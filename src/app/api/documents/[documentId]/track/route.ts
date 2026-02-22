/**
 * Document Interaction Tracking
 * 
 * POST - Track document interactions (view, download, copy, share)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { z } from "zod";

const trackSchema = z.object({
  action: z.enum(['view', 'download', 'copy', 'share', 'email_opened']),
});

export async function POST(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const documentId = params.documentId;
    const body = await request.json();
    const { action } = trackSchema.parse(body);

    // Get document with ownership check
    const document = await prisma.generatedDocument.findUnique({
      where: { id: documentId },
      include: {
        case: { select: { userId: true } }
      }
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.case?.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const now = new Date();

    // Update tracking based on action
    switch (action) {
      case 'view':
        await prisma.generatedDocument.update({
          where: { id: documentId },
          data: {
            viewCount: { increment: 1 },
            viewedAt: document.viewedAt || now, // Only set first view
          }
        });
        break;
        
      case 'download':
        await prisma.generatedDocument.update({
          where: { id: documentId },
          data: {
            downloadCount: { increment: 1 },
            downloadedAt: document.downloadedAt || now, // Only set first download
          }
        });
        break;
        
      case 'copy':
      case 'share':
      case 'email_opened':
        // These are logged but don't have dedicated counters yet
        // Could add them if needed
        break;
    }

    return NextResponse.json({
      success: true,
      action,
      timestamp: now.toISOString(),
    });

  } catch (error) {
    console.error("[Document Track] Error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.issues }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Failed to track action" }, { status: 500 });
  }
}
