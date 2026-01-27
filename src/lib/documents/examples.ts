/**
 * Document Plan Computation - Usage Examples
 * 
 * This file demonstrates how to use the document plan computation system
 */

import {
  tryComputeDocumentPlan,
  validateStrategyCompleteness,
  calculateComplexityScore,
  formatComplexityBreakdown,
  summarizePlan,
  DEFAULT_COMPLEXITY_CONFIG,
} from "@/lib/documents";
import type { CaseStrategyInput } from "@/lib/documents";

// ============================================================================
// Example 1: Simple Parking Ticket
// ============================================================================

const simpleParkingTicket: CaseStrategyInput = {
  disputeType: "parking_ticket",
  keyFacts: [
    "Parked at 2pm on residential street",
    "No visible signage",
    "Photo shows faded lines",
  ],
  evidenceMentioned: ["Photo of parking spot"],
  desiredOutcome: "Get ticket cancelled",
};

console.log("=== Example 1: Simple Parking Ticket ===\n");

// Step 1: Validate completeness
const validation1 = validateStrategyCompleteness(simpleParkingTicket);
console.log("Validation:", validation1);
console.log();

// Step 2: Calculate complexity
const complexity1 = calculateComplexityScore(
  simpleParkingTicket,
  DEFAULT_COMPLEXITY_CONFIG
);
console.log(formatComplexityBreakdown(complexity1));
console.log();

// Step 3: Compute full plan
const result1 = tryComputeDocumentPlan(simpleParkingTicket);
if (result1.success && result1.plan) {
  console.log(summarizePlan(result1.plan));
}

// ============================================================================
// Example 2: Complex Employment Dispute
// ============================================================================

const complexEmployment: CaseStrategyInput = {
  disputeType: "employment",
  keyFacts: [
    "Dismissed without notice on Jan 5th",
    "No written warning given",
    "Manager shouted in front of colleagues",
    "HR refused to investigate",
    "Documented all incidents in diary",
    "Union rep present at meeting",
    "Requested grievance procedure",
    "Email proof of good performance reviews",
  ],
  evidenceMentioned: [
    "Email from manager",
    "Witness statement from colleague",
    "Diary entries",
    "Performance reviews",
    "Union meeting notes",
  ],
  desiredOutcome: "Unfair dismissal tribunal claim",
};

console.log("\n\n=== Example 2: Complex Employment Dispute ===\n");

const result2 = tryComputeDocumentPlan(complexEmployment);
if (result2.success && result2.plan) {
  console.log(formatComplexityBreakdown(result2.plan.complexityBreakdown));
  console.log();
  console.log(summarizePlan(result2.plan));
}

// ============================================================================
// Example 3: Incomplete Strategy (should fail validation)
// ============================================================================

const incompleteStrategy: CaseStrategyInput = {
  disputeType: "consumer",
  keyFacts: ["Faulty laptop"], // Only 1 fact
  evidenceMentioned: [], // No evidence
  desiredOutcome: "Refund",
};

console.log("\n\n=== Example 3: Incomplete Strategy ===\n");

const result3 = tryComputeDocumentPlan(incompleteStrategy);
if (!result3.success) {
  console.log("❌ Validation Failed:");
  console.log("Error:", result3.error);
  console.log("Validation:", result3.validation);
}

// ============================================================================
// Example 4: Custom Configuration
// ============================================================================

const customConfig = {
  ...DEFAULT_COMPLEXITY_CONFIG,
  complexityThreshold: 8, // Lower threshold (more cases become COMPLEX)
};

console.log("\n\n=== Example 4: Custom Configuration (threshold: 8) ===\n");

const result4 = tryComputeDocumentPlan(simpleParkingTicket, customConfig);
if (result4.success && result4.plan) {
  console.log(`Original threshold (10): ${result1.plan?.complexity}`);
  console.log(`Custom threshold (8): ${result4.plan.complexity}`);
  console.log(`Score: ${result4.plan.complexityScore}`);
}

// ============================================================================
// Example 5: API Usage
// ============================================================================

async function exampleApiUsage(disputeId: string) {
  const response = await fetch(`/api/disputes/${disputeId}/documents/plan`);
  const data = await response.json();

  if (data.plan) {
    console.log("Document Plan Generated:");
    console.log("- Complexity:", data.plan.complexity);
    console.log("- Score:", data.plan.complexityScore);
    console.log("- Documents:", data.plan.documents.length);
    console.log("\nDocuments:");
    data.plan.documents.forEach((doc: any) => {
      console.log(`  ${doc.order}. ${doc.title} [${doc.required ? "REQUIRED" : "OPTIONAL"}]`);
    });
  } else {
    console.log("No plan available:", data.reason);
  }
}

// Usage: await exampleApiUsage("dispute-id-here");
