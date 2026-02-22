/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RELIEF ALIGNMENT VALIDATOR
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * CRITICAL: The relief claimed must logically follow from the facts and forum.
 * 
 * Prevents:
 * - Claiming costs in small claims (not usually recoverable)
 * - Claiming interest without legal basis
 * - Overreaching with "further or other relief"
 * - Asking for remedies not available in that forum
 */

import type { LegalForum } from "./forum-language-guard";

export type ReliefType =
  | "PRINCIPAL_SUM"           // The main debt/damages
  | "STATUTORY_INTEREST"      // 8% under County Courts Act 1984
  | "CONTRACTUAL_INTEREST"    // Interest agreed in contract
  | "LATE_PAYMENT_INTEREST"   // Commercial Debts (Interest) Act 1998
  | "COSTS"                   // Legal costs
  | "COURT_FEE"              // Issue fee
  | "FURTHER_RELIEF"          // "Such further or other relief"
  | "SPECIFIC_PERFORMANCE"    // Force performance of contract
  | "INJUNCTION"             // Stop someone doing something
  | "DECLARATION"            // Court states legal position
  | "REINSTATEMENT"          // Employment - get job back
  | "RE_ENGAGEMENT"          // Employment - similar job
  | "COMPENSATION"           // Employment - money instead
  | "RECOMMENDATION"         // Tribunal recommendation
  | "PENSION_CONTRIBUTION";  // Employment - pension loss

/**
 * Rules for what relief is allowed in each forum
 */
export const RELIEF_RULES: Record<LegalForum, {
  allowed: ReliefType[];
  requiresUserConfirmation: ReliefType[];
  forbidden: ReliefType[];
  automaticCaps?: {
    costs?: number;
    interest?: string;
  };
}> = {
  COUNTY_COURT_SMALL_CLAIMS: {
    allowed: [
      "PRINCIPAL_SUM",
      "STATUTORY_INTEREST",  // But user should confirm
      "COURT_FEE"
    ],
    requiresUserConfirmation: [
      "STATUTORY_INTEREST",   // Small claims: interest is optional
      "FURTHER_RELIEF"        // Should be specific
    ],
    forbidden: [
      "COSTS",               // Not recoverable in small claims (except fixed costs)
      "SPECIFIC_PERFORMANCE",
      "INJUNCTION"
    ],
    automaticCaps: {
      costs: 0,              // No costs except court fee
      interest: "8% statutory only"
    }
  },

  COUNTY_COURT_FAST_TRACK: {
    allowed: [
      "PRINCIPAL_SUM",
      "STATUTORY_INTEREST",
      "CONTRACTUAL_INTEREST",
      "LATE_PAYMENT_INTEREST",
      "COSTS",
      "COURT_FEE",
      "SPECIFIC_PERFORMANCE",
      "INJUNCTION",
      "DECLARATION"
    ],
    requiresUserConfirmation: [
      "SPECIFIC_PERFORMANCE",  // Unusual remedy
      "INJUNCTION",            // Serious remedy
      "DECLARATION"            // Rare in fast track
    ],
    forbidden: [],
    automaticCaps: {
      costs: 25000  // Fast track costs cap
    }
  },

  EMPLOYMENT_TRIBUNAL: {
    allowed: [
      "COMPENSATION",
      "REINSTATEMENT",
      "RE_ENGAGEMENT",
      "RECOMMENDATION",
      "PENSION_CONTRIBUTION"
    ],
    requiresUserConfirmation: [
      "REINSTATEMENT",    // User must want job back
      "RE_ENGAGEMENT"     // User must want similar job
    ],
    forbidden: [
      "STATUTORY_INTEREST",  // Tribunals don't award interest same way
      "COSTS",              // Costs rare in ET (only for unreasonable conduct)
      "COURT_FEE",         // No fees in ET since 2017
      "INJUNCTION"
    ],
    automaticCaps: {
      costs: 0  // No routine costs in ET
    }
  },

  SOCIAL_SECURITY_TRIBUNAL: {
    allowed: [
      "COMPENSATION"  // Really just "allow appeal" but simplified
    ],
    requiresUserConfirmation: [],
    forbidden: [
      "PRINCIPAL_SUM",
      "STATUTORY_INTEREST",
      "COSTS",
      "COURT_FEE",
      "INJUNCTION",
      "SPECIFIC_PERFORMANCE"
    ],
    automaticCaps: {
      costs: 0  // No costs in SSCS
    }
  },

  TAX_TRIBUNAL: {
    allowed: [
      "COMPENSATION"  // Allow appeal / reduce assessment
    ],
    requiresUserConfirmation: [],
    forbidden: [
      "STATUTORY_INTEREST",
      "COSTS",  // Only in complex cases
      "INJUNCTION"
    ],
    automaticCaps: {}
  },

  PROPERTY_TRIBUNAL: {
    allowed: [
      "PRINCIPAL_SUM",  // Reduce service charge
      "COMPENSATION",
      "DECLARATION"
    ],
    requiresUserConfirmation: [
      "DECLARATION"
    ],
    forbidden: [
      "STATUTORY_INTEREST",  // Rare
      "COSTS",              // Limited costs regime
      "INJUNCTION"
    ],
    automaticCaps: {}
  },

  IMMIGRATION_TRIBUNAL: {
    allowed: [
      "COMPENSATION"  // Allow appeal
    ],
    requiresUserConfirmation: [],
    forbidden: [
      "PRINCIPAL_SUM",
      "STATUTORY_INTEREST",
      "COSTS",
      "INJUNCTION"
    ],
    automaticCaps: {
      costs: 0
    }
  }
};

/**
 * Validate relief requested against forum rules
 */
export function validateRelief(
  requestedRelief: ReliefType[],
  forum: LegalForum,
  claimValue?: number
): {
  valid: boolean;
  forbiddenRelief: ReliefType[];
  needsConfirmation: ReliefType[];
  warnings: string[];
} {
  const rules = RELIEF_RULES[forum];
  
  const forbiddenRelief = requestedRelief.filter(r => 
    rules.forbidden.includes(r)
  );

  const needsConfirmation = requestedRelief.filter(r =>
    rules.requiresUserConfirmation.includes(r)
  );

  const warnings: string[] = [];

  // Check for costs in small claims
  if (forum === "COUNTY_COURT_SMALL_CLAIMS" && requestedRelief.includes("COSTS")) {
    warnings.push("COSTS not recoverable in small claims (except fixed court fee)");
  }

  // Check for excessive relief in small value claims
  if (claimValue && claimValue < 1000) {
    if (requestedRelief.includes("INJUNCTION")) {
      warnings.push("Injunction disproportionate for £" + claimValue + " claim");
    }
    if (requestedRelief.includes("SPECIFIC_PERFORMANCE")) {
      warnings.push("Specific performance disproportionate for £" + claimValue + " claim");
    }
  }

  // Check for "further relief" without specific basis
  if (requestedRelief.includes("FURTHER_RELIEF")) {
    if (forum === "COUNTY_COURT_SMALL_CLAIMS") {
      warnings.push('"Further or other relief" should be specific in small claims');
    }
  }

  return {
    valid: forbiddenRelief.length === 0,
    forbiddenRelief,
    needsConfirmation,
    warnings
  };
}

/**
 * Generate relief section for document
 */
export function generateReliefSection(
  forum: LegalForum,
  principalSum: number,
  includeInterest: boolean = false,
  userConfirmedRelief?: ReliefType[]
): string {
  const rules = RELIEF_RULES[forum];

  if (forum === "COUNTY_COURT_SMALL_CLAIMS") {
    let relief = `AND THE CLAIMANT CLAIMS:

(1) Payment of the sum of £${principalSum.toFixed(2)}`;

    if (includeInterest && userConfirmedRelief?.includes("STATUTORY_INTEREST")) {
      relief += `

(2) Interest pursuant to section 69 of the County Courts Act 1984 at the rate of 8% per annum from [date] to the date of judgment`;
    }

    relief += `

(${includeInterest ? '3' : '2'}) The court fee

`;
    return relief;
  }

  if (forum === "COUNTY_COURT_FAST_TRACK") {
    return `AND THE CLAIMANT CLAIMS:

(1) Payment of the sum of £${principalSum.toFixed(2)}

(2) Interest pursuant to section 69 of the County Courts Act 1984 at the rate of 8% per annum from [date] to the date of judgment, or such other rate and period as the court thinks fit

(3) Costs

(4) Further or other relief
`;
  }

  if (forum === "EMPLOYMENT_TRIBUNAL") {
    return `AND THE CLAIMANT CLAIMS:

(1) Compensation for ${userConfirmedRelief?.includes("RE_ENGAGEMENT") ? "unfair dismissal or, alternatively," : ""}
    ${userConfirmedRelief?.includes("REINSTATEMENT") ? "an order for reinstatement or, alternatively," : ""}
    ${userConfirmedRelief?.includes("RE_ENGAGEMENT") ? "an order for re-engagement or, alternatively," : ""}
    compensation

(2) ${userConfirmedRelief?.includes("PENSION_CONTRIBUTION") ? "An award for loss of pension rights\n\n(3) " : ""}Such further relief as the Tribunal considers appropriate
`;
  }

  // Generic fallback
  return `AND THE CLAIMANT/APPELLANT CLAIMS:

(1) [Appropriate relief for ${forum.replace(/_/g, ' ')}]
`;
}

/**
 * Extract relief types from document content
 */
export function extractReliefFromDocument(content: string): ReliefType[] {
  const relief: ReliefType[] = [];

  const contentLower = content.toLowerCase();

  if (contentLower.includes("payment of") || contentLower.includes("sum of £")) {
    relief.push("PRINCIPAL_SUM");
  }

  if (contentLower.includes("interest") && contentLower.includes("8%")) {
    relief.push("STATUTORY_INTEREST");
  }

  if (contentLower.includes("costs")) {
    relief.push("COSTS");
  }

  if (contentLower.includes("further") && contentLower.includes("relief")) {
    relief.push("FURTHER_RELIEF");
  }

  if (contentLower.includes("specific performance")) {
    relief.push("SPECIFIC_PERFORMANCE");
  }

  if (contentLower.includes("injunction")) {
    relief.push("INJUNCTION");
  }

  if (contentLower.includes("reinstatement")) {
    relief.push("REINSTATEMENT");
  }

  if (contentLower.includes("re-engagement")) {
    relief.push("RE_ENGAGEMENT");
  }

  return relief;
}
