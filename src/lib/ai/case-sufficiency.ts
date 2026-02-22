/**
 * Phase 8.6 - Case Sufficiency Check (HARD STOP)
 * 
 * This module determines when a case has enough information to proceed
 * to document generation WITHOUT further questions.
 * 
 * This is NOT a prompt suggestion - this is a HARD GATE that blocks
 * the AI from asking more questions once sufficiency is met.
 */

import type { CaseStrategy } from "@/types/chat";

export interface SufficiencyCheck {
  isSufficient: boolean;
  reason?: string;
  missingItems: string[];
  score: number; // 0-100
}

export interface CaseSufficiencyInput {
  strategy: CaseStrategy | null;
  evidenceCount: number;
  requiredEvidenceTypes: string[];
  uploadedEvidenceTypes: string[];
}

/**
 * CORE SUFFICIENCY RULES
 * 
 * A case is SUFFICIENT when ALL of these are true:
 * 1. Dispute type is identified
 * 2. Counterparty is known
 * 3. Amount/outcome is stated
 * 4. At least ONE clear breach/issue is described
 * 5. Required evidence is uploaded (if any)
 */
export function checkCaseSufficiency(input: CaseSufficiencyInput): SufficiencyCheck {
  const { strategy, evidenceCount, requiredEvidenceTypes, uploadedEvidenceTypes } = input;
  
  const missingItems: string[] = [];
  let score = 0;

  // Rule 1: Dispute type identified (25 points)
  if (!strategy?.disputeType || strategy.disputeType === "unknown") {
    missingItems.push("dispute type");
  } else {
    score += 25;
  }

  // Rule 2: Key facts exist (25 points)
  const keyFacts = Array.isArray(strategy?.keyFacts) ? strategy.keyFacts : [];
  if (keyFacts.length === 0) {
    missingItems.push("facts about what happened");
  } else {
    score += 25;
  }

  // Rule 3: Desired outcome stated (25 points)
  if (!strategy?.desiredOutcome || strategy.desiredOutcome.length < 10) {
    missingItems.push("desired outcome");
  } else {
    score += 25;
  }

  // Rule 4: Evidence requirement met (25 points)
  // CRITICAL: For most dispute types, evidence is ALWAYS required
  const disputeType = strategy?.disputeType?.toLowerCase() || "";
  const evidenceAlwaysRequired = [
    "employment",
    "landlord",
    "consumer",
    "parking",
    "debt",
    "contract",
    "unpaid",
    "payment",
    "breach"
  ];
  
  const requiresEvidence = evidenceAlwaysRequired.some(type => 
    disputeType.includes(type)
  );

  if (requiresEvidence) {
    // Evidence is MANDATORY for this case type
    if (evidenceCount === 0) {
      missingItems.push("evidence upload");
      // Do NOT give points without evidence
    } else {
      score += 25;
    }
  } else {
    // Only for very simple cases (rare)
    if (evidenceCount > 0) {
      score += 25;
    } else {
      // Even if not strictly required, prefer to have evidence
      missingItems.push("evidence upload (recommended)");
    }
  }

  const isSufficient = score >= 100;

  return {
    isSufficient,
    missingItems,
    score,
    reason: isSufficient 
      ? "Case has all required information"
      : `Missing: ${missingItems.join(", ")}`
  };
}

/**
 * Determines if the AI should STOP asking questions
 * 
 * This is the HARD GATE that prevents conversational loops.
 */
export function shouldStopGathering(sufficiency: SufficiencyCheck): boolean {
  return sufficiency.isSufficient;
}

/**
 * Gets the final confirmation message when case is sufficient
 * 
 * This is the ONLY message format allowed when transitioning to document generation.
 */
export function getFinalConfirmationMessage(): string {
  return "Thanks — I have everything I need.\n\nI'm now preparing your documents.\n\nYou don't need to do anything further.";
}

/**
 * Checks if a question is a "lawyer question" that should NOT be asked
 * 
 * These are questions that re-interrogate facts the user already stated.
 */
export function isLawyerQuestion(message: string): boolean {
  const forbiddenPatterns = [
    /what (specific )?breach/i,
    /how do you justify/i,
    /specify the legal basis/i,
    /what legal grounds/i,
    /what is the breach/i,
    /justify your claim/i,
    /what breach are you claiming/i,
  ];

  return forbiddenPatterns.some(pattern => pattern.test(message));
}

/**
 * Validates if an AI response is allowed given the current case state
 */
export function validateAIResponse(
  response: string,
  sufficiency: SufficiencyCheck
): { allowed: boolean; reason?: string } {
  // If case is sufficient, only allow final confirmation
  if (sufficiency.isSufficient) {
    const isFinalMessage = response.includes("I have everything I need") ||
                          response.includes("preparing your documents");
    
    if (!isFinalMessage) {
      return {
        allowed: false,
        reason: "Case is sufficient - only final confirmation allowed"
      };
    }
  }

  // Never allow lawyer questions
  if (isLawyerQuestion(response)) {
    return {
      allowed: false,
      reason: "Lawyer questions are forbidden - user already explained in plain English"
    };
  }

  return { allowed: true };
}
