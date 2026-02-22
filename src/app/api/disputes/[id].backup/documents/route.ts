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

    // Get document plan with all documents (proper schema relationship)
    const documentPlan = await prisma.documentPlan.findUnique({
      where: { caseId },
      include: {
        documents: {
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
      orderBy: { createdAt: "desc" },
    });

    const allDocuments = [
      ...(documentPlan?.documents || []),
      ...directDocuments,
    ];

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
