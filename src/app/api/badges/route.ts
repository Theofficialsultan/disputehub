/**
 * API Route: Progress Badges
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import {
  getUserBadges,
  checkAndAwardBadges,
  getUserPoints,
  getUserRank,
  getAllBadges,
  getBadgeById,
} from "@/lib/gamification/progress-badges";

// GET: Get user's badges and progress
export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const badgeId = searchParams.get("id");
    const listAll = searchParams.get("all") === "true";

    // Get specific badge info
    if (badgeId) {
      const badge = getBadgeById(badgeId);
      if (!badge) {
        return NextResponse.json(
          { error: "Badge not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ badge });
    }

    // List all available badges
    if (listAll) {
      const badges = getAllBadges();
      return NextResponse.json({ badges });
    }

    // Get user's badges with progress
    const [userBadges, points] = await Promise.all([
      getUserBadges(userId),
      getUserPoints(userId),
    ]);

    const rank = getUserRank(points);
    const earnedCount = userBadges.filter((b) => b.isEarned).length;
    const totalCount = userBadges.length;

    return NextResponse.json({
      badges: userBadges,
      points,
      rank,
      earnedCount,
      totalCount,
      completionPercent: Math.round((earnedCount / totalCount) * 100),
    });
  } catch (error) {
    console.error("Error fetching badges:", error);
    return NextResponse.json(
      { error: "Failed to fetch badges" },
      { status: 500 }
    );
  }
}

// POST: Check and award new badges
export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const newBadges = await checkAndAwardBadges(userId);
    const points = await getUserPoints(userId);
    const rank = getUserRank(points);

    return NextResponse.json({
      newBadges,
      newBadgeCount: newBadges.length,
      currentPoints: points,
      currentRank: rank,
    });
  } catch (error) {
    console.error("Error checking badges:", error);
    return NextResponse.json(
      { error: "Failed to check badges" },
      { status: 500 }
    );
  }
}
