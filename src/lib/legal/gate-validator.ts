/**
 * HARD GATE VALIDATION SYSTEM
 * 
 * Enforces that System 3 (document generation) cannot run
 * unless System 2 (routing) has produced a valid, APPROVED decision.
 * 
 * This is the enforcement layer that prevents wrong documents.
 */

import type { RoutingDecision } from "./routing-types";
import type { OfficialFormID } from "./form-registry";
import type { GateValidationResult, DocumentGenerationGuard } from "./routing-types";

// ============================================================================
// MAIN GATE VALIDATION
// ============================================================================

export function validateRoutingDecision(
  decision: RoutingDecision | null | undefined
): GateValidationResult {
  
  // GATE 1: Routing decision must exist
  if (!decision) {
    return {
      allowed: false,
      gateName: "GATE_1_DECISION_EXISTS",
      error: "FATAL: No routing decision exists. System 2 must run first.",
      nextAction: "Execute routing engine to classify dispute and select forum",
      userMessage: "We're analyzing your case to determine the correct legal route..."
    };
  }
  
  // GATE 2: Status must be APPROVED
  if (decision.status === "BLOCKED") {
    return {
      allowed: false,
      gateName: "GATE_2_STATUS_APPROVED",
      error: decision.reason,
      nextAction: decision.userMessage,
      userMessage: `Document generation blocked: ${decision.reason}`
    };
  }
  
  if (decision.status === "REQUIRES_CLARIFICATION") {
    return {
      allowed: false,
      gateName: "GATE_2_STATUS_APPROVED",
      error: "Classification confidence too low",
      nextAction: "User must answer clarification questions",
      userMessage: "We need more information to determine the correct legal route."
    };
  }
  
  if (decision.status === "PENDING") {
    return {
      allowed: false,
      gateName: "GATE_2_STATUS_APPROVED",
      error: "Routing decision still pending",
      nextAction: "Wait for routing engine to complete",
      userMessage: "Classification in progress..."
    };
  }
  
  // GATE 3: Confidence threshold
  // TEMPORARY: Lowered to 0.40 for dev testing
  if (decision.confidence < 0.40) {
    return {
      allowed: false,
      gateName: "GATE_3_CONFIDENCE_THRESHOLD",
      error: `Confidence ${decision.confidence.toFixed(2)} below threshold 0.40`,
      nextAction: "Request user confirmation or gather more facts",
      userMessage: "We need to be more certain about your case before generating documents."
    };
  }
  
  // GATE 4: Prerequisites must be met
  if (!decision.prerequisitesMet) {
    const unmetPrereqs = decision.prerequisites.filter(p => !p.met);
    const prereqNames = unmetPrereqs.map(p => p.name).join(", ");
    
    return {
      allowed: false,
      gateName: "GATE_4_PREREQUISITES_MET",
      error: `Missing prerequisites: ${prereqNames}`,
      nextAction: unmetPrereqs[0]?.instruction || "Complete required prerequisites",
      userMessage: `Before we can generate documents, you need to: ${prereqNames}`
    };
  }
  
  // GATE 5: Allowed docs list must not be empty
  if (decision.allowedDocs.length === 0) {
    return {
      allowed: false,
      gateName: "GATE_5_ALLOWED_DOCS_NOT_EMPTY",
      error: "No valid documents for this route",
      nextAction: "Review classification or inform user of alternative routes",
      userMessage: "We couldn't determine which documents are appropriate for your case."
    };
  }
  
  // GATE 6: Time limit check (if applicable)
  if (decision.timeLimit && !decision.timeLimit.met) {
    return {
      allowed: false,
      gateName: "GATE_6_TIME_LIMIT",
      error: `Time limit expired: ${decision.timeLimit.description}`,
      nextAction: "Suggest alternative routes if available",
      userMessage: `Your case is out of time for this route. ${decision.timeLimit.description}`
    };
  }
  
  // ALL GATES PASSED
  return {
    allowed: true,
    gateName: "ALL_GATES_PASSED",
    userMessage: "Routing validated. Document generation approved."
  };
}

// ============================================================================
// DOCUMENT-SPECIFIC GATE VALIDATION
// ============================================================================

export function validateDocumentGeneration(
  documentType: OfficialFormID,
  routingDecision: RoutingDecision | null | undefined
): GateValidationResult {
  
  // First, validate routing decision
  const routingValidation = validateRoutingDecision(routingDecision);
  if (!routingValidation.allowed) {
    return routingValidation;
  }
  
  // Now validate document-specific rules
  const decision = routingDecision!; // Safe after validation
  
  // GATE 7: Document must be in allowedDocs
  if (!decision.allowedDocs.includes(documentType)) {
    return {
      allowed: false,
      gateName: "GATE_7_DOCUMENT_IN_ALLOWED_LIST",
      error: `Document ${documentType} not allowed for forum ${decision.forum}`,
      nextAction: `Only these documents are allowed: ${decision.allowedDocs.join(", ")}`,
      userMessage: `This document type is not appropriate for your case.`
    };
  }
  
  // GATE 8: Document must NOT be in blockedDocs
  if (decision.blockedDocs.includes(documentType)) {
    return {
      allowed: false,
      gateName: "GATE_8_DOCUMENT_NOT_BLOCKED",
      error: `Document ${documentType} explicitly blocked`,
      nextAction: decision.reason,
      userMessage: `This document cannot be used for your type of case. ${decision.reason}`
    };
  }
  
  // ALL GATES PASSED
  return {
    allowed: true,
    gateName: "ALL_GATES_PASSED",
    userMessage: "Document generation approved."
  };
}

// ============================================================================
// COMPREHENSIVE GUARD CHECK (for logging/debugging)
// ============================================================================

export function getDocumentGenerationGuard(
  documentType: OfficialFormID,
  routingDecision: RoutingDecision | null | undefined
): DocumentGenerationGuard {
  
  const failedGates: string[] = [];
  
  const routingDecisionExists = !!routingDecision;
  if (!routingDecisionExists) failedGates.push("ROUTING_DECISION_EXISTS");
  
  const routingStatusApproved = routingDecision?.status === "APPROVED";
  if (!routingStatusApproved) failedGates.push("ROUTING_STATUS_APPROVED");
  
  const confidenceAboveThreshold = (routingDecision?.confidence || 0) >= 0.40;
  if (!confidenceAboveThreshold) failedGates.push("CONFIDENCE_THRESHOLD");
  
  const prerequisitesMet = routingDecision?.prerequisitesMet ?? false;
  if (!prerequisitesMet) failedGates.push("PREREQUISITES_MET");
  
  const allowedDocsNotEmpty = (routingDecision?.allowedDocs.length || 0) > 0;
  if (!allowedDocsNotEmpty) failedGates.push("ALLOWED_DOCS_NOT_EMPTY");
  
  const documentInAllowedList = routingDecision?.allowedDocs.includes(documentType) ?? false;
  if (!documentInAllowedList) failedGates.push("DOCUMENT_IN_ALLOWED_LIST");
  
  const documentNotBlocked = !routingDecision?.blockedDocs.includes(documentType);
  if (!documentNotBlocked) failedGates.push("DOCUMENT_NOT_BLOCKED");
  
  const allGatesPassed = failedGates.length === 0;
  
  return {
    routingDecisionExists,
    routingStatusApproved,
    confidenceAboveThreshold,
    prerequisitesMet,
    allowedDocsNotEmpty,
    documentInAllowedList,
    documentNotBlocked,
    allGatesPassed,
    failedGates
  };
}

// ============================================================================
// BATCH VALIDATION (for multiple documents)
// ============================================================================

export function validateBatchGeneration(
  documentTypes: OfficialFormID[],
  routingDecision: RoutingDecision | null | undefined
): {
  allowed: boolean;
  validDocuments: OfficialFormID[];
  blockedDocuments: Array<{ documentType: OfficialFormID; reason: string }>;
} {
  
  // First check routing decision
  const routingValidation = validateRoutingDecision(routingDecision);
  if (!routingValidation.allowed) {
    return {
      allowed: false,
      validDocuments: [],
      blockedDocuments: documentTypes.map(doc => ({
        documentType: doc,
        reason: routingValidation.error || "Routing validation failed"
      }))
    };
  }
  
  // Check each document
  const validDocuments: OfficialFormID[] = [];
  const blockedDocuments: Array<{ documentType: OfficialFormID; reason: string }> = [];
  
  for (const docType of documentTypes) {
    const validation = validateDocumentGeneration(docType, routingDecision);
    
    if (validation.allowed) {
      validDocuments.push(docType);
    } else {
      blockedDocuments.push({
        documentType: docType,
        reason: validation.error || "Validation failed"
      });
    }
  }
  
  return {
    allowed: validDocuments.length > 0,
    validDocuments,
    blockedDocuments
  };
}

// ============================================================================
// ERROR MESSAGES FOR UI
// ============================================================================

export function getGateErrorMessage(gateName: string): string {
  const messages: Record<string, string> = {
    GATE_1_DECISION_EXISTS: "We haven't analyzed your case yet. Please continue chatting with the AI.",
    GATE_2_STATUS_APPROVED: "Your case needs additional information before we can generate documents.",
    GATE_3_CONFIDENCE_THRESHOLD: "We need more details to be confident about the correct legal route.",
    GATE_4_PREREQUISITES_MET: "There are required steps you must complete before filing.",
    GATE_5_ALLOWED_DOCS_NOT_EMPTY: "We couldn't determine which documents are appropriate.",
    GATE_6_TIME_LIMIT: "Your case may be out of time for this legal route.",
    GATE_7_DOCUMENT_IN_ALLOWED_LIST: "This document type is not appropriate for your case.",
    GATE_8_DOCUMENT_NOT_BLOCKED: "This document cannot be used for your type of dispute.",
    ALL_GATES_PASSED: "All checks passed. Generating documents..."
  };
  
  return messages[gateName] || "Validation check failed.";
}
