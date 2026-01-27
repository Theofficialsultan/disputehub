/**
 * GET /api/disputes/[id]/evidence
 * 
 * Fetch all evidence items for a case
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const caseId = params.id;

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify case ownership
    const dispute = await prisma.dispute.findFirst({
      where: { id: caseId, userId },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Fetch evidence items
    const evidence = await prisma.evidenceItem.findMany({
      where: { caseId },
      orderBy: { evidenceIndex: "asc" },
    });

    return NextResponse.json({
      evidence,
      count: evidence.length,
    });

  } catch (error) {
    console.error("[Evidence API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch evidence" },
      { status: 500 }
    );
  }
}
