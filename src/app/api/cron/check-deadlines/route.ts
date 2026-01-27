/**
 * Phase 8.4 - Cron endpoint for deadline checks and notifications
 * 
 * This endpoint should be called by a cron service (e.g., Vercel Cron)
 * 
 * Performs:
 * 1. Check for missed deadlines
 * 2. Check for approaching deadlines (3 days)
 * 3. Process missed deadlines (generate follow-ups)
 */

import { NextRequest, NextResponse } from "next/server";
import { checkMissedDeadlines, processMissedDeadlines } from "@/lib/deadlines/deadline-engine";
import { checkApproachingDeadlines } from "@/lib/notifications/triggers";

export async function GET(request: NextRequest) {
  // Optional: Verify cron secret for security
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // 1. Check and mark missed deadlines
    const missedCount = await checkMissedDeadlines();

    // 2. Check for approaching deadlines and notify
    const approachingCount = await checkApproachingDeadlines();

    // 3. Process missed deadlines (generate follow-ups)
    const followUpsGenerated = await processMissedDeadlines();

    return NextResponse.json({
      success: true,
      missedDeadlines: missedCount,
      approachingDeadlines: approachingCount,
      followUpsGenerated,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
