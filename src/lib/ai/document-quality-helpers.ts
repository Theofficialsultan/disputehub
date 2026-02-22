/**
 * DOCUMENT QUALITY HELPERS
 * 
 * Fixes for:
 * 1. Placeholder text - auto-fill from case data
 * 2. Evidence bundle - auto-populate from EvidenceItem records
 * 3. Filing pack cover sheet - proper document ordering
 * 4. Deadline dates - calculate actual dates
 * 5. Court fees - auto-calculate based on claim value
 * 6. Regional court - determine from postcode
 */

// Using simplified type to avoid Prisma enum issues
interface EvidenceItemInput {
  id: string;
  title: string;
  description?: string | null;
  fileName: string;
  fileType: string; // Can be enum or string
  fileUrl: string;
  fileSize?: number;
  uploadedAt?: Date | string;
  evidenceDate?: Date | string | null;
  evidenceIndex?: number;
}

// ============================================================================
// 1. SMART FACT EXTRACTION (No more "[User to complete]")
// ============================================================================

export interface ExtractedCaseData {
  // Parties
  claimantName: string;
  claimantAddress: string;
  claimantEmail: string;
  claimantPhone: string;
  
  defendantName: string;
  defendantAddress: string;
  
  // Financial
  claimAmount: number;
  claimAmountFormatted: string;
  
  // Dates
  incidentDate: string;
  incidentDateFormatted: string;
  lbaDeadlineDate: string;
  courtDeadlineDate: string;
  
  // Employment specific
  employmentStartDate: string;
  employmentEndDate: string;
  jobTitle: string;
  hourlyRate: number;
  hoursWorked: number;
  
  // Legal
  legalRelationship: string;
  acasCertificateNumber: string;
  hasAcasCertificate: boolean;
  
  // Jurisdiction
  suggestedCourt: string;
  courtFee: number;
  courtFeeFormatted: string;
  
  // Metadata
  dataCompleteness: number; // 0-100 percentage
  missingFields: string[];
}

/**
 * Extract all case data from enriched strategy with intelligent fallbacks
 * Returns actual values - never "[User to complete]" placeholders
 */
export function extractCaseDataSmart(
  strategy: any,
  evidence: EvidenceItemInput[],
  userDetails?: any
): ExtractedCaseData {
  const keyFacts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  const factsText = keyFacts.join(' ').toLowerCase();
  
  const missingFields: string[] = [];
  
  // ──────────────────────────────────────────────────────────────────────────
  // CLAIMANT DETAILS
  // ──────────────────────────────────────────────────────────────────────────
  
  let claimantName = strategy.claimantName || userDetails?.name || '';
  if (!claimantName) {
    // Try to extract from facts
    const claimantFact = keyFacts.find((f: string) => f.toLowerCase().includes('claimant is:'));
    if (claimantFact) {
      claimantName = claimantFact.replace(/^the claimant is:\s*/i, '').trim();
    }
  }
  if (!claimantName) missingFields.push('claimantName');
  
  let claimantAddress = strategy.claimantAddress || userDetails?.address || '';
  if (!claimantAddress) {
    const addressFact = keyFacts.find((f: string) => f.toLowerCase().includes('claimant address:'));
    if (addressFact) {
      claimantAddress = addressFact.replace(/^claimant address:\s*/i, '').trim();
    }
  }
  if (!claimantAddress) missingFields.push('claimantAddress');
  
  const claimantEmail = strategy.claimantEmail || userDetails?.email || '';
  if (!claimantEmail) missingFields.push('claimantEmail');
  
  const claimantPhone = strategy.claimantPhone || userDetails?.phone || '';
  
  // ──────────────────────────────────────────────────────────────────────────
  // DEFENDANT DETAILS
  // ──────────────────────────────────────────────────────────────────────────
  
  let defendantName = strategy.counterpartyName || '';
  if (!defendantName) {
    const partyFact = keyFacts.find((f: string) => f.toLowerCase().includes('other party is:'));
    if (partyFact) {
      defendantName = partyFact.replace(/^the other party is:\s*/i, '').trim();
    }
  }
  // Still empty? Try common patterns
  if (!defendantName) {
    const patterns = [
      /(?:employer|company|landlord|defendant)\s+(?:is\s+)?(?:called\s+)?([A-Za-z0-9\s&']+?)(?:\.|,|$)/i,
      /([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)\s+(?:Ltd|Limited|PLC|Inc)/i,
    ];
    for (const pattern of patterns) {
      const match = factsText.match(pattern);
      if (match) {
        defendantName = match[1].trim();
        break;
      }
    }
  }
  if (!defendantName) missingFields.push('defendantName');
  
  let defendantAddress = strategy.counterpartyAddress || '';
  if (!defendantAddress) {
    const addressFact = keyFacts.find((f: string) => f.toLowerCase().includes('other party address:'));
    if (addressFact) {
      defendantAddress = addressFact.replace(/^other party address:\s*/i, '').trim();
    }
  }
  if (!defendantAddress) missingFields.push('defendantAddress');
  
  // ──────────────────────────────────────────────────────────────────────────
  // FINANCIAL DETAILS
  // ──────────────────────────────────────────────────────────────────────────
  
  let claimAmount = strategy.amount || 0;
  if (!claimAmount) {
    // Extract from facts
    const amountFact = keyFacts.find((f: string) => f.toLowerCase().includes('amount claimed:'));
    if (amountFact) {
      const match = amountFact.match(/£([\d,]+(?:\.\d{2})?)/);
      if (match) claimAmount = parseFloat(match[1].replace(/,/g, ''));
    }
  }
  // Still empty? Search all facts for £ amounts
  if (!claimAmount) {
    const allText = keyFacts.join(' ');
    const amounts = allText.match(/£([\d,]+(?:\.\d{2})?)/g);
    if (amounts && amounts.length > 0) {
      // Take the largest amount mentioned
      claimAmount = Math.max(...amounts.map(a => parseFloat(a.replace(/[£,]/g, ''))));
    }
  }
  if (!claimAmount) missingFields.push('claimAmount');
  
  const claimAmountFormatted = claimAmount ? `£${claimAmount.toFixed(2)}` : '';
  
  // ──────────────────────────────────────────────────────────────────────────
  // DATES
  // ──────────────────────────────────────────────────────────────────────────
  
  let incidentDate = strategy.incidentDate || '';
  if (!incidentDate) {
    const dateFact = keyFacts.find((f: string) => f.toLowerCase().includes('date of incident:'));
    if (dateFact) {
      incidentDate = dateFact.replace(/^date of incident:\s*/i, '').trim();
    }
  }
  // Try to parse dates from facts
  if (!incidentDate) {
    const datePatterns = [
      /(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/i,
      /(\d{1,2}\/\d{1,2}\/\d{2,4})/,
      /((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})/i,
    ];
    for (const pattern of datePatterns) {
      const match = factsText.match(pattern);
      if (match) {
        incidentDate = match[1];
        break;
      }
    }
  }
  
  // Format incident date nicely
  let incidentDateFormatted = incidentDate;
  if (incidentDate) {
    try {
      const parsed = new Date(incidentDate);
      if (!isNaN(parsed.getTime())) {
        incidentDateFormatted = parsed.toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }
    } catch (e) {
      // Keep original
    }
  }
  
  // Calculate deadline dates
  const today = new Date();
  const lbaDeadline = new Date(today);
  lbaDeadline.setDate(lbaDeadline.getDate() + 14);
  const lbaDeadlineDate = lbaDeadline.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  
  // Court deadline (typically 6 years for contract, 3 for personal injury)
  let courtDeadlineDate = '';
  if (incidentDate) {
    try {
      const incident = new Date(incidentDate);
      const deadline = new Date(incident);
      deadline.setFullYear(deadline.getFullYear() + 6); // 6 year limitation
      courtDeadlineDate = deadline.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      // Can't calculate
    }
  }
  
  // ──────────────────────────────────────────────────────────────────────────
  // EMPLOYMENT DETAILS
  // ──────────────────────────────────────────────────────────────────────────
  
  let employmentStartDate = '';
  let employmentEndDate = '';
  let jobTitle = '';
  let hourlyRate = 0;
  let hoursWorked = 0;
  
  // Extract hours and rate
  const hoursMatch = factsText.match(/(\d+(?:\.\d+)?)\s*hours?/i);
  if (hoursMatch) hoursWorked = parseFloat(hoursMatch[1]);
  
  const rateMatch = factsText.match(/£(\d+(?:\.\d+)?)\s*(?:per\s*hour|\/hr|\/hour|hourly)/i);
  if (rateMatch) hourlyRate = parseFloat(rateMatch[1]);
  
  // Job title
  const jobPatterns = [
    /(?:worked?\s+as\s+(?:a\s+)?|job\s+(?:title|role)\s*:?\s*|position\s*:?\s*)([A-Za-z\s]+?)(?:\.|,|for|at|$)/i,
  ];
  for (const pattern of jobPatterns) {
    const match = factsText.match(pattern);
    if (match) {
      jobTitle = match[1].trim();
      break;
    }
  }
  
  // ──────────────────────────────────────────────────────────────────────────
  // LEGAL DETAILS
  // ──────────────────────────────────────────────────────────────────────────
  
  let legalRelationship = strategy.relationship || '';
  if (!legalRelationship) {
    const relFact = keyFacts.find((f: string) => f.toLowerCase().includes('legal relationship:'));
    if (relFact) {
      legalRelationship = relFact.replace(/^legal relationship:\s*/i, '').trim();
    }
  }
  
  // ACAS certificate
  let acasCertificateNumber = '';
  let hasAcasCertificate = false;
  const acasMatch = factsText.match(/(?:acas|certificate)\s*(?:number|ref|reference)?\s*:?\s*(R\d{6,}(?:\/\d{2}\/\d{2})?)/i);
  if (acasMatch) {
    acasCertificateNumber = acasMatch[1];
    hasAcasCertificate = true;
  }
  
  // ──────────────────────────────────────────────────────────────────────────
  // COURT & FEES
  // ──────────────────────────────────────────────────────────────────────────
  
  // Determine court based on claim value
  let suggestedCourt = 'County Court';
  if (claimAmount <= 10000) {
    suggestedCourt = 'County Court (Small Claims Track)';
  } else if (claimAmount <= 25000) {
    suggestedCourt = 'County Court (Fast Track)';
  } else {
    suggestedCourt = 'County Court (Multi-Track)';
  }
  
  // Calculate court fee
  const courtFee = calculateCourtFee(claimAmount);
  const courtFeeFormatted = courtFee > 0 ? `£${courtFee.toFixed(2)}` : '';
  
  // ──────────────────────────────────────────────────────────────────────────
  // DATA COMPLETENESS
  // ──────────────────────────────────────────────────────────────────────────
  
  const totalFields = 10; // Key fields we track
  const filledFields = totalFields - missingFields.length;
  const dataCompleteness = Math.round((filledFields / totalFields) * 100);
  
  return {
    claimantName,
    claimantAddress,
    claimantEmail,
    claimantPhone,
    defendantName,
    defendantAddress,
    claimAmount,
    claimAmountFormatted,
    incidentDate,
    incidentDateFormatted,
    lbaDeadlineDate,
    courtDeadlineDate,
    employmentStartDate,
    employmentEndDate,
    jobTitle,
    hourlyRate,
    hoursWorked,
    legalRelationship,
    acasCertificateNumber,
    hasAcasCertificate,
    suggestedCourt,
    courtFee,
    courtFeeFormatted,
    dataCompleteness,
    missingFields,
  };
}

// ============================================================================
// 2. EVIDENCE BUNDLE AUTO-POPULATION
// ============================================================================

export interface EvidenceBundleItem {
  exhibitNumber: string;
  title: string;
  description: string;
  dateUploaded: string;
  fileType: string;
  category: string;
  relevance: string;
  pageRange: string;
}

/**
 * Generate evidence bundle from actual EvidenceItem records
 */
export function generateEvidenceBundleFromRecords(
  evidence: EvidenceItemInput[],
  caseType: string
): { items: EvidenceBundleItem[]; indexText: string; totalPages: number } {
  
  if (!evidence || evidence.length === 0) {
    return {
      items: [],
      indexText: 'No evidence has been uploaded yet.',
      totalPages: 0
    };
  }
  
  let pageCount = 1;
  const items: EvidenceBundleItem[] = evidence.map((e, i) => {
    const exhibitNumber = `E${i + 1}`;
    const fileName = e.title || e.fileName || `Document ${i + 1}`;
    const fileType = String(e.fileType || 'unknown');
    const isImage = fileType.toLowerCase().startsWith('image') || fileType === 'IMAGE';
    const isPdf = fileType.toLowerCase().includes('pdf') || fileType === 'PDF' || fileType === 'DOCUMENT';
    
    // Estimate page count
    let pages = 1;
    if (isPdf) pages = 2; // Assume 2 pages for PDFs
    if (isImage) pages = 1;
    
    const startPage = pageCount;
    pageCount += pages;
    const endPage = pageCount - 1;
    const pageRange = startPage === endPage ? `Page ${startPage}` : `Pages ${startPage}-${endPage}`;
    
    // Categorize evidence
    let category = 'Document';
    let relevance = 'Supporting evidence for the claim.';
    
    const nameLower = fileName.toLowerCase();
    
    if (isImage) {
      category = 'Photograph';
      if (nameLower.includes('screenshot')) {
        relevance = 'Screenshot evidence capturing digital communications or records.';
      } else if (nameLower.includes('damage') || nameLower.includes('condition')) {
        relevance = 'Photographic evidence documenting condition or damage.';
      } else {
        relevance = 'Visual evidence supporting the claimant\'s account.';
      }
    } else if (nameLower.includes('contract') || nameLower.includes('agreement')) {
      category = 'Contract';
      relevance = 'Documentary evidence of the agreement between the parties.';
    } else if (nameLower.includes('email') || nameLower.includes('message') || nameLower.includes('text')) {
      category = 'Correspondence';
      relevance = 'Written communications between the parties.';
    } else if (nameLower.includes('invoice') || nameLower.includes('receipt')) {
      category = 'Financial Record';
      relevance = 'Financial documentation supporting the amounts claimed.';
    } else if (nameLower.includes('statement')) {
      category = 'Statement';
      relevance = 'Statement relevant to the facts of the case.';
    }
    
    // Use user description if provided
    if (e.description && e.description.length > 10) {
      relevance = e.description;
    }
    
    return {
      exhibitNumber,
      title: fileName,
      description: e.description || relevance,
      dateUploaded: e.uploadedAt ? new Date(e.uploadedAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
      fileType: category,
      category,
      relevance,
      pageRange,
    };
  });
  
  // Generate index text
  const indexText = items.map(item => 
    `${item.exhibitNumber}. ${item.title}\n   Category: ${item.category}\n   ${item.pageRange}\n   Relevance: ${item.relevance}`
  ).join('\n\n');
  
  return {
    items,
    indexText,
    totalPages: pageCount - 1
  };
}

// ============================================================================
// 3. FILING PACK COVER SHEET
// ============================================================================

export interface FilingPackDocument {
  order: number;
  title: string;
  formId: string;
  pageRange: string;
  instructions: string;
  attachTo?: string; // Which document this attaches to
}

/**
 * Generate filing pack cover sheet with proper document ordering
 */
export function generateFilingPackCoverSheet(
  documents: { type: string; title: string; content: string }[],
  forum: string,
  caseData: ExtractedCaseData
): string {
  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  
  // Define correct filing order based on forum
  const filingOrder = getFilingOrder(forum);
  
  // Sort documents according to filing order
  const sortedDocs = documents
    .map(doc => ({
      ...doc,
      order: filingOrder.findIndex(f => doc.type.includes(f)) + 1 || 999
    }))
    .sort((a, b) => a.order - b.order);
  
  // Calculate page ranges
  let currentPage = 1;
  const docsWithPages = sortedDocs.map(doc => {
    const estimatedPages = Math.ceil(doc.content.length / 3000) || 1;
    const startPage = currentPage;
    currentPage += estimatedPages;
    return {
      ...doc,
      startPage,
      endPage: currentPage - 1,
      pageRange: startPage === currentPage - 1 
        ? `Page ${startPage}` 
        : `Pages ${startPage}-${currentPage - 1}`
    };
  });
  
  let coverSheet = `
═══════════════════════════════════════════════════════════════════════════════
                           FILING PACK - COVER SHEET
═══════════════════════════════════════════════════════════════════════════════

Date Prepared: ${today}
Prepared by: ${caseData.claimantName || '[Claimant Name]'}
Case: ${caseData.claimantName || 'Claimant'} v ${caseData.defendantName || 'Defendant'}
Claim Value: ${caseData.claimAmountFormatted || '[Amount]'}
Court: ${caseData.suggestedCourt}
Court Fee: ${caseData.courtFeeFormatted || '[Fee]'}

───────────────────────────────────────────────────────────────────────────────
                            DOCUMENT INDEX
───────────────────────────────────────────────────────────────────────────────

`;

  docsWithPages.forEach((doc, i) => {
    coverSheet += `${i + 1}. ${doc.title}\n`;
    coverSheet += `   ${doc.pageRange}\n`;
    if (getAttachmentInstructions(doc.type)) {
      coverSheet += `   → ${getAttachmentInstructions(doc.type)}\n`;
    }
    coverSheet += `\n`;
  });
  
  coverSheet += `
───────────────────────────────────────────────────────────────────────────────
                            FILING INSTRUCTIONS
───────────────────────────────────────────────────────────────────────────────

${getFilingInstructions(forum, caseData)}

───────────────────────────────────────────────────────────────────────────────
                               CHECKLIST
───────────────────────────────────────────────────────────────────────────────

☐ All documents printed and signed where required
☐ Court fee payment prepared (${caseData.courtFeeFormatted || 'see fee table'})
☐ Copies made for:
    ☐ The Court (1 copy)
    ☐ The Defendant (1 copy per defendant)
    ☐ Your records (1 copy)
☐ Defendant's address verified for service
☐ Evidence bundle paginated and indexed

═══════════════════════════════════════════════════════════════════════════════
`;

  return coverSheet;
}

function getFilingOrder(forum: string): string[] {
  switch (forum) {
    case 'county_court':
    case 'county_court_small_claims':
    case 'county_court_fast_track':
      return [
        'N1', 'COUNTY_COURT_CLAIM',
        'PARTICULARS', 
        'SCHEDULE_OF_DAMAGES',
        'WITNESS_STATEMENT',
        'EVIDENCE_BUNDLE',
        'CHRONOLOGY'
      ];
    case 'employment_tribunal':
      return [
        'ET1', 'EMPLOYMENT_TRIBUNAL',
        'SCHEDULE_OF_LOSS',
        'WITNESS_STATEMENT',
        'CHRONOLOGY',
        'EVIDENCE_BUNDLE'
      ];
    default:
      return ['LBA', 'COMPLAINT', 'LETTER'];
  }
}

function getAttachmentInstructions(docType: string): string {
  if (docType.includes('PARTICULARS')) {
    return 'Attach to Claim Form N1';
  }
  if (docType.includes('SCHEDULE_OF_LOSS')) {
    return 'Attach to ET1';
  }
  if (docType.includes('EVIDENCE_BUNDLE')) {
    return 'File separately - reference in main form';
  }
  return '';
}

function getFilingInstructions(forum: string, caseData: ExtractedCaseData): string {
  switch (forum) {
    case 'county_court':
    case 'county_court_small_claims':
      return `
1. BEFORE COURT (Required):
   ✓ Send Letter Before Action to defendant
   ✓ Wait 14 days for response (deadline: calculated from LBA date)
   ✓ If no satisfactory response, proceed to step 2

2. FILE AT COURT:
   Option A: Online at www.moneyclaim.gov.uk (recommended for claims under £100,000)
   Option B: Post to ${caseData.suggestedCourt}
   
3. PAY COURT FEE:
   Fee: ${caseData.courtFeeFormatted || calculateCourtFee(caseData.claimAmount)}
   Payment: Card (online) or cheque payable to "HMCTS"

4. SERVE DEFENDANT:
   The court will serve the claim on the defendant
   OR you can serve personally and file Certificate of Service

5. IMPORTANT DEADLINES:
   • Defendant has 14 days to respond after service
   • If no response, you can request default judgment`;

    case 'employment_tribunal':
      return `
1. ACAS EARLY CONCILIATION (Mandatory):
   ✓ Contact ACAS: 0300 123 1100 or www.acas.org.uk
   ✓ Obtain Early Conciliation Certificate
   ✓ Certificate number required on ET1
   ${caseData.hasAcasCertificate ? `✓ Certificate: ${caseData.acasCertificateNumber}` : '⚠️ ACAS certificate NOT yet obtained'}

2. TIME LIMIT:
   ⚠️ You must file within 3 months less 1 day from the act complained of
   
3. FILE ONLINE:
   Submit at: www.employmenttribunals.service.gov.uk
   
4. NO FILING FEE:
   Employment Tribunal claims are free to file

5. AFTER FILING:
   • Tribunal will send acknowledgment
   • Respondent has 28 days to submit ET3 response`;

    default:
      return `
1. Review all documents for accuracy
2. Sign where indicated
3. Keep copies for your records
4. Submit to the appropriate body/court`;
  }
}

// ============================================================================
// 4. COURT FEE CALCULATOR
// ============================================================================

export function calculateCourtFee(claimAmount: number): number {
  if (!claimAmount || claimAmount <= 0) return 0;
  
  // County Court fee scale (as of 2024)
  if (claimAmount <= 300) return 35;
  if (claimAmount <= 500) return 50;
  if (claimAmount <= 1000) return 70;
  if (claimAmount <= 1500) return 80;
  if (claimAmount <= 3000) return 115;
  if (claimAmount <= 5000) return 205;
  if (claimAmount <= 10000) return 455;
  if (claimAmount <= 200000) return claimAmount * 0.05; // 5%
  return 10000; // Maximum fee
}

// ============================================================================
// 5. INTEREST CALCULATOR
// ============================================================================

export interface InterestCalculation {
  principal: number;
  rate: number;
  dailyRate: number;
  startDate: Date;
  endDate: Date;
  days: number;
  interestAmount: number;
  totalWithInterest: number;
  breakdown: string;
}

/**
 * Calculate statutory interest at 8% per annum
 */
export function calculateStatutoryInterest(
  principal: number,
  startDate: string | Date,
  endDate?: string | Date
): InterestCalculation {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  
  const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const rate = 0.08; // 8% per annum
  const dailyRate = rate / 365;
  const interestAmount = principal * dailyRate * days;
  
  const breakdown = `
Principal: £${principal.toFixed(2)}
Interest rate: 8% per annum (statutory rate)
Period: ${days} days (from ${start.toLocaleDateString('en-GB')} to ${end.toLocaleDateString('en-GB')})
Calculation: £${principal.toFixed(2)} × 8% × ${days}/365 = £${interestAmount.toFixed(2)}
Daily rate: £${(principal * dailyRate).toFixed(2)} per day
Interest to date: £${interestAmount.toFixed(2)}
───────────────────────────────────
TOTAL (Principal + Interest): £${(principal + interestAmount).toFixed(2)}
Interest continues to accrue at £${(principal * dailyRate).toFixed(2)} per day until judgment or payment.
`.trim();

  return {
    principal,
    rate,
    dailyRate,
    startDate: start,
    endDate: end,
    days,
    interestAmount: Math.round(interestAmount * 100) / 100,
    totalWithInterest: Math.round((principal + interestAmount) * 100) / 100,
    breakdown
  };
}

// ============================================================================
// 6. DEADLINE DATE FORMATTER
// ============================================================================

export function formatDeadlineDate(daysFromNow: number): string {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + daysFromNow);
  return deadline.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export function calculateLBADeadline(): { date: string; formatted: string } {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 14);
  return {
    date: deadline.toISOString().split('T')[0],
    formatted: deadline.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  extractCaseDataSmart,
  generateEvidenceBundleFromRecords,
  generateFilingPackCoverSheet,
  calculateCourtFee,
  calculateStatutoryInterest,
  formatDeadlineDate,
  calculateLBADeadline,
};
