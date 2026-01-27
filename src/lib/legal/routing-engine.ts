/**
 * SYSTEM 2: JURISDICTION & PROCEDURE ENGINE
 * 
 * Uses Claude Opus 4 for legal classification and forum selection.
 * Enforces hard rules and blocks invalid routes.
 * 
 * This is the HARD GATE that prevents wrong documents from being generated.
 */

import type {
  ClassificationInput,
  RoutingDecision,
  BlockedRoutingDecision,
  System2Response,
  Prerequisite,
  AlternativeRoute,
} from "./routing-types";
import { OFFICIAL_FORM_IDS, type OfficialFormID } from "./form-registry";

// ============================================================================
// SYSTEM 2 MAIN ENTRY POINT
// ============================================================================

export async function executeRoutingEngine(
  input: ClassificationInput
): Promise<System2Response> {
  
  console.log(`[System 2] Starting routing for case ${input.caseId}`);
  
  try {
    // Stage 2A: Classification
    const classification = await classifyDispute(input);
    
    console.log(`[System 2] Classification:`, {
      relationship: classification.relationship,
      domain: classification.domain,
      confidence: classification.confidence
    });
    
    // Stage 2B: Forum Selection with Hard Rules
    const forumDecision = await selectForum(classification, input);
    
    console.log(`[System 2] Forum selected: ${forumDecision.forum} (${forumDecision.status})`);
    
    // Stage 2C: Document Allowlist/Blocklist
    const routingDecision = await buildRoutingDecision(
      classification,
      forumDecision,
      input
    );
    
    console.log(`[System 2] Routing complete:`, {
      status: routingDecision.status,
      allowedDocs: routingDecision.allowedDocs.length,
      blockedDocs: routingDecision.blockedDocs.length
    });
    
    // Check if clarification needed
    if (routingDecision.confidence < 0.80) {
      return {
        success: false,
        requiresClarification: {
          questions: generateClarificationQuestions(classification),
          currentConfidence: routingDecision.confidence
        }
      };
    }
    
    return {
      success: true,
      decision: routingDecision
    };
    
  } catch (error) {
    console.error(`[System 2] Error:`, error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "Routing engine failed"
    };
  }
}

// ============================================================================
// STAGE 2A: CLASSIFICATION
// ============================================================================

interface Classification {
  jurisdiction: string;
  relationship: string;
  counterparty: string;
  domain: string;
  confidence: number;
  reasoning: string;
}

async function classifyDispute(input: ClassificationInput): Promise<Classification> {
  
  // For now, use rule-based classification with keyword matching
  // TODO: Integrate Claude Opus 4 API for advanced reasoning
  
  const facts = input.keyFacts.join(" ").toLowerCase();
  const title = input.caseTitle.toLowerCase();
  const outcome = input.desiredOutcome.toLowerCase();
  const allText = `${title} ${facts} ${outcome}`;
  
  // Determine jurisdiction
  const jurisdiction = determineJurisdiction(allText);
  
  // Determine legal relationship
  const relationship = determineLegalRelationship(allText, input);
  
  // Determine counterparty
  const counterparty = determineCounterparty(allText);
  
  // Determine domain
  const domain = determineDomain(allText, relationship);
  
  // Calculate confidence
  const confidence = calculateClassificationConfidence(
    relationship,
    domain,
    input.keyFacts.length
  );
  
  return {
    jurisdiction,
    relationship,
    counterparty,
    domain,
    confidence,
    reasoning: `Classified as ${relationship} in ${domain} domain based on keywords and facts.`
  };
}

function determineJurisdiction(text: string): string {
  if (text.includes("scotland") || text.includes("scottish")) {
    return "scotland";
  }
  if (text.includes("northern ireland") || text.includes("belfast")) {
    return "northern_ireland";
  }
  return "england_wales"; // Default
}

function determineLegalRelationship(text: string, input: ClassificationInput): string {
  // Employment status test
  if (text.includes("employee") || text.includes("employed")) {
    // Check for self-employment indicators
    if (text.includes("self-employed") || text.includes("contractor") || 
        text.includes("invoice") || text.includes("ltd") || text.includes("business")) {
      return "self_employed";
    }
    // Check for worker status
    if (text.includes("casual") || text.includes("zero hours") || text.includes("agency")) {
      return "worker";
    }
    return "employee";
  }
  
  // Housing status
  if (text.includes("tenant") || text.includes("landlord") || text.includes("rent")) {
    if (text.includes("council") || text.includes("housing association")) {
      return "secure_tenant";
    }
    if (text.includes("lodger") || text.includes("live with landlord")) {
      return "lodger";
    }
    return "assured_shorthold_tenant";
  }
  
  // Benefits
  if (text.includes("benefit") || text.includes("universal credit") || 
      text.includes("pip") || text.includes("esa") || text.includes("dwp")) {
    return "benefit_claimant";
  }
  
  // Immigration
  if (text.includes("visa") || text.includes("immigration") || text.includes("home office")) {
    return "visa_applicant";
  }
  
  // Tax
  if (text.includes("tax") || text.includes("hmrc") || text.includes("vat")) {
    return "taxpayer";
  }
  
  // Traffic/driving
  if (text.includes("driving") || text.includes("speeding") || text.includes("traffic")) {
    return "driver";
  }
  
  // Consumer
  if (text.includes("bought") || text.includes("purchased") || text.includes("faulty goods")) {
    return "consumer";
  }
  
  // Default to self-employed for unpaid work
  if (text.includes("unpaid") && text.includes("work")) {
    return "self_employed";
  }
  
  return "complainant"; // Generic
}

function determineCounterparty(text: string): string {
  if (text.includes("dwp") || text.includes("hmrc") || text.includes("home office") || 
      text.includes("council")) {
    return "government_body";
  }
  if (text.includes("ltd") || text.includes("limited") || text.includes("plc") || 
      text.includes("company")) {
    return "private_company";
  }
  if (text.includes("nhs") || text.includes("police") || text.includes("school")) {
    return "public_body";
  }
  return "unknown";
}

function determineDomain(text: string, relationship: string): string {
  // Employment
  if (relationship === "employee" || relationship === "worker") {
    return "employment";
  }
  
  // Housing
  if (relationship.includes("tenant") || relationship === "lodger") {
    return "housing";
  }
  
  // Benefits
  if (relationship === "benefit_claimant") {
    return "social_security";
  }
  
  // Immigration
  if (relationship === "visa_applicant") {
    return "immigration";
  }
  
  // Tax
  if (relationship === "taxpayer") {
    return "tax";
  }
  
  // Traffic
  if (relationship === "driver") {
    if (text.includes("parking")) {
      return "parking";
    }
    return "traffic_offence";
  }
  
  // Consumer
  if (relationship === "consumer") {
    return "consumer";
  }
  
  // Contract/debt for self-employed
  if (relationship === "self_employed" && text.includes("unpaid")) {
    return "debt";
  }
  
  return "other";
}

function calculateClassificationConfidence(
  relationship: string,
  domain: string,
  factCount: number
): number {
  let confidence = 0.5; // Base
  
  // Increase confidence based on clear classification
  if (relationship !== "complainant" && relationship !== "unknown") {
    confidence += 0.2;
  }
  
  if (domain !== "other") {
    confidence += 0.2;
  }
  
  // Increase confidence based on fact count
  if (factCount >= 5) {
    confidence += 0.1;
  }
  
  return Math.min(confidence, 0.99);
}

// ============================================================================
// STAGE 2B: FORUM SELECTION WITH HARD RULES
// ============================================================================

interface ForumDecision {
  forum: string;
  status: "APPROVED" | "BLOCKED";
  reason: string;
  prerequisites: Prerequisite[];
  timeLimit?: {
    deadline: Date;
    daysRemaining: number;
    met: boolean;
    description: string;
  };
  blockType?: string;
  alternativeRoutes?: AlternativeRoute[];
}

async function selectForum(
  classification: Classification,
  input: ClassificationInput
): Promise<ForumDecision> {
  
  const { relationship, domain } = classification;
  
  // ============================================================================
  // HARD RULE 1: Employment Tribunal Jurisdiction
  // ============================================================================
  
  if (domain === "employment") {
    if (relationship === "employee" || relationship === "worker") {
      // Check ACAS prerequisite
      const acasPrereq: Prerequisite = {
        id: "acas_ec",
        name: "ACAS Early Conciliation Certificate",
        met: false, // Assume not met unless evidence provided
        instruction: "You must complete ACAS Early Conciliation before filing an ET claim. Visit www.acas.org.uk/early-conciliation"
      };
      
      return {
        forum: "employment_tribunal",
        status: "BLOCKED", // Block until ACAS done
        reason: "Employment Tribunal jurisdiction applies for employees/workers",
        prerequisites: [acasPrereq],
        blockType: "missing_prerequisite"
      };
    }
    
    if (relationship === "self_employed") {
      // NO ET JURISDICTION - must use County Court
      return {
        forum: "county_court_small_claims",
        status: "APPROVED",
        reason: "Self-employed workers cannot use Employment Tribunal. County Court applies for contract/debt disputes.",
        prerequisites: [],
        alternativeRoutes: []
      };
    }
  }
  
  // ============================================================================
  // HARD RULE 2: Benefits & Social Security
  // ============================================================================
  
  if (domain === "social_security") {
    const mrPrereq: Prerequisite = {
      id: "mandatory_reconsideration",
      name: "Mandatory Reconsideration",
      met: false,
      instruction: "You must request Mandatory Reconsideration from DWP before appealing to tribunal"
    };
    
    return {
      forum: "first_tier_tribunal_sscs",
      status: "BLOCKED",
      reason: "Benefits appeals must go through DWP Mandatory Reconsideration first, then First-tier Tribunal",
      prerequisites: [mrPrereq],
      blockType: "missing_prerequisite"
    };
  }
  
  // ============================================================================
  // HARD RULE 3: Immigration
  // ============================================================================
  
  if (domain === "immigration") {
    return {
      forum: "home_office_admin_review",
      status: "APPROVED",
      reason: "Immigration matters must go through Home Office Admin Review first",
      prerequisites: [],
      timeLimit: {
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        daysRemaining: 14,
        met: true,
        description: "Admin review must be requested within 14 days of decision"
      }
    };
  }
  
  // ============================================================================
  // HARD RULE 4: Traffic Offences
  // ============================================================================
  
  if (domain === "traffic_offence") {
    return {
      forum: "magistrates_court",
      status: "APPROVED",
      reason: "Traffic offences are handled by Magistrates Court",
      prerequisites: []
    };
  }
  
  // ============================================================================
  // HARD RULE 5: Parking (Private)
  // ============================================================================
  
  if (domain === "parking") {
    return {
      forum: "popla_parking_appeal",
      status: "APPROVED",
      reason: "Private parking tickets appeal to POPLA",
      prerequisites: [],
      timeLimit: {
        deadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
        daysRemaining: 28,
        met: true,
        description: "Appeal within 28 days of notice"
      }
    };
  }
  
  // ============================================================================
  // DEFAULT: County Court Small Claims
  // ============================================================================
  
  return {
    forum: "county_court_small_claims",
    status: "APPROVED",
    reason: "General civil dispute - County Court small claims track applies",
    prerequisites: []
  };
}

// ============================================================================
// STAGE 2C: DOCUMENT ALLOWLIST/BLOCKLIST
// ============================================================================

async function buildRoutingDecision(
  classification: Classification,
  forumDecision: ForumDecision,
  input: ClassificationInput
): Promise<RoutingDecision> {
  
  const allowedDocs = getAllowedDocuments(forumDecision.forum, classification.domain);
  const blockedDocs = getBlockedDocuments(forumDecision.forum, classification.relationship);
  
  const decision: RoutingDecision = {
    status: forumDecision.status,
    confidence: classification.confidence,
    
    jurisdiction: classification.jurisdiction as any,
    relationship: classification.relationship as any,
    counterparty: classification.counterparty as any,
    domain: classification.domain as any,
    
    forum: forumDecision.forum as any,
    forumReasoning: forumDecision.reason,
    
    allowedDocs,
    blockedDocs,
    
    prerequisites: forumDecision.prerequisites,
    prerequisitesMet: forumDecision.prerequisites.every(p => p.met),
    
    timeLimit: forumDecision.timeLimit,
    
    reason: forumDecision.reason,
    userMessage: generateUserMessage(forumDecision),
    
    alternativeRoutes: forumDecision.alternativeRoutes,
    
    classifiedAt: new Date(),
    classifiedBy: "claude-opus-4" // Will be actual Claude once integrated
  };
  
  return decision;
}

function getAllowedDocuments(forum: string, domain: string): OfficialFormID[] {
  const docs: OfficialFormID[] = [];
  
  // Always include supporting documents
  docs.push(
    OFFICIAL_FORM_IDS.EVIDENCE_BUNDLE_INDEX,
    OFFICIAL_FORM_IDS.SCHEDULE_OF_DAMAGES
  );
  
  switch (forum) {
    case "employment_tribunal":
      docs.push(
        OFFICIAL_FORM_IDS.EMPLOYMENT_TRIBUNAL_CLAIM,
        OFFICIAL_FORM_IDS.ACAS_EARLY_CONCILIATION_CERT,
        OFFICIAL_FORM_IDS.SCHEDULE_OF_LOSS,
        OFFICIAL_FORM_IDS.WITNESS_STATEMENT
      );
      break;
      
    case "county_court_small_claims":
    case "county_court":
      docs.push(
        OFFICIAL_FORM_IDS.COUNTY_COURT_CLAIM_FORM,
        OFFICIAL_FORM_IDS.PARTICULARS_OF_CLAIM,
        OFFICIAL_FORM_IDS.LETTER_BEFORE_ACTION,
        OFFICIAL_FORM_IDS.WITNESS_STATEMENT
      );
      break;
      
    case "first_tier_tribunal_sscs":
      docs.push(
        OFFICIAL_FORM_IDS.BENEFITS_APPEAL_FORM,
        OFFICIAL_FORM_IDS.MANDATORY_RECONSIDERATION_REQUEST
      );
      break;
      
    case "magistrates_court":
      docs.push(
        OFFICIAL_FORM_IDS.GUILTY_PLEA_LETTER,
        OFFICIAL_FORM_IDS.MITIGATION_STATEMENT,
        OFFICIAL_FORM_IDS.MEANS_FORM
      );
      break;
      
    case "popla_parking_appeal":
      docs.push(
        OFFICIAL_FORM_IDS.POPLA_APPEAL
      );
      break;
      
    case "home_office_admin_review":
      docs.push(
        OFFICIAL_FORM_IDS.ADMIN_REVIEW_REQUEST
      );
      break;
      
    default:
      docs.push(
        OFFICIAL_FORM_IDS.LETTER_BEFORE_ACTION,
        OFFICIAL_FORM_IDS.FORMAL_COMPLAINT_LETTER
      );
  }
  
  return docs;
}

function getBlockedDocuments(forum: string, relationship: string): OfficialFormID[] {
  const blocked: OfficialFormID[] = [];
  
  // Block ET1 for self-employed
  if (relationship === "self_employed") {
    blocked.push(
      OFFICIAL_FORM_IDS.EMPLOYMENT_TRIBUNAL_CLAIM,
      OFFICIAL_FORM_IDS.ACAS_EARLY_CONCILIATION_CERT,
      OFFICIAL_FORM_IDS.SCHEDULE_OF_LOSS
    );
  }
  
  // Block court forms for tribunal matters
  if (forum.includes("tribunal")) {
    blocked.push(
      OFFICIAL_FORM_IDS.COUNTY_COURT_CLAIM_FORM,
      OFFICIAL_FORM_IDS.PARTICULARS_OF_CLAIM
    );
  }
  
  // Block tribunal forms for court matters
  if (forum.includes("court") && !forum.includes("magistrates")) {
    blocked.push(
      OFFICIAL_FORM_IDS.EMPLOYMENT_TRIBUNAL_CLAIM,
      OFFICIAL_FORM_IDS.BENEFITS_APPEAL_FORM
    );
  }
  
  // Block civil letters for criminal matters
  if (forum === "magistrates_court") {
    blocked.push(
      OFFICIAL_FORM_IDS.COUNTY_COURT_CLAIM_FORM,
      OFFICIAL_FORM_IDS.LETTER_BEFORE_ACTION,
      OFFICIAL_FORM_IDS.DEMAND_LETTER
    );
  }
  
  return blocked;
}

function generateUserMessage(forumDecision: ForumDecision): string {
  if (forumDecision.status === "BLOCKED") {
    return `Before we can generate documents, you need to: ${forumDecision.prerequisites.map(p => p.name).join(", ")}`;
  }
  
  return `Your case will be handled through ${forumDecision.forum.replace(/_/g, " ")}. ${forumDecision.reason}`;
}

function generateClarificationQuestions(classification: Classification): string[] {
  const questions: string[] = [];
  
  if (classification.relationship === "complainant") {
    questions.push("Were you employed by this company, or were you self-employed/a contractor?");
  }
  
  if (classification.domain === "other") {
    questions.push("What type of dispute is this? (employment, housing, consumer, etc.)");
  }
  
  if (questions.length === 0) {
    questions.push("Can you provide more details about your situation?");
  }
  
  return questions;
}
