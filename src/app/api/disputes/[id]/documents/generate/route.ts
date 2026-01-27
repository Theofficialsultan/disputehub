import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { batchGenerateDocuments } from "@/lib/documents/document-generator";

/**
 * POST /api/disputes/[id]/documents/generate
 * 
 * Batch generates all eligible documents (PENDING or FAILED with retryCount < 2)
 * 
 * Process:
 * 1. Authenticate user
 * 2. Verify dispute ownership
 * 3. Fetch DocumentPlan
 * 4. Generate all eligible documents
 * 5. Upload PDFs to Supabase Storage
 * 6. Update database records
 * 7. Return generation summary
 * 
 * Requirements:
 * - User must be authenticated
 * - Dispute must belong to user
 * - DocumentPlan must exist
 * - CaseStrategy must exist
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

    // Check if document plan exists
    const plan = await prisma.documentPlan.findUnique({
      where: { caseId: disputeId },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "No document plan found. Please create a plan first." },
        { status: 404 }
      );
    }

    // Generate documents
    const result = await batchGenerateDocuments(disputeId);

    return NextResponse.json(
      {
        summary: {
          completed: result.completed,
          failed: result.failed,
          pending: result.pending,
        },
        documents: result.documents,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error generating documents:", error);
    return NextResponse.json(
      { error: "Failed to generate documents" },
      { status: 500 }
    );
  }
}
