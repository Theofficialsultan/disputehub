/**
 * API Route: Case Progress
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { getCaseProgress } from "@/lib/gamification/progress-badges";

export async function GET(
  request: NextRequest,
  { params }: { params: { caseId: string } }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const progress = await getCaseProgress(params.caseId);
    
    if (!progress) {
      return NextResponse.json(
        { error: "Case not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ progress });
  } catch (error) {
    console.error("Error fetching case progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch case progress" },
      { status: 500 }
    );
  }
}
