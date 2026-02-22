import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTimelineEvent } from "@/lib/timeline/timeline";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: caseId } = params;

    // Verify ownership
    const dispute = await prisma.dispute.findFirst({
      where: {
        id: caseId,
        userId,
      },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Update case to mark as escalated
    const updatedDispute = await prisma.dispute.update({
      where: { id: caseId },
      data: {
        restricted: true, // Mark as requiring professional assistance
        conversationStatus: "CLOSED",
      },
    });

    // Create timeline event
    await createTimelineEvent(
      caseId,
      "ESCALATION_TRIGGERED",
      "Case escalated to lawyer for professional assistance"
    );

    // TODO: In production, this would:
    // 1. Notify the lawyer team
    // 2. Create a lawyer assignment record
    // 3. Send email to user confirming escalation

    return NextResponse.json({
      success: true,
      dispute: updatedDispute,
      message: "Case escalated successfully. A lawyer will be assigned shortly.",
    });
  } catch (error) {
    console.error("Error escalating case:", error);
    return NextResponse.json(
      { error: "Failed to escalate case" },
      { status: 500 }
    );
  }
}
