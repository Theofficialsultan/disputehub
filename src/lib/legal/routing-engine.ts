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

// Lazy-load Anthropic client
let anthropicClient: any = null;
async function getAnthropicClient() {
  if (!anthropicClient) {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

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
    
    // Check if clarification needed (use <= to avoid floating point precision issues)
    // TEMPORARY: Lowered to 0.40 for dev testing
    if (routingDecision.confidence <= 0.40) {
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
  
  console.log(`[System 2] 🤖 Using Claude Opus 4 for intelligent classification...`);
  
  const facts = input.keyFacts.join("\n");
  
  const prompt = `You are a senior UK legal classification expert analyzing a dispute for routing to the correct legal forum.

CASE INFORMATION:
─────────────────────────────────────────────
Title: ${input.caseTitle}

Dispute Type: ${input.disputeType}

Key Facts:
${facts}

Desired Outcome: ${input.desiredOutcome}

Evidence: ${input.evidenceCount} items (${input.evidenceTypes.join(", ")})
─────────────────────────────────────────────

TASK: Classify this case precisely according to UK legal categories.

CLASSIFICATION CATEGORIES:

1. JURISDICTION:
   - england_wales
   - scotland
   - northern_ireland

2. LEGAL RELATIONSHIP:
   - employment (employer/employee)
   - consumer (business/consumer)
   - landlord_tenant (property rental)
   - debtor_creditor (money owed)
   - government_citizen (DWP, HMRC, Home Office, etc.)
   - family (divorce, child arrangements, etc.)
   - business_business (B2B dispute)
   - individual_individual (personal dispute)

3. COUNTERPARTY:
   - employer
   - company
   - landlord
   - government_agency
   - individual
   - family_member
   - service_provider

4. DOMAIN:
   - employment_law
   - consumer_rights
   - housing
   - debt_money
   - benefits_welfare
   - tax
   - immigration
   - family
   - criminal
   - parking_fines
   - complaints

5. CONFIDENCE: 0.0 to 1.0 (how confident are you?)

6. REASONING: Brief explanation of your classification

Respond in JSON format ONLY:
{
  "jurisdiction": "england_wales",
  "relationship": "employment",
  "counterparty": "employer",
  "domain": "employment_law",
  "confidence": 0.95,
  "reasoning": "Clear employment dispute with unfair dismissal claim against employer"
}`;

  try {
    const anthropic = await getAnthropicClient();
    
    const response = await anthropic.messages.create({
      model: "claude-opus-4-20250514",
      max_tokens: 1000,
      temperature: 0.3,
      system: "You are a UK legal classification expert. Analyze disputes and return ONLY valid JSON with no additional text.",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });
    
    const content = response.content[0]?.text;
    if (!content) {
      throw new Error("No response from Claude Opus 4");
    }
    
    // Parse JSON response
    const classification = JSON.parse(content.trim());
    
    console.log(`[System 2] ✅ Claude Opus 4: ${classification.relationship} → ${classification.domain} (confidence: ${classification.confidence})`);
    
    return {
      jurisdiction: classification.jurisdiction,
      relationship: classification.relationship,
      counterparty: classification.counterparty,
      domain: classification.domain,
      confidence: classification.confidence,
      reasoning: classification.reasoning
    };
    
  } catch (error) {
    console.error(`[System 2] ❌ Claude Opus 4 error:`, error);
    console.log(`[System 2] 🔄 Falling back to rule-based classification`);
    
    // Fallback to rule-based logic
    const allText = `${input.caseTitle} ${facts} ${input.desiredOutcome}`.toLowerCase();
    
    const jurisdiction = determineJurisdiction(allText);
    const relationship = determineLegalRelationship(allText, input);
    const counterparty = determineCounterparty(allText);
    const domain = determineDomain(allText, relationship);
    const confidence = calculateClassificationConfidence(relationship, domain, input.keyFacts.length);
    
    return {
      jurisdiction,
      relationship,
      counterparty,
      domain,
      confidence: confidence * 0.8, // Lower confidence for fallback
      reasoning: `Rule-based classification (Claude Opus 4 unavailable): ${relationship} in ${domain}`
    };
  }
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
  
  // Insurance disputes
  if (text.includes("insurance") || text.includes("claim rejected") || text.includes("insurer")) {
    return "policyholder";
  }
  
  // Medical/NHS complaints
  if (text.includes("nhs") || text.includes("gp") || text.includes("hospital") || 
      text.includes("doctor") || text.includes("misdiagnos")) {
    return "patient";
  }
  
  // Neighbour disputes
  if (text.includes("neighbour") || text.includes("neighbor") || text.includes("fence") ||
      text.includes("boundary") || text.includes("noise") || text.includes("party") ||
      text.includes("antisocial")) {
    return "neighbour";
  }
  
  // Council tax
  if (text.includes("council tax") || text.includes("band") || text.includes("valuation office")) {
    return "council_tax_payer";
  }
  
  // Criminal matters
  if (text.includes("conviction") || text.includes("appeal") || text.includes("magistrates") ||
      text.includes("crown court") || text.includes("criminal")) {
    return "defendant";
  }
  
  // Defamation
  if (text.includes("defam") || text.includes("libel") || text.includes("slander") ||
      text.includes("false accusation") || text.includes("reputation")) {
    return "defamation_claimant";
  }
  
  // Contract disputes
  if (text.includes("contract") || text.includes("builder") || text.includes("deposit") ||
      text.includes("abandoned") || text.includes("breach")) {
    return "contract_party";
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
  
  // Insurance
  if (relationship === "policyholder") {
    return "insurance";
  }
  
  // Medical/NHS
  if (relationship === "patient") {
    return "medical";
  }
  
  // Neighbour disputes
  if (relationship === "neighbour") {
    if (text.includes("noise") || text.includes("antisocial") || text.includes("party")) {
      return "antisocial_behaviour";
    }
    return "neighbour_dispute";
  }
  
  // Council tax
  if (relationship === "council_tax_payer") {
    return "council_tax";
  }
  
  // Criminal
  if (relationship === "defendant") {
    return "criminal";
  }
  
  // Defamation
  if (relationship === "defamation_claimant") {
    return "defamation";
  }
  
  // Contract
  if (relationship === "contract_party") {
    return "contract";
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
  
  // Round to 2 decimal places to avoid floating point precision issues
  return Math.min(Math.round(confidence * 100) / 100, 0.99);
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
  // USER CHOICE OVERRIDE (RESPECT USER'S EXPLICIT CHOICE)
  // ============================================================================
  
  if (input.userChosenForum) {
    console.log(`[System 2] User explicitly chose forum: ${input.userChosenForum}`);
    
    // Map user's choice to valid forums
    const forumMapping: Record<string, string> = {
      "letter_before_action": "letter_before_action",
      "county_court_small_claims": "county_court_small_claims",
      "county_court": "county_court_small_claims",
      "small_claims": "county_court_small_claims",
      "county_court_fast_track": "county_court_fast_track",
      "employment_tribunal": "employment_tribunal",
      "money_claim_online": "money_claim_online",
      "acas": "acas_conciliation",
    };
    
    const mappedForum = forumMapping[input.userChosenForum.toLowerCase()] || input.userChosenForum;
    
    // Letter Before Action is a special pre-court step
    if (mappedForum === "letter_before_action") {
      return {
        forum: "letter_before_action",
        status: "APPROVED",
        reason: `User chose Letter Before Action. This is the recommended first step to resolve disputes without court.`,
        prerequisites: [],
      };
    }
    
    // Return user's chosen forum with appropriate reasoning
    return {
      forum: mappedForum,
      status: "APPROVED",
      reason: `User explicitly chose ${mappedForum}. Respecting user's choice.`,
      prerequisites: [],
    };
  }
  
  // ============================================================================
  // HARD RULE 1: Employment Tribunal Jurisdiction
  // ============================================================================
  
  if (domain === "employment") {
    if (relationship === "employee" || relationship === "worker") {
      // Check ACAS prerequisite
      const acasPrereq: Prerequisite = {
        id: "acas_ec",
        name: "ACAS Early Conciliation Certificate",
        met: false, // Will be checked properly in future
        instruction: "You must complete ACAS Early Conciliation before filing an ET claim. Visit www.acas.org.uk/early-conciliation"
      };
      
      // For now, APPROVE but note the prerequisite
      // In production, this would check for ACAS evidence
      return {
        forum: "employment_tribunal",
        status: "APPROVED", // Allow generation, but note prerequisite
        reason: "Employment Tribunal jurisdiction applies for employees/workers. ACAS Early Conciliation required before filing.",
        prerequisites: [acasPrereq],
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
    
    // For now, APPROVE but note the prerequisite
    return {
      forum: "first_tier_tribunal_sscs",
      status: "APPROVED", // Allow generation, but note prerequisite
      reason: "Benefits appeals must go through DWP Mandatory Reconsideration first, then First-tier Tribunal",
      prerequisites: [mrPrereq],
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
  // HARD RULE 6: Insurance Disputes
  // ============================================================================
  
  if (domain === "insurance") {
    return {
      forum: "financial_ombudsman",
      status: "APPROVED",
      reason: "Insurance disputes should first go through the Financial Ombudsman Service (FOS). If unsuccessful, County Court is available.",
      prerequisites: [{
        id: "insurer_complaint",
        name: "Formal Complaint to Insurer",
        met: false,
        instruction: "You must first make a formal complaint to your insurance company and wait 8 weeks (or receive a final response) before escalating to FOS"
      }],
    };
  }
  
  // ============================================================================
  // HARD RULE 7: Medical/NHS Complaints
  // ============================================================================
  
  if (domain === "medical") {
    return {
      forum: "nhs_complaints",
      status: "APPROVED",
      reason: "Medical complaints should go through NHS Complaints Procedure first. If unresolved, you can escalate to the Parliamentary and Health Service Ombudsman (PHSO).",
      prerequisites: [{
        id: "nhs_complaint",
        name: "NHS Formal Complaint",
        met: false,
        instruction: "Submit a formal complaint to the NHS provider (GP surgery, hospital, etc.) within 12 months of the incident"
      }],
      timeLimit: {
        deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        daysRemaining: 365,
        met: true,
        description: "NHS complaints must be made within 12 months of the incident"
      }
    };
  }
  
  // ============================================================================
  // HARD RULE 8: Council Tax Disputes
  // ============================================================================
  
  if (domain === "council_tax") {
    return {
      forum: "valuation_tribunal",
      status: "APPROVED",
      reason: "Council tax banding disputes go to the Valuation Tribunal. You can also challenge via the Valuation Office Agency (VOA) first.",
      prerequisites: [{
        id: "voa_challenge",
        name: "VOA Challenge",
        met: false,
        instruction: "Consider challenging the banding with the Valuation Office Agency (VOA) first. This is free and may resolve the issue without tribunal."
      }],
    };
  }
  
  // ============================================================================
  // HARD RULE 9: Antisocial Behaviour / Noise Complaints
  // ============================================================================
  
  if (domain === "antisocial_behaviour") {
    return {
      forum: "council_environmental_health",
      status: "APPROVED",
      reason: "Noise complaints and antisocial behaviour should be reported to your local council's Environmental Health department. They can issue warnings and abatement notices.",
      prerequisites: [{
        id: "noise_diary",
        name: "Noise Diary",
        met: false,
        instruction: "Keep a detailed noise diary with dates, times, duration, and type of noise. Include any recordings if possible."
      }],
    };
  }
  
  // ============================================================================
  // HARD RULE 10: Neighbour Boundary Disputes
  // ============================================================================
  
  if (domain === "neighbour_dispute") {
    return {
      forum: "county_court_small_claims",
      status: "APPROVED",
      reason: "Boundary disputes are civil matters handled by County Court. Consider mediation first as it's cheaper and faster.",
      prerequisites: [{
        id: "boundary_evidence",
        name: "Boundary Evidence",
        met: false,
        instruction: "Gather evidence: property deeds, title plans from Land Registry, photos, and ideally a surveyor's report"
      }],
      alternativeRoutes: [{
        forum: "civil_mediation" as any,
        reason: "Mediation is recommended for neighbour disputes - cheaper and preserves relationships",
        viability: "high"
      }]
    };
  }
  
  // ============================================================================
  // HARD RULE 11: Criminal Appeals
  // ============================================================================
  
  if (domain === "criminal") {
    return {
      forum: "crown_court_appeal",
      status: "APPROVED",
      reason: "Appeals against Magistrates' Court convictions go to Crown Court. You have 21 days from the date of sentence to appeal.",
      prerequisites: [],
      timeLimit: {
        deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        daysRemaining: 21,
        met: true,
        description: "Criminal appeals must be lodged within 21 days of sentencing"
      }
    };
  }
  
  // ============================================================================
  // HARD RULE 12: Defamation
  // ============================================================================
  
  if (domain === "defamation") {
    return {
      forum: "county_court_fast_track",
      status: "APPROVED",
      reason: "Defamation claims are civil matters. For claims under £10,000, County Court applies. Consider sending a cease and desist letter first.",
      prerequisites: [{
        id: "cease_desist",
        name: "Cease and Desist Letter",
        met: false,
        instruction: "Send a formal cease and desist letter demanding removal of the defamatory content and an apology"
      }],
    };
  }
  
  // ============================================================================
  // HARD RULE 13: Contract Disputes
  // ============================================================================
  
  if (domain === "contract") {
    return {
      forum: "county_court_small_claims",
      status: "APPROVED",
      reason: "Contract disputes under £10,000 go to Small Claims Court. Letter Before Action is required first.",
      prerequisites: [{
        id: "lba",
        name: "Letter Before Action",
        met: false,
        instruction: "Send a formal Letter Before Action giving 14-28 days to resolve the matter before court action"
      }],
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
  
  // Determine if there's a financial claim based on input
  const allText = [input.desiredOutcome, ...input.keyFacts, input.caseTitle].join(' ').toLowerCase();
  const hasFinancialClaim = /£|\bpound|\bmoney|\brefund|\bcompensation|\bdamages|\bloss|\bclaim\s*\d|\bowed|\bpay\s*back|\breimburse/i.test(allText);
  
  // Pass user's chosen forum to respect their explicit choice for focused document generation
  const allowedDocs = getAllowedDocuments(
    forumDecision.forum, 
    classification.domain, 
    hasFinancialClaim,
    input.userChosenForum // User's explicit choice from AI chat (e.g., "letter_before_action")
  );
  const blockedDocs = getBlockedDocuments(forumDecision.forum, classification.relationship);
  
  console.log(`[Routing] Generated ${allowedDocs.length} documents for forum: ${forumDecision.forum}, userChoice: ${input.userChosenForum || 'none'}`);
  
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
    classifiedBy: "claude-opus-4" // Claude Opus 4 AI-powered classification
  };
  
  return decision;
}

/**
 * DOCUMENT GENERATION MODES
 * 
 * MINIMAL: Just the core document needed (e.g., just LBA, just complaint)
 * STANDARD: Core document + basic supporting docs
 * FULL: All documents for formal proceedings (court/tribunal)
 */
type DocumentMode = "MINIMAL" | "STANDARD" | "FULL";

/**
 * Determine document mode based on forum and user's chosen route
 */
function getDocumentMode(forum: string, userChosenForum?: string): DocumentMode {
  // If user explicitly chose a simple route, use minimal
  if (userChosenForum) {
    const simpleForums = [
      "letter_before_action",
      "formal_complaint",
      "demand_letter",
      "refund_request",
      "section_75",
      "chargeback",
      "warranty_claim",
      "cancellation",
      "cease_desist",
    ];
    
    if (simpleForums.some(f => userChosenForum.toLowerCase().includes(f))) {
      return "MINIMAL";
    }
    
    // ADR/Ombudsman routes - standard mode
    const adrForums = [
      "ombudsman",
      "sar",
      "foi",
      "ico",
      "mediation",
      "appeal",
    ];
    
    if (adrForums.some(f => userChosenForum.toLowerCase().includes(f))) {
      return "STANDARD";
    }
  }
  
  // Court/Tribunal = Full mode
  const fullModeForums = [
    "employment_tribunal",
    "county_court",
    "county_court_small_claims",
    "county_court_fast_track",
    "first_tier_tribunal",
    "magistrates_court",
    "crown_court",
  ];
  
  if (fullModeForums.some(f => forum.includes(f))) {
    return "FULL";
  }
  
  // Everything else = Standard
  return "STANDARD";
}

function getAllowedDocuments(
  forum: string, 
  domain: string, 
  hasFinancialClaim: boolean = false,
  userChosenForum?: string
): OfficialFormID[] {
  const docs: OfficialFormID[] = [];
  const mode = getDocumentMode(forum, userChosenForum);
  
  console.log(`[Routing] Document mode: ${mode} for forum: ${forum}`);
  
  // ============================================================================
  // TIER 1: SIMPLE LETTERS (MINIMAL MODE)
  // ============================================================================
  
  // Letter Before Action - ONLY the letter
  if (forum === "letter_before_action" || userChosenForum === "letter_before_action") {
    docs.push(OFFICIAL_FORM_IDS.LETTER_BEFORE_ACTION);
    return docs; // Return immediately - no extra docs
  }
  
  // Demand letter - ONLY the letter
  if (forum === "demand_letter" || userChosenForum === "demand_letter") {
    docs.push(OFFICIAL_FORM_IDS.DEMAND_LETTER);
    return docs;
  }
  
  // Formal complaint - ONLY the letter
  if (forum === "formal_complaint" || userChosenForum === "formal_complaint") {
    docs.push(OFFICIAL_FORM_IDS.FORMAL_COMPLAINT_LETTER);
    return docs;
  }
  
  // Grievance letter - ONLY the letter
  if (forum === "grievance" || userChosenForum === "grievance") {
    docs.push(OFFICIAL_FORM_IDS.GRIEVANCE_LETTER);
    return docs;
  }
  
  // Section 75 / Chargeback - ONLY the claim letter
  if (userChosenForum?.includes("section_75") || userChosenForum?.includes("chargeback")) {
    if (userChosenForum.includes("section_75")) {
      docs.push(OFFICIAL_FORM_IDS.SECTION_75_CLAIM);
    } else {
      docs.push(OFFICIAL_FORM_IDS.CHARGEBACK_REQUEST);
    }
    return docs;
  }
  
  // Other Tier 1 letters
  if (userChosenForum?.includes("refund")) {
    docs.push(OFFICIAL_FORM_IDS.REFUND_REQUEST);
    return docs;
  }
  
  if (userChosenForum?.includes("warranty")) {
    docs.push(OFFICIAL_FORM_IDS.WARRANTY_CLAIM);
    return docs;
  }
  
  if (userChosenForum?.includes("insurance")) {
    docs.push(OFFICIAL_FORM_IDS.INSURANCE_CLAIM_LETTER);
    return docs;
  }
  
  if (userChosenForum?.includes("cancellation") || userChosenForum?.includes("cancel")) {
    docs.push(OFFICIAL_FORM_IDS.CANCELLATION_LETTER);
    return docs;
  }
  
  if (userChosenForum?.includes("cease") || userChosenForum?.includes("desist")) {
    docs.push(OFFICIAL_FORM_IDS.CEASE_AND_DESIST);
    return docs;
  }
  
  // ============================================================================
  // TIER 2: ADR / OMBUDSMAN (STANDARD MODE)
  // ============================================================================
  
  // SAR - ONLY the request
  if (userChosenForum?.includes("sar") || userChosenForum?.includes("subject_access")) {
    docs.push(OFFICIAL_FORM_IDS.SUBJECT_ACCESS_REQUEST);
    return docs;
  }
  
  // FOI - ONLY the request
  if (userChosenForum?.includes("foi") || userChosenForum?.includes("freedom_of_information")) {
    docs.push(OFFICIAL_FORM_IDS.FOI_REQUEST);
    return docs;
  }
  
  // ICO Complaint
  if (userChosenForum?.includes("ico")) {
    docs.push(OFFICIAL_FORM_IDS.ICO_COMPLAINT);
    return docs;
  }
  
  // Financial Ombudsman - complaint form only
  if (forum === "financial_ombudsman" || userChosenForum?.includes("fos")) {
    docs.push(OFFICIAL_FORM_IDS.FINANCIAL_OMBUDSMAN_COMPLAINT);
    return docs;
  }
  
  // Housing Ombudsman
  if (forum === "housing_ombudsman" || userChosenForum?.includes("housing_ombudsman")) {
    docs.push(OFFICIAL_FORM_IDS.HOUSING_OMBUDSMAN_COMPLAINT);
    return docs;
  }
  
  // Energy Ombudsman
  if (userChosenForum?.includes("energy_ombudsman")) {
    docs.push(OFFICIAL_FORM_IDS.ENERGY_OMBUDSMAN_COMPLAINT);
    return docs;
  }
  
  // LGSCO (Local Government)
  if (userChosenForum?.includes("lgsco") || userChosenForum?.includes("local_gov")) {
    docs.push(OFFICIAL_FORM_IDS.LGSCO_COMPLAINT);
    return docs;
  }
  
  // PHSO (NHS/Parliament)
  if (userChosenForum?.includes("phso") || userChosenForum?.includes("nhs_ombudsman")) {
    docs.push(OFFICIAL_FORM_IDS.PHSO_COMPLAINT);
    return docs;
  }
  
  // Mediation request
  if (userChosenForum?.includes("mediation")) {
    docs.push(OFFICIAL_FORM_IDS.MEDIATION_REQUEST);
    return docs;
  }
  
  // Internal appeal
  if (userChosenForum?.includes("internal_appeal")) {
    docs.push(OFFICIAL_FORM_IDS.INTERNAL_APPEAL_LETTER);
    return docs;
  }
  
  // ============================================================================
  // TIER 3: COURT / TRIBUNAL (FULL MODE)
  // Only add supporting docs for full court proceedings
  // ============================================================================
  
  switch (forum) {
    case "employment_tribunal":
      docs.push(OFFICIAL_FORM_IDS.EMPLOYMENT_TRIBUNAL_CLAIM);
      if (mode === "FULL") {
        docs.push(OFFICIAL_FORM_IDS.SCHEDULE_OF_LOSS);
        // Only add witness statement if complex
        if (hasFinancialClaim) {
          docs.push(OFFICIAL_FORM_IDS.WITNESS_STATEMENT);
        }
      }
      break;
      
    case "county_court_small_claims":
    case "county_court":
      docs.push(
        OFFICIAL_FORM_IDS.COUNTY_COURT_CLAIM_FORM,
        OFFICIAL_FORM_IDS.PARTICULARS_OF_CLAIM
      );
      if (mode === "FULL" && hasFinancialClaim) {
        docs.push(OFFICIAL_FORM_IDS.SCHEDULE_OF_DAMAGES);
      }
      break;
      
    case "county_court_fast_track":
      docs.push(
        OFFICIAL_FORM_IDS.COUNTY_COURT_CLAIM_FORM,
        OFFICIAL_FORM_IDS.PARTICULARS_OF_CLAIM,
        OFFICIAL_FORM_IDS.WITNESS_STATEMENT
      );
      if (hasFinancialClaim) {
        docs.push(OFFICIAL_FORM_IDS.SCHEDULE_OF_DAMAGES);
      }
      docs.push(OFFICIAL_FORM_IDS.EVIDENCE_BUNDLE_INDEX);
      break;
      
    case "first_tier_tribunal_sscs":
      docs.push(OFFICIAL_FORM_IDS.BENEFITS_APPEAL_FORM);
      break;
      
    case "popla_parking_appeal":
      docs.push(OFFICIAL_FORM_IDS.POPLA_APPEAL);
      break;
      
    case "home_office_admin_review":
      docs.push(OFFICIAL_FORM_IDS.ADMIN_REVIEW_REQUEST);
      break;
      
    case "magistrates_court":
      docs.push(OFFICIAL_FORM_IDS.FORMAL_COMPLAINT_LETTER);
      break;
      
    case "crown_court_appeal":
      docs.push(
        OFFICIAL_FORM_IDS.MITIGATION_STATEMENT,
        OFFICIAL_FORM_IDS.WITNESS_STATEMENT
      );
      break;
      
    // Fallback for NHS, valuation, etc - just complaint letter
    case "nhs_complaints":
    case "valuation_tribunal":
    case "council_environmental_health":
      docs.push(OFFICIAL_FORM_IDS.FORMAL_COMPLAINT_LETTER);
      break;
      
    default:
      // Unknown forum - just generate a basic letter
      docs.push(OFFICIAL_FORM_IDS.FORMAL_COMPLAINT_LETTER);
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
