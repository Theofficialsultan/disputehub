/**
 * ═══════════════════════════════════════════════════════════════════════════
 * FORM vs ATTACHMENT CLASSIFICATION
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * CRITICAL DISTINCTION:
 * 
 * FORMS = Official court/tribunal forms (N1, ET1, etc.)
 *   → DisputeHub does NOT generate these
 *   → User fills them via MCOL/online portal/official PDF
 *   → We provide INSTRUCTIONS ONLY
 * 
 * ATTACHMENTS = Supporting documents for forms
 *   → DisputeHub DOES generate these
 *   → Particulars of Claim, Witness Statements, etc.
 *   → These are what we're good at
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

export type DocumentCategory = 
  | "OFFICIAL_FORM_ONLINE_ONLY"      // N1, ET1 via MCOL/portal - INSTRUCTIONS ONLY
  | "OFFICIAL_FORM_FILLABLE_PDF"     // PDF we can auto-fill
  | "GENERATED_ATTACHMENT"           // Particulars, witness statements
  | "GENERATED_STANDALONE"           // Letters before action
  | "GENERATED_BUNDLE";              // Evidence bundles

export interface FormClassification {
  formCode: string;
  category: DocumentCategory;
  canGenerate: boolean;
  outputType: "INSTRUCTIONS" | "FILLED_PDF" | "GENERATED_DOCUMENT";
  requiredAttachments: string[];
  instructions?: string;
}

/**
 * HARD RULES: What DisputeHub generates vs what user must complete
 */
export const FORM_CLASSIFICATIONS: Record<string, FormClassification> = {
  // ════════════════════════════════════════════════════════════════
  // COUNTY COURT FORMS - ONLINE ONLY (NO GENERATION)
  // ════════════════════════════════════════════════════════════════
  "N1": {
    formCode: "N1",
    category: "OFFICIAL_FORM_ONLINE_ONLY",
    canGenerate: false,
    outputType: "INSTRUCTIONS",
    requiredAttachments: [
      "PARTICULARS_OF_CLAIM",
      "SCHEDULE_OF_LOSS",
      "EVIDENCE_BUNDLE"
    ],
    instructions: `
The N1 County Court Claim Form must be completed using:
• MCOL (Money Claim Online) at https://www.moneyclaim.gov.uk
• OR the official PDF from GOV.UK

DisputeHub has prepared the attachments you need:
1. Particulars of Claim (attach to N1)
2. Schedule of Loss (attach to N1)
3. Evidence Bundle (file with claim)

DO NOT attempt to file this guidance as a court document.
    `.trim()
  },

  "UK-N1-COUNTY-COURT-CLAIM": {
    formCode: "UK-N1-COUNTY-COURT-CLAIM",
    category: "OFFICIAL_FORM_ONLINE_ONLY",
    canGenerate: false,
    outputType: "INSTRUCTIONS",
    requiredAttachments: [
      "UK-N1-PARTICULARS-OF-CLAIM",
      "UK-SCHEDULE-OF-DAMAGES",
      "UK-EVIDENCE-BUNDLE-INDEX"
    ],
    instructions: `
The N1 County Court Claim Form must be completed using:
• MCOL (Money Claim Online) at https://www.moneyclaim.gov.uk
• OR the official PDF from GOV.UK

DisputeHub has prepared the attachments you need:
1. Particulars of Claim (attach to N1)
2. Schedule of Damages (attach to N1)
3. Evidence Bundle with Index (file with claim)

DO NOT attempt to file this guidance as a court document.
    `.trim()
  },

  // ════════════════════════════════════════════════════════════════
  // EMPLOYMENT TRIBUNAL - ONLINE ONLY (NO GENERATION)
  // ════════════════════════════════════════════════════════════════
  "ET1": {
    formCode: "ET1",
    category: "OFFICIAL_FORM_ONLINE_ONLY",
    canGenerate: false,
    outputType: "INSTRUCTIONS",
    requiredAttachments: [
      "ET1_ADDITIONAL_INFORMATION",
      "SCHEDULE_OF_LOSS",
      "EVIDENCE_BUNDLE"
    ],
    instructions: `
The ET1 Employment Tribunal Claim must be submitted online at:
https://www.gov.uk/employment-tribunals/make-a-claim

DisputeHub has prepared:
1. Additional Information document (paste into ET1 Section 8.2)
2. Schedule of Loss (upload as attachment)
3. Evidence Bundle (upload as attachment)

The ET1 form itself cannot be generated - you must complete it online.
    `.trim()
  },

  // ════════════════════════════════════════════════════════════════
  // FILLABLE PDFs - WE AUTO-FILL THESE
  // ════════════════════════════════════════════════════════════════
  "N244": {
    formCode: "N244",
    category: "OFFICIAL_FORM_FILLABLE_PDF",
    canGenerate: true,
    outputType: "FILLED_PDF",
    requiredAttachments: [
      "SUPPORTING_STATEMENT",
      "EVIDENCE_BUNDLE"
    ]
  },

  "N260": {
    formCode: "N260",
    category: "OFFICIAL_FORM_FILLABLE_PDF",
    canGenerate: true,
    outputType: "FILLED_PDF",
    requiredAttachments: []
  },

  // ════════════════════════════════════════════════════════════════
  // GENERATED ATTACHMENTS - THESE ARE OUR CORE OUTPUT
  // ════════════════════════════════════════════════════════════════
  "PARTICULARS_OF_CLAIM": {
    formCode: "PARTICULARS_OF_CLAIM",
    category: "GENERATED_ATTACHMENT",
    canGenerate: true,
    outputType: "GENERATED_DOCUMENT",
    requiredAttachments: []
  },

  "UK-N1-PARTICULARS-OF-CLAIM": {
    formCode: "UK-N1-PARTICULARS-OF-CLAIM",
    category: "GENERATED_ATTACHMENT",
    canGenerate: true,
    outputType: "GENERATED_DOCUMENT",
    requiredAttachments: []
  },

  "WITNESS_STATEMENT": {
    formCode: "WITNESS_STATEMENT",
    category: "GENERATED_ATTACHMENT",
    canGenerate: true,
    outputType: "GENERATED_DOCUMENT",
    requiredAttachments: []
  },

  "UK-CPR32-WITNESS-STATEMENT": {
    formCode: "UK-CPR32-WITNESS-STATEMENT",
    category: "GENERATED_ATTACHMENT",
    canGenerate: true,
    outputType: "GENERATED_DOCUMENT",
    requiredAttachments: []
  },

  "SCHEDULE_OF_LOSS": {
    formCode: "SCHEDULE_OF_LOSS",
    category: "GENERATED_ATTACHMENT",
    canGenerate: true,
    outputType: "GENERATED_DOCUMENT",
    requiredAttachments: []
  },

  "UK-SCHEDULE-OF-DAMAGES": {
    formCode: "UK-SCHEDULE-OF-DAMAGES",
    category: "GENERATED_ATTACHMENT",
    canGenerate: true,
    outputType: "GENERATED_DOCUMENT",
    requiredAttachments: []
  },

  "EVIDENCE_BUNDLE": {
    formCode: "EVIDENCE_BUNDLE",
    category: "GENERATED_BUNDLE",
    canGenerate: true,
    outputType: "GENERATED_DOCUMENT",
    requiredAttachments: []
  },

  "UK-EVIDENCE-BUNDLE-INDEX": {
    formCode: "UK-EVIDENCE-BUNDLE-INDEX",
    category: "GENERATED_BUNDLE",
    canGenerate: true,
    outputType: "GENERATED_DOCUMENT",
    requiredAttachments: []
  },

  // ════════════════════════════════════════════════════════════════
  // STANDALONE DOCUMENTS - PRE-ACTION
  // ════════════════════════════════════════════════════════════════
  "LETTER_BEFORE_ACTION": {
    formCode: "LETTER_BEFORE_ACTION",
    category: "GENERATED_STANDALONE",
    canGenerate: true,
    outputType: "GENERATED_DOCUMENT",
    requiredAttachments: []
  },

  "UK-LBA-GENERAL": {
    formCode: "UK-LBA-GENERAL",
    category: "GENERATED_STANDALONE",
    canGenerate: true,
    outputType: "GENERATED_DOCUMENT",
    requiredAttachments: []
  }
};

/**
 * Determine what DisputeHub should output for a given form
 */
export function getFormOutputType(formCode: string): {
  shouldGenerate: boolean;
  outputType: "INSTRUCTIONS" | "FILLED_PDF" | "GENERATED_DOCUMENT";
  instructions?: string;
  requiredAttachments: string[];
} {
  const classification = FORM_CLASSIFICATIONS[formCode];

  if (!classification) {
    // Default: assume it's a generated document if not in registry
    console.warn(`[Form Classification] Unknown form code: ${formCode} - defaulting to GENERATED_DOCUMENT`);
    return {
      shouldGenerate: true,
      outputType: "GENERATED_DOCUMENT",
      requiredAttachments: []
    };
  }

  return {
    shouldGenerate: classification.canGenerate,
    outputType: classification.outputType,
    instructions: classification.instructions,
    requiredAttachments: classification.requiredAttachments
  };
}

/**
 * Check if form should be generated or just instructions provided
 */
export function shouldGenerateDocument(formCode: string): boolean {
  const classification = FORM_CLASSIFICATIONS[formCode];
  return classification ? classification.canGenerate : false;
}

/**
 * Get required attachments for a form
 */
export function getRequiredAttachments(formCode: string): string[] {
  const classification = FORM_CLASSIFICATIONS[formCode];
  return classification ? classification.requiredAttachments : [];
}

/**
 * Generate filing instructions for online-only forms
 */
export function generateFilingInstructions(formCode: string): string {
  const classification = FORM_CLASSIFICATIONS[formCode];
  
  if (!classification || classification.category !== "OFFICIAL_FORM_ONLINE_ONLY") {
    return "";
  }

  return classification.instructions || "";
}

/**
 * Create a professional filing pack cover sheet
 */
export function generateFilingPackCoverSheet(
  formCode: string,
  caseTitle: string,
  documents: string[]
): string {
  const date = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return `
═══════════════════════════════════════════════════════════════════════════
                         DISPUTEHUB FILING PACK
═══════════════════════════════════════════════════════════════════════════

Case Title:         ${caseTitle}
Form Type:          ${formCode}
Prepared:           ${date}
Prepared by:        DisputeHub AI Legal Assistant

───────────────────────────────────────────────────────────────────────────
CONTENTS OF THIS PACK
───────────────────────────────────────────────────────────────────────────

${documents.map((doc, i) => `${i + 1}. ${doc}`).join('\n')}

───────────────────────────────────────────────────────────────────────────
HOW TO USE THIS PACK
───────────────────────────────────────────────────────────────────────────

${generateFilingInstructions(formCode)}

───────────────────────────────────────────────────────────────────────────
IMPORTANT NOTES
───────────────────────────────────────────────────────────────────────────

✓ Review all documents carefully before filing
✓ Ensure all amounts and dates are correct
✓ Sign documents where required
✓ Keep copies of everything you file
✓ Check court fees before submission

───────────────────────────────────────────────────────────────────────────
DISCLAIMER
───────────────────────────────────────────────────────────────────────────

This pack has been prepared by DisputeHub AI based on the information you
provided. While we strive for accuracy, you should review all documents and
seek legal advice if unsure about any aspect of your claim.

DisputeHub is not a law firm and does not provide legal advice.

═══════════════════════════════════════════════════════════════════════════
  `.trim();
}
