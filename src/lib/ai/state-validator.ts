/**
 * STATE VALIDATOR
 * Server-side enforcement of conversation state rules
 * 
 * Prevents AI from hallucinating evidence or proceeding without system confirmation
 */

export interface ConversationState {
  evidenceCount: number;
  hasDisputeType: boolean;
  hasRelationship: boolean;
  hasOtherParty: boolean;
  hasWhatHappened: boolean;
  hasAmount: boolean;
  factCount: number;
}

export interface StateValidationResult {
  canProceed: boolean;
  reason?: string;
  state: "GATHERING" | "WAITING_FOR_EVIDENCE" | "READY" | "BLOCKED";
}

/**
 * Validate if conversation can proceed to document generation
 */
export function validateConversationState(
  strategy: any,
  evidenceCount: number
): StateValidationResult {
  const state: ConversationState = {
    evidenceCount,
    hasDisputeType: !!strategy?.disputeType,
    hasRelationship: extractRelationship(strategy) !== null,
    hasOtherParty: extractOtherParty(strategy) !== null,
    hasWhatHappened: extractBreach(strategy) !== null,
    hasAmount: extractAmount(strategy) !== null,
    factCount: Array.isArray(strategy?.keyFacts) ? strategy.keyFacts.length : 0,
  };

  // Check if all core facts are gathered
  const coreFactsComplete =
    state.hasDisputeType &&
    state.hasRelationship &&
    state.hasOtherParty &&
    state.hasWhatHappened &&
    state.hasAmount &&
    state.factCount >= 5;

  // Evidence gate: Must have evidence to proceed
  if (coreFactsComplete && evidenceCount === 0) {
    return {
      canProceed: false,
      reason: "Evidence required but not uploaded",
      state: "WAITING_FOR_EVIDENCE",
    };
  }

  // All requirements met
  if (coreFactsComplete && evidenceCount > 0) {
    return {
      canProceed: true,
      state: "READY",
    };
  }

  // Still gathering information
  return {
    canProceed: false,
    reason: "Core facts incomplete",
    state: "GATHERING",
  };
}

/**
 * Check if AI response contains forbidden evidence hallucinations
 */
export function detectEvidenceHallucination(
  aiResponse: string,
  evidenceCount: number
): { detected: boolean; violations: string[] } {
  if (evidenceCount > 0) {
    // Evidence exists, no hallucination possible
    return { detected: false, violations: [] };
  }

  // Evidence does NOT exist - check for forbidden phrases
  const forbiddenPhrases = [
    "I've reviewed the evidence",
    "I've reviewed the",
    "based on the uploaded",
    "based on the files",
    "the documents show",
    "the photos show",
    "the email confirms",
    "that's enough information to proceed",
    "I have everything needed",
    "your documents will be prepared",
  ];

  const violations: string[] = [];
  const lowerResponse = aiResponse.toLowerCase();

  for (const phrase of forbiddenPhrases) {
    if (lowerResponse.includes(phrase.toLowerCase())) {
      violations.push(phrase);
    }
  }

  return {
    detected: violations.length > 0,
    violations,
  };
}

// Helper functions to extract facts from strategy

function extractRelationship(strategy: any): string | null {
  if (!strategy?.keyFacts) return null;
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  
  const relationshipKeywords = [
    "employee", "worker", "self-employed", "contractor",
    "tenant", "lodger", "buyer", "customer", "patient",
  ];
  
  for (const fact of facts) {
    const lower = fact.toLowerCase();
    for (const keyword of relationshipKeywords) {
      if (lower.includes(keyword)) return keyword;
    }
  }
  
  return null;
}

function extractOtherParty(strategy: any): string | null {
  if (!strategy?.keyFacts) return null;
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  
  // Look for company names, organization names
  for (const fact of facts) {
    if (fact.includes("Ltd") || fact.includes("Limited") || 
        fact.includes("Corp") || fact.includes("Council") ||
        fact.length > 10) {
      return fact;
    }
  }
  
  return null;
}

function extractBreach(strategy: any): string | null {
  if (!strategy?.keyFacts) return null;
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  
  const breachKeywords = [
    "not paid", "didn't pay", "refused to pay", "unpaid",
    "breach", "damage", "broken", "failed", "unfair",
  ];
  
  for (const fact of facts) {
    const lower = fact.toLowerCase();
    for (const keyword of breachKeywords) {
      if (lower.includes(keyword)) return fact;
    }
  }
  
  return null;
}

function extractAmount(strategy: any): string | null {
  if (!strategy?.desiredOutcome) return null;
  
  const outcome = strategy.desiredOutcome.toLowerCase();
  
  // Look for currency amounts
  if (outcome.includes("£") || outcome.includes("$") || 
      outcome.includes("compensation") || outcome.includes("refund")) {
    return strategy.desiredOutcome;
  }
  
  return null;
}
