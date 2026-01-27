/**
 * Document Generation Service (Block 3C)
 * 
 * Orchestrates: AI Content → HTML → PDF → Storage → Database
 * 
 * Architecture:
 * 1. AI generates structured content (plain text)
 * 2. Content is formatted into semantic HTML
 * 3. HTML is converted to PDF via external API
 * 4. PDF is uploaded to Supabase Storage
 * 5. Database is updated with fileUrl and status
 * 
 * Requirements Met:
 * - Production-grade PDF generation
 * - Per-document-type prompts
 * - Batch processing
 * - Retry logic (max 2 auto-retries)
 * - Status flow: PENDING → GENERATING → COMPLETED/FAILED
 */

import { openai } from "@/lib/ai/openai";
import { convertHTMLToPDF, wrapHTMLDocument } from "@/lib/pdf/html-to-pdf";
import {
  generateFormalLetterHTML,
  generateEvidenceScheduleHTML,
  generateTimelineHTML,
  generateWitnessStatementHTML,
  generateAppealFormHTML,
  generateCoverLetterHTML,
  generateFollowUpLetterHTML,
} from "@/lib/pdf/templates";
import { uploadPDF } from "@/lib/storage/supabase";
import { prisma } from "@/lib/prisma";
import { createDocumentGeneratedEvent } from "@/lib/timeline/timeline";
import type { CaseStrategy } from "@prisma/client";

/**
 * Document type-specific AI prompts
 * Each document type has its own deterministic prompt
 */
const DOCUMENT_PROMPTS = {
  FORMAL_LETTER: (strategy: CaseStrategy, evidenceItems?: Array<{evidenceIndex: number; title: string; evidenceDate?: Date}>) => `
You are a UK legal document writer. Generate a formal dispute letter.

Case Information:
- Dispute Type: ${strategy.disputeType || "Not specified"}
- Key Facts: ${JSON.stringify(strategy.keyFacts)}
- Desired Outcome: ${strategy.desiredOutcome || "Not specified"}

${evidenceItems && evidenceItems.length > 0 ? `
Available Evidence Items (reference by index only):
${evidenceItems.map(e => `- Evidence Item #${e.evidenceIndex}: ${e.title}${e.evidenceDate ? ` (dated ${new Date(e.evidenceDate).toLocaleDateString('en-GB')})` : ''}`).join('\n')}
` : ''}

Write a professional formal letter with 3-5 paragraphs that:
1. Clearly states the nature of the dispute
2. Presents the key facts in a logical order
3. ${evidenceItems && evidenceItems.length > 0 ? 'References evidence using ONLY the format "Evidence Item #X" (e.g., "Evidence Item #1", "Evidence Item #2")' : 'States the facts clearly'}
4. States the desired resolution

Requirements:
- Use formal UK legal language
- Write in complete paragraphs only (no bullet points)
- Be factual and professional
- ${evidenceItems && evidenceItems.length > 0 ? 'When referencing evidence, use ONLY the format: "Evidence Item #X (Title) dated DD/MM/YYYY"' : ''}
- DO NOT embed images or attach files
- DO NOT use phrases like "see attached" or "available on request"
- Keep each paragraph focused on one main point

Return ONLY the body paragraphs (no addresses, dates, salutations).
Separate paragraphs with double line breaks.
`,

  EVIDENCE_SCHEDULE: (strategy: CaseStrategy, evidenceItems?: Array<{evidenceIndex: number; title: string; description?: string; evidenceDate?: Date; fileType: string}>) => `
You are creating an Evidence Schedule for a UK legal case.

${evidenceItems && evidenceItems.length > 0 ? `
Evidence Items to document:
${evidenceItems.map(e => `
Evidence Item #${e.evidenceIndex}
- Title: ${e.title}
- Type: ${e.fileType}
${e.description ? `- Description: ${e.description}` : ''}
${e.evidenceDate ? `- Date: ${new Date(e.evidenceDate).toLocaleDateString('en-GB')}` : ''}
`).join('\n')}
` : 'No evidence items uploaded yet.'}

Return: EVIDENCE_SCHEDULE_TEMPLATE
(This will be formatted by the template system with embedded images/PDFs)
`,

  TIMELINE: (strategy: CaseStrategy) => `
Create a chronological timeline of events.

Key Facts:
${JSON.stringify(strategy.keyFacts, null, 2)}

Order these events chronologically and clearly.
Each event should be a single clear statement.
Return as a list, one event per line.
No formatting, no numbering (will be added by template).
`,

  WITNESS_STATEMENT: () => "TEMPLATE_DOCUMENT",
  APPEAL_FORM: () => "TEMPLATE_DOCUMENT",
  COVER_LETTER: () => "TEMPLATE_DOCUMENT",

  FOLLOW_UP_LETTER: (strategy: CaseStrategy, evidenceItems?: Array<{evidenceIndex: number; title: string; evidenceDate?: Date}>) => `
You are a UK legal document writer. Generate a follow-up letter for a case where the initial letter received no response.

Case Information:
- Dispute Type: ${strategy.disputeType || "Not specified"}
- Key Facts: ${JSON.stringify(strategy.keyFacts)}
- Desired Outcome: ${strategy.desiredOutcome || "Not specified"}

${evidenceItems && evidenceItems.length > 0 ? `
Available Evidence Items (reference by index only):
${evidenceItems.map(e => `- Evidence Item #${e.evidenceIndex}: ${e.title}${e.evidenceDate ? ` (dated ${new Date(e.evidenceDate).toLocaleDateString('en-GB')})` : ''}`).join('\n')}
` : ''}

Write a professional follow-up letter with 2-4 paragraphs that:
1. Reinforces the key points from the original letter
2. References the missed deadline
3. ${evidenceItems && evidenceItems.length > 0 ? 'References evidence using ONLY the format "Evidence Item #X"' : 'Restates the facts'}
4. Uses a firmer (but still professional) tone
5. Requests a response within 14 days

Requirements:
- Use formal UK legal language
- Write in complete paragraphs only (no bullet points)
- Be assertive but not aggressive
- ${evidenceItems && evidenceItems.length > 0 ? 'When referencing evidence, use ONLY: "Evidence Item #X (Title) dated DD/MM/YYYY"' : ''}
- DO NOT embed images or attach files
- DO NOT mention lawyers or court proceedings
- DO NOT escalate beyond requesting a response
- Keep each paragraph focused and clear

Return ONLY the body paragraphs (no addresses, dates, salutations).
Separate paragraphs with double line breaks.
`,
};

/**
 * Generate document content using AI
 * 
 * @param documentType - Type of document to generate
 * @param strategy - Case strategy data
 * @param evidenceItems - Evidence items for reference
 * @returns AI-generated content (plain text)
 */
async function generateAIContent(
  documentType: string,
  strategy: CaseStrategy,
  evidenceItems?: Array<{evidenceIndex: number; title: string; description?: string; evidenceDate?: Date; fileType: string}>
): Promise<string> {
  const promptFn = DOCUMENT_PROMPTS[documentType as keyof typeof DOCUMENT_PROMPTS];

  if (!promptFn) {
    throw new Error(`Unknown document type: ${documentType}`);
  }

  const promptResult = promptFn(strategy, evidenceItems);

  // Template documents don't need AI
  if (promptResult === "TEMPLATE_DOCUMENT" || promptResult.includes("EVIDENCE_SCHEDULE_TEMPLATE")) {
    return promptResult;
  }

  // Generate content using OpenAI
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a UK legal document writer. Write clear, formal, professional content suitable for legal proceedings. Follow UK legal conventions and use formal British English.",
      },
      {
        role: "user",
        content: promptResult,
      },
    ],
    temperature: 0.3, // Low temperature for consistency
    max_tokens: 1500,
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error("AI generated empty content");
  }

  return content.trim();
}

/**
 * Convert AI content to HTML
 * 
 * @param documentType - Type of document
 * @param aiContent - AI-generated content
 * @param strategy - Case strategy
 * @param documentCount - Total document count (for cover letter)
 * @param evidenceItems - Evidence items for Evidence Schedule
 * @returns Complete HTML document
 */
function convertToHTML(
  documentType: string,
  aiContent: string,
  strategy: CaseStrategy,
  documentCount: number,
  evidenceItems?: Array<{evidenceIndex: number; title: string; description?: string; evidenceDate?: Date; fileType: string; fileUrl: string}>
): string {
  const senderName = "Claimant"; // TODO: Get from user profile
  const recipientName = "Respondent"; // TODO: Get from case details
  const subject = (strategy.disputeType || "Dispute")
    .replace(/_/g, " ")
    .toUpperCase();

  let htmlContent: string;

  switch (documentType) {
    case "FORMAL_LETTER":
      // Parse AI paragraphs
      const paragraphs = aiContent
        .split(/\n\n+/)
        .filter((p) => p.trim())
        .map((p) => p.trim());

      htmlContent = generateFormalLetterHTML({
        senderName,
        recipientName,
        subject,
        bodyParagraphs: paragraphs,
      });
      break;

    case "EVIDENCE_SCHEDULE":
      // Phase 8.5: Generate evidence schedule with embedded evidence
      if (evidenceItems && evidenceItems.length > 0) {
        htmlContent = generateEvidenceScheduleHTML(evidenceItems);
      } else {
        // No evidence items yet
        htmlContent = `
          <div class="section-title">SCHEDULE OF EVIDENCE</div>
          <div class="body">
            <p>No evidence items have been uploaded for this case yet.</p>
          </div>
        `;
      }
      break;

    case "TIMELINE":
      const events = aiContent
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => line.trim());

      htmlContent = generateTimelineHTML(events);
      break;

    case "WITNESS_STATEMENT":
      htmlContent = generateWitnessStatementHTML();
      break;

    case "APPEAL_FORM":
      htmlContent = generateAppealFormHTML(strategy.disputeType || "other");
      break;

    case "COVER_LETTER":
      htmlContent = generateCoverLetterHTML({ senderName, documentCount });
      break;

    case "FOLLOW_UP_LETTER":
      // Parse AI paragraphs for follow-up
      const followUpParagraphs = aiContent
        .split(/\n\n+/)
        .filter((p) => p.trim())
        .map((p) => p.trim());

      // Calculate dates for follow-up
      const originalDate = new Date();
      originalDate.setDate(originalDate.getDate() - 14); // Assume original was 14 days ago
      const originalLetterDate = originalDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      
      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() - 1); // Deadline was yesterday
      const deadlineMissedDate = deadlineDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      htmlContent = generateFollowUpLetterHTML({
        senderName,
        recipientName,
        subject,
        originalLetterDate,
        deadlineMissedDate,
        bodyParagraphs: followUpParagraphs,
      });
      break;

    default:
      throw new Error(`Unknown document type: ${documentType}`);
  }

  // Wrap in complete HTML document with styles
  return wrapHTMLDocument(htmlContent, documentType);
}

/**
 * Generate a single document
 * 
 * Process:
 * 1. Update status to GENERATING
 * 2. Fetch evidence items for the case
 * 3. Generate content using AI (with evidence references)
 * 4. Convert to HTML (with embedded evidence for EVIDENCE_SCHEDULE)
 * 5. Convert HTML to PDF
 * 6. Upload to Supabase Storage
 * 7. Update database with fileUrl and COMPLETED status
 * 
 * @param documentId - Document ID
 * @param documentType - Document type
 * @param caseId - Case ID
 * @param strategy - Case strategy
 * @param documentCount - Total document count
 * @returns File URL on success
 */
export async function generateDocument(
  documentId: string,
  documentType: string,
  caseId: string,
  strategy: CaseStrategy,
  documentCount: number
): Promise<string> {
  // Step 1: Update status to GENERATING
  await prisma.generatedDocument.update({
    where: { id: documentId },
    data: { status: "GENERATING" },
  });

  try {
    // Step 2: Fetch evidence items for this case
    const evidenceItems = await prisma.evidenceItem.findMany({
      where: { caseId },
      orderBy: { evidenceIndex: "asc" },
      select: {
        evidenceIndex: true,
        title: true,
        description: true,
        evidenceDate: true,
        fileType: true,
        fileUrl: true,
      },
    });

    // Step 3: Generate content using AI (pass evidence items)
    const aiContent = await generateAIContent(documentType, strategy, evidenceItems);
    console.log(`[Document Gen] AI Content Length: ${aiContent.length} chars`);
    console.log(`[Document Gen] AI Content Preview: ${aiContent.substring(0, 200)}...`);

    // HARD FAIL: AI content must exist
    if (!aiContent || aiContent.trim().length < 50) {
      throw new Error(
        `AI content generation failed for ${documentType}. Length: ${aiContent?.length ?? 0}. Content: "${aiContent}"`
      );
    }

    // Step 4: Convert to HTML (pass evidence items for embedding)
    const html = convertToHTML(documentType, aiContent, strategy, documentCount, evidenceItems);
    console.log(`[Document Gen] HTML Length: ${html.length} chars`);
    console.log(`[Document Gen] HTML Preview: ${html.substring(0, 500)}...`);

    // HARD FAIL: HTML must have substantial content
    if (!html || html.trim().length < 300) {
      throw new Error(
        `HTML generation failed for ${documentType}. Length: ${html?.length ?? 0}. Check convertToHTML() output.`
      );
    }

    // Step 5: Convert HTML to PDF
    const pdfBuffer = await convertHTMLToPDF(html);

    // Step 6: Upload to Supabase Storage
    const fileUrl = await uploadPDF(caseId, documentType, pdfBuffer);

    // Step 7: Update database with success
    await prisma.generatedDocument.update({
      where: { id: documentId },
      data: {
        status: "COMPLETED",
        fileUrl,
        lastError: null,
      },
    });

    // Step 8: Create timeline event (Phase 8.2.1)
    await createDocumentGeneratedEvent(caseId, documentId, documentType, true);

    return fileUrl;
  } catch (error) {
    // Handle failure: increment retry count
    const doc = await prisma.generatedDocument.findUnique({
      where: { id: documentId },
      select: { retryCount: true },
    });

    const newRetryCount = (doc?.retryCount || 0) + 1;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    await prisma.generatedDocument.update({
      where: { id: documentId },
      data: {
        status: "FAILED",
        retryCount: newRetryCount,
        lastError: errorMessage,
      },
    });

    // Create timeline event for failure (Phase 8.2.1)
    await createDocumentGeneratedEvent(caseId, documentId, documentType, false);

    throw new Error(`Document generation failed: ${errorMessage}`);
  }
}

/**
 * Batch generate all eligible documents
 * 
 * Eligible documents:
 * - status = PENDING
 * - OR status = FAILED AND retryCount < 2
 * 
 * Process:
 * - Process documents in order
 * - Failure of one document does NOT stop others
 * - Each document has independent retry logic
 * 
 * @param caseId - Case ID
 * @returns Generation summary
 */
export async function batchGenerateDocuments(caseId: string): Promise<{
  completed: number;
  failed: number;
  pending: number;
  documents: Array<{
    id: string;
    type: string;
    status: string;
    fileUrl?: string;
    error?: string;
  }>;
}> {
  console.log(`[batchGenerateDocuments] Starting for case ${caseId}`);
  
  // Fetch document plan
  const plan = await prisma.documentPlan.findUnique({
    where: { caseId },
    include: {
      documents: {
        orderBy: { order: "asc" },
      },
    },
  });

  if (!plan) {
    console.log(`[batchGenerateDocuments] ❌ No document plan found`);
    throw new Error("No document plan found for this case");
  }

  console.log(`[batchGenerateDocuments] Found plan with ${plan.documents.length} documents`);

  // Fetch strategy
  const strategy = await prisma.caseStrategy.findUnique({
    where: { caseId },
  });

  if (!strategy) {
    console.log(`[batchGenerateDocuments] ❌ No strategy found`);
    throw new Error("No strategy found for this case");
  }

  // Filter eligible documents
  const eligibleDocs = plan.documents.filter(
    (doc) =>
      doc.status === "PENDING" || (doc.status === "FAILED" && doc.retryCount < 2)
  );
  
  console.log(`[batchGenerateDocuments] ${eligibleDocs.length} eligible documents to generate`);

  const results = {
    completed: 0,
    failed: 0,
    pending: 0,
    documents: [] as Array<{
      id: string;
      type: string;
      status: string;
      fileUrl?: string;
      error?: string;
    }>,
  };

  // Generate each eligible document
  for (const doc of eligibleDocs) {
    console.log(`[batchGenerateDocuments] Generating: ${doc.title} (${doc.type})`);
    try {
      const fileUrl = await generateDocument(
        doc.id,
        doc.type,
        caseId,
        strategy,
        plan.documents.length
      );

      console.log(`[batchGenerateDocuments] ✅ Completed: ${doc.title}`);
      results.completed++;
      results.documents.push({
        id: doc.id,
        type: doc.type,
        status: "COMPLETED",
        fileUrl,
      });
    } catch (error) {
      console.log(`[batchGenerateDocuments] ❌ Failed: ${doc.title} - ${error}`);
      results.failed++;
      results.documents.push({
        id: doc.id,
        type: doc.type,
        status: "FAILED",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
  
  console.log(`[batchGenerateDocuments] Finished: ${results.completed} completed, ${results.failed} failed`);

  // Count remaining pending documents
  const updatedPlan = await prisma.documentPlan.findUnique({
    where: { caseId },
    include: {
      documents: true,
    },
  });

  results.pending =
    updatedPlan?.documents.filter((d) => d.status === "PENDING").length || 0;

  return results;
}
