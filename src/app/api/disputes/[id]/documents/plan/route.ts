import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { tryComputeDocumentPlan } from "@/lib/documents/plan-generator";
import {
  getPersistedDocumentPlan,
  persistDocumentPlan,
  documentPlanExists,
} from "@/lib/documents/persistence";
import { DEFAULT_COMPLEXITY_CONFIG } from "@/lib/documents/types";
import type { CaseStrategyInput } from "@/lib/documents/types";

/**
 * GET /api/disputes/[id]/documents/plan
 * 
 * Returns document plan with persisted flag:
 * - If plan exists in database: returns persisted plan (persisted: true)
 * - If no persisted plan: computes in-memory (persisted: false)
 * - If strategy incomplete: returns null with validation errors
 * 
 * Requirements:
 * - User must be authenticated
 * - Dispute must belong to user
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const disputeId = params.id;

    // Verify dispute exists and belongs to user
    const dispute = await prisma.dispute.findFirst({
      where: {
        id: disputeId,
        userId,
      },
    });

    if (!dispute) {
      return NextResponse.json(
        { error: "Dispute not found" },
        { status: 404 }
      );
    }

    // Step 1: Check for persisted plan first
    const persistedPlan = await getPersistedDocumentPlan(disputeId);

    if (persistedPlan) {
      // Return persisted plan
      return NextResponse.json({
        plan: persistedPlan,
        persisted: true,
      });
    }

    // Step 2: No persisted plan, try to compute in-memory
    const strategy = await prisma.caseStrategy.findUnique({
      where: { caseId: disputeId },
      select: {
        disputeType: true,
        keyFacts: true,
        evidenceMentioned: true,
        desiredOutcome: true,
      },
    });

    // If no strategy exists yet, return null
    if (!strategy) {
      return NextResponse.json({
        plan: null,
        persisted: false,
        reason: "No strategy exists yet for this case",
      });
    }

    // Prepare strategy input
    const strategyInput: CaseStrategyInput = {
      disputeType: strategy.disputeType,
      keyFacts: strategy.keyFacts as string[],
      evidenceMentioned: strategy.evidenceMentioned as string[],
      desiredOutcome: strategy.desiredOutcome,
    };

    // Compute plan in-memory
    const result = tryComputeDocumentPlan(
      strategyInput,
      DEFAULT_COMPLEXITY_CONFIG
    );

    if (!result.success) {
      // Strategy exists but is incomplete
      return NextResponse.json({
        plan: null,
        persisted: false,
        reason: result.error,
        validation: result.validation,
      });
    }

    // Return computed (non-persisted) plan
    return NextResponse.json({
      plan: result.plan,
      persisted: false,
    });
  } catch (error) {
    console.error("Error fetching document plan:", error);
    return NextResponse.json(
      { error: "Failed to fetch document plan" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/disputes/[id]/documents/plan
 * 
 * Creates and persists document plan (explicit user action)
 * 
 * Idempotency:
 * - If plan already exists: returns existing plan with created: false
 * - If no plan: computes, persists, returns with created: true
 * 
 * Requirements:
 * - User must be authenticated
 * - Dispute must belong to user
 * - CaseStrategy must exist and be complete
 * 
 * Transaction:
 * - DocumentPlan + GeneratedDocuments created atomically
 * - If any step fails, entire operation rolls back
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const disputeId = params.id;

    // Verify dispute exists and belongs to user
    const dispute = await prisma.dispute.findFirst({
      where: {
        id: disputeId,
        userId,
      },
    });

    if (!dispute) {
      return NextResponse.json(
        { error: "Dispute not found" },
        { status: 404 }
      );
    }

    // Step 1: Check if plan already exists (idempotency)
    const existingPlan = await getPersistedDocumentPlan(disputeId);

    if (existingPlan) {
      return NextResponse.json(
        {
          plan: existingPlan,
          created: false,
          message: "Document plan already exists",
        },
        { status: 200 }
      );
    }

    // Step 2: Fetch strategy
    const strategy = await prisma.caseStrategy.findUnique({
      where: { caseId: disputeId },
      select: {
        disputeType: true,
        keyFacts: true,
        evidenceMentioned: true,
        desiredOutcome: true,
      },
    });

    if (!strategy) {
      return NextResponse.json(
        { error: "No strategy exists for this case" },
        { status: 404 }
      );
    }

    // Step 3: Prepare strategy input
    const strategyInput: CaseStrategyInput = {
      disputeType: strategy.disputeType,
      keyFacts: strategy.keyFacts as string[],
      evidenceMentioned: strategy.evidenceMentioned as string[],
      desiredOutcome: strategy.desiredOutcome,
    };

    // Step 4: Compute plan
    const result = tryComputeDocumentPlan(
      strategyInput,
      DEFAULT_COMPLEXITY_CONFIG
    );

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Strategy is incomplete",
          validation: result.validation,
        },
        { status: 400 }
      );
    }

    // Step 5: Persist plan (with transaction for atomicity)
    const persistedPlan = await persistDocumentPlan(disputeId, result.plan!);

    // Step 6: Return persisted plan
    return NextResponse.json(
      {
        plan: persistedPlan,
        created: true,
        message: "Document plan created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating document plan:", error);
    return NextResponse.json(
      { error: "Failed to create document plan" },
      { status: 500 }
    );
  }
}
