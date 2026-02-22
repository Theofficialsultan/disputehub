/**
 * GET /api/documents/[documentId]/download
 * 
 * Downloads a generated document - handles both PDF and text documents.
 * - PDF documents (pdfData) → returns as application/pdf
 * - Text documents (content) → returns as text/plain or generates PDF
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const documentId = params.documentId;

    // Get the document with case info for ownership check
    const document = await prisma.generatedDocument.findUnique({
      where: { id: documentId },
      include: {
        plan: {
          include: {
            case: {
              select: { userId: true }
            }
          }
        }
      }
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Check ownership - document must belong to user's case
    const caseUserId = document.plan?.case?.userId;
    
    // Also check direct caseId relationship if plan relationship doesn't exist
    if (!caseUserId && document.caseId) {
      const directCase = await prisma.dispute.findUnique({
        where: { id: document.caseId },
        select: { userId: true }
      });
      
      if (!directCase || directCase.userId !== userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    } else if (caseUserId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if document is completed
    if (document.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Document is not ready for download", status: document.status },
        { status: 400 }
      );
    }

    // Generate safe filename
    const safeTitle = document.title
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
    const timestamp = new Date().toISOString().split('T')[0];

    // CASE 1: PDF document (auto-filled form)
    if (document.pdfData) {
      const filename = document.pdfFilename || `${safeTitle}_${timestamp}.pdf`;
      
      return new NextResponse(document.pdfData, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': document.pdfData.length.toString(),
        },
      });
    }

    // CASE 2: External file URL (Supabase storage)
    if (document.fileUrl) {
      // Redirect to the file URL
      return NextResponse.redirect(document.fileUrl);
    }

    // CASE 3: Text content - return as downloadable text file
    if (document.content) {
      const filename = `${safeTitle}_${timestamp}.txt`;
      const content = document.content;
      
      return new NextResponse(content, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': Buffer.byteLength(content, 'utf8').toString(),
        },
      });
    }

    // No content available
    return NextResponse.json(
      { error: "Document has no content" },
      { status: 404 }
    );

  } catch (error) {
    console.error("[Document Download] Error:", error);
    return NextResponse.json(
      { error: "Failed to download document" },
      { status: 500 }
    );
  }
}
