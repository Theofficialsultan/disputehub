/**
 * Phase 8.4 - Mark all notifications as read
 */

import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { markAllNotificationsAsRead } from "@/lib/notifications/service";

export async function POST() {
  const userId = await getCurrentUserId();

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    await markAllNotificationsAsRead(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
