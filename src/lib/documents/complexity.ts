/**
 * Case Complexity Scoring System
 * Determines document complexity and types based on case characteristics
 */

import type { CaseStrategy } from "@prisma/client";

export type ComplexityLevel = "LOW" | "MEDIUM" | "HIGH";
export type DocumentStructureType = "BASIC" | "INTERMEDIATE" | "COMPREHENSIVE";

interface ComplexityScore {
  level: ComplexityLevel;
  score: number; // 0-100
  breakdown: {
    factCount: number;
    evidenceCount: number;
    disputeType: number;
    outcomeComplexity: number;
  };
  documentStructure: DocumentStructureType;
  recommendedDocuments: string[];
}

export function calculateComplexity(
  strategy: CaseStrategy,
  evidenceCount: number
): ComplexityScore {
  // DEV MODE: Boost scores for faster testing
  const DEV_MODE = process.env.NODE_ENV === "development";
  const devBoost = DEV_MODE ? 20 : 0; // Add 20 points in dev mode
  
  let score = devBoost;
  const breakdown = {
    factCount: 0,
    evidenceCount: 0,
    disputeType: 0,
    outcomeComplexity: 0,
  };

  // 1. Fact count (0-30 points)
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  if (facts.length >= 10) {
    breakdown.factCount = 30;
  } else if (facts.length >= 5) {
    breakdown.factCount = 20;
  } else {
    breakdown.factCount = 10;
  }
  score += breakdown.factCount;

  // 2. Evidence count (0-25 points)
  if (evidenceCount >= 5) {
    breakdown.evidenceCount = 25;
  } else if (evidenceCount >= 2) {
    breakdown.evidenceCount = 15;
  } else if (evidenceCount >= 1) {
    breakdown.evidenceCount = 5;
  }
  score += breakdown.evidenceCount;

  // 3. Dispute type complexity (0-25 points)
  const complexDisputeTypes = ["employment", "contract", "property"];
  const mediumDisputeTypes = ["consumer", "debt"];
  
  if (strategy.disputeType && complexDisputeTypes.includes(strategy.disputeType.toLowerCase())) {
    breakdown.disputeType = 25;
  } else if (strategy.disputeType && mediumDisputeTypes.includes(strategy.disputeType.toLowerCase())) {
    breakdown.disputeType = 15;
  } else {
    breakdown.disputeType = 10;
  }
  score += breakdown.disputeType;

  // 4. Outcome complexity (0-20 points)
  const outcomeLength = (strategy.desiredOutcome || "").length;
  if (outcomeLength > 200) {
    breakdown.outcomeComplexity = 20;
  } else if (outcomeLength > 100) {
    breakdown.outcomeComplexity = 15;
  } else if (outcomeLength > 50) {
    breakdown.outcomeComplexity = 10;
  } else {
    breakdown.outcomeComplexity = 5;
  }
  score += breakdown.outcomeComplexity;

  // Determine complexity level
  let level: ComplexityLevel;
  let documentStructure: DocumentStructureType;

  if (score >= 70) {
    level = "HIGH";
    documentStructure = "COMPREHENSIVE";
  } else if (score >= 40) {
    level = "MEDIUM";
    documentStructure = "INTERMEDIATE";
  } else {
    level = "LOW";
    documentStructure = "BASIC";
  }

  // Recommend documents based on complexity and dispute type
  const recommendedDocuments = getRecommendedDocuments(
    strategy.disputeType || "general",
    level
  );

  return {
    level,
    score,
    breakdown,
    documentStructure,
    recommendedDocuments,
  };
}

function getRecommendedDocuments(
  disputeType: string,
  complexity: ComplexityLevel
): string[] {
  const baseDocuments = ["case_summary", "demand_letter"];
  
  const typeSpecific: Record<string, string[]> = {
    employment: ["employment_claim", "grievance_letter", "evidence_bundle"],
    contract: ["breach_notice", "damages_calculation", "evidence_bundle"],
    consumer: ["complaint_letter", "ccj_response", "evidence_bundle"],
    property: ["dispute_notice", "claim_form", "evidence_bundle"],
    debt: ["debt_validation", "dispute_letter", "statute_barred_notice"],
    parking: ["appeal_letter", "witness_statement"],
  };

  const specific = typeSpecific[disputeType.toLowerCase()] || ["evidence_bundle"];
  
  // For high complexity, include all documents
  if (complexity === "HIGH") {
    return [...baseDocuments, ...specific, "witness_statement", "chronology"];
  }
  
  // For medium, include some extras
  if (complexity === "MEDIUM") {
    return [...baseDocuments, ...specific.slice(0, 2)];
  }
  
  // For low, just basics + one specific
  return [...baseDocuments, specific[0]];
}
