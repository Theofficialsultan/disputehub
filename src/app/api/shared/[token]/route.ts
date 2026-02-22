/**
 * Shared Case Viewer API
 * Access a case via share token (no auth required)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Find the share by token
    const share = await prisma.caseShare.findUnique({
      where: { shareToken: token },
    });

    if (!share) {
      return NextResponse.json({ error: "Share not found" }, { status: 404 });
    }

    // Check if share is active
    if (!share.isActive) {
      return NextResponse.json({ error: "Share has been revoked" }, { status: 403 });
    }

    // Check if share has expired
    if (share.expiresAt && share.expiresAt < new Date()) {
      return NextResponse.json({ error: "Share has expired" }, { status: 403 });
    }

    // Update access tracking
    await prisma.caseShare.update({
      where: { id: share.id },
      data: {
        accessedAt: new Date(),
        accessCount: { increment: 1 },
      },
    });

    // Get case details based on permission level
    const dispute = await prisma.dispute.findUnique({
      where: { id: share.caseId },
      select: {
        id: true,
        title: true,
        type: true,
        description: true,
        status: true,
        lifecycleStatus: true,
        createdAt: true,
        caseSummary: share.permission !== "VIEW_ONLY" ? true : false,
        caseStrategy: {
          select: {
            keyFacts: true,
            disputeType: true,
            desiredOutcome: true,
          },
        },
        generatedDocuments: {
          select: {
            id: true,
            type: true,
            title: true,
            status: true,
            fileUrl: true,
            createdAt: true,
          },
        },
        caseEvents: {
          select: {
            id: true,
            type: true,
            description: true,
            occurredAt: true,
          },
          orderBy: { occurredAt: "desc" },
          take: 20,
        },
        evidenceItems: share.permission === "COLLABORATE" ? {
          select: {
            id: true,
            title: true,
            description: true,
            fileName: true,
            evidenceIndex: true,
          },
        } : false,
      },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    return NextResponse.json({
      permission: share.permission,
      case: dispute,
    });
  } catch (error) {
    console.error("[Shared] Get error:", error);
    return NextResponse.json(
      { error: "Failed to access shared case" },
      { status: 500 }
    );
  }
}
