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

    // Check if already closed
    if (dispute.lifecycleStatus === "CLOSED") {
      return NextResponse.json(
        { error: "Case is already closed" },
        { status: 400 }
      );
    }

    // Update case status to CLOSED
    const updatedDispute = await prisma.dispute.update({
      where: { id: caseId },
      data: {
        lifecycleStatus: "CLOSED",
        conversationStatus: "CLOSED",
      },
    });

    // Create timeline event
    await createTimelineEvent(caseId, "CASE_CLOSED", "Case closed by user");

    return NextResponse.json({
      success: true,
      dispute: updatedDispute,
    });
  } catch (error) {
    console.error("Error closing case:", error);
    return NextResponse.json(
      { error: "Failed to close case" },
      { status: 500 }
    );
  }
}
