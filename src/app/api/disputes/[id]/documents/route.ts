import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

/**
 * GET /api/disputes/[id]/documents
 * 
 * Fetch all documents for a case
 * 
 * Returns:
 * - DocumentPlan
 * - All GeneratedDocuments (ordered by order)
 * 
 * Authorization:
 * - User must own the case
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

    // Fetch document plan with documents
    const plan = await prisma.documentPlan.findUnique({
      where: { caseId: disputeId },
      include: {
        documents: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!plan) {
      return NextResponse.json(
        {
          plan: null,
          documents: [],
          message: "No document plan exists for this case",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        plan: {
          id: plan.id,
          complexity: plan.complexity,
          complexityScore: plan.complexityScore,
          documentType: plan.documentType,
          createdAt: plan.createdAt,
        },
        documents: plan.documents.map((doc) => ({
          id: doc.id,
          type: doc.type,
          title: doc.title,
          description: doc.description,
          order: doc.order,
          required: doc.required,
          status: doc.status,
          fileUrl: doc.fileUrl,
          retryCount: doc.retryCount,
          lastError: doc.lastError,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}
