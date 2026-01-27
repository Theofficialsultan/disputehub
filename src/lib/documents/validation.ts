/**
 * Strategy Completeness Validation
 * Phase 7.2 Block 3A
 * 
 * Validates that a CaseStrategy has sufficient information
 * to generate a document plan
 */

import type { CaseStrategyInput, StrategyCompleteness } from "./types";

/**
 * Validate strategy completeness
 * 
 * Requirements:
 * - disputeType must be set (not null)
 * - desiredOutcome must be set (not null)
 * - Must have at least 2 key facts, OR 1 key fact + 1 evidence item
 * 
 * Rationale:
 * - disputeType: Determines document routing and complexity base
 * - desiredOutcome: Essential for letter purpose and tone
 * - Facts/Evidence: Need minimum substance for credible case
 */
export function validateStrategyCompleteness(
  strategy: CaseStrategyInput
): StrategyCompleteness {
  const missingFields: string[] = [];

  // Check dispute type
  if (!strategy.disputeType || strategy.disputeType.trim() === "") {
    missingFields.push("disputeType");
  }

  // Check desired outcome
  if (!strategy.desiredOutcome || strategy.desiredOutcome.trim() === "") {
    missingFields.push("desiredOutcome");
  }

  // Check facts and evidence requirement
  const factCount = strategy.keyFacts.length;
  const evidenceCount = strategy.evidenceMentioned.length;

  const hasMinimumSubstance =
    factCount >= 2 || (factCount >= 1 && evidenceCount >= 1);

  if (!hasMinimumSubstance) {
    if (factCount === 0 && evidenceCount === 0) {
      missingFields.push("keyFacts and evidenceMentioned (need at least 2 facts OR 1 fact + 1 evidence)");
    } else if (factCount === 1 && evidenceCount === 0) {
      missingFields.push("keyFacts or evidenceMentioned (need 1 more fact OR 1 evidence item)");
    } else if (factCount === 0 && evidenceCount >= 1) {
      missingFields.push("keyFacts (need at least 1 fact when only evidence is provided)");
    }
  }

  // Build result
  const isComplete = missingFields.length === 0;

  let reason: string;
  if (isComplete) {
    reason = "Strategy is complete and ready for document generation";
  } else {
    reason = `Strategy is incomplete. Missing: ${missingFields.join(", ")}`;
  }

  return {
    isComplete,
    missingFields,
    reason,
  };
}

/**
 * Get detailed breakdown of what's present vs missing
 */
export function getStrategyCompletionStatus(strategy: CaseStrategyInput): {
  disputeType: { present: boolean; value: string | null };
  desiredOutcome: { present: boolean; value: string | null };
  keyFacts: { count: number; sufficient: boolean };
  evidenceMentioned: { count: number; sufficient: boolean };
  minimumSubstance: { met: boolean; reason: string };
} {
  const factCount = strategy.keyFacts.length;
  const evidenceCount = strategy.evidenceMentioned.length;
  const hasMinimumSubstance =
    factCount >= 2 || (factCount >= 1 && evidenceCount >= 1);

  let substanceReason: string;
  if (factCount >= 2) {
    substanceReason = `Has ${factCount} facts (meets 2+ facts requirement)`;
  } else if (factCount >= 1 && evidenceCount >= 1) {
    substanceReason = `Has ${factCount} fact(s) + ${evidenceCount} evidence (meets 1 fact + 1 evidence requirement)`;
  } else if (factCount === 1 && evidenceCount === 0) {
    substanceReason = `Has only ${factCount} fact, needs 1 more fact OR 1 evidence item`;
  } else if (factCount === 0 && evidenceCount >= 1) {
    substanceReason = `Has ${evidenceCount} evidence but no facts, needs at least 1 fact`;
  } else {
    substanceReason = "No facts or evidence provided yet";
  }

  return {
    disputeType: {
      present: !!strategy.disputeType,
      value: strategy.disputeType,
    },
    desiredOutcome: {
      present: !!strategy.desiredOutcome,
      value: strategy.desiredOutcome,
    },
    keyFacts: {
      count: factCount,
      sufficient: factCount >= 2,
    },
    evidenceMentioned: {
      count: evidenceCount,
      sufficient: evidenceCount >= 1,
    },
    minimumSubstance: {
      met: hasMinimumSubstance,
      reason: substanceReason,
    },
  };
}
