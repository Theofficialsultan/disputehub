/**
 * Document Generation System - Main Export
 * Phase 7.2 Block 3A + 3B
 * 
 * Central export point for document plan computation and persistence
 */

// Types
export type {
  CaseComplexity,
  DocumentStructureType,
  DocumentType,
  DocumentStatus,
  DocumentPlan,
  ComplexityBreakdown,
  PlannedDocument,
  ComplexityConfig,
  StrategyCompleteness,
  CaseStrategyInput,
} from "./types";

export { DOCUMENT_TYPES, DEFAULT_COMPLEXITY_CONFIG } from "./types";

// Validation
export {
  validateStrategyCompleteness,
  getStrategyCompletionStatus,
} from "./validation";

// Outcome Classification
export {
  classifyOutcomeComplexity,
  explainOutcomeClassification,
  getOutcomeScore,
} from "./outcome-classifier";

// Complexity Scoring
export {
  calculateComplexityScore,
  formatComplexityBreakdown,
} from "./complexity-scoring";

// Document Routing
export {
  determineDocumentStructure,
  routeDocuments,
  getDocumentSummary,
} from "./routing";

// Plan Generation (main entry point)
export {
  computeDocumentPlan,
  tryComputeDocumentPlan,
  summarizePlan,
} from "./plan-generator";

// Persistence (Block 3B)
export {
  persistDocumentPlan,
  getPersistedDocumentPlan,
  documentPlanExists,
  deleteDocumentPlan,
} from "./persistence";
