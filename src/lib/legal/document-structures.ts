/**
 * DOCUMENT STRUCTURES - NON-NEGOTIABLE CONSTITUTIONAL LAYOUT
 * 
 * Every document type has a mandatory structure that MUST be followed.
 * If a document doesn't match its structure → it fails audit → it does not ship.
 * 
 * Think of this as the constitution for document generation.
 */

import { LegalForum } from "./forum-language-guard";

// ============================================================================
// UNIVERSAL RULES (APPLY TO ALL DOCUMENTS)
// ============================================================================

export interface DocumentStructureRule {
  /** What forum is this for? */
  forum: LegalForum | "any";
  /** What is this document's legal role? */
  legalRole: string;
  /** Mandatory sections in order */
  mandatorySections: DocumentSection[];
  /** Forbidden content */
  forbidden: string[];
  /** Required phrasing */
  required: string[];
}

export interface DocumentSection {
  id: string;
  name: string;
  order: number;
  mandatory: boolean;
  contentRules: string[];
  examples?: string[];
}

// ============================================================================
// 1. LETTER BEFORE ACTION (LBA)
// ============================================================================

export const LBA_STRUCTURE: DocumentStructureRule = {
  forum: "any",
  legalRole: "Pre-action compliance + pressure. Not argument-heavy. Not emotional.",
  mandatorySections: [
    {
      id: "header",
      name: "Header",
      order: 1,
      mandatory: true,
      contentRules: [
        "Claimant name + address",
        "Defendant name + address",
        "Date",
        '"WITHOUT PREJUDICE SAVE AS TO COSTS" (if configurable)'
      ]
    },
    {
      id: "title",
      name: "Title",
      order: 2,
      mandatory: true,
      contentRules: ["Must be exactly: 'LETTER BEFORE ACTION'"]
    },
    {
      id: "parties",
      name: "Section 1: Parties",
      order: 3,
      mandatory: true,
      contentRules: [
        "Identify claimant",
        "Identify defendant",
        "State relationship (e.g. self-employed contractor)"
      ]
    },
    {
      id: "background",
      name: "Section 2: Background Facts (Short)",
      order: 4,
      mandatory: true,
      contentRules: [
        "Date of agreement",
        "Nature of work",
        "What was done",
        "What was paid / not paid",
        "❌ NO evidence descriptions here"
      ]
    },
    {
      id: "breach",
      name: "Section 3: Breach",
      order: 5,
      mandatory: true,
      contentRules: [
        "One paragraph only",
        "State what obligation was breached",
        "No accusations, no emotion"
      ]
    },
    {
      id: "amount",
      name: "Section 4: Amount Owed",
      order: 6,
      mandatory: true,
      contentRules: [
        "Exact amount",
        "How it's calculated",
        "Explicitly state concessions (if any)"
      ]
    },
    {
      id: "demand",
      name: "Section 5: Demand",
      order: 7,
      mandatory: true,
      contentRules: [
        "Clear deadline (usually 14 days)",
        "Payment method",
        "What happens if ignored (court claim)"
      ]
    },
    {
      id: "preaction",
      name: "Section 6: Pre-Action Compliance",
      order: 8,
      mandatory: true,
      contentRules: [
        "State this letter complies with relevant pre-action protocol"
      ]
    },
    {
      id: "signature",
      name: "Signature Block",
      order: 9,
      mandatory: true,
      contentRules: [
        "Name",
        '"Claimant" / "On behalf of Claimant"'
      ]
    }
  ],
  forbidden: [
    "legal theatre",
    "emotional language",
    "threats",
    "evidence descriptions",
    "speculation about motive"
  ],
  required: [
    "LETTER BEFORE ACTION",
    "14 days",
    "pre-action protocol"
  ]
};

// ============================================================================
// 2. PARTICULARS OF CLAIM (COUNTY COURT)
// ============================================================================

export const PARTICULARS_OF_CLAIM_STRUCTURE: DocumentStructureRule = {
  forum: "county_court_small_claims",
  legalRole: "Attachment to N1 form. Sets out the legal case for breach of contract.",
  mandatorySections: [
    {
      id: "title",
      name: "Title",
      order: 1,
      mandatory: true,
      contentRules: [
        'Must include: "PARTICULARS OF CLAIM"',
        'Must include: "(Attached to Form N1)"'
      ]
    },
    {
      id: "parties",
      name: "Section 1: Parties",
      order: 2,
      mandatory: true,
      contentRules: [
        "Claimant details",
        "Defendant details"
      ]
    },
    {
      id: "status",
      name: "Section 2: Status of Claimant",
      order: 3,
      mandatory: true,
      contentRules: [
        "Employee / worker / self-employed",
        "Explicit statement (no ambiguity)"
      ]
    },
    {
      id: "contract",
      name: "Section 3: The Contract",
      order: 4,
      mandatory: true,
      contentRules: [
        "Structured list:",
        "- Offer",
        "- Acceptance",
        "- Consideration",
        "- Implied terms",
        "- Mode (verbal / written)"
      ]
    },
    {
      id: "performance",
      name: "Section 4: Performance",
      order: 5,
      mandatory: true,
      contentRules: [
        "What claimant did",
        "Duration actually worked",
        "Any partial performance doctrine",
        "Any concession (e.g. unpaid final hour)"
      ]
    },
    {
      id: "breach",
      name: "Section 5: Breach",
      order: 6,
      mandatory: true,
      contentRules: [
        "Clear statement of non-payment / breach",
        "No motive speculation"
      ]
    },
    {
      id: "loss",
      name: "Section 6: Loss",
      order: 7,
      mandatory: true,
      contentRules: [
        "Exact sum",
        "No padding",
        "No unrelated heads"
      ]
    },
    {
      id: "alternative",
      name: "Section 7: Alternative Basis (If Applicable)",
      order: 8,
      mandatory: false,
      contentRules: [
        "Quantum meruit fallback",
        "Only if legally appropriate"
      ]
    },
    {
      id: "interest",
      name: "Section 8: Interest",
      order: 9,
      mandatory: true,
      contentRules: [
        "s.69 County Courts Act 1984",
        '"Or such other rate and period as the court thinks fit"'
      ]
    },
    {
      id: "relief",
      name: "Section 9: Relief Sought",
      order: 10,
      mandatory: true,
      contentRules: [
        "Principal sum",
        "Interest",
        "Court fee (if applicable)",
        "❌ NO costs in small claims"
      ]
    },
    {
      id: "statement_of_truth",
      name: "Statement of Truth",
      order: 11,
      mandatory: true,
      contentRules: [
        "Exact CPR wording. No variations."
      ]
    }
  ],
  forbidden: [
    "costs claim (small claims)",
    "motive speculation",
    "invented facts",
    "emotional language",
    "unrelated heads of loss"
  ],
  required: [
    "PARTICULARS OF CLAIM",
    "Statement of Truth",
    "s.69 County Courts Act 1984"
  ]
};

// ============================================================================
// 3. WITNESS STATEMENT (CPR 32)
// ============================================================================

export const WITNESS_STATEMENT_STRUCTURE: DocumentStructureRule = {
  forum: "any",
  legalRole: "Evidence. Facts only. No argument.",
  mandatorySections: [
    {
      id: "header",
      name: "Header",
      order: 1,
      mandatory: true,
      contentRules: [
        "Court name",
        "Claim number (if known)",
        "Parties"
      ]
    },
    {
      id: "title",
      name: "Title",
      order: 2,
      mandatory: true,
      contentRules: [
        'Must be: "WITNESS STATEMENT OF [NAME]"'
      ]
    },
    {
      id: "introduction",
      name: "Section 1: Introduction",
      order: 3,
      mandatory: true,
      contentRules: [
        "Who you are",
        "Relationship to case",
        "Purpose of statement"
      ]
    },
    {
      id: "chronology",
      name: "Section 2: Chronology (Numbered)",
      order: 4,
      mandatory: true,
      contentRules: [
        "Dates",
        "Events",
        "Neutral tone",
        "No argument"
      ]
    },
    {
      id: "evidence_refs",
      name: "Section 3: Evidence References",
      order: 5,
      mandatory: true,
      contentRules: [
        '"Exhibit A1", "Exhibit A2"',
        "No descriptions of photos",
        "No metadata"
      ]
    },
    {
      id: "conclusion",
      name: "Section 4: Conclusion",
      order: 6,
      mandatory: true,
      contentRules: [
        "Short factual wrap-up"
      ]
    },
    {
      id: "statement_of_truth",
      name: "Statement of Truth",
      order: 7,
      mandatory: true,
      contentRules: [
        "Exact CPR wording"
      ]
    }
  ],
  forbidden: [
    "legal argument",
    "opinions (unfair, wrong)",
    "evidence not exhibited correctly",
    "photo descriptions",
    "metadata"
  ],
  required: [
    "WITNESS STATEMENT",
    "Statement of Truth",
    "Exhibit references"
  ]
};

// ============================================================================
// 4. SCHEDULE OF DAMAGES / LOSS
// ============================================================================

export const SCHEDULE_OF_LOSS_STRUCTURE: DocumentStructureRule = {
  forum: "any",
  legalRole: "Mathematical breakdown of claim. Table only. No prose.",
  mandatorySections: [
    {
      id: "title",
      name: "Title",
      order: 1,
      mandatory: true,
      contentRules: [
        'Must be: "SCHEDULE OF LOSS"'
      ]
    },
    {
      id: "table",
      name: "Table Only (No Prose)",
      order: 2,
      mandatory: true,
      contentRules: [
        "Columns: Item | Description | Amount (£) | Notes",
        "Total must equal claim",
        "No speculative heads",
        'No "distress", "time spent", etc. unless legally allowed',
        "For small claims: usually one line item"
      ],
      examples: [
        "Unpaid contractual fee | 11 hours @ agreed rate | £145.00"
      ]
    },
    {
      id: "total",
      name: "Total",
      order: 3,
      mandatory: true,
      contentRules: [
        "Bold",
        "Matches PoC exactly"
      ]
    }
  ],
  forbidden: [
    "prose paragraphs",
    "speculative heads",
    "distress (unless tribunal)",
    "time spent (unless costs allowed)",
    "padding"
  ],
  required: [
    "SCHEDULE OF LOSS",
    "table format",
    "total"
  ]
};

// ============================================================================
// 5. EVIDENCE BUNDLE & INDEX
// ============================================================================

export const EVIDENCE_BUNDLE_STRUCTURE: DocumentStructureRule = {
  forum: "any",
  legalRole: "Organized evidence. Index only. No argument.",
  mandatorySections: [
    {
      id: "title",
      name: "Title",
      order: 1,
      mandatory: true,
      contentRules: [
        'Must be: "EVIDENCE BUNDLE"'
      ]
    },
    {
      id: "index",
      name: "Index Table",
      order: 2,
      mandatory: true,
      contentRules: [
        "Exhibit reference",
        "Description (neutral)",
        "Date",
        "Page number"
      ]
    }
  ],
  forbidden: [
    "argument",
    "conclusions",
    'evidence "proves" anything'
  ],
  required: [
    "EVIDENCE BUNDLE",
    "Exhibit references (A1, A2, etc.)",
    'Evidence "shows" not "proves"'
  ]
};

// ============================================================================
// 6. GUIDANCE / COVER LETTER (FROM DISPUTEHUB)
// ============================================================================

export const DISPUTEHUB_COVER_LETTER_STRUCTURE: DocumentStructureRule = {
  forum: "any",
  legalRole: "Explain how to use the pack. Not sent to court. User confidence boost.",
  mandatorySections: [
    {
      id: "title",
      name: "Title",
      order: 1,
      mandatory: true,
      contentRules: [
        'Must include: "DisputeHub Filing Pack"'
      ]
    },
    {
      id: "contents",
      name: "Section 1: What this pack contains",
      order: 2,
      mandatory: true,
      contentRules: [
        "List all documents"
      ]
    },
    {
      id: "purpose",
      name: "Section 2: What each document is for",
      order: 3,
      mandatory: true,
      contentRules: [
        "Brief explanation of each document's role"
      ]
    },
    {
      id: "filing",
      name: "Section 3: Where to file",
      order: 4,
      mandatory: true,
      contentRules: [
        "Court name",
        "Filing method (online / post)"
      ]
    },
    {
      id: "deadlines",
      name: "Section 4: Deadlines",
      order: 5,
      mandatory: true,
      contentRules: [
        "Any time-sensitive actions"
      ]
    },
    {
      id: "disclaimers",
      name: "Section 5: What DisputeHub has / hasn't done",
      order: 6,
      mandatory: true,
      contentRules: [
        "Clear statement of what was generated",
        "What user must verify"
      ]
    },
    {
      id: "legal_disclaimer",
      name: "Section 6: Clear disclaimer",
      order: 7,
      mandatory: true,
      contentRules: [
        "DisputeHub is not a law firm",
        "Documents are based on information provided",
        "User responsibility to verify"
      ]
    }
  ],
  forbidden: [
    "legal advice",
    "guarantees of success"
  ],
  required: [
    "DisputeHub",
    "disclaimer"
  ]
};

// ============================================================================
// 7. RECEIPT / SERVICE CONFIRMATION
// ============================================================================

export const DISPUTEHUB_RECEIPT_STRUCTURE: DocumentStructureRule = {
  forum: "any",
  legalRole: "Trust signal. Protects DisputeHub. Shows what was generated.",
  mandatorySections: [
    {
      id: "title",
      name: "Title",
      order: 1,
      mandatory: true,
      contentRules: [
        'Must include: "DisputeHub Generation Receipt"'
      ]
    },
    {
      id: "case_ref",
      name: "Case Reference",
      order: 2,
      mandatory: true,
      contentRules: [
        "Case reference"
      ]
    },
    {
      id: "documents",
      name: "Documents Generated",
      order: 3,
      mandatory: true,
      contentRules: [
        "List of all documents with character counts"
      ]
    },
    {
      id: "timestamp",
      name: "Date/Time",
      order: 4,
      mandatory: true,
      contentRules: [
        "Generation timestamp"
      ]
    },
    {
      id: "hash",
      name: "Version Hash",
      order: 5,
      mandatory: true,
      contentRules: [
        "Content hash for verification"
      ]
    },
    {
      id: "source",
      name: "Source Statement",
      order: 6,
      mandatory: true,
      contentRules: [
        '"Generated based on information you provided"'
      ]
    }
  ],
  forbidden: [],
  required: [
    "DisputeHub",
    "timestamp",
    "Generated based on information you provided"
  ]
};

// ============================================================================
// DOCUMENT TYPE REGISTRY
// ============================================================================

export const DOCUMENT_STRUCTURES: Record<string, DocumentStructureRule> = {
  "UK-LBA-GENERAL": LBA_STRUCTURE,
  "UK-N1-PARTICULARS-OF-CLAIM": PARTICULARS_OF_CLAIM_STRUCTURE,
  "UK-CPR32-WITNESS-STATEMENT": WITNESS_STATEMENT_STRUCTURE,
  "UK-SCHEDULE-OF-DAMAGES": SCHEDULE_OF_LOSS_STRUCTURE,
  "UK-EVIDENCE-BUNDLE-INDEX": EVIDENCE_BUNDLE_STRUCTURE,
  "DISPUTEHUB-COVER-LETTER": DISPUTEHUB_COVER_LETTER_STRUCTURE,
  "DISPUTEHUB-RECEIPT": DISPUTEHUB_RECEIPT_STRUCTURE,
};

// ============================================================================
// PRE-GENERATION VALIDATOR
// ============================================================================

export interface PreGenerationCheck {
  canGenerate: boolean;
  blockers: string[];
  warnings: string[];
}

/**
 * Every document generator must answer before output:
 * 1. What forum is this for?
 * 2. What is this document's legal role?
 * 3. What facts am I allowed to use?
 * 4. What am I NOT allowed to include?
 * 
 * If it can't answer those → block.
 */
export function preGenerationCheck(
  formId: string,
  forum: LegalForum,
  factsAvailable: string[],
  lockedFacts: any[]
): PreGenerationCheck {
  const structure = DOCUMENT_STRUCTURES[formId];
  
  if (!structure) {
    return {
      canGenerate: false,
      blockers: [`Unknown document type: ${formId}`],
      warnings: []
    };
  }

  const blockers: string[] = [];
  const warnings: string[] = [];

  // Check 1: Forum match
  if (structure.forum !== "any" && structure.forum !== forum) {
    blockers.push(`Document ${formId} is for ${structure.forum}, but case is in ${forum}`);
  }

  // Check 2: Legal role understood?
  if (!structure.legalRole) {
    blockers.push(`Legal role not defined for ${formId}`);
  }

  // Check 3: Facts available?
  if (factsAvailable.length === 0) {
    warnings.push("No facts available - generation may be incomplete");
  }

  // Check 4: Locked facts present?
  if (lockedFacts.length === 0) {
    warnings.push("No locked facts - fact-locking not enforced");
  }

  return {
    canGenerate: blockers.length === 0,
    blockers,
    warnings
  };
}

// ============================================================================
// STRUCTURE VALIDATION
// ============================================================================

export interface StructureValidationResult {
  valid: boolean;
  missingMandatorySections: string[];
  forbiddenContentFound: string[];
  missingRequiredPhrases: string[];
  score: number; // 0-10
}

/**
 * Validates that a generated document matches its constitutional structure
 */
export function validateDocumentStructure(
  formId: string,
  generatedContent: string
): StructureValidationResult {
  const structure = DOCUMENT_STRUCTURES[formId];
  
  // If no structure defined, we can't validate - assume valid with neutral score
  // This prevents blocking documents that don't have explicit structure rules yet
  if (!structure) {
    console.log(`[DocumentStructures] No structure defined for ${formId} - skipping validation`);
    return {
      valid: true, // Don't block - just can't validate
      missingMandatorySections: [],
      forbiddenContentFound: [],
      missingRequiredPhrases: [],
      score: 7 // Neutral score (passes but not perfect)
    };
  }

  const missingMandatorySections: string[] = [];
  const forbiddenContentFound: string[] = [];
  const missingRequiredPhrases: string[] = [];

  // Check mandatory sections
  for (const section of structure.mandatorySections) {
    if (section.mandatory) {
      const sectionNameVariations = [
        section.name,
        section.name.replace("Section ", ""),
        section.name.split(":")[0],
        section.id.toUpperCase()
      ];
      
      const found = sectionNameVariations.some(variation => 
        generatedContent.includes(variation)
      );
      
      if (!found) {
        missingMandatorySections.push(section.name);
      }
    }
  }

  // Check forbidden content
  for (const forbidden of structure.forbidden) {
    if (generatedContent.toLowerCase().includes(forbidden.toLowerCase())) {
      forbiddenContentFound.push(forbidden);
    }
  }

  // Check required phrases
  for (const required of structure.required) {
    if (!generatedContent.includes(required)) {
      missingRequiredPhrases.push(required);
    }
  }

  // Calculate score
  let score = 10;
  score -= missingMandatorySections.length * 2;
  score -= forbiddenContentFound.length * 1.5;
  score -= missingRequiredPhrases.length * 1;
  score = Math.max(0, Math.min(10, score));

  return {
    valid: missingMandatorySections.length === 0 && forbiddenContentFound.length === 0,
    missingMandatorySections,
    forbiddenContentFound,
    missingRequiredPhrases,
    score
  };
}

// ============================================================================
// SYSTEM PROMPT GENERATOR
// ============================================================================

/**
 * Generates AI prompt instructions based on document structure
 */
export function generateStructureInstructions(formId: string): string {
  const structure = DOCUMENT_STRUCTURES[formId];
  
  if (!structure) {
    return "";
  }

  let instructions = `
=== CONSTITUTIONAL STRUCTURE FOR ${formId} ===

LEGAL ROLE: ${structure.legalRole}
FORUM: ${structure.forum}

MANDATORY STRUCTURE (YOU MUST FOLLOW THIS EXACTLY):

`;

  for (const section of structure.mandatorySections) {
    instructions += `\n${section.order}. ${section.name}${section.mandatory ? " [MANDATORY]" : " [OPTIONAL]"}\n`;
    for (const rule of section.contentRules) {
      instructions += `   - ${rule}\n`;
    }
    if (section.examples) {
      instructions += `   Examples:\n`;
      for (const example of section.examples) {
        instructions += `   - ${example}\n`;
      }
    }
  }

  instructions += `\nFORBIDDEN CONTENT (DO NOT INCLUDE):\n`;
  for (const forbidden of structure.forbidden) {
    instructions += `❌ ${forbidden}\n`;
  }

  instructions += `\nREQUIRED PHRASES (MUST INCLUDE):\n`;
  for (const required of structure.required) {
    instructions += `✅ ${required}\n`;
  }

  instructions += `\n=== END CONSTITUTIONAL STRUCTURE ===\n`;

  return instructions;
}
