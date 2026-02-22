/**
 * GET /api/documents/[documentId]/pdf
 * 
 * Generates a professional PDF from document content.
 * Uses pdf-lib to create properly formatted PDFs.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// Configuration
const PAGE_WIDTH = 595.28; // A4 width in points
const PAGE_HEIGHT = 841.89; // A4 height in points
const MARGIN_TOP = 72;
const MARGIN_BOTTOM = 72;
const MARGIN_LEFT = 72;
const MARGIN_RIGHT = 72;
const LINE_HEIGHT = 14;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

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

    // Check ownership
    const caseUserId = document.plan?.case?.userId;
    
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

    // If already have PDF data, return it
    if (document.pdfData) {
      const filename = document.pdfFilename || `${sanitizeFilename(document.title)}.pdf`;
      
      return new NextResponse(document.pdfData, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': document.pdfData.length.toString(),
        },
      });
    }

    // Generate PDF from content
    if (!document.content) {
      return NextResponse.json({ error: "Document has no content" }, { status: 404 });
    }

    const pdfBytes = await generatePDFFromContent(document.title, document.content);
    const filename = `${sanitizeFilename(document.title)}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBytes.length.toString(),
      },
    });

  } catch (error) {
    console.error("[PDF Generation] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}

function sanitizeFilename(title: string): string {
  return title
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50);
}

async function generatePDFFromContent(title: string, content: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  
  // Embed fonts
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Parse content into lines
  const lines = content.split('\n');
  
  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let yPosition = PAGE_HEIGHT - MARGIN_TOP;
  
  // Add title
  const titleFontSize = 16;
  page.drawText(title, {
    x: MARGIN_LEFT,
    y: yPosition,
    size: titleFontSize,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  yPosition -= titleFontSize * 1.5;
  
  // Add horizontal line
  page.drawLine({
    start: { x: MARGIN_LEFT, y: yPosition },
    end: { x: PAGE_WIDTH - MARGIN_RIGHT, y: yPosition },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
  yPosition -= 20;
  
  // Process content
  const fontSize = 11;
  const maxCharsPerLine = Math.floor(CONTENT_WIDTH / (fontSize * 0.5));
  
  for (const line of lines) {
    // Check if we need a new page
    if (yPosition < MARGIN_BOTTOM + LINE_HEIGHT) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      yPosition = PAGE_HEIGHT - MARGIN_TOP;
    }
    
    // Handle empty lines (paragraph breaks)
    if (line.trim() === '') {
      yPosition -= LINE_HEIGHT * 0.8;
      continue;
    }
    
    // Detect headers (lines in ALL CAPS or starting with certain patterns)
    const isHeader = /^[A-Z][A-Z\s\d:.()-]+$/.test(line.trim()) || 
                     /^(RE:|REF:|SUBJECT:|FROM:|TO:|DATE:|DEAR|YOURS|WITHOUT PREJUDICE)/i.test(line.trim());
    
    const currentFont = isHeader ? helveticaBold : helvetica;
    const currentFontSize = isHeader ? 12 : fontSize;
    
    // Word wrap
    const words = line.split(' ');
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const textWidth = currentFont.widthOfTextAtSize(testLine, currentFontSize);
      
      if (textWidth > CONTENT_WIDTH && currentLine) {
        // Draw current line
        if (yPosition < MARGIN_BOTTOM + LINE_HEIGHT) {
          page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
          yPosition = PAGE_HEIGHT - MARGIN_TOP;
        }
        
        page.drawText(currentLine, {
          x: MARGIN_LEFT,
          y: yPosition,
          size: currentFontSize,
          font: currentFont,
          color: rgb(0, 0, 0),
        });
        yPosition -= LINE_HEIGHT;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    // Draw remaining text
    if (currentLine) {
      if (yPosition < MARGIN_BOTTOM + LINE_HEIGHT) {
        page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        yPosition = PAGE_HEIGHT - MARGIN_TOP;
      }
      
      page.drawText(currentLine, {
        x: MARGIN_LEFT,
        y: yPosition,
        size: currentFontSize,
        font: currentFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= LINE_HEIGHT;
    }
    
    // Extra space after headers
    if (isHeader) {
      yPosition -= 4;
    }
  }
  
  // Add page numbers
  const pages = pdfDoc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const pageNum = pages[i];
    const pageText = `Page ${i + 1} of ${pages.length}`;
    const textWidth = helvetica.widthOfTextAtSize(pageText, 9);
    
    pageNum.drawText(pageText, {
      x: (PAGE_WIDTH - textWidth) / 2,
      y: 30,
      size: 9,
      font: helvetica,
      color: rgb(0.5, 0.5, 0.5),
    });
  }
  
  // Add footer on first page
  const firstPage = pages[0];
  const footerText = 'Generated by DisputeHub • dispute-hub.com';
  const footerWidth = helvetica.widthOfTextAtSize(footerText, 8);
  
  firstPage.drawText(footerText, {
    x: (PAGE_WIDTH - footerWidth) / 2,
    y: 20,
    size: 8,
    font: helvetica,
    color: rgb(0.6, 0.6, 0.6),
  });
  
  return await pdfDoc.save();
}
