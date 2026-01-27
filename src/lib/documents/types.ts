/**
 * Document Generation System - Type Definitions
 * Phase 7.2 Block 3A
 * 
 * Note: These are computed in-memory types, NOT database models yet.
 */

// ============================================================================
// Core Types
// ============================================================================

export type CaseComplexity = "SIMPLE" | "COMPLEX";

export type DocumentStructureType = "SINGLE_LETTER" | "MULTI_DOCUMENT_DOCKET";

/**
 * Extensible document type system
 * Can add new types without enum explosion
 */
export type DocumentType = string;

// Common document types (not exhaustive)
export const DOCUMENT_TYPES = {
  FORMAL_LETTER: "FORMAL_LETTER",
  EVIDENCE_SCHEDULE: "EVIDENCE_SCHEDULE",
  TIMELINE: "TIMELINE",
  WITNESS_STATEMENT: "WITNESS_STATEMENT",
  STATUTORY_DECLARATION: "STATUTORY_DECLARATION",
  APPEAL_FORM: "APPEAL_FORM",
  COVER_LETTER: "COVER_LETTER",
} as const;

export type DocumentStatus = "PENDING" | "GENERATING" | "COMPLETED" | "FAILED";

// ============================================================================
// Document Plan
// ============================================================================

/**
 * Document Plan - computed in memory, not persisted yet
 */
export type DocumentPlan = {
  // Classification
  complexity: CaseComplexity;
  complexityScore: number;
  complexityBreakdown: ComplexityBreakdown;

  // Document structure
  documentType: DocumentStructureType;
  documents: PlannedDocument[];
};

/**
 * Breakdown of how complexity score was calculated
 * Provides transparency and debugging capability
 * 
 * Version field tracks algorithm changes over time
 */
export type ComplexityBreakdown = {
  version: string; // Algorithm version (e.g., "1.0")
  
  disputeTypeScore: number;
  disputeTypeReason: string;

  factCountScore: number;
  factCountReason: string;

  evidenceScore: number;
  evidenceReason: string;

  outcomeScore: number;
  outcomeReason: string;

  totalScore: number;
  threshold: number;
  classification: CaseComplexity;
};

/**
 * Individual document in the plan
 */
export type PlannedDocument = {
  type: DocumentType;
  title: string;
  description: string;
  order: number;
  required: boolean;
};

// ============================================================================
// Configuration
// ============================================================================

/**
 * Complexity scoring configuration
 * Allows tuning thresholds without code changes
 */
export type ComplexityConfig = {
  // Threshold for SIMPLE vs COMPLEX classification
  complexityThreshold: number;

  // Dispute type weights
  disputeTypeWeights: Record<string, number>;

  // Fact count scoring rules
  factScoring: {
    none: number; // 0 facts
    low: { max: number; score: number }; // 1-3 facts
    medium: { max: number; score: number }; // 4-6 facts
    high: { score: number }; // 7+ facts
  };

  // Evidence count scoring rules
  evidenceScoring: {
    none: number; // 0 evidence
    low: { max: number; score: number }; // 1-2 evidence
    medium: { max: number; score: number }; // 3-4 evidence
    high: { score: number }; // 5+ evidence
  };

  // Outcome complexity classification weights
  outcomeWeights: {
    simple: number;
    medium: number;
    complex: number;
  };
};

/**
 * Default complexity configuration
 * Can be overridden via environment variables or database settings
 */
export const DEFAULT_COMPLEXITY_CONFIG: ComplexityConfig = {
  complexityThreshold: 10,

  disputeTypeWeights: {
    parking_ticket: 1,
    speeding_ticket: 2,
    consumer: 3,
    flight_delay: 3,
    landlord: 5,
    employment: 6,
    benefits: 7,
    immigration: 8,
    other: 4,
  },

  factScoring: {
    none: 0,
    low: { max: 3, score: 1 },
    medium: { max: 6, score: 2 },
    high: { score: 4 },
  },

  evidenceScoring: {
    none: 0,
    low: { max: 2, score: 1 },
    medium: { max: 4, score: 2 },
    high: { score: 3 },
  },

  outcomeWeights: {
    simple: 1,
    medium: 2,
    complex: 3,
  },
};

// ============================================================================
// Validation
// ============================================================================

/**
 * Strategy completeness requirements
 */
export type StrategyCompleteness = {
  isComplete: boolean;
  missingFields: string[];
  reason: string;
};

/**
 * Input for plan computation
 */
export type CaseStrategyInput = {
  disputeType: string | null;
  keyFacts: string[];
  evidenceMentioned: string[];
  desiredOutcome: string | null;
};
