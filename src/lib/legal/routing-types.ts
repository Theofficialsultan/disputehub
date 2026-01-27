/**
 * SYSTEM 2: ROUTING DECISION TYPES
 * 
 * TypeScript types for jurisdiction classification, forum selection,
 * and routing decisions. These types enforce the hard-gated architecture.
 */

import type { OfficialFormID } from "./form-registry";

// ============================================================================
// ROUTING STATUS & DECISION
// ============================================================================

export type RoutingStatus = "APPROVED" | "BLOCKED" | "REQUIRES_CLARIFICATION" | "PENDING";

export type BlockType =
  | "missing_prerequisite"
  | "out_of_time"
  | "no_jurisdiction"
  | "insufficient_information"
  | "requires_specialist"
  | "invalid_classification";

export interface Prerequisite {
  id: string;
  name: string;
  met: boolean;
  instruction?: string;
  dueDate?: Date;
}

export interface AlternativeRoute {
  forum: string;
  description: string;
  allowedDocs: OfficialFormID[];
  conditions: string[];
  confidence: number;
}

export interface RoutingDecision {
  // Status
  status: RoutingStatus;
  confidence: number;
  
  // Classification
  jurisdiction: Jurisdiction;
  relationship: LegalRelationship;
  counterparty: CounterpartyType;
  domain: DisputeDomain;
  
  // Forum Selection
  forum: LegalForum;
  forumReasoning: string;
  
  // Document Control
  allowedDocs: OfficialFormID[];
  blockedDocs: OfficialFormID[];
  
  // Prerequisites
  prerequisites: Prerequisite[];
  prerequisitesMet: boolean;
  
  // Time Limits
  timeLimit?: {
    deadline: Date;
    daysRemaining: number;
    met: boolean;
    description: string;
  };
  
  // Reasoning & Explanation
  reason: string;
  userMessage: string;
  
  // Alternative Routes (if applicable)
  alternativeRoutes?: AlternativeRoute[];
  
  // Metadata
  classifiedAt: Date;
  classifiedBy: "claude-opus-4" | "gpt-4o";
}

export interface BlockedRoutingDecision extends Omit<RoutingDecision, "status"> {
  status: "BLOCKED";
  blockType: BlockType;
  nextAction: string;
  canResolve: boolean;
  resolutionSteps?: string[];
}

// ============================================================================
// CLASSIFICATION TYPES
// ============================================================================

export type Jurisdiction =
  | "england_wales"
  | "scotland"
  | "northern_ireland"
  | "uk_wide";

export type LegalRelationship =
  // Employment
  | "employee"
  | "worker"
  | "self_employed"
  | "job_applicant"
  // Housing
  | "assured_tenant"
  | "assured_shorthold_tenant"
  | "secure_tenant"
  | "lodger"
  | "licensee"
  // Consumer
  | "consumer"
  | "business_to_business"
  // Regulatory
  | "benefit_claimant"
  | "taxpayer"
  | "visa_applicant"
  | "driver"
  | "passenger"
  // General
  | "creditor"
  | "debtor"
  | "complainant"
  | "accused";

export type CounterpartyType =
  | "private_company"
  | "sole_trader"
  | "partnership"
  | "government_body"
  | "public_body"
  | "local_authority"
  | "individual"
  | "charity"
  | "unknown";

export type DisputeDomain =
  | "employment"
  | "housing"
  | "social_security"
  | "tax"
  | "immigration"
  | "consumer"
  | "contract"
  | "debt"
  | "traffic_offence"
  | "parking"
  | "flight_delay"
  | "insurance"
  | "financial_services"
  | "discrimination"
  | "personal_injury"
  | "property"
  | "other";

export type LegalForum =
  // Tribunals
  | "employment_tribunal"
  | "first_tier_tribunal_sscs"
  | "first_tier_tribunal_property"
  | "first_tier_tribunal_tax"
  | "first_tier_tribunal_immigration"
  // Courts
  | "county_court"
  | "county_court_small_claims"
  | "county_court_fast_track"
  | "magistrates_court"
  | "high_court"
  // Alternative Dispute Resolution
  | "financial_ombudsman"
  | "housing_ombudsman"
  | "local_government_ombudsman"
  | "pensions_ombudsman"
  // Regulatory Bodies
  | "acas_conciliation"
  | "popla_parking_appeal"
  | "ias_parking_appeal"
  | "tec_traffic_appeal"
  | "airline_adr"
  // Government Departments
  | "dwp_mandatory_reconsideration"
  | "hmrc_statutory_review"
  | "home_office_admin_review"
  // Pre-Action
  | "pre_action_protocol"
  | "informal_resolution";

// ============================================================================
// CLASSIFICATION INPUT
// ============================================================================

export interface ClassificationInput {
  caseId: string;
  caseTitle: string;
  keyFacts: string[];
  disputeType: string | null;
  desiredOutcome: string;
  evidenceCount: number;
  evidenceTypes: string[];
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  action: "SUCCESS" | "GENERATE_WITH_WARNINGS" | "FAIL_GENERATION";
}

export interface DocumentValidationResult extends ValidationResult {
  formId: OfficialFormID;
  validatedAt: Date;
  sectionResults: SectionValidationResult[];
  structureResults: StructureValidationResult[];
}

export interface SectionValidationResult {
  sectionName: string;
  found: boolean;
  length: number;
  errors: string[];
  warnings: string[];
}

export interface StructureValidationResult {
  checkType: string;
  passed: boolean;
  errorMessage?: string;
}

// ============================================================================
// CASE PHASE TYPES
// ============================================================================

export type CasePhase =
  | "gathering"      // AI asking questions
  | "routing"        // System 2 running
  | "generating"     // System 3 running
  | "completed"      // Documents ready
  | "blocked";       // Cannot proceed

export interface PhaseTransition {
  from: CasePhase;
  to: CasePhase;
  reason: string;
  timestamp: Date;
  triggeredBy: "system" | "user";
}

// ============================================================================
// HARD GATE VALIDATION
// ============================================================================

export interface GateValidationResult {
  allowed: boolean;
  gateName: string;
  error?: string;
  nextAction?: string;
  userMessage?: string;
}

export interface DocumentGenerationGuard {
  routingDecisionExists: boolean;
  routingStatusApproved: boolean;
  confidenceAboveThreshold: boolean;
  prerequisitesMet: boolean;
  allowedDocsNotEmpty: boolean;
  documentInAllowedList: boolean;
  documentNotBlocked: boolean;
  allGatesPassed: boolean;
  failedGates: string[];
}

// ============================================================================
// SYSTEM 2 RESPONSE
// ============================================================================

export interface System2Response {
  success: boolean;
  decision?: RoutingDecision;
  error?: string;
  requiresClarification?: {
    questions: string[];
    currentConfidence: number;
  };
}

// ============================================================================
// HELPER TYPE GUARDS
// ============================================================================

export function isBlockedDecision(
  decision: RoutingDecision
): decision is BlockedRoutingDecision {
  return decision.status === "BLOCKED";
}

export function isApprovedDecision(
  decision: RoutingDecision
): decision is RoutingDecision & { status: "APPROVED" } {
  return decision.status === "APPROVED";
}

export function requiresClarification(
  decision: RoutingDecision
): boolean {
  return decision.status === "REQUIRES_CLARIFICATION" || decision.confidence < 0.80;
}
