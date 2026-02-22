/**
 * Feature 10: Export Case Bundle
 * Download all case docs as single PDF
 */

import { prisma } from "@/lib/prisma";
import { PDFDocument, StandardFonts, rgb, PageSizes } from "pdf-lib";

export interface CaseBundleOptions {
  includeEvidence: boolean;
  includeCoverPage: boolean;
  includeTableOfContents: boolean;
  includeTimeline: boolean;
  includeStrategy: boolean;
}

export interface BundleDocument {
  id: string;
  title: string;
  type: string;
  pageStart: number;
  pageCount: number;
  content?: string;
  fileUrl?: string;
  pdfData?: Buffer;
}

export interface CaseBundleResult {
  pdfBuffer: Buffer;
  filename: string;
  pageCount: number;
  documents: BundleDocument[];
}

const DEFAULT_OPTIONS: CaseBundleOptions = {
  includeEvidence: true,
  includeCoverPage: true,
  includeTableOfContents: true,
  includeTimeline: true,
  includeStrategy: true,
};

/**
 * Generate a complete case bundle as a single PDF
 */
export async function generateCaseBundle(
  caseId: string,
  userId: string,
  options: Partial<CaseBundleOptions> = {}
): Promise<CaseBundleResult> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  // Fetch case data
  const caseData = await prisma.dispute.findFirst({
    where: { id: caseId, userId },
    include: {
      caseStrategy: true,
      documentPlan: {
        include: {
          documents: {
            where: { status: "COMPLETED" },
            orderBy: { order: "asc" },
          },
        },
      },
      caseEvents: {
        orderBy: { occurredAt: "asc" },
      },
      evidenceItems: {
        orderBy: { evidenceIndex: "asc" },
      },
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!caseData) {
    throw new Error("Case not found");
  }

  // Create main PDF document
  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const bundleDocuments: BundleDocument[] = [];
  let currentPage = 1;

  // 1. Cover Page
  if (mergedOptions.includeCoverPage) {
    currentPage = await addCoverPage(pdfDoc, {
      caseTitle: caseData.title,
      caseId: caseData.id,
      userName: `${caseData.user.firstName || ""} ${caseData.user.lastName || ""}`.trim() || "User",
      createdAt: caseData.createdAt,
      documentCount: caseData.documentPlan?.documents.length || 0,
      evidenceCount: caseData.evidenceItems.length,
    });
    currentPage++;
  }

  // 2. Table of Contents (placeholder - we'll update after)
  let tocPageIndex = -1;
  if (mergedOptions.includeTableOfContents) {
    tocPageIndex = pdfDoc.getPageCount();
    const tocPage = pdfDoc.addPage(PageSizes.A4);
    const { width, height } = tocPage.getSize();
    tocPage.drawText("TABLE OF CONTENTS", {
      x: 50,
      y: height - 50,
      size: 16,
      font: helveticaBold,
      color: rgb(0.2, 0.2, 0.2),
    });
    currentPage++;
  }

  // 3. Case Strategy Summary
  if (mergedOptions.includeStrategy && caseData.caseStrategy) {
    const strategyStartPage = currentPage;
    currentPage = await addStrategySection(pdfDoc, caseData.caseStrategy, currentPage);
    bundleDocuments.push({
      id: "strategy",
      title: "Case Strategy Summary",
      type: "STRATEGY",
      pageStart: strategyStartPage,
      pageCount: currentPage - strategyStartPage,
    });
  }

  // 4. Generated Documents
  if (caseData.documentPlan?.documents) {
    for (const doc of caseData.documentPlan.documents) {
      const docStartPage = currentPage;
      
      if (doc.pdfData) {
        // Merge existing PDF
        try {
          const existingPdf = await PDFDocument.load(doc.pdfData);
          const pages = await pdfDoc.copyPages(existingPdf, existingPdf.getPageIndices());
          pages.forEach((page) => pdfDoc.addPage(page));
          currentPage += pages.length;
        } catch (error) {
          console.error(`Failed to merge PDF for document ${doc.id}:`, error);
          // Add placeholder page
          currentPage = await addPlaceholderPage(pdfDoc, doc.title, "PDF could not be merged");
        }
      } else if (doc.content) {
        // Convert text content to PDF pages
        currentPage = await addTextDocument(pdfDoc, doc.title, doc.content, currentPage);
      } else if (doc.fileUrl) {
        // Add reference page
        currentPage = await addPlaceholderPage(pdfDoc, doc.title, `See attached: ${doc.fileUrl}`);
      }

      bundleDocuments.push({
        id: doc.id,
        title: doc.title,
        type: doc.type,
        pageStart: docStartPage,
        pageCount: currentPage - docStartPage,
        content: doc.content || undefined,
        fileUrl: doc.fileUrl || undefined,
      });
    }
  }

  // 5. Evidence Index
  if (mergedOptions.includeEvidence && caseData.evidenceItems.length > 0) {
    const evidenceStartPage = currentPage;
    currentPage = await addEvidenceIndex(pdfDoc, caseData.evidenceItems, currentPage);
    bundleDocuments.push({
      id: "evidence-index",
      title: "Evidence Index",
      type: "EVIDENCE_INDEX",
      pageStart: evidenceStartPage,
      pageCount: currentPage - evidenceStartPage,
    });
  }

  // 6. Timeline
  if (mergedOptions.includeTimeline && caseData.caseEvents.length > 0) {
    const timelineStartPage = currentPage;
    currentPage = await addTimelineSection(pdfDoc, caseData.caseEvents, currentPage);
    bundleDocuments.push({
      id: "timeline",
      title: "Case Timeline",
      type: "TIMELINE",
      pageStart: timelineStartPage,
      pageCount: currentPage - timelineStartPage,
    });
  }

  // Update Table of Contents with actual page numbers
  if (tocPageIndex >= 0) {
    await updateTableOfContents(pdfDoc, tocPageIndex, bundleDocuments);
  }

  // Add page numbers
  await addPageNumbers(pdfDoc);

  // Save PDF
  const pdfBytes = await pdfDoc.save();
  const pdfBuffer = Buffer.from(pdfBytes);

  // Generate filename
  const safeTitle = caseData.title.replace(/[^a-z0-9]/gi, "_").substring(0, 30);
  const filename = `DisputeHub_Bundle_${safeTitle}_${new Date().toISOString().split("T")[0]}.pdf`;

  return {
    pdfBuffer,
    filename,
    pageCount: pdfDoc.getPageCount(),
    documents: bundleDocuments,
  };
}

async function addCoverPage(
  pdfDoc: PDFDocument,
  info: {
    caseTitle: string;
    caseId: string;
    userName: string;
    createdAt: Date;
    documentCount: number;
    evidenceCount: number;
  }
): Promise<number> {
  const page = pdfDoc.addPage(PageSizes.A4);
  const { width, height } = page.getSize();
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Title
  page.drawText("CASE BUNDLE", {
    x: 50,
    y: height - 100,
    size: 32,
    font: helveticaBold,
    color: rgb(0.2, 0.2, 0.4),
  });

  // Case Title
  page.drawText(info.caseTitle, {
    x: 50,
    y: height - 160,
    size: 20,
    font: helveticaBold,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Case ID
  page.drawText(`Case Reference: ${info.caseId}`, {
    x: 50,
    y: height - 200,
    size: 12,
    font: helvetica,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Prepared for
  page.drawText(`Prepared for: ${info.userName}`, {
    x: 50,
    y: height - 250,
    size: 14,
    font: helvetica,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Date
  page.drawText(`Date: ${info.createdAt.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })}`, {
    x: 50,
    y: height - 280,
    size: 14,
    font: helvetica,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Summary box
  const boxY = height - 400;
  page.drawRectangle({
    x: 50,
    y: boxY,
    width: width - 100,
    height: 100,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1,
    color: rgb(0.96, 0.96, 0.98),
  });

  page.drawText("Bundle Contents:", {
    x: 60,
    y: boxY + 75,
    size: 12,
    font: helveticaBold,
    color: rgb(0.2, 0.2, 0.2),
  });

  page.drawText(`• ${info.documentCount} document(s)`, {
    x: 70,
    y: boxY + 50,
    size: 11,
    font: helvetica,
    color: rgb(0.3, 0.3, 0.3),
  });

  page.drawText(`• ${info.evidenceCount} evidence item(s)`, {
    x: 70,
    y: boxY + 30,
    size: 11,
    font: helvetica,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Footer
  page.drawText("Generated by DisputeHub", {
    x: 50,
    y: 50,
    size: 10,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });

  page.drawText(new Date().toISOString(), {
    x: width - 150,
    y: 50,
    size: 10,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });

  return 1;
}

async function addStrategySection(
  pdfDoc: PDFDocument,
  strategy: any,
  startPage: number
): Promise<number> {
  const page = pdfDoc.addPage(PageSizes.A4);
  const { width, height } = page.getSize();
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let y = height - 50;

  page.drawText("CASE STRATEGY SUMMARY", {
    x: 50,
    y,
    size: 16,
    font: helveticaBold,
    color: rgb(0.2, 0.2, 0.4),
  });

  y -= 40;

  if (strategy.disputeType) {
    page.drawText(`Dispute Type: ${strategy.disputeType}`, {
      x: 50,
      y,
      size: 12,
      font: helvetica,
    });
    y -= 30;
  }

  if (strategy.desiredOutcome) {
    page.drawText("Desired Outcome:", {
      x: 50,
      y,
      size: 12,
      font: helveticaBold,
    });
    y -= 20;
    
    const outcomeLines = wrapText(strategy.desiredOutcome, 80);
    for (const line of outcomeLines) {
      page.drawText(line, { x: 50, y, size: 11, font: helvetica });
      y -= 18;
    }
    y -= 10;
  }

  if (strategy.keyFacts && strategy.keyFacts.length > 0) {
    page.drawText("Key Facts:", {
      x: 50,
      y,
      size: 12,
      font: helveticaBold,
    });
    y -= 25;

    for (const fact of strategy.keyFacts) {
      const factLines = wrapText(`• ${fact}`, 75);
      for (const line of factLines) {
        page.drawText(line, { x: 60, y, size: 11, font: helvetica });
        y -= 18;
      }
    }
  }

  return startPage + 1;
}

async function addTextDocument(
  pdfDoc: PDFDocument,
  title: string,
  content: string,
  startPage: number
): Promise<number> {
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  const lines = content.split("\n");
  let currentPage = pdfDoc.addPage(PageSizes.A4);
  let { width, height } = currentPage.getSize();
  let y = height - 50;
  let pageCount = 1;

  // Title
  currentPage.drawText(title, {
    x: 50,
    y,
    size: 14,
    font: helveticaBold,
    color: rgb(0.2, 0.2, 0.4),
  });
  y -= 30;

  for (const line of lines) {
    const wrappedLines = wrapText(line, 85);
    
    for (const wrappedLine of wrappedLines) {
      if (y < 80) {
        // New page
        currentPage = pdfDoc.addPage(PageSizes.A4);
        y = height - 50;
        pageCount++;
      }

      currentPage.drawText(wrappedLine, {
        x: 50,
        y,
        size: 11,
        font: helvetica,
      });
      y -= 16;
    }
  }

  return startPage + pageCount;
}

async function addEvidenceIndex(
  pdfDoc: PDFDocument,
  evidenceItems: any[],
  startPage: number
): Promise<number> {
  const page = pdfDoc.addPage(PageSizes.A4);
  const { width, height } = page.getSize();
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let y = height - 50;

  page.drawText("EVIDENCE INDEX", {
    x: 50,
    y,
    size: 16,
    font: helveticaBold,
    color: rgb(0.2, 0.2, 0.4),
  });

  y -= 40;

  for (const item of evidenceItems) {
    if (y < 100) break; // Simple pagination

    page.drawText(`Evidence Item #${item.evidenceIndex}`, {
      x: 50,
      y,
      size: 12,
      font: helveticaBold,
    });
    y -= 18;

    page.drawText(`Title: ${item.title}`, {
      x: 60,
      y,
      size: 11,
      font: helvetica,
    });
    y -= 16;

    page.drawText(`Type: ${item.fileType}`, {
      x: 60,
      y,
      size: 11,
      font: helvetica,
    });
    y -= 16;

    if (item.description) {
      page.drawText(`Description: ${item.description.substring(0, 60)}...`, {
        x: 60,
        y,
        size: 11,
        font: helvetica,
      });
      y -= 16;
    }

    y -= 10;
  }

  return startPage + 1;
}

async function addTimelineSection(
  pdfDoc: PDFDocument,
  events: any[],
  startPage: number
): Promise<number> {
  const page = pdfDoc.addPage(PageSizes.A4);
  const { width, height } = page.getSize();
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let y = height - 50;

  page.drawText("CASE TIMELINE", {
    x: 50,
    y,
    size: 16,
    font: helveticaBold,
    color: rgb(0.2, 0.2, 0.4),
  });

  y -= 40;

  for (const event of events) {
    if (y < 100) break;

    const date = new Date(event.occurredAt).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    page.drawText(date, {
      x: 50,
      y,
      size: 10,
      font: helveticaBold,
      color: rgb(0.4, 0.4, 0.4),
    });

    page.drawText(event.description, {
      x: 130,
      y,
      size: 11,
      font: helvetica,
    });

    y -= 25;
  }

  return startPage + 1;
}

async function addPlaceholderPage(
  pdfDoc: PDFDocument,
  title: string,
  message: string
): Promise<number> {
  const page = pdfDoc.addPage(PageSizes.A4);
  const { width, height } = page.getSize();
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  page.drawText(title, {
    x: 50,
    y: height - 50,
    size: 14,
    font: helveticaBold,
  });

  page.drawText(message, {
    x: 50,
    y: height - 80,
    size: 11,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });

  return 1;
}

async function updateTableOfContents(
  pdfDoc: PDFDocument,
  tocPageIndex: number,
  documents: BundleDocument[]
): Promise<void> {
  const tocPage = pdfDoc.getPage(tocPageIndex);
  const { width, height } = tocPage.getSize();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let y = height - 100;

  for (const doc of documents) {
    const text = `${doc.title}`;
    const pageNum = `Page ${doc.pageStart}`;
    
    tocPage.drawText(text, {
      x: 50,
      y,
      size: 11,
      font: helvetica,
    });

    tocPage.drawText(pageNum, {
      x: width - 100,
      y,
      size: 11,
      font: helvetica,
    });

    // Draw dots
    const dotsY = y;
    for (let x = 300; x < width - 110; x += 5) {
      tocPage.drawText(".", { x, y: dotsY, size: 11, font: helvetica, color: rgb(0.7, 0.7, 0.7) });
    }

    y -= 25;
  }
}

async function addPageNumbers(pdfDoc: PDFDocument): Promise<void> {
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    
    page.drawText(`Page ${i + 1} of ${pages.length}`, {
      x: width / 2 - 30,
      y: 30,
      size: 9,
      font: helvetica,
      color: rgb(0.5, 0.5, 0.5),
    });
  }
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).trim().length <= maxChars) {
      currentLine = (currentLine + " " + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines.length > 0 ? lines : [""];
}

/**
 * Get estimated bundle size
 */
export async function estimateBundleSize(caseId: string, userId: string): Promise<{
  documentCount: number;
  evidenceCount: number;
  estimatedPages: number;
  estimatedSizeMb: number;
}> {
  const caseData = await prisma.dispute.findFirst({
    where: { id: caseId, userId },
    include: {
      documentPlan: {
        include: {
          documents: {
            where: { status: "COMPLETED" },
          },
        },
      },
      evidenceItems: true,
      caseEvents: true,
    },
  });

  if (!caseData) {
    return { documentCount: 0, evidenceCount: 0, estimatedPages: 0, estimatedSizeMb: 0 };
  }

  const documentCount = caseData.documentPlan?.documents.length || 0;
  const evidenceCount = caseData.evidenceItems.length;
  
  // Estimate: cover (1) + TOC (1) + strategy (1) + docs (avg 2 each) + evidence index (1) + timeline (1)
  const estimatedPages = 5 + (documentCount * 2);
  
  // Rough estimate: 50KB per page
  const estimatedSizeMb = (estimatedPages * 50) / 1024;

  return {
    documentCount,
    evidenceCount,
    estimatedPages,
    estimatedSizeMb: Math.round(estimatedSizeMb * 10) / 10,
  };
}
