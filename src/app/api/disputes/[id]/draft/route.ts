/**
 * Chat Draft Auto-Save API
 * Saves and retrieves chat drafts for a case
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Get saved draft
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: caseId } = await params;

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const draft = await prisma.chatDraft.findUnique({
      where: { caseId },
    });

    return NextResponse.json({
      draft: draft?.content || null,
      savedAt: draft?.savedAt || null,
    });
  } catch (error) {
    console.error("[Draft] Get error:", error);
    return NextResponse.json(
      { error: "Failed to get draft" },
      { status: 500 }
    );
  }
}

// Save draft
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: caseId } = await params;

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify case belongs to user
    const dispute = await prisma.dispute.findFirst({
      where: { id: caseId, userId: user.id },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const body = await request.json();
    const { content } = body;

    if (typeof content !== "string") {
      return NextResponse.json(
        { error: "Content must be a string" },
        { status: 400 }
      );
    }

    // Upsert draft
    const draft = await prisma.chatDraft.upsert({
      where: { caseId },
      update: {
        content,
        savedAt: new Date(),
      },
      create: {
        caseId,
        userId: user.id,
        content,
      },
    });

    return NextResponse.json({
      success: true,
      savedAt: draft.savedAt,
    });
  } catch (error) {
    console.error("[Draft] Save error:", error);
    return NextResponse.json(
      { error: "Failed to save draft" },
      { status: 500 }
    );
  }
}

// Delete draft (after sending message)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: caseId } = await params;

    await prisma.chatDraft.deleteMany({
      where: { caseId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Draft] Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete draft" },
      { status: 500 }
    );
  }
}
