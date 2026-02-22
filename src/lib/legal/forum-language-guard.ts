/**
 * ═══════════════════════════════════════════════════════════════════════════
 * FORUM-SPECIFIC LANGUAGE GUARD
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * CRITICAL: Different forums have different linguistic standards.
 * Using tribunal language in court (or vice versa) undermines credibility.
 * 
 * This guard ensures:
 * - County Court claims use contract/debt language
 * - Employment Tribunals use statutory rights language
 * - No language drift between forums
 */

export type LegalForum = 
  | "COUNTY_COURT_SMALL_CLAIMS"
  | "COUNTY_COURT_FAST_TRACK"
  | "EMPLOYMENT_TRIBUNAL"
  | "SOCIAL_SECURITY_TRIBUNAL"
  | "TAX_TRIBUNAL"
  | "PROPERTY_TRIBUNAL"
  | "IMMIGRATION_TRIBUNAL";

/**
 * Allowed phrases for each forum
 * If a phrase isn't here, AI should avoid it or use neutral alternative
 */
export const FORUM_LANGUAGE_RULES: Record<LegalForum, {
  allowed: string[];
  forbidden: string[];
  required: string[];
}> = {
  COUNTY_COURT_SMALL_CLAIMS: {
    allowed: [
      "breach of contract",
      "agreed fee",
      "services rendered",
      "sum due",
      "reasonable sum",
      "quantum meruit",
      "substantial performance",
      "oral agreement",
      "implied contract",
      "payment refused",
      "debt due",
      "consideration"
    ],
    forbidden: [
      "unfair dismissal",
      "statutory entitlement",
      "protected characteristic",
      "reasonable adjustments",
      "collective agreement",
      "without reasonable cause", // Too defensive for simple debt
      "acted unreasonably",       // Invites unnecessary argument
      "without justification",    // Raises bar unnecessarily
      "discriminatory",
      "harassment"
    ],
    required: [
      "sum", // Must quantify claim
      "contract" // OR "agreement" - must establish legal basis
    ]
  },

  COUNTY_COURT_FAST_TRACK: {
    allowed: [
      "breach of contract",
      "negligence",
      "duty of care",
      "foreseeable",
      "causation",
      "damages",
      "specific performance",
      "injunction",
      "CPR",
      "disclosure",
      "without prejudice"
    ],
    forbidden: [
      "unfair dismissal",
      "statutory rights",
      "tribunal",
      "respondent" // Should be "defendant"
    ],
    required: [
      "particulars",
      "damages" // OR "sum claimed"
    ]
  },

  EMPLOYMENT_TRIBUNAL: {
    allowed: [
      "unfair dismissal",
      "unlawful deduction from wages",
      "statutory entitlement",
      "notice period",
      "redundancy payment",
      "protected characteristic",
      "discrimination",
      "less favourable treatment",
      "reasonable adjustments",
      "protected disclosure",
      "whistleblowing",
      "ACAS early conciliation",
      "effective date of termination"
    ],
    forbidden: [
      "breach of contract", // Use "breach of employment contract" if needed
      "claimant", // Should be "claimant" actually - this is allowed
      "defendant", // Should be "respondent"
      "county court",
      "CPR"
    ],
    required: [
      "respondent", // Must use tribunal terminology
      "employment" // Must establish employment relationship
    ]
  },

  SOCIAL_SECURITY_TRIBUNAL: {
    allowed: [
      "decision notice",
      "mandatory reconsideration",
      "DWP decision",
      "ESA",
      "PIP",
      "Universal Credit",
      "assessment",
      "descriptor",
      "points",
      "functional limitation",
      "entitlement",
      "overpayment",
      "supersession",
      "revision"
    ],
    forbidden: [
      "breach of contract",
      "damages",
      "defendant",
      "claimant" // Should be "appellant"
    ],
    required: [
      "decision", // Must reference DWP/HMRC decision
      "appeal" // Must establish it's an appeal
    ]
  },

  TAX_TRIBUNAL: {
    allowed: [
      "assessment",
      "HMRC",
      "tax liability",
      "discovery assessment",
      "enquiry",
      "closure notice",
      "penalty",
      "reasonable excuse",
      "deliberate",
      "careless",
      "appeal"
    ],
    forbidden: [
      "breach of contract",
      "unfair",
      "claimant",
      "defendant"
    ],
    required: [
      "HMRC",
      "tax"
    ]
  },

  PROPERTY_TRIBUNAL: {
    allowed: [
      "lease",
      "service charge",
      "reasonable",
      "landlord",
      "tenant",
      "section 20",
      "consultation",
      "major works",
      "managing agent",
      "lease covenant"
    ],
    forbidden: [
      "breach of contract", // Use "breach of lease" instead
      "defendant",
      "claimant"
    ],
    required: [
      "lease", // OR "tenancy"
      "property"
    ]
  },

  IMMIGRATION_TRIBUNAL: {
    allowed: [
      "Home Office",
      "refusal decision",
      "human rights",
      "Article 8",
      "leave to remain",
      "visa",
      "deportation",
      "asylum",
      "refugee convention",
      "country guidance",
      "proportionality"
    ],
    forbidden: [
      "breach of contract",
      "damages",
      "defendant"
    ],
    required: [
      "Home Office",
      "immigration"
    ]
  }
};

/**
 * Validate document language against forum rules
 */
export function validateForumLanguage(
  content: string,
  forum: LegalForum
): {
  valid: boolean;
  forbiddenPhrases: string[];
  missingRequired: string[];
  warnings: string[];
} {
  const rules = FORUM_LANGUAGE_RULES[forum];
  const contentLower = content.toLowerCase();

  // Check for forbidden phrases
  const forbiddenPhrases: string[] = [];
  rules.forbidden.forEach(phrase => {
    if (contentLower.includes(phrase.toLowerCase())) {
      forbiddenPhrases.push(phrase);
    }
  });

  // Check for required phrases
  const missingRequired: string[] = [];
  rules.required.forEach(phrase => {
    if (!contentLower.includes(phrase.toLowerCase())) {
      missingRequired.push(phrase);
    }
  });

  const warnings: string[] = [];

  // Check for tribunal/court language drift
  if (forum.includes("TRIBUNAL") && contentLower.includes("defendant")) {
    warnings.push('Using "defendant" in tribunal context - should use "respondent"');
  }

  if (forum.includes("COURT") && contentLower.includes("respondent")) {
    warnings.push('Using "respondent" in court context - should use "defendant"');
  }

  // Check for overly argumentative language in simple debt claims
  if (forum === "COUNTY_COURT_SMALL_CLAIMS") {
    const argumentativePhrases = [
      "without reasonable cause",
      "acted unreasonably",
      "without justification",
      "unfairly refused",
      "unjustifiably withheld"
    ];

    argumentativePhrases.forEach(phrase => {
      if (contentLower.includes(phrase)) {
        warnings.push(`Phrase "${phrase}" invites unnecessary argument in simple debt claim`);
      }
    });
  }

  return {
    valid: forbiddenPhrases.length === 0 && missingRequired.length === 0,
    forbiddenPhrases,
    missingRequired,
    warnings
  };
}

/**
 * Get forum from routing decision
 */
export function getForumFromRouting(domain: string, forum: string): LegalForum {
  if (forum.includes("County Court") || forum.includes("CCMCC")) {
    if (domain === "civil_debt" || domain === "consumer_rights") {
      return "COUNTY_COURT_SMALL_CLAIMS";
    }
    return "COUNTY_COURT_FAST_TRACK";
  }

  if (forum.includes("Employment") || domain === "employment") {
    return "EMPLOYMENT_TRIBUNAL";
  }

  if (forum.includes("Social Security") || domain === "benefits") {
    return "SOCIAL_SECURITY_TRIBUNAL";
  }

  if (forum.includes("Tax") || domain === "tax") {
    return "TAX_TRIBUNAL";
  }

  if (forum.includes("Property") || domain === "property") {
    return "PROPERTY_TRIBUNAL";
  }

  if (forum.includes("Immigration") || domain === "immigration") {
    return "IMMIGRATION_TRIBUNAL";
  }

  // Default to county court small claims for simple matters
  return "COUNTY_COURT_SMALL_CLAIMS";
}

/**
 * Generate forum-specific language instructions for AI
 */
export function generateForumLanguageInstructions(forum: LegalForum): string {
  const rules = FORUM_LANGUAGE_RULES[forum];

  return `
⚠️ CRITICAL: FORUM-SPECIFIC LANGUAGE RULES

Forum: ${forum.replace(/_/g, ' ')}

YOU MUST USE:
${rules.allowed.map(p => `✓ "${p}"`).join('\n')}

YOU MUST NOT USE:
${rules.forbidden.map(p => `✗ "${p}"`).join('\n')}

YOU MUST INCLUDE:
${rules.required.map(p => `⚠️  "${p}"`).join('\n')}

CRITICAL REMINDERS:
${forum.includes("TRIBUNAL") ? "- Use 'respondent' not 'defendant'\n- Use 'claimant' or 'appellant'\n- Reference statutory rights" : ""}
${forum.includes("COURT") ? "- Use 'defendant' not 'respondent'\n- Use 'claimant'\n- Reference contractual obligations" : ""}
${forum === "COUNTY_COURT_SMALL_CLAIMS" ? "- Keep language simple and fact-based\n- Avoid argumentative phrases like 'without reasonable cause'\n- Focus on: what was agreed, what was done, what is owed" : ""}

ANY VIOLATION OF THESE RULES WILL UNDERMINE CREDIBILITY IN ${forum.replace(/_/g, ' ')}.
  `.trim();
}
