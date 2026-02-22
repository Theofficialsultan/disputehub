/**
 * API Route: Case Sharing
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import {
  createShareLink,
  getCaseShareLinks,
  getShareLinkUrl,
  type CollaboratorRole,
} from "@/lib/collaboration/case-sharing";

// GET: List share links for a case
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const links = await getCaseShareLinks(params.id, userId);
    
    // Add URL to each link
    const linksWithUrls = links.map((link) => ({
      ...link,
      url: getShareLinkUrl(link.token),
    }));

    return NextResponse.json({ links: linksWithUrls });
  } catch (error) {
    console.error("Error fetching share links:", error);
    return NextResponse.json(
      { error: "Failed to fetch share links" },
      { status: 500 }
    );
  }
}

// POST: Create a new share link
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { role = "VIEWER", expiresInDays, maxUses } = body as {
      role?: CollaboratorRole;
      expiresInDays?: number;
      maxUses?: number;
    };

    const link = await createShareLink({
      caseId: params.id,
      userId,
      role,
      expiresInDays,
      maxUses,
    });

    return NextResponse.json({
      link: {
        ...link,
        url: getShareLinkUrl(link.token),
      },
    });
  } catch (error) {
    console.error("Error creating share link:", error);
    return NextResponse.json(
      { error: "Failed to create share link" },
      { status: 500 }
    );
  }
}
