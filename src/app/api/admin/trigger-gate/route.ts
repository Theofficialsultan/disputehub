/**
 * Admin endpoint to manually trigger decision gate for a case
 * 
 * This is useful for cases where the AI said "generating documents"
 * but the decision gate didn't trigger due to old requirements.
 */

import { NextResponse } from "next/server";
import { executeDecisionGate } from "@/lib/strategy/decision-gate";

export async function POST(request: Request) {
  try {
    const { caseId } = await request.json();

    if (!caseId) {
      return NextResponse.json(
        { error: "caseId is required" },
        { status: 400 }
      );
    }

    console.log(`[Admin] Manually triggering decision gate for case ${caseId}`);

    const triggered = await executeDecisionGate(caseId);

    if (triggered) {
      return NextResponse.json({
        success: true,
        message: "Decision gate triggered successfully",
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "Decision gate did not trigger (check logs for reason)",
      });
    }
  } catch (error) {
    console.error("[Admin] Error triggering decision gate:", error);
    return NextResponse.json(
      { error: "Failed to trigger decision gate" },
      { status: 500 }
    );
  }
}
