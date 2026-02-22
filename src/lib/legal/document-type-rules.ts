/**
 * DOCUMENT-TYPE RULES (ORTHOGONAL LAYER)
 * 
 * These rules apply to document types REGARDLESS of case type.
 * They define what each document type CAN and CANNOT do.
 * 
 * This is layered on top of: Universal Skeleton + Case-Type Module
 */

import { DocumentType } from "./universal-skeleton";

// ============================================================================
// DOCUMENT-TYPE RULES INTERFACE
// ============================================================================

export interface DocumentTypeRules {
  documentType: DocumentType;
  /** What this document can do */
  allowed: string[];
  /** What this document must NOT do */
  forbidden: string[];
  /** Content restrictions */
  restrictions: ContentRestriction[];
  /** Validation rules */
  validationRules: ValidationRule[];
}

export interface ContentRestriction {
  rule: string;
  rationale: string;
  examples: string[];
}

export interface ValidationRule {
  check: string;
  failureMessage: string;
  severity: "error" | "warning";
}

// ============================================================================
// LETTER BEFORE ACTION RULES
// ============================================================================

export const LETTER_BEFORE_ACTION_RULES: DocumentTypeRules = {
  documentType: "letter_before_action",
  
  allowed: [
    "State facts briefly",
    "Make clear demand",
    "Set deadline (14 days)",
    "State consequences",
    "Reference pre-action protocol"
  ],
  
  forbidden: [
    "Legal argument",
    "Detailed evidence description",
    "Emotional language",
    "Threats",
    "Speculation about motive"
  ],
  
  restrictions: [
    {
      rule: "No legal argument",
      rationale: "LBA is a notice, not a legal submission",
      examples: [
        "❌ 'The defendant's conduct amounts to a fundamental breach under common law principles...'",
        "✅ 'The defendant has failed to pay the agreed fee of £145.'"
      ]
    },
    {
      rule: "No evidence descriptions",
      rationale: "Evidence comes later, not in the LBA",
      examples: [
        "❌ 'I have 11 photos showing my presence on site...'",
        "✅ 'I worked the agreed shift on 14 October 2025.'"
      ]
    },
    {
      rule: "One page maximum for small claims",
      rationale: "Proportionality",
      examples: []
    }
  ],
  
  validationRules: [
    {
      check: "Contains '14 days' or '14-day'",
      failureMessage: "LBA must specify 14-day deadline",
      severity: "error"
    },
    {
      check: "Contains 'pre-action' or 'protocol'",
      failureMessage: "LBA must reference pre-action compliance",
      severity: "warning"
    },
    {
      check: "No words: 'exhibit', 'photo', 'evidence bundle'",
      failureMessage: "LBA should not describe evidence in detail",
      severity: "warning"
    }
  ]
};

// ============================================================================
// PARTICULARS OF CLAIM RULES
// ============================================================================

export const PARTICULARS_OF_CLAIM_RULES: DocumentTypeRules = {
  documentType: "particulars_of_claim",
  
  allowed: [
    "Plead facts",
    "State legal basis",
    "Claim relief",
    "Reference statutory provisions",
    "Alternative legal theories"
  ],
  
  forbidden: [
    "Describe evidence (that's for witness statement)",
    "Argue interpretation (that's for trial)",
    "Personal opinions",
    "Emotional language"
  ],
  
  restrictions: [
    {
      rule: "Facts, not evidence",
      rationale: "PoC pleads what happened, not what will prove it",
      examples: [
        "❌ 'I have photos showing I was there for 11 hours'",
        "✅ 'The Claimant worked for approximately 11 hours'"
      ]
    },
    {
      rule: "State relief precisely",
      rationale: "Court needs exact figures",
      examples: [
        "❌ 'The Claimant seeks payment'",
        "✅ 'The Claimant seeks £145.00 being the unpaid fee'"
      ]
    },
    {
      rule: "No speculation",
      rationale: "Only plead what you can prove",
      examples: [
        "❌ 'The Defendant probably knew the contract was binding'",
        "✅ 'The Defendant agreed to pay £145 for the work'"
      ]
    }
  ],
  
  validationRules: [
    {
      check: "Contains 'Statement of Truth'",
      failureMessage: "PoC must have Statement of Truth",
      severity: "error"
    },
    {
      check: "Contains exact monetary amount (e.g. £145.00)",
      failureMessage: "PoC must state precise claim amount",
      severity: "error"
    },
    {
      check: "Does not contain 'I believe' or 'I think'",
      failureMessage: "PoC should state facts, not beliefs",
      severity: "warning"
    }
  ]
};

// ============================================================================
// WITNESS STATEMENT RULES
// ============================================================================

export const WITNESS_STATEMENT_RULES: DocumentTypeRules = {
  documentType: "witness_statement",
  
  allowed: [
    "State facts only",
    "Chronological narrative",
    "Reference exhibits",
    "Personal observations"
  ],
  
  forbidden: [
    "Legal argument",
    "Opinions about law",
    "Conclusions about what evidence proves",
    "Describing photos (exhibit them, don't describe)",
    "Emotional language ('unfair', 'wrong', 'unjust')"
  ],
  
  restrictions: [
    {
      rule: "Facts only, no argument",
      rationale: "Witness statement is evidence, not submission",
      examples: [
        "❌ 'This clearly shows the defendant breached the contract'",
        "✅ 'At 3pm, the defendant said he would not pay me'"
      ]
    },
    {
      rule: "No photo descriptions",
      rationale: "Let photos speak for themselves",
      examples: [
        "❌ 'Exhibit A1 is a photo showing me at the site at 8am'",
        "✅ 'I arrived at the site at 8am (Exhibit A1)'"
      ]
    },
    {
      rule: "No opinions",
      rationale: "Facts, not interpretation",
      examples: [
        "❌ 'I think the defendant was being unfair'",
        "✅ 'The defendant said he would not pay'"
      ]
    }
  ],
  
  validationRules: [
    {
      check: "Contains 'Statement of Truth'",
      failureMessage: "Witness statement must have Statement of Truth",
      severity: "error"
    },
    {
      check: "No words: 'unfair', 'wrong', 'unjust', 'clearly', 'obviously'",
      failureMessage: "Witness statement should avoid opinion words",
      severity: "warning"
    },
    {
      check: "Contains 'Exhibit A' or 'Exhibit B'",
      failureMessage: "Witness statement should reference exhibits",
      severity: "warning"
    }
  ]
};

// ============================================================================
// SCHEDULE OF LOSS RULES
// ============================================================================

export const SCHEDULE_OF_LOSS_RULES: DocumentTypeRules = {
  documentType: "schedule_of_loss",
  
  allowed: [
    "Numbers only",
    "Table format",
    "Clear calculation",
    "Line-by-line breakdown"
  ],
  
  forbidden: [
    "Narrative prose",
    "Legal argument",
    "Speculation",
    "Padding",
    "Emotional language"
  ],
  
  restrictions: [
    {
      rule: "Table only, no prose",
      rationale: "Schedule is mathematical, not narrative",
      examples: [
        "❌ 'The claimant suffered significant losses as a result of...'",
        "✅ 'Unpaid fee | 11 hours @ £13.18/hr | £145.00'"
      ]
    },
    {
      rule: "Total must match PoC",
      rationale: "Consistency check",
      examples: []
    },
    {
      rule: "No speculative heads",
      rationale: "Only claim what you can prove",
      examples: [
        "❌ 'Future loss of earnings: £10,000'",
        "✅ 'Unpaid contractual fee: £145.00'"
      ]
    },
    {
      rule: "Proportionality check",
      rationale: "Don't claim £50k schedule for £145 debt",
      examples: []
    }
  ],
  
  validationRules: [
    {
      check: "Contains table or structured list",
      failureMessage: "Schedule must be in table format",
      severity: "error"
    },
    {
      check: "Contains 'Total' or 'TOTAL'",
      failureMessage: "Schedule must have clear total",
      severity: "error"
    },
    {
      check: "Length < 2 pages for claims under £1000",
      failureMessage: "Schedule is disproportionately long for small claim",
      severity: "warning"
    }
  ]
};

// ============================================================================
// EVIDENCE BUNDLE RULES
// ============================================================================

export const EVIDENCE_BUNDLE_RULES: DocumentTypeRules = {
  documentType: "evidence_bundle",
  
  allowed: [
    "Index exhibits",
    "Neutral descriptions",
    "Chronological order",
    "Page references"
  ],
  
  forbidden: [
    "Argument",
    "Conclusions",
    "Saying evidence 'proves' anything",
    "Opinions"
  ],
  
  restrictions: [
    {
      rule: "Index only, no argument",
      rationale: "Evidence speaks for itself",
      examples: [
        "❌ 'This photo clearly proves I was on site'",
        "✅ 'Photo of site, 14 Oct 2025, 08:00'"
      ]
    },
    {
      rule: "Evidence 'shows', not 'proves'",
      rationale: "Court decides what evidence proves",
      examples: [
        "❌ 'Exhibit A1 proves I arrived at 8am'",
        "✅ 'Exhibit A1: Photo showing site at 08:00'"
      ]
    }
  ],
  
  validationRules: [
    {
      check: "Contains 'Exhibit A1' or similar references",
      failureMessage: "Evidence bundle must use exhibit references",
      severity: "error"
    },
    {
      check: "No words: 'proves', 'clearly shows', 'demonstrates'",
      failureMessage: "Evidence bundle should be neutral",
      severity: "warning"
    }
  ]
};

// ============================================================================
// DOCUMENT-TYPE RULES REGISTRY
// ============================================================================

export const DOCUMENT_TYPE_RULES_REGISTRY: Record<DocumentType, DocumentTypeRules> = {
  "letter_before_action": LETTER_BEFORE_ACTION_RULES,
  "particulars_of_claim": PARTICULARS_OF_CLAIM_RULES,
  "witness_statement": WITNESS_STATEMENT_RULES,
  "schedule_of_loss": SCHEDULE_OF_LOSS_RULES,
  "evidence_bundle": EVIDENCE_BUNDLE_RULES,
};

// ============================================================================
// DOCUMENT-TYPE VALIDATOR
// ============================================================================

export interface DocumentTypeValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  score: number;
}

/**
 * Validate that generated content follows document-type rules
 */
export function validateDocumentTypeRules(
  content: string,
  documentType: DocumentType
): DocumentTypeValidationResult {
  const rules = DOCUMENT_TYPE_RULES_REGISTRY[documentType];
  
  if (!rules) {
    return {
      passed: false,
      errors: [`Unknown document type: ${documentType}`],
      warnings: [],
      score: 0
    };
  }
  
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Run validation rules
  for (const validationRule of rules.validationRules) {
    const checkPassed = runValidationCheck(content, validationRule.check);
    
    if (!checkPassed) {
      if (validationRule.severity === "error") {
        errors.push(validationRule.failureMessage);
      } else {
        warnings.push(validationRule.failureMessage);
      }
    }
  }
  
  // Check for forbidden content
  for (const forbidden of rules.forbidden) {
    if (content.toLowerCase().includes(forbidden.toLowerCase())) {
      warnings.push(`Document contains forbidden content: "${forbidden}"`);
    }
  }
  
  // Calculate score
  let score = 10;
  score -= errors.length * 3;
  score -= warnings.length * 1;
  score = Math.max(0, Math.min(10, score));
  
  return {
    passed: errors.length === 0,
    errors,
    warnings,
    score
  };
}

/**
 * Run a validation check on content
 */
function runValidationCheck(content: string, check: string): boolean {
  // Parse check string and execute
  if (check.startsWith("Contains ")) {
    const phrase = check.replace("Contains ", "").replace(/['"]/g, "");
    return content.includes(phrase);
  }
  
  if (check.startsWith("No words: ")) {
    const words = check.replace("No words: ", "").split(", ").map(w => w.replace(/['"]/g, ""));
    return !words.some(word => content.toLowerCase().includes(word.toLowerCase()));
  }
  
  if (check.startsWith("Length < ")) {
    const pages = parseInt(check.match(/\d+/)?.[0] || "999");
    const estimatedPages = content.length / 2500; // Rough estimate
    return estimatedPages < pages;
  }
  
  // Default: assume check passes
  return true;
}

/**
 * Generate instructions for AI based on document-type rules
 */
export function generateDocumentTypeInstructions(documentType: DocumentType): string {
  const rules = DOCUMENT_TYPE_RULES_REGISTRY[documentType];
  
  if (!rules) {
    return "";
  }
  
  let instructions = `
=== DOCUMENT-TYPE RULES FOR ${documentType.toUpperCase().replace(/_/g, ' ')} ===

WHAT THIS DOCUMENT CAN DO:
${rules.allowed.map(a => `✅ ${a}`).join('\n')}

WHAT THIS DOCUMENT MUST NOT DO:
${rules.forbidden.map(f => `❌ ${f}`).join('\n')}

CONTENT RESTRICTIONS:
${rules.restrictions.map(r => `
⚠️  ${r.rule}
   Rationale: ${r.rationale}
   ${r.examples.map(e => `   ${e}`).join('\n')}
`).join('\n')}

=== END DOCUMENT-TYPE RULES ===
  `.trim();
  
  return instructions;
}
