/**
 * API endpoint for Summary Gate rejection
 * POST /api/disputes/[id]/summary/reject - User wants to correct the summary
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const caseId = params.id;
    const dispute = await prisma.dispute.findFirst({
      where: { id: caseId, userId },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    if (dispute.chatState !== "CONFIRMING_SUMMARY") {
      return NextResponse.json({ error: "Not in confirmation state" }, { status: 400 });
    }

    console.log("[Summary Gate] ❌ User rejected summary - returning to fact gathering");

    // Reset to fact gathering state
    await prisma.dispute.update({
      where: { id: caseId },
      data: {
        chatState: "GATHERING_FACTS",
        summaryConfirmed: false,
      },
    });

    // Create a helpful AI message
    await prisma.caseMessage.create({
      data: {
        caseId,
        role: "AI",
        content: "No problem. What would you like to correct or add?",
        intent: "ANSWER",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Summary rejected. You can now make corrections.",
      nextState: "GATHERING_FACTS",
    });
  } catch (error) {
    console.error("Error rejecting summary:", error);
    return NextResponse.json({ error: "Failed to reject summary" }, { status: 500 });
  }
}
