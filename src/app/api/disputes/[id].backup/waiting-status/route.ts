import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { getWaitingStatus } from "@/lib/deadlines/deadline-engine";

/**
 * GET /api/disputes/[id]/waiting-status
 * 
 * Get case waiting status
 * 
 * Returns:
 * - lifecycleStatus
 * - waitingUntil
 * - daysRemaining
 * 
 * Authorization:
 * - User must own the case
 * 
 * Phase 8.2.2 - Waiting States & Deadline Engine
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

    // Get waiting status
    const status = await getWaitingStatus(disputeId);

    return NextResponse.json(status, { status: 200 });
  } catch (error) {
    console.error("Error fetching waiting status:", error);
    return NextResponse.json(
      { error: "Failed to fetch waiting status" },
      { status: 500 }
    );
  }
}
