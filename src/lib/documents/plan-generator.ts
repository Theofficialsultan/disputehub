/**
 * Document Plan Generator
 * Phase 7.2 Block 3A
 * 
 * Main entry point for computing document plans
 * Orchestrates validation, scoring, and routing
 */

import type {
  CaseStrategyInput,
  DocumentPlan,
  ComplexityConfig,
} from "./types";
import { DEFAULT_COMPLEXITY_CONFIG } from "./types";
import { validateStrategyCompleteness } from "./validation";
import { calculateComplexityScore } from "./complexity-scoring";
import { determineDocumentStructure, routeDocuments } from "./routing";

/**
 * Compute document plan from strategy
 * 
 * This is the main function that:
 * 1. Validates strategy completeness
 * 2. Calculates complexity score
 * 3. Routes documents based on complexity and type
 * 4. Returns complete plan (in-memory, not persisted)
 * 
 * @throws Error if strategy is incomplete
 */
export function computeDocumentPlan(
  strategy: CaseStrategyInput,
  config: ComplexityConfig = DEFAULT_COMPLEXITY_CONFIG
): DocumentPlan {
  // Step 1: Validate strategy completeness
  const validation = validateStrategyCompleteness(strategy);

  if (!validation.isComplete) {
    throw new Error(
      `Cannot generate document plan: ${validation.reason}`
    );
  }

  // Step 2: Calculate complexity score with breakdown
  const complexityBreakdown = calculateComplexityScore(strategy, config);

  // Step 3: Determine document structure type
  const documentType = determineDocumentStructure(
    complexityBreakdown.classification
  );

  // Step 4: Route documents based on complexity and dispute type
  const documents = routeDocuments(strategy, complexityBreakdown.classification);

  // Step 5: Build complete plan
  const plan: DocumentPlan = {
    complexity: complexityBreakdown.classification,
    complexityScore: complexityBreakdown.totalScore,
    complexityBreakdown,
    documentType,
    documents,
  };

  return plan;
}

/**
 * Compute plan and return result with validation info
 * 
 * Non-throwing version that returns success/error status
 */
export function tryComputeDocumentPlan(
  strategy: CaseStrategyInput,
  config: ComplexityConfig = DEFAULT_COMPLEXITY_CONFIG
): {
  success: boolean;
  plan?: DocumentPlan;
  error?: string;
  validation?: ReturnType<typeof validateStrategyCompleteness>;
} {
  try {
    // Validate first
    const validation = validateStrategyCompleteness(strategy);

    if (!validation.isComplete) {
      return {
        success: false,
        error: validation.reason,
        validation,
      };
    }

    // Compute plan
    const plan = computeDocumentPlan(strategy, config);

    return {
      success: true,
      plan,
      validation,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get a summary of the plan for logging/debugging
 */
export function summarizePlan(plan: DocumentPlan): string {
  const lines = [
    `Document Plan Summary:`,
    ``,
    `Complexity: ${plan.complexity} (score: ${plan.complexityScore})`,
    `Structure: ${plan.documentType}`,
    `Documents: ${plan.documents.length} total`,
    ``,
    `Documents:`,
  ];

  plan.documents.forEach((doc) => {
    const requiredLabel = doc.required ? "[REQUIRED]" : "[OPTIONAL]";
    lines.push(`  ${doc.order}. ${doc.title} ${requiredLabel}`);
    lines.push(`     ${doc.description}`);
  });

  return lines.join("\n");
}
