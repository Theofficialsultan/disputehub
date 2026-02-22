/**
 * UNIVERSAL DOCUMENT SKELETON
 * 
 * This NEVER changes. Every document, in every case type, follows this order.
 * What changes is what goes inside each section (populated by case-type modules).
 */

import { CaseTypeModule } from "./case-type-modules";
import { LockedFact } from "../ai/fact-lock";

// ============================================================================
// UNIVERSAL SKELETON STRUCTURE
// ============================================================================

export interface UniversalDocumentSkeleton {
  sections: SkeletonSection[];
}

export interface SkeletonSection {
  id: string;
  name: string;
  order: number;
  mandatory: boolean;
  /** Function that populates this section based on case type */
  populate: (context: DocumentContext) => string;
}

export interface DocumentContext {
  /** Case-specific legal module */
  caseModule: CaseTypeModule;
  /** User-confirmed facts (immutable) */
  lockedFacts: LockedFact[];
  /** Document type being generated */
  documentType: DocumentType;
  /** Case details */
  caseDetails: {
    claimantName?: string;
    defendantName?: string;
    caseTitle: string;
    claimValue?: number;
    forum: string;
  };
  /** Evidence available */
  evidence: Array<{
    type: string;
    description: string;
  }>;
}

export type DocumentType = 
  | "letter_before_action"
  | "particulars_of_claim"
  | "witness_statement"
  | "schedule_of_loss"
  | "evidence_bundle";

// ============================================================================
// THE UNIVERSAL SKELETON (IMMUTABLE)
// ============================================================================

export const UNIVERSAL_SKELETON: UniversalDocumentSkeleton = {
  sections: [
    {
      id: "header",
      name: "Header",
      order: 1,
      mandatory: true,
      populate: (ctx) => {
        return `
${ctx.caseDetails.claimantName || "[Claimant Name]"}
[Claimant Address]

${ctx.caseDetails.defendantName || "[Defendant Name]"}
[Defendant Address]

Date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        `.trim();
      }
    },
    
    {
      id: "parties",
      name: "Parties",
      order: 2,
      mandatory: true,
      populate: (ctx) => {
        return `
───────────────────────────────────────────────────────────────
PARTIES
───────────────────────────────────────────────────────────────

Claimant: ${ctx.caseDetails.claimantName || "[Claimant Name]"}

Defendant: ${ctx.caseDetails.defendantName || "[Defendant Name]"}
        `.trim();
      }
    },
    
    {
      id: "purpose",
      name: "Purpose of Document",
      order: 3,
      mandatory: true,
      populate: (ctx) => {
        const purposes: Record<DocumentType, string> = {
          "letter_before_action": "This letter constitutes formal notice of a legal claim and complies with the relevant pre-action protocol.",
          "particulars_of_claim": "This document sets out the Claimant's case and the legal basis for the claim.",
          "witness_statement": "This statement contains the evidence of the witness named above and is true to the best of their knowledge and belief.",
          "schedule_of_loss": "This schedule provides a detailed breakdown of the financial losses claimed.",
          "evidence_bundle": "This bundle contains the documentary evidence relied upon by the Claimant."
        };
        
        return `
───────────────────────────────────────────────────────────────
PURPOSE
───────────────────────────────────────────────────────────────

${purposes[ctx.documentType]}
        `.trim();
      }
    },
    
    {
      id: "facts",
      name: "Facts (Chronological)",
      order: 4,
      mandatory: true,
      populate: (ctx) => {
        // Extract facts from lockedFacts in chronological order
        const facts = ctx.lockedFacts
          .filter(f => f.field && f.value)
          .map((f, i) => `${i + 1}. ${f.field}: ${f.value}`)
          .join('\n');
        
        return `
───────────────────────────────────────────────────────────────
FACTS
───────────────────────────────────────────────────────────────

${facts || "[Facts to be populated based on locked facts]"}
        `.trim();
      }
    },
    
    {
      id: "legal_basis",
      name: "Legal Basis (Domain-Specific)",
      order: 5,
      mandatory: true,
      populate: (ctx) => {
        // This is populated by the case-type module
        const theories = ctx.caseModule.legalTheories
          .map(t => `
**${t.name}**

${t.description}

${t.statutoryBasis ? `Statutory basis: ${t.statutoryBasis}` : ''}

Legal tests:
${t.legalTests.map(test => `- ${test}`).join('\n')}
          `.trim())
          .join('\n\n');
        
        return `
───────────────────────────────────────────────────────────────
LEGAL BASIS
───────────────────────────────────────────────────────────────

${theories}
        `.trim();
      }
    },
    
    {
      id: "relief",
      name: "Relief / Outcome Sought",
      order: 6,
      mandatory: true,
      populate: (ctx) => {
        // Filter allowed remedies based on document type
        const remedies = ctx.caseModule.allowedRemedies
          .map((r, i) => `${i + 1}. ${r.description}`)
          .join('\n');
        
        return `
───────────────────────────────────────────────────────────────
RELIEF SOUGHT
───────────────────────────────────────────────────────────────

The Claimant seeks:

${remedies}
        `.trim();
      }
    },
    
    {
      id: "evidence_reference",
      name: "Evidence Reference",
      order: 7,
      mandatory: true,
      populate: (ctx) => {
        const evidenceList = ctx.evidence
          .map((e, i) => `Exhibit A${i + 1}: ${e.description}`)
          .join('\n');
        
        return `
───────────────────────────────────────────────────────────────
EVIDENCE
───────────────────────────────────────────────────────────────

The Claimant relies on the following evidence:

${evidenceList || "[Evidence to be exhibited]"}
        `.trim();
      }
    },
    
    {
      id: "closing",
      name: "Statement of Truth / Closing",
      order: 8,
      mandatory: true,
      populate: (ctx) => {
        if (ctx.documentType === "letter_before_action") {
          return `
───────────────────────────────────────────────────────────────
NEXT STEPS
───────────────────────────────────────────────────────────────

If payment is not received within 14 days, proceedings will be commenced in the ${ctx.caseDetails.forum} without further notice.

Yours faithfully,

${ctx.caseDetails.claimantName || "[Claimant Name]"}
          `.trim();
        }
        
        // Default: Statement of Truth
        return `
───────────────────────────────────────────────────────────────
STATEMENT OF TRUTH
───────────────────────────────────────────────────────────────

I believe that the facts stated in this document are true. I understand that proceedings for contempt of court may be brought against anyone who makes, or causes to be made, a false statement in a document verified by a statement of truth without an honest belief in its truth.

Signed: ______________________

Name: ${ctx.caseDetails.claimantName || "[Claimant Name]"}

Date: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        `.trim();
      }
    }
  ]
};

// ============================================================================
// SKELETON GENERATOR
// ============================================================================

/**
 * Generate a document using the universal skeleton + case-type module
 */
export function generateFromSkeleton(context: DocumentContext): string {
  const sections = UNIVERSAL_SKELETON.sections
    .sort((a, b) => a.order - b.order)
    .filter(section => section.mandatory)
    .map(section => section.populate(context))
    .join('\n\n');
  
  return sections;
}

/**
 * Validate that generated content follows the skeleton structure
 */
export function validateSkeletonCompliance(
  content: string,
  documentType: DocumentType
): {
  compliant: boolean;
  missingSections: string[];
  score: number;
} {
  const requiredSections = UNIVERSAL_SKELETON.sections
    .filter(s => s.mandatory)
    .map(s => s.name);
  
  const missingSections: string[] = [];
  
  for (const section of requiredSections) {
    // Check if section appears in content
    const sectionVariations = [
      section,
      section.toUpperCase(),
      section.replace(/\s+/g, ''),
      section.split(/[(/]/).at(0)?.trim()
    ];
    
    const found = sectionVariations.some(variation => 
      content.includes(variation!)
    );
    
    if (!found) {
      missingSections.push(section);
    }
  }
  
  const score = 10 - (missingSections.length * 2);
  
  return {
    compliant: missingSections.length === 0,
    missingSections,
    score: Math.max(0, score)
  };
}
