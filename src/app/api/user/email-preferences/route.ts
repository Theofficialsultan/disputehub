/**
 * Email Preferences API
 * Manage user email notification settings
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Get preferences
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let prefs = await prisma.emailPreferences.findUnique({
      where: { userId: user.id },
    });

    // Return defaults if no preferences exist
    if (!prefs) {
      prefs = {
        id: "",
        userId: user.id,
        documentReady: true,
        deadlineReminders: true,
        caseUpdates: true,
        marketingEmails: false,
        weeklyDigest: true,
        reminderDaysBefore: 3,
        updatedAt: new Date(),
      };
    }

    return NextResponse.json({
      preferences: {
        documentReady: prefs.documentReady,
        deadlineReminders: prefs.deadlineReminders,
        caseUpdates: prefs.caseUpdates,
        marketingEmails: prefs.marketingEmails,
        weeklyDigest: prefs.weeklyDigest,
        reminderDaysBefore: prefs.reminderDaysBefore,
      },
    });
  } catch (error) {
    console.error("[Email Prefs] Get error:", error);
    return NextResponse.json(
      { error: "Failed to get preferences" },
      { status: 500 }
    );
  }
}

// Update preferences
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      documentReady,
      deadlineReminders,
      caseUpdates,
      marketingEmails,
      weeklyDigest,
      reminderDaysBefore,
    } = body;

    const prefs = await prisma.emailPreferences.upsert({
      where: { userId: user.id },
      update: {
        documentReady: documentReady ?? undefined,
        deadlineReminders: deadlineReminders ?? undefined,
        caseUpdates: caseUpdates ?? undefined,
        marketingEmails: marketingEmails ?? undefined,
        weeklyDigest: weeklyDigest ?? undefined,
        reminderDaysBefore: reminderDaysBefore ?? undefined,
      },
      create: {
        userId: user.id,
        documentReady: documentReady ?? true,
        deadlineReminders: deadlineReminders ?? true,
        caseUpdates: caseUpdates ?? true,
        marketingEmails: marketingEmails ?? false,
        weeklyDigest: weeklyDigest ?? true,
        reminderDaysBefore: reminderDaysBefore ?? 3,
      },
    });

    return NextResponse.json({
      success: true,
      preferences: {
        documentReady: prefs.documentReady,
        deadlineReminders: prefs.deadlineReminders,
        caseUpdates: prefs.caseUpdates,
        marketingEmails: prefs.marketingEmails,
        weeklyDigest: prefs.weeklyDigest,
        reminderDaysBefore: prefs.reminderDaysBefore,
      },
    });
  } catch (error) {
    console.error("[Email Prefs] Update error:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
