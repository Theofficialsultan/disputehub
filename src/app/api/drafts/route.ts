/**
 * API Route: Auto-Save Drafts
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import {
  saveDraft,
  getUserDrafts,
  deleteDraft,
  getDraftStats,
  type DraftType,
  type DraftContent,
} from "@/lib/drafts/auto-save";

// GET: List user's drafts
export async function GET(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const stats = searchParams.get("stats") === "true";

    if (stats) {
      const draftStats = await getDraftStats(userId);
      return NextResponse.json({ stats: draftStats });
    }

    const drafts = await getUserDrafts(userId);
    return NextResponse.json({ drafts });
  } catch (error) {
    console.error("Error fetching drafts:", error);
    return NextResponse.json(
      { error: "Failed to fetch drafts" },
      { status: 500 }
    );
  }
}

// POST: Save a draft
export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { caseId, type, title, content, autoSaved } = body as {
      caseId?: string;
      type: DraftType;
      title: string;
      content: DraftContent;
      autoSaved?: boolean;
    };

    if (!type || !title) {
      return NextResponse.json(
        { error: "Missing required fields: type, title" },
        { status: 400 }
      );
    }

    const draft = await saveDraft({
      userId,
      caseId,
      type,
      title,
      content: content || {},
      autoSaved: autoSaved || false,
    });

    return NextResponse.json({ draft });
  } catch (error) {
    console.error("Error saving draft:", error);
    return NextResponse.json(
      { error: "Failed to save draft" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a draft
export async function DELETE(request: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const draftId = searchParams.get("id");

    if (!draftId) {
      return NextResponse.json(
        { error: "Missing draft ID" },
        { status: 400 }
      );
    }

    await deleteDraft(draftId, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting draft:", error);
    return NextResponse.json(
      { error: "Failed to delete draft" },
      { status: 500 }
    );
  }
}
