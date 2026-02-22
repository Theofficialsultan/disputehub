import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

/**
 * GET /api/disputes/[id]
 * Get dispute details (for polling phase changes)
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

    const dispute = await prisma.dispute.findFirst({
      where: {
        id: params.id,
        userId
      },
      select: {
        id: true,
        phase: true,
        chatLocked: true,
        lockReason: true,
        lifecycleStatus: true,
      }
    });

    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    return NextResponse.json({ dispute });
  } catch (error) {
    console.error("[API] Error fetching dispute:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/disputes/[id]
 * Update dispute details (wizard flow)
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, title, description, evidenceFiles, lifecycleStatus } = body;

    // Verify ownership
    const existingDispute = await prisma.dispute.findFirst({
      where: {
        id: params.id,
        userId
      }
    });

    if (!existingDispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    // Build update data
    const updateData: any = {
      type: type || existingDispute.type,
      title: title || existingDispute.title,
      description: description || existingDispute.description,
      evidenceFiles: evidenceFiles || existingDispute.evidenceFiles,
    };

    // Allow updating lifecycle status
    if (lifecycleStatus) {
      updateData.lifecycleStatus = lifecycleStatus;
      // Clear deadline if case is closed
      if (lifecycleStatus === 'CLOSED') {
        updateData.waitingUntil = null;
      }
    }

    // Update the dispute
    const updatedDispute = await prisma.dispute.update({
      where: { id: params.id },
      data: updateData
    });

    return NextResponse.json(updatedDispute);
  } catch (error) {
    console.error("[API] Error updating dispute:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
