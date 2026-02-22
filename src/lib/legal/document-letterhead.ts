/**
 * PROFESSIONAL DOCUMENT LETTERHEAD & FORMATTING
 * 
 * Provides consistent, professional formatting for all legal documents.
 * Compliant with UK court and tribunal formatting standards.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface LetterheadData {
  // Sender (Claimant)
  senderName: string;
  senderAddress: string;
  senderCity: string;
  senderPostcode: string;
  senderEmail?: string;
  senderPhone?: string;
  
  // Recipient (Defendant/Respondent)
  recipientName: string;
  recipientAddress?: string;
  recipientCity?: string;
  recipientPostcode?: string;
  
  // Document details
  documentDate: string;
  caseReference?: string;
  yourReference?: string;
  documentTitle?: string;
  
  // Court details (for formal filings)
  courtName?: string;
  claimNumber?: string;
}

export interface CourtHeaderData {
  courtName: string;
  claimNumber?: string;
  claimantName: string;
  defendantName: string;
  documentTitle: string;
  date: string;
}

// ============================================================================
// DATE FORMATTING
// ============================================================================

export function formatDateFormal(date: Date = new Date()): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export function formatDateShort(date: Date = new Date()): string {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function calculateDeadlineDate(days: number, from: Date = new Date()): { date: Date; formatted: string } {
  const deadline = new Date(from);
  deadline.setDate(deadline.getDate() + days);
  return {
    date: deadline,
    formatted: formatDateFormal(deadline)
  };
}

// ============================================================================
// REFERENCE NUMBER GENERATION
// ============================================================================

export function generateCaseReference(disputeId: string, type: string): string {
  const prefix = type.substring(0, 3).toUpperCase();
  const year = new Date().getFullYear();
  const shortId = disputeId.substring(0, 6).toUpperCase();
  return `${prefix}/${year}/${shortId}`;
}

// ============================================================================
// FORMAL LETTER LETTERHEAD
// ============================================================================

export function generateLetterhead(data: LetterheadData): string {
  const senderBlock = [
    data.senderName.toUpperCase(),
    data.senderAddress,
    data.senderCity,
    data.senderPostcode,
    data.senderEmail ? `Email: ${data.senderEmail}` : null,
    data.senderPhone ? `Tel: ${data.senderPhone}` : null,
  ].filter(Boolean).join('\n');

  const recipientBlock = [
    data.recipientName,
    data.recipientAddress,
    data.recipientCity,
    data.recipientPostcode,
  ].filter(Boolean).join('\n');

  const references = [
    data.caseReference ? `Our Ref: ${data.caseReference}` : null,
    data.yourReference ? `Your Ref: ${data.yourReference}` : null,
  ].filter(Boolean).join('\n');

  return `
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ${senderBlock.split('\n').map(line => line.padEnd(73)).join('\n│  ')}
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

${recipientBlock}

${data.documentDate}
${references ? `\n${references}` : ''}

${data.documentTitle ? `RE: ${data.documentTitle.toUpperCase()}` : ''}
${'─'.repeat(77)}
`.trim();
}

// ============================================================================
// COURT DOCUMENT HEADER
// ============================================================================

export function generateCourtHeader(data: CourtHeaderData): string {
  return `
╔═════════════════════════════════════════════════════════════════════════════╗
║                                                                             ║
║                    ${data.courtName.toUpperCase().padStart(35).padEnd(59)}║
║                                                                             ║
${data.claimNumber ? `║  Claim No: ${data.claimNumber.padEnd(63)}║\n` : ''}╠═════════════════════════════════════════════════════════════════════════════╣
║                                                                             ║
║  BETWEEN:                                                                   ║
║                                                                             ║
║                              ${data.claimantName.toUpperCase().padEnd(45)}║
║                                                              Claimant       ║
║                                                                             ║
║                                    - and -                                  ║
║                                                                             ║
║                              ${data.defendantName.toUpperCase().padEnd(45)}║
║                                                              Defendant      ║
║                                                                             ║
╠═════════════════════════════════════════════════════════════════════════════╣
║                                                                             ║
║                         ${data.documentTitle.toUpperCase().padStart(30).padEnd(55)}║
║                                                                             ║
╚═════════════════════════════════════════════════════════════════════════════╝

Date: ${data.date}
`.trim();
}

// ============================================================================
// EMPLOYMENT TRIBUNAL HEADER
// ============================================================================

export function generateTribunalHeader(data: {
  tribunalName: string;
  caseNumber?: string;
  claimantName: string;
  respondentName: string;
  documentTitle: string;
  date: string;
}): string {
  return `
╔═════════════════════════════════════════════════════════════════════════════╗
║                                                                             ║
║                           EMPLOYMENT TRIBUNAL                               ║
║                                                                             ║
║                    ${(data.tribunalName || 'LONDON CENTRAL').toUpperCase().padStart(30).padEnd(55)}║
║                                                                             ║
${data.caseNumber ? `║  Case Number: ${data.caseNumber.padEnd(60)}║\n` : ''}╠═════════════════════════════════════════════════════════════════════════════╣
║                                                                             ║
║  BETWEEN:                                                                   ║
║                                                                             ║
║                              ${data.claimantName.toUpperCase().padEnd(45)}║
║                                                              Claimant       ║
║                                                                             ║
║                                    - and -                                  ║
║                                                                             ║
║                              ${data.respondentName.toUpperCase().padEnd(45)}║
║                                                              Respondent     ║
║                                                                             ║
╠═════════════════════════════════════════════════════════════════════════════╣
║                                                                             ║
║                         ${data.documentTitle.toUpperCase().padStart(30).padEnd(55)}║
║                                                                             ║
╚═════════════════════════════════════════════════════════════════════════════╝

Date: ${data.date}
`.trim();
}

// ============================================================================
// LETTER BEFORE ACTION HEADER
// ============================================================================

export function generateLBAHeader(data: LetterheadData): string {
  return `
┌─────────────────────────────────────────────────────────────────────────────┐
│  ${data.senderName.toUpperCase().padEnd(73)}│
│  ${data.senderAddress.padEnd(73)}│
│  ${data.senderCity.padEnd(73)}│
│  ${data.senderPostcode.padEnd(73)}│
${data.senderEmail ? `│  ${data.senderEmail.padEnd(73)}│\n` : ''}${data.senderPhone ? `│  ${data.senderPhone.padEnd(73)}│\n` : ''}└─────────────────────────────────────────────────────────────────────────────┘

${data.recipientName}
${data.recipientAddress || '[RECIPIENT ADDRESS]'}
${data.recipientCity || ''}
${data.recipientPostcode || '[POSTCODE]'}

Date: ${data.documentDate}
${data.caseReference ? `Our Reference: ${data.caseReference}` : ''}

═══════════════════════════════════════════════════════════════════════════════
                    LETTER BEFORE ACTION
                    ${data.documentTitle ? data.documentTitle.toUpperCase() : ''}
                    
                    FORMAL NOTICE OF INTENDED LEGAL PROCEEDINGS
                    Sent in accordance with Pre-Action Protocol
═══════════════════════════════════════════════════════════════════════════════

WITHOUT PREJUDICE SAVE AS TO COSTS
───────────────────────────────────────────────────────────────────────────────
`.trim();
}

// ============================================================================
// DOCUMENT FOOTER
// ============================================================================

export function generateFooter(data: {
  caseReference?: string;
  pageNumber?: number;
  totalPages?: number;
  date: string;
}): string {
  const pageInfo = data.pageNumber && data.totalPages 
    ? `Page ${data.pageNumber} of ${data.totalPages}` 
    : '';
  
  return `
───────────────────────────────────────────────────────────────────────────────
${data.caseReference ? `Ref: ${data.caseReference}` : ''}${' '.repeat(40)}${pageInfo}
Document generated: ${data.date}
───────────────────────────────────────────────────────────────────────────────
`.trim();
}

// ============================================================================
// SIGNATURE BLOCK
// ============================================================================

export function generateSignatureBlock(data: {
  name: string;
  isStatement?: boolean;
  date: string;
}): string {
  if (data.isStatement) {
    return `
═══════════════════════════════════════════════════════════════════════════════
STATEMENT OF TRUTH
═══════════════════════════════════════════════════════════════════════════════

I believe that the facts stated in this document are true. I understand that 
proceedings for contempt of court may be brought against anyone who makes, or 
causes to be made, a false statement in a document verified by a statement of 
truth without an honest belief in its truth.

Signed: ____________________________________

Full name: ${data.name}

Date: ${data.date}

Position or office held: Claimant
═══════════════════════════════════════════════════════════════════════════════
`.trim();
  }
  
  return `
───────────────────────────────────────────────────────────────────────────────

Yours faithfully,



____________________________________
${data.name}

Date: ${data.date}
───────────────────────────────────────────────────────────────────────────────
`.trim();
}

// ============================================================================
// SECTION FORMATTING
// ============================================================================

export function formatSection(title: string, content: string, number?: number): string {
  const sectionNumber = number ? `${number}. ` : '';
  return `
┌─────────────────────────────────────────────────────────────────────────────┐
│  ${sectionNumber}${title.toUpperCase().padEnd(71 - sectionNumber.length)}│
└─────────────────────────────────────────────────────────────────────────────┘

${content}
`.trim();
}

export function formatSubsection(title: string, content: string, number?: string): string {
  const sectionNumber = number ? `${number} ` : '';
  return `
${sectionNumber}${title}
${'─'.repeat(Math.min(title.length + sectionNumber.length + 10, 77))}

${content}
`.trim();
}

// ============================================================================
// PARAGRAPH NUMBERING
// ============================================================================

export function numberParagraphs(content: string, startNumber: number = 1): string {
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  return paragraphs.map((p, i) => `${startNumber + i}. ${p.trim()}`).join('\n\n');
}

// ============================================================================
// DEMAND/RELIEF SECTION
// ============================================================================

export function formatDemandSection(demands: string[]): string {
  return `
╔═════════════════════════════════════════════════════════════════════════════╗
║  AND THE CLAIMANT CLAIMS:                                                   ║
╠═════════════════════════════════════════════════════════════════════════════╣
${demands.map((d, i) => `║  (${i + 1}) ${d.padEnd(69)}║`).join('\n')}
╚═════════════════════════════════════════════════════════════════════════════╝
`.trim();
}

// ============================================================================
// EVIDENCE EXHIBIT FORMATTING
// ============================================================================

export function formatExhibitReference(exhibitNumber: string, description: string): string {
  return `[${exhibitNumber}] - ${description}`;
}

export function formatEvidenceBundle(evidence: Array<{ id: string; title: string; description?: string }>, startNumber: number = 1): string {
  if (!evidence.length) {
    return 'No evidence items attached.';
  }
  
  let bundle = '';
  evidence.forEach((e, i) => {
    const exhibitNum = `E${startNumber + i}`;
    bundle += `${exhibitNum}  │  ${e.title}\n`;
    if (e.description) {
      bundle += `     │  ${e.description}\n`;
    }
    bundle += '─────┴────────────────────────────────────────────────────────────────────\n';
  });
  
  return bundle;
}

// ============================================================================
// COMPLETE DOCUMENT WRAPPER
// ============================================================================

export function wrapDocument(
  content: string,
  header: string,
  footer: string,
  signatureBlock?: string
): string {
  return `${header}

${content}

${signatureBlock || ''}

${footer}`;
}

// ============================================================================
// EXPORT
// ============================================================================

export const DocumentFormatting = {
  formatDateFormal,
  formatDateShort,
  calculateDeadlineDate,
  generateCaseReference,
  generateLetterhead,
  generateCourtHeader,
  generateTribunalHeader,
  generateLBAHeader,
  generateFooter,
  generateSignatureBlock,
  formatSection,
  formatSubsection,
  numberParagraphs,
  formatDemandSection,
  formatExhibitReference,
  formatEvidenceBundle,
  wrapDocument,
};

export default DocumentFormatting;
