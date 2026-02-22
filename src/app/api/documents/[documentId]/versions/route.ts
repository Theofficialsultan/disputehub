/**
 * Document Versions API
 * View and restore document version history
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import {
  getDocumentVersions,
  restoreDocumentVersion,
  compareDocumentVersions,
} from "@/lib/document-versioning";

// Get version history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { documentId } = await params;

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify document access
    const document = await prisma.generatedDocument.findUnique({
      where: { id: documentId },
      include: {
        case: {
          select: { userId: true },
        },
      },
    });

    if (!document || document.case?.userId !== user.id) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const versions = await getDocumentVersions(documentId);

    return NextResponse.json({
      documentId,
      currentVersion: versions.length + 1,
      versions: versions.map((v) => ({
        versionNumber: v.versionNumber,
        createdAt: v.createdAt,
        changeReason: v.changeReason,
        changedBy: v.changedBy,
        hasContent: !!v.content,
        hasFile: !!v.fileUrl,
      })),
    });
  } catch (error) {
    console.error("[Versions] Get error:", error);
    return NextResponse.json(
      { error: "Failed to get versions" },
      { status: 500 }
    );
  }
}

// Restore a version
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { documentId } = await params;

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify document access
    const document = await prisma.generatedDocument.findUnique({
      where: { id: documentId },
      include: {
        case: {
          select: { userId: true },
        },
      },
    });

    if (!document || document.case?.userId !== user.id) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const body = await request.json();
    const { versionNumber, action } = body;

    if (action === "compare") {
      const { compareWith } = body;
      if (!versionNumber || !compareWith) {
        return NextResponse.json(
          { error: "Two version numbers required for comparison" },
          { status: 400 }
        );
      }

      const comparison = await compareDocumentVersions(
        documentId,
        versionNumber,
        compareWith
      );

      return NextResponse.json({ comparison });
    }

    if (action === "restore") {
      if (!versionNumber) {
        return NextResponse.json(
          { error: "Version number required" },
          { status: 400 }
        );
      }

      const success = await restoreDocumentVersion(
        documentId,
        versionNumber,
        user.id
      );

      if (!success) {
        return NextResponse.json(
          { error: "Failed to restore version" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Restored to version ${versionNumber}`,
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'restore' or 'compare'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[Versions] Action error:", error);
    return NextResponse.json(
      { error: "Failed to perform version action" },
      { status: 500 }
    );
  }
}
