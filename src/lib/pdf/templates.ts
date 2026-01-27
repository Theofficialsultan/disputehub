/**
 * Document HTML Templates (Block 3C)
 * 
 * Generate semantic HTML for each document type
 * Follows UK legal document standards
 */

import { textToHTML, arrayToHTMLList } from "./html-to-pdf";

/**
 * Format UK date
 */
function formatUKDate(): string {
  const now = new Date();
  const day = now.getDate();
  const month = now.toLocaleString("en-GB", { month: "long" });
  const year = now.getFullYear();

  const suffix =
    day === 1 || day === 21 || day === 31
      ? "st"
      : day === 2 || day === 22
      ? "nd"
      : day === 3 || day === 23
      ? "rd"
      : "th";

  return `${day}${suffix} ${month} ${year}`;
}

/**
 * Escape HTML
 */
function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Generate Formal Letter HTML
 */
export function generateFormalLetterHTML(params: {
  senderName: string;
  senderAddress?: string;
  recipientName: string;
  recipientAddress?: string;
  subject: string;
  bodyParagraphs: string[];
}): string {
  const sections: string[] = [];

  // Sender address
  sections.push(`<div class="header">`);
  sections.push(`<div class="address-block">`);
  sections.push(`<strong>${esc(params.senderName)}</strong><br>`);
  if (params.senderAddress) {
    sections.push(`${esc(params.senderAddress)}`);
  }
  sections.push(`</div>`);

  // Recipient address
  sections.push(`<div class="address-block">`);
  sections.push(`<strong>${esc(params.recipientName)}</strong><br>`);
  if (params.recipientAddress) {
    sections.push(`${esc(params.recipientAddress)}`);
  }
  sections.push(`</div>`);

  // Date
  sections.push(`<div class="date">${formatUKDate()}</div>`);
  sections.push(`</div>`);

  // Salutation
  sections.push(`<div class="salutation">Dear Sir/Madam,</div>`);

  // Subject
  sections.push(`<div class="subject">Re: ${esc(params.subject)}</div>`);

  // Body
  sections.push(`<div class="body">`);
  params.bodyParagraphs.forEach((para) => {
    sections.push(`<p>${esc(para)}</p>`);
  });
  sections.push(`</div>`);

  // Closing
  sections.push(`<div class="closing">Yours faithfully,</div>`);
  sections.push(`<div class="signature">${esc(params.senderName)}</div>`);

  return sections.join("\n");
}

/**
 * Generate Evidence Schedule HTML
 * Phase 8.5: Now embeds actual evidence items with images and PDFs
 */
export function generateEvidenceScheduleHTML(
  evidenceItems: Array<{
    evidenceIndex: number;
    title: string;
    description?: string;
    evidenceDate?: Date;
    fileType: string;
    fileUrl: string;
  }>
): string {
  const sections: string[] = [];

  sections.push(`<div class="section-title">SCHEDULE OF EVIDENCE</div>`);
  sections.push(`<div class="body">`);
  sections.push(
    `<p>This schedule lists ${evidenceItems.length} item${evidenceItems.length !== 1 ? "s" : ""} of evidence in support of this case.</p>`
  );
  sections.push(`</div>`);

  // Generate each evidence item with embedded content
  evidenceItems.forEach((item) => {
    sections.push(`<div class="evidence-item">`);
    sections.push(`<div class="evidence-header">Evidence Item #${item.evidenceIndex}</div>`);
    
    sections.push(`<table class="evidence-metadata">`);
    sections.push(`<tr><td><strong>Title:</strong></td><td>${esc(item.title)}</td></tr>`);
    sections.push(`<tr><td><strong>Type:</strong></td><td>${item.fileType}</td></tr>`);
    if (item.evidenceDate) {
      sections.push(`<tr><td><strong>Date:</strong></td><td>${new Date(item.evidenceDate).toLocaleDateString('en-GB')}</td></tr>`);
    }
    if (item.description) {
      sections.push(`<tr><td><strong>Description:</strong></td><td>${esc(item.description)}</td></tr>`);
    }
    sections.push(`</table>`);

    // Embed evidence content
    if (item.fileType === "IMAGE") {
      // Embed image inline at readable width
      sections.push(`<div class="evidence-content">`);
      sections.push(`<img src="${esc(item.fileUrl)}" alt="${esc(item.title)}" style="max-width: 100%; height: auto; border: 1px solid #ccc; padding: 10px; background: #fff;" />`);
      sections.push(`</div>`);
    } else if (item.fileType === "PDF") {
      // For PDFs, note that they are appended/merged
      sections.push(`<div class="evidence-content">`);
      sections.push(`<p><em>PDF document attached (see following pages)</em></p>`);
      sections.push(`</div>`);
    }

    sections.push(`<div class="evidence-separator"></div>`);
    sections.push(`</div>`);
  });

  return sections.join("\n");
}

/**
 * Generate Timeline HTML
 */
export function generateTimelineHTML(events: string[]): string {
  const sections: string[] = [];

  sections.push(`<div class="section-title">CHRONOLOGICAL TIMELINE</div>`);
  sections.push(`<div class="body">`);
  sections.push(`<p>The following events occurred in chronological order:</p>`);
  sections.push(`</div>`);

  sections.push(`<div class="body">`);
  sections.push(arrayToHTMLList(events));
  sections.push(`</div>`);

  return sections.join("\n");
}

/**
 * Generate Witness Statement HTML
 */
export function generateWitnessStatementHTML(): string {
  const sections: string[] = [];

  sections.push(`<div class="section-title">WITNESS STATEMENT</div>`);
  sections.push(`<div class="body">`);

  sections.push(`<p>`);
  sections.push(`Statement of: <span class="form-field"></span>`);
  sections.push(`</p>`);

  sections.push(`<p>`);
  sections.push(`Address: <span class="form-field"></span><br>`);
  sections.push(`<span class="form-field" style="margin-left: 80pt;"></span><br>`);
  sections.push(`<span class="form-field" style="margin-left: 80pt;"></span>`);
  sections.push(`</p>`);

  sections.push(`<p>`);
  sections.push(`Occupation: <span class="form-field"></span>`);
  sections.push(`</p>`);

  sections.push(`<p>`);
  sections.push(
    `This statement, consisting of pages, is true to the best of my knowledge and belief.`
  );
  sections.push(`</p>`);

  sections.push(`<p style="font-size: 10pt; font-style: italic;">`);
  sections.push(
    `I understand that proceedings for contempt of court may be brought against anyone who makes, or causes to be made, a false statement in a document verified by a statement of truth without an honest belief in its truth.`
  );
  sections.push(`</p>`);

  sections.push(`<p style="margin-top: 30pt;"><strong>Statement:</strong></p>`);
  sections.push(`<div style="min-height: 200pt; border: 1px solid #ccc; padding: 10pt; margin: 10pt 0;"></div>`);

  sections.push(`<p style="margin-top: 30pt;">`);
  sections.push(`Signed: <span class="form-field"></span>`);
  sections.push(`</p>`);

  sections.push(`<p>`);
  sections.push(`Date: <span class="form-field"></span>`);
  sections.push(`</p>`);

  sections.push(`</div>`);

  return sections.join("\n");
}

/**
 * Generate Appeal Form HTML
 */
export function generateAppealFormHTML(disputeType: string): string {
  const sections: string[] = [];

  const title =
    disputeType === "benefits"
      ? "BENEFITS APPEAL FORM"
      : disputeType === "employment"
      ? "EMPLOYMENT TRIBUNAL CLAIM FORM"
      : "NOTICE OF APPEAL";

  sections.push(`<div class="section-title">${title}</div>`);
  sections.push(`<div class="body">`);

  sections.push(`<p>`);
  sections.push(`Full Name: <span class="form-field"></span>`);
  sections.push(`</p>`);

  sections.push(`<p>`);
  sections.push(`Address: <span class="form-field"></span><br>`);
  sections.push(`<span class="form-field" style="margin-left: 80pt;"></span><br>`);
  sections.push(`Postcode: <span class="form-field" style="width: 100pt;"></span>`);
  sections.push(`</p>`);

  sections.push(`<p>`);
  sections.push(`Contact Number: <span class="form-field"></span>`);
  sections.push(`</p>`);

  sections.push(`<p style="margin-top: 30pt;"><strong>Grounds of Appeal:</strong></p>`);
  sections.push(`<div style="min-height: 150pt; border: 1px solid #ccc; padding: 10pt; margin: 10pt 0;"></div>`);

  sections.push(`<p style="margin-top: 20pt;"><strong>Remedy Sought:</strong></p>`);
  sections.push(`<div style="min-height: 80pt; border: 1px solid #ccc; padding: 10pt; margin: 10pt 0;"></div>`);

  sections.push(`<p style="margin-top: 30pt;">`);
  sections.push(`Signed: <span class="form-field"></span>`);
  sections.push(`</p>`);

  sections.push(`<p>`);
  sections.push(`Date: ${formatUKDate()}`);
  sections.push(`</p>`);

  sections.push(`</div>`);

  return sections.join("\n");
}

/**
 * Generate Cover Letter HTML
 */
export function generateCoverLetterHTML(params: {
  senderName: string;
  documentCount: number;
}): string {
  const sections: string[] = [];

  sections.push(`<div class="header">`);
  sections.push(`<div class="address-block">`);
  sections.push(`<strong>${esc(params.senderName)}</strong>`);
  sections.push(`</div>`);
  sections.push(`<div class="date">${formatUKDate()}</div>`);
  sections.push(`</div>`);

  sections.push(`<div class="salutation">Dear Sir/Madam,</div>`);
  sections.push(`<div class="subject">RE: SUBMISSION OF DOCUMENTS</div>`);

  sections.push(`<div class="body">`);
  sections.push(
    `<p>Please find enclosed ${params.documentCount} document${params.documentCount > 1 ? "s" : ""} in support of my case.</p>`
  );
  sections.push(
    `<p>I have prepared this submission carefully and believe it contains all necessary information to support my position.</p>`
  );
  sections.push(`<p>I look forward to your response.</p>`);
  sections.push(`</div>`);

  sections.push(`<div class="closing">Yours faithfully,</div>`);
  sections.push(`<div class="signature">${esc(params.senderName)}</div>`);

  return sections.join("\n");
}

/**
 * Generate Follow-Up Letter HTML
 * 
 * Phase 8.2.3 - System-Triggered Follow-Ups
 * 
 * This letter is automatically generated when a deadline is missed.
 * Tone is firmer but still professional.
 */
export function generateFollowUpLetterHTML(params: {
  senderName: string;
  recipientName: string;
  subject: string;
  originalLetterDate: string;
  deadlineMissedDate: string;
  bodyParagraphs: string[];
}): string {
  const sections: string[] = [];

  sections.push(`<div class="header">`);
  sections.push(`<div class="address-block">`);
  sections.push(`<strong>${esc(params.senderName)}</strong>`);
  sections.push(`</div>`);
  sections.push(`<div class="date">${formatUKDate()}</div>`);
  sections.push(`</div>`);

  sections.push(`<div class="address-block" style="margin-top: 20pt;">`);
  sections.push(`${esc(params.recipientName)}`);
  sections.push(`</div>`);

  sections.push(`<div class="salutation">Dear Sir/Madam,</div>`);
  sections.push(`<div class="subject">RE: ${esc(params.subject)} - FOLLOW-UP</div>`);

  sections.push(`<div class="body">`);
  sections.push(`<p>I refer to my letter dated ${esc(params.originalLetterDate)} regarding the above matter.</p>`);
  sections.push(`<p>I note that the deadline for your response (${esc(params.deadlineMissedDate)}) has now passed without any communication from you.</p>`);
  
  // Add body paragraphs
  for (const para of params.bodyParagraphs) {
    sections.push(`<p>${textToHTML(para)}</p>`);
  }
  
  sections.push(`<p>I request that you respond to this matter within 14 days of receipt of this letter.</p>`);
  sections.push(`<p>I trust this matter will now receive your urgent attention.</p>`);
  sections.push(`</div>`);

  sections.push(`<div class="closing">Yours faithfully,</div>`);
  sections.push(`<div class="signature">${esc(params.senderName)}</div>`);

  return sections.join("\n");
}
