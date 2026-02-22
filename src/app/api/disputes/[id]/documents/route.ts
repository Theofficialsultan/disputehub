/**
 * GET /api/disputes/[id]/documents
 * 
 * Fetches all generated documents for a case through DocumentPlan relationship.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const caseId = params.id;

    // Verify case ownership
    const dispute = await prisma.dispute.findFirst({
      where: { id: caseId, userId },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Fields to select (exclude pdfData binary to avoid huge payloads)
    const documentSelect = {
      id: true,
      planId: true,
      caseId: true,
      type: true,
      title: true,
      description: true,
      order: true,
      required: true,
      status: true,
      fileUrl: true,
      content: true,
      pdfFilename: true,
      retryCount: true,
      lastError: true,
      isFollowUp: true,
      validationErrors: true,
      validationWarnings: true,
      createdAt: true,
      updatedAt: true,
    };

    // Get document plan with all documents (proper schema relationship)
    const documentPlan = await prisma.documentPlan.findUnique({
      where: { caseId },
      include: {
        documents: {
          select: documentSelect,
          orderBy: [
            { order: "asc" },
            { createdAt: "desc" }
          ],
        },
      },
    });

    // Also get any documents created directly with caseId (backward compatibility)
    const directDocuments = await prisma.generatedDocument.findMany({
      where: { 
        caseId,
        planId: null, // Only get documents not linked to a plan
      },
      select: documentSelect,
      orderBy: { createdAt: "desc" },
    });

    // Check which documents have PDF data (without fetching the binary)
    const docsWithPdfData = await prisma.generatedDocument.findMany({
      where: {
        caseId,
        pdfData: { not: null }
      },
      select: { id: true }
    });
    const pdfDataIds = new Set(docsWithPdfData.map(d => d.id));

    // Combine documents and add pdfData flag
    const allDocuments = [
      ...(documentPlan?.documents || []),
      ...directDocuments,
    ].map(doc => ({
      ...doc,
      pdfData: pdfDataIds.has(doc.id), // Boolean flag instead of binary data
    }));

    return NextResponse.json({
      success: true,
      plan: documentPlan ? {
        id: documentPlan.id,
        complexity: documentPlan.complexity,
        complexityScore: documentPlan.complexityScore,
        documentType: documentPlan.documentType,
      } : null,
      documents: allDocuments,
      totalDocuments: allDocuments.length,
    });

  } catch (error) {
    console.error("[Get Documents] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}
