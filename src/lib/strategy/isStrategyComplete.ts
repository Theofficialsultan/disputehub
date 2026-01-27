/**
 * Strategy Completeness Checker (Phase 8.2.5)
 * 
 * System-owned decision logic for determining when a case strategy is complete.
 * 
 * This is NOT AI-controlled.
 * This is NOT user-controlled.
 * This is SYSTEM-controlled.
 * 
 * Rules (NON-NEGOTIABLE):
 * - disputeType must exist
 * - At least 2 key facts required
 * - At least 1 evidence item OR at least 3 key facts
 * - Desired outcome must exist
 */

import type { CaseStrategy } from "@prisma/client";

/**
 * Check if a case strategy is complete
 * 
 * Strategy is complete if and only if:
 * - disputeType !== null
 * - keyFacts.length >= 3 (realistic threshold for case building)
 * - desiredOutcome !== null AND has at least 10 characters
 * 
 * Evidence is helpful but not required - we'll work with what we have.
 * 
 * @param strategy - Case strategy to check
 * @returns true if strategy is complete, false otherwise
 */
export function isStrategyComplete(strategy: CaseStrategy | null): boolean {
  console.log('[Strategy Check] Starting completeness check...');
  
  if (!strategy) {
    console.log('[Strategy Check] ❌ No strategy found');
    return false;
  }

  // Check disputeType
  if (!strategy.disputeType) {
    console.log('[Strategy Check] ❌ Missing dispute type');
    return false;
  }
  console.log(`[Strategy Check] ✅ Dispute type: ${strategy.disputeType}`);

  // Check keyFacts (minimum 8 for realistic case building)
  const keyFactsCount = Array.isArray(strategy.keyFacts) ? strategy.keyFacts.length : 0;
  if (keyFactsCount < 8) {
    console.log(`[Strategy Check] ❌ Only ${keyFactsCount} key facts (need 8)`);
    return false;
  }
  console.log(`[Strategy Check] ✅ Key facts: ${keyFactsCount}`);

  // Check desiredOutcome (must be specific, minimum 30 chars)
  const outcomeLength = strategy.desiredOutcome?.length || 0;
  if (!strategy.desiredOutcome || outcomeLength < 30) {
    console.log(`[Strategy Check] ❌ Desired outcome too short: ${outcomeLength} chars (need 30)`);
    return false;
  }
  console.log(`[Strategy Check] ✅ Desired outcome: "${strategy.desiredOutcome}" (${outcomeLength} chars)`);

  // Check evidence (at least 1 evidence item required)
  const evidenceCount = Array.isArray(strategy.evidenceMentioned) ? strategy.evidenceMentioned.length : 0;
  if (evidenceCount < 1) {
    console.log(`[Strategy Check] ❌ No evidence mentioned (need at least 1)`);
    return false;
  }
  console.log(`[Strategy Check] ✅ Evidence items: ${evidenceCount}`);

  // All conditions met
  console.log('[Strategy Check] ✅✅✅ STRATEGY IS COMPLETE! ✅✅✅');
  return true;
}

/**
 * Get strategy completeness details (for debugging/logging)
 * 
 * @param strategy - Case strategy to check
 * @returns Object with completeness details
 */
export function getStrategyCompletenessDetails(
  strategy: CaseStrategy | null
) {
  if (!strategy) {
    return {
      isComplete: false,
      hasDisputeType: false,
      keyFactsCount: 0,
      hasMinimumKeyFacts: false,
      evidenceCount: 0,
      hasEvidence: false,
      hasExtraKeyFacts: false,
      hasDesiredOutcome: false,
      missingFields: [
        "disputeType",
        "keyFacts (min 8)",
        "desiredOutcome (min 30 chars)",
        "evidence (min 1)",
      ],
    };
  }

  const keyFactsCount = Array.isArray(strategy.keyFacts)
    ? strategy.keyFacts.length
    : 0;
  const evidenceCount = Array.isArray(strategy.evidenceMentioned)
    ? strategy.evidenceMentioned.length
    : 0;

  const hasDisputeType = !!strategy.disputeType;
  const hasMinimumKeyFacts = keyFactsCount >= 8;
  const hasEvidence = evidenceCount >= 1;
  const hasExtraKeyFacts = keyFactsCount >= 8;
  const hasDesiredOutcome = !!strategy.desiredOutcome && strategy.desiredOutcome.length >= 30;

  const missingFields: string[] = [];
  if (!hasDisputeType) missingFields.push("disputeType");
  if (!hasMinimumKeyFacts) missingFields.push(`keyFacts (${keyFactsCount}/8)`);
  if (!hasDesiredOutcome) missingFields.push("desiredOutcome (min 30 chars)");
  if (!hasEvidence) missingFields.push(`evidence (${evidenceCount}/1)`);

  return {
    isComplete: isStrategyComplete(strategy),
    hasDisputeType,
    keyFactsCount,
    hasMinimumKeyFacts,
    evidenceCount,
    hasEvidence,
    hasExtraKeyFacts,
    hasDesiredOutcome,
    missingFields,
  };
}
