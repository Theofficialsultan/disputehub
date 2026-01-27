/**
 * Complexity Scoring Algorithm
 * Phase 7.2 Block 3A
 * 
 * Calculates case complexity score using configurable weights
 * and provides detailed breakdown for transparency
 */

import type {
  CaseStrategyInput,
  ComplexityConfig,
  ComplexityBreakdown,
  CaseComplexity,
} from "./types";
import {
  classifyOutcomeComplexity,
  explainOutcomeClassification,
  getOutcomeScore,
} from "./outcome-classifier";

/**
 * Calculate dispute type score
 */
function calculateDisputeTypeScore(
  disputeType: string | null,
  config: ComplexityConfig
): { score: number; reason: string } {
  if (!disputeType) {
    return {
      score: 0,
      reason: "No dispute type specified",
    };
  }

  const weight = config.disputeTypeWeights[disputeType];

  if (weight === undefined) {
    // Unknown dispute type, use 'other' as fallback
    const fallbackWeight = config.disputeTypeWeights.other || 4;
    return {
      score: fallbackWeight,
      reason: `Unknown dispute type '${disputeType}', using fallback weight of ${fallbackWeight}`,
    };
  }

  return {
    score: weight,
    reason: `Dispute type '${disputeType}' has weight ${weight}`,
  };
}

/**
 * Calculate key facts score
 */
function calculateFactCountScore(
  factCount: number,
  config: ComplexityConfig
): { score: number; reason: string } {
  if (factCount === 0) {
    return {
      score: config.factScoring.none,
      reason: `No facts provided (${config.factScoring.none} points)`,
    };
  }

  if (factCount <= config.factScoring.low.max) {
    return {
      score: config.factScoring.low.score,
      reason: `${factCount} fact(s) - low complexity (${config.factScoring.low.score} point(s))`,
    };
  }

  if (factCount <= config.factScoring.medium.max) {
    return {
      score: config.factScoring.medium.score,
      reason: `${factCount} facts - medium complexity (${config.factScoring.medium.score} points)`,
    };
  }

  return {
    score: config.factScoring.high.score,
    reason: `${factCount} facts - high complexity (${config.factScoring.high.score} points)`,
  };
}

/**
 * Calculate evidence score
 */
function calculateEvidenceScore(
  evidenceCount: number,
  config: ComplexityConfig
): { score: number; reason: string } {
  if (evidenceCount === 0) {
    return {
      score: config.evidenceScoring.none,
      reason: `No evidence mentioned (${config.evidenceScoring.none} points)`,
    };
  }

  if (evidenceCount <= config.evidenceScoring.low.max) {
    return {
      score: config.evidenceScoring.low.score,
      reason: `${evidenceCount} evidence item(s) - basic (${config.evidenceScoring.low.score} point(s))`,
    };
  }

  if (evidenceCount <= config.evidenceScoring.medium.max) {
    return {
      score: config.evidenceScoring.medium.score,
      reason: `${evidenceCount} evidence items - good (${config.evidenceScoring.medium.score} points)`,
    };
  }

  return {
    score: config.evidenceScoring.high.score,
    reason: `${evidenceCount} evidence items - substantial (${config.evidenceScoring.high.score} points)`,
  };
}

/**
 * Calculate outcome complexity score
 */
function calculateOutcomeScore(
  desiredOutcome: string | null,
  config: ComplexityConfig
): { score: number; reason: string } {
  const complexity = classifyOutcomeComplexity(desiredOutcome);
  const score = getOutcomeScore(complexity, config.outcomeWeights);
  const explanation = explainOutcomeClassification(desiredOutcome, complexity);

  return {
    score,
    reason: `${explanation} (${score} point(s))`,
  };
}

/**
 * Calculate total complexity score with detailed breakdown
 * 
 * This is the core algorithm that determines document routing
 * Version 1.0
 */
export function calculateComplexityScore(
  strategy: CaseStrategyInput,
  config: ComplexityConfig
): ComplexityBreakdown {
  // Calculate individual scores
  const disputeTypeResult = calculateDisputeTypeScore(
    strategy.disputeType,
    config
  );
  const factCountResult = calculateFactCountScore(
    strategy.keyFacts.length,
    config
  );
  const evidenceResult = calculateEvidenceScore(
    strategy.evidenceMentioned.length,
    config
  );
  const outcomeResult = calculateOutcomeScore(
    strategy.desiredOutcome,
    config
  );

  // Calculate total
  const totalScore =
    disputeTypeResult.score +
    factCountResult.score +
    evidenceResult.score +
    outcomeResult.score;

  // Classify complexity
  const classification: CaseComplexity =
    totalScore >= config.complexityThreshold ? "COMPLEX" : "SIMPLE";

  // Build detailed breakdown with version
  return {
    version: "1.0", // Algorithm version
    
    disputeTypeScore: disputeTypeResult.score,
    disputeTypeReason: disputeTypeResult.reason,

    factCountScore: factCountResult.score,
    factCountReason: factCountResult.reason,

    evidenceScore: evidenceResult.score,
    evidenceReason: evidenceResult.reason,

    outcomeScore: outcomeResult.score,
    outcomeReason: outcomeResult.reason,

    totalScore,
    threshold: config.complexityThreshold,
    classification,
  };
}

/**
 * Format complexity breakdown as human-readable text
 */
export function formatComplexityBreakdown(
  breakdown: ComplexityBreakdown
): string {
  const lines = [
    `Complexity Calculation:`,
    ``,
    `1. Dispute Type: ${breakdown.disputeTypeScore} points`,
    `   ${breakdown.disputeTypeReason}`,
    ``,
    `2. Key Facts: ${breakdown.factCountScore} points`,
    `   ${breakdown.factCountReason}`,
    ``,
    `3. Evidence: ${breakdown.evidenceScore} points`,
    `   ${breakdown.evidenceReason}`,
    ``,
    `4. Desired Outcome: ${breakdown.outcomeScore} points`,
    `   ${breakdown.outcomeReason}`,
    ``,
    `---`,
    `Total Score: ${breakdown.totalScore}`,
    `Threshold: ${breakdown.threshold}`,
    `Classification: ${breakdown.classification}`,
  ];

  return lines.join("\n");
}
