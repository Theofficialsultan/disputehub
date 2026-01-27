import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { generateDocument } from "@/lib/documents/document-generator";

/**
 * POST /api/documents/[documentId]/retry
 * 
 * Retry generation for a single failed document
 * 
 * Requirements:
 * - status must be FAILED
 * - retryCount must be < 3
 * - User must own the case
 * 
 * Process:
 * 1. Validate ownership
 * 2. Check retry eligibility
 * 3. Trigger generation for this document only
 * 4. Return updated document
 */
export async function POST(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const documentId = params.documentId;

    // Fetch document with plan and case
    const document = await prisma.generatedDocument.findUnique({
      where: { id: documentId },
      include: {
        plan: {
          include: {
            case: true,
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (document.plan.case.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Validate retry eligibility
    if (document.status !== "FAILED") {
      return NextResponse.json(
        { error: "Only failed documents can be retried" },
        { status: 400 }
      );
    }

    if (document.retryCount >= 3) {
      return NextResponse.json(
        { error: "Maximum retry attempts reached (3)" },
        { status: 400 }
      );
    }

    // Fetch strategy for document generation
    const strategy = await prisma.caseStrategy.findUnique({
      where: { caseId: document.plan.caseId },
    });

    if (!strategy) {
      return NextResponse.json(
        { error: "Case strategy not found" },
        { status: 404 }
      );
    }

    // Get total document count for generation
    const totalDocuments = await prisma.generatedDocument.count({
      where: { planId: document.planId },
    });

    // Trigger generation for this document only
    try {
      const fileUrl = await generateDocument(
        documentId,
        document.type,
        document.plan.caseId,
        strategy,
        totalDocuments
      );

      // Fetch updated document
      const updatedDocument = await prisma.generatedDocument.findUnique({
        where: { id: documentId },
      });

      return NextResponse.json(
        {
          document: updatedDocument,
          message: "Document generation started",
        },
        { status: 200 }
      );
    } catch (error) {
      // Generation failed - document status already updated by generateDocument
      const failedDocument = await prisma.generatedDocument.findUnique({
        where: { id: documentId },
      });

      return NextResponse.json(
        {
          document: failedDocument,
          error: "Generation failed",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error retrying document:", error);
    return NextResponse.json(
      { error: "Failed to retry document generation" },
      { status: 500 }
    );
  }
}
