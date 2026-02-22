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

    // Verify ownership
    const dispute = await prisma.dispute.findFirst({
      where: { id: caseId, userId },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Reset the case
    await prisma.dispute.update({
      where: { id: caseId },
      data: {
        phase: "GATHERING",
        chatLocked: false,
        lockReason: null,
        lockedAt: null,
      },
    });

    // Delete document plan
    await prisma.documentPlan.deleteMany({
      where: { caseId },
    });

    console.log(`[Reset] Case ${caseId} reset to GATHERING phase`);

    return NextResponse.json({
      success: true,
      message: "Case reset successfully",
    });
  } catch (error) {
    console.error("[Reset] Error:", error);
    return NextResponse.json(
      { error: "Failed to reset case" },
      { status: 500 }
    );
  }
}
