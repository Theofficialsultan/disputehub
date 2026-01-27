import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

/**
 * GET /api/disputes/[id]/strategy
 * 
 * Read-only endpoint to fetch case strategy
 * 
 * Requirements:
 * - User must be authenticated
 * - Dispute must belong to user
 * - Returns strategy if exists, null otherwise
 * - NO creation or modification allowed
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

    // Fetch strategy (if it exists)
    const strategy = await prisma.caseStrategy.findUnique({
      where: { caseId: disputeId },
      select: {
        disputeType: true,
        keyFacts: true,
        evidenceMentioned: true,
        desiredOutcome: true,
      },
    });

    // Return strategy or null
    return NextResponse.json({
      strategy: strategy
        ? {
            disputeType: strategy.disputeType,
            keyFacts: strategy.keyFacts as string[],
            evidenceMentioned: strategy.evidenceMentioned as string[],
            desiredOutcome: strategy.desiredOutcome,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching strategy:", error);
    return NextResponse.json(
      { error: "Failed to fetch strategy" },
      { status: 500 }
    );
  }
}
