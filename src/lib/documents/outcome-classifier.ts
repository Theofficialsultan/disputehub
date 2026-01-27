/**
 * Outcome Complexity Classifier
 * Phase 7.2 Block 3A
 * 
 * Classifies desired outcomes into complexity categories using
 * deterministic rules and keyword analysis (NOT substring matching)
 */

export type OutcomeComplexity = "SIMPLE" | "MEDIUM" | "COMPLEX";

/**
 * Keywords that indicate outcome complexity
 * Organized by legal complexity level
 */
const OUTCOME_KEYWORDS = {
  simple: [
    // Basic requests
    "refund",
    "cancel",
    "cancellation",
    "dismiss",
    "dismissal",
    "withdraw",
    "waive",
    "void",
    "remove",
    "delete",
    "reverse",
    // Simple resolution
    "apology",
    "correction",
    "fix",
    "repair",
  ],

  medium: [
    // Partial resolution
    "compensation",
    "partial refund",
    "reduce",
    "reduction",
    "discount",
    "credit",
    "voucher",
    // Administrative actions
    "review",
    "reconsider",
    "reassess",
    "investigate",
    "complaint",
    "escalate",
  ],

  complex: [
    // Legal proceedings
    "tribunal",
    "court",
    "lawsuit",
    "legal action",
    "litigation",
    "claim",
    "sue",
    "prosecution",
    // Formal processes
    "appeal",
    "hearing",
    "adjudication",
    "arbitration",
    "mediation",
    // Serious outcomes
    "damages",
    "injunction",
    "enforcement",
    "penalty",
    "settlement",
    "judgment",
  ],
};

/**
 * Classify outcome complexity using keyword analysis
 * 
 * Algorithm:
 * 1. Normalize outcome text (lowercase, trim)
 * 2. Tokenize into words
 * 3. Check for keyword matches in each complexity category
 * 4. Return highest complexity found
 * 5. Default to SIMPLE if no keywords match
 */
export function classifyOutcomeComplexity(
  outcome: string | null
): OutcomeComplexity {
  if (!outcome) {
    return "SIMPLE"; // Default for incomplete cases
  }

  // Normalize text
  const normalizedOutcome = outcome.toLowerCase().trim();

  // Tokenize (split by spaces, punctuation)
  const tokens = normalizedOutcome
    .split(/[\s,;.!?]+/)
    .filter((token) => token.length > 0);

  // Check for complex keywords first (highest priority)
  for (const keyword of OUTCOME_KEYWORDS.complex) {
    if (tokens.includes(keyword) || normalizedOutcome.includes(keyword)) {
      return "COMPLEX";
    }
  }

  // Check for medium keywords
  for (const keyword of OUTCOME_KEYWORDS.medium) {
    if (tokens.includes(keyword) || normalizedOutcome.includes(keyword)) {
      return "MEDIUM";
    }
  }

  // Check for simple keywords
  for (const keyword of OUTCOME_KEYWORDS.simple) {
    if (tokens.includes(keyword) || normalizedOutcome.includes(keyword)) {
      return "SIMPLE";
    }
  }

  // Default: Assume simple if no keywords found
  // Rationale: Most users express simple desires naturally
  return "SIMPLE";
}

/**
 * Get human-readable explanation for outcome classification
 */
export function explainOutcomeClassification(
  outcome: string | null,
  classification: OutcomeComplexity
): string {
  if (!outcome) {
    return "No desired outcome specified, defaulting to simple classification";
  }

  const normalizedOutcome = outcome.toLowerCase();

  // Find which keyword triggered the classification
  const keywordSets = {
    SIMPLE: OUTCOME_KEYWORDS.simple,
    MEDIUM: OUTCOME_KEYWORDS.medium,
    COMPLEX: OUTCOME_KEYWORDS.complex,
  };

  const matchedKeywords = keywordSets[classification].filter(
    (keyword) =>
      normalizedOutcome.includes(keyword) ||
      normalizedOutcome.split(/[\s,;.!?]+/).includes(keyword)
  );

  if (matchedKeywords.length > 0) {
    return `Classified as ${classification.toLowerCase()} based on keywords: ${matchedKeywords.slice(0, 3).join(", ")}`;
  }

  return `Classified as ${classification.toLowerCase()} by default (no specific keywords found)`;
}

/**
 * Get score for outcome complexity based on configuration
 */
export function getOutcomeScore(
  complexity: OutcomeComplexity,
  config: { simple: number; medium: number; complex: number }
): number {
  switch (complexity) {
    case "SIMPLE":
      return config.simple;
    case "MEDIUM":
      return config.medium;
    case "COMPLEX":
      return config.complex;
    default:
      return config.simple;
  }
}
