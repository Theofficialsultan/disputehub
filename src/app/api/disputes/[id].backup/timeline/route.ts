import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { getCaseTimeline } from "@/lib/timeline/timeline";

/**
 * GET /api/disputes/[id]/timeline
 * 
 * Fetch all timeline events for a case
 * 
 * Returns:
 * - All CaseEvents ordered by occurredAt ASC
 * 
 * Authorization:
 * - User must own the case
 * 
 * Phase 8.2.1 - Case Timeline Engine
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

    // Fetch timeline events
    const events = await getCaseTimeline(disputeId);

    return NextResponse.json(
      {
        events,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching timeline:", error);
    return NextResponse.json(
      { error: "Failed to fetch timeline" },
      { status: 500 }
    );
  }
}
