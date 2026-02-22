/**
 * API Route: Deadlines
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import {
  getUserDeadlines,
  getDeadlinesForMonth,
  getUpcomingDeadlines,
  getOverdueDeadlines,
} from "@/lib/deadlines/calendar";

export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get("year");
    const month = searchParams.get("month");
    const upcoming = searchParams.get("upcoming") === "true";
    const overdue = searchParams.get("overdue") === "true";

    // Get upcoming deadlines
    if (upcoming) {
      const deadlines = await getUpcomingDeadlines(userId);
      return NextResponse.json({ deadlines });
    }

    // Get overdue deadlines
    if (overdue) {
      const deadlines = await getOverdueDeadlines(userId);
      return NextResponse.json({ deadlines });
    }

    // Get deadlines for specific month
    if (year && month) {
      const deadlines = await getDeadlinesForMonth(
        userId,
        parseInt(year),
        parseInt(month)
      );
      return NextResponse.json({ deadlines });
    }

    // Get all deadlines
    const deadlines = await getUserDeadlines(userId);
    return NextResponse.json({ deadlines });
  } catch (error) {
    console.error("Error fetching deadlines:", error);
    return NextResponse.json(
      { error: "Failed to fetch deadlines" },
      { status: 500 }
    );
  }
}
