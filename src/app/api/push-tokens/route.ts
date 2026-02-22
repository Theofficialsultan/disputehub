/**
 * Push Token Registration API
 * Stores Expo push tokens for mobile notifications
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Register or update push token
export async function POST(request: NextRequest) {
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
    const { token, platform, deviceId } = body;

    if (!token || !platform) {
      return NextResponse.json(
        { error: "Token and platform required" },
        { status: 400 }
      );
    }

    // Upsert the token (update if exists, create if not)
    const pushToken = await prisma.pushToken.upsert({
      where: { token },
      update: {
        userId: user.id,
        platform,
        deviceId,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        token,
        platform,
        deviceId,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      tokenId: pushToken.id,
    });
  } catch (error) {
    console.error("[Push Token] Registration error:", error);
    return NextResponse.json(
      { error: "Failed to register push token" },
      { status: 500 }
    );
  }
}

// Deactivate push token (logout)
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    await prisma.pushToken.updateMany({
      where: { token },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Push Token] Deactivation error:", error);
    return NextResponse.json(
      { error: "Failed to deactivate push token" },
      { status: 500 }
    );
  }
}
