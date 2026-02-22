import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { createTimelineEvent } from "@/lib/timeline/timeline";
import { sendEmailNotification } from "@/lib/notifications/email";

/**
 * POST /api/disputes/[id]/response
 * 
 * Mark a response received or confirm no response
 * 
 * Body:
 * - type: "RECEIVED" | "NO_RESPONSE"
 * - responseDate?: string (ISO date)
 * - responseSummary?: string (brief summary of response)
 * - outcome?: "RESOLVED" | "PARTIAL" | "REJECTED" | "NEEDS_ESCALATION"
 * 
 * Phase: Response Tracking
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
    const body = await request.json();
    const { type, responseDate, responseSummary, outcome } = body;

    if (!type || !["RECEIVED", "NO_RESPONSE"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be RECEIVED or NO_RESPONSE" },
        { status: 400 }
      );
    }

    // Fetch dispute and verify ownership
    const dispute = await prisma.dispute.findFirst({
      where: { id: disputeId, userId },
      include: {
        user: { select: { email: true, firstName: true } },
      },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    const now = new Date();
    let newStatus: string;
    let timelineMessage: string;
    let emailType: "DOCUMENT_READY" | "DOCUMENT_SENT" | "DEADLINE_APPROACHING" | "DEADLINE_MISSED" | "FOLLOW_UP_GENERATED" | "CASE_CLOSED" | null = null;

    if (type === "RECEIVED") {
      // Response received - update status and record details
      newStatus = "RESPONSE_RECEIVED";
      timelineMessage = responseSummary 
        ? `Response received: ${responseSummary.substring(0, 100)}${responseSummary.length > 100 ? '...' : ''}`
        : "Response received from the other party";

      // Update dispute with response info
      await prisma.dispute.update({
        where: { id: disputeId },
        data: {
          lifecycleStatus: newStatus as any,
          // Store response details in caseSummary
          caseSummary: {
            ...(dispute.caseSummary as any || {}),
            response: {
              receivedAt: responseDate || now.toISOString(),
              summary: responseSummary || null,
              outcome: outcome || null,
            },
          },
        },
      });

      // Create timeline event
      await createTimelineEvent(
        disputeId,
        "RESPONSE_RECEIVED",
        timelineMessage,
        undefined,
        responseDate ? new Date(responseDate) : now
      );

      // If outcome indicates resolution, optionally mark as closed
      if (outcome === "RESOLVED") {
        await prisma.dispute.update({
          where: { id: disputeId },
          data: { lifecycleStatus: "CLOSED" },
        });
        
        await createTimelineEvent(
          disputeId,
          "CASE_CLOSED",
          "Case resolved successfully",
          undefined,
          now
        );
        
        emailType = "CASE_CLOSED";
      }

    } else {
      // No response - check if deadline has passed
      const deadlinePassed = dispute.waitingUntil && dispute.waitingUntil < now;
      
      if (deadlinePassed) {
        newStatus = "DEADLINE_MISSED";
        timelineMessage = "User confirmed no response received - deadline missed";
        emailType = "DEADLINE_MISSED";
      } else {
        // Deadline not passed yet, but user is reporting no response
        newStatus = "AWAITING_RESPONSE";
        timelineMessage = "User checked: no response received yet";
      }

      await prisma.dispute.update({
        where: { id: disputeId },
        data: {
          lifecycleStatus: newStatus as any,
        },
      });

      await createTimelineEvent(
        disputeId,
        deadlinePassed ? "DEADLINE_MISSED" : ("RESPONSE_RECEIVED" as any),
        timelineMessage,
        undefined,
        now
      );
    }

    // Send email notification if applicable
    if (emailType && dispute.user.email) {
      await sendEmailNotification({
        to: dispute.user.email,
        caseId: disputeId,
        caseTitle: dispute.title,
        type: emailType,
      });
    }

    // Fetch updated dispute
    const updatedDispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      select: {
        id: true,
        lifecycleStatus: true,
        waitingUntil: true,
        caseSummary: true,
      },
    });

    return NextResponse.json({
      success: true,
      dispute: updatedDispute,
      message: type === "RECEIVED" 
        ? "Response recorded successfully"
        : "Status updated - no response received",
    });

  } catch (error) {
    console.error("Error recording response:", error);
    return NextResponse.json(
      { error: "Failed to record response" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/disputes/[id]/response
 * 
 * Get response tracking status
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

    const dispute = await prisma.dispute.findFirst({
      where: { id: disputeId, userId },
      select: {
        lifecycleStatus: true,
        waitingUntil: true,
        caseSummary: true,
      },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    const now = new Date();
    const daysRemaining = dispute.waitingUntil
      ? Math.ceil((dispute.waitingUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    
    const deadlinePassed = daysRemaining !== null && daysRemaining < 0;
    const response = (dispute.caseSummary as any)?.response || null;

    return NextResponse.json({
      lifecycleStatus: dispute.lifecycleStatus,
      waitingUntil: dispute.waitingUntil,
      daysRemaining,
      deadlinePassed,
      response,
      canMarkResponse: ["AWAITING_RESPONSE", "DOCUMENT_SENT", "DEADLINE_MISSED"].includes(dispute.lifecycleStatus),
    });

  } catch (error) {
    console.error("Error fetching response status:", error);
    return NextResponse.json(
      { error: "Failed to fetch response status" },
      { status: 500 }
    );
  }
}
