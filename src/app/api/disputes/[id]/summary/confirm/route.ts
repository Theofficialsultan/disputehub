/**
 * API endpoint for Summary Gate confirmation
 * POST /api/disputes/[id]/summary/confirm - User confirms summary (with optional edits)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { triggerDocumentGeneration } from "@/lib/legal/trigger-generation";

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

    // Get edits from request body (if any)
    const body = await request.json();
    const { edits } = body;

    console.log("[Summary Gate] ✅ User confirmed summary - GATE UNLOCKED");
    
    // If user made edits, merge them into caseSummary
    let updatedSummary = dispute.caseSummary;
    if (edits && typeof edits === "object") {
      console.log("[Summary Gate] User provided edits, merging...");
      updatedSummary = {
        ...(dispute.caseSummary as any),
        ...edits,
      };
    }

    // 🔓 UNLOCK THE GATE
    await prisma.dispute.update({
      where: { id: caseId },
      data: {
        summaryConfirmed: true,
        summaryConfirmedAt: new Date(),
        chatState: "ROUTING_DECISION",
        chatLocked: true,
        phase: "ROUTING",
        lockReason: "Summary confirmed - analyzing legal route",
        caseSummary: updatedSummary as any,
      },
    });

    // Trigger document generation directly (no HTTP call needed)
    // Run in background so we can return quickly
    triggerDocumentGeneration(caseId)
      .then((result) => {
        if (result.success) {
          console.log(`[Summary Gate] ✅ Document generation complete: ${result.documents?.length} docs`);
        } else {
          console.error(`[Summary Gate] ❌ Document generation failed: ${result.error}`);
        }
      })
      .catch((err) => {
        console.error("[Summary Gate] Document generation error:", err);
      });

    return NextResponse.json({
      success: true,
      message: "Summary confirmed. Analyzing legal route...",
      nextState: "ROUTING_DECISION",
    });
  } catch (error) {
    console.error("Error confirming summary:", error);
    return NextResponse.json({ error: "Failed to confirm summary" }, { status: 500 });
  }
}
