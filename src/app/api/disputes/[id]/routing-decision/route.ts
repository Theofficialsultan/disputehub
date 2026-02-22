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

    // Get routing decision from DocumentPlan
    const documentPlan = await prisma.documentPlan.findUnique({
      where: { caseId },
    });

    if (!documentPlan || !documentPlan.routingStatus) {
      console.log(`[routing-decision] No DocumentPlan found for case ${caseId}`);
      return NextResponse.json({ routingDecision: null });
    }
    
    console.log(`[routing-decision] Found DocumentPlan for case ${caseId}:`, {
      forum: documentPlan.forum,
      relationship: documentPlan.legalRelationship,
      status: documentPlan.routingStatus
    });

    // Transform DocumentPlan to routing decision format
    const routingDecision = {
      status: documentPlan.routingStatus,
      confidence: documentPlan.routingConfidence || 0,
      jurisdiction: documentPlan.jurisdiction,
      relationship: documentPlan.legalRelationship,
      counterparty: documentPlan.counterparty,
      domain: documentPlan.domain,
      forum: documentPlan.forum,
      forumReasoning: documentPlan.forumReasoning,
      allowedDocs: documentPlan.allowedDocuments,
      blockedDocs: documentPlan.blockedDocuments,
      prerequisites: documentPlan.prerequisitesList || [],
      prerequisitesMet: documentPlan.prerequisitesMet,
      timeLimit: documentPlan.timeLimitDeadline ? {
        deadline: documentPlan.timeLimitDeadline,
        daysRemaining: Math.ceil((documentPlan.timeLimitDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        met: documentPlan.timeLimitMet || false,
        description: documentPlan.timeLimitDescription || ""
      } : undefined,
      reason: documentPlan.routingReason || "",
      userMessage: documentPlan.routingReason || "",
      alternativeRoutes: documentPlan.alternativeRoutes,
      classifiedAt: documentPlan.routingCompletedAt || new Date(),
      classifiedBy: "claude-opus-4" as const
    };

    return NextResponse.json({ routingDecision });
  } catch (error) {
    console.error("[routing-decision] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch routing decision" },
      { status: 500 }
    );
  }
}
