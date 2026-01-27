/**
 * Phase 8.5 - Get evidence for a case
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { getCaseEvidence } from "@/lib/evidence/service";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { caseId: string } }
) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { caseId } = params;

    // Verify case ownership
    const caseData = await prisma.dispute.findUnique({
      where: { id: caseId },
      select: { userId: true },
    });

    if (!caseData || caseData.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Get evidence items
    const evidence = await getCaseEvidence(caseId);

    return NextResponse.json({ evidence });
  } catch (error) {
    console.error("Failed to fetch evidence:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
