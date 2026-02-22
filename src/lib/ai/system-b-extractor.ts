/**
 * SYSTEM B - SILENT FACT EXTRACTOR (GPT-4o or Claude Sonnet)
 * 
 * This system NEVER talks to the user.
 * It runs AFTER every user message to extract structured facts.
 * Tracks: facts, contradictions, missing info, evidence, readiness score
 */

import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

/**
 * Structured facts extracted from conversation
 */
export interface ExtractedFacts {
  // Dispute Classification
  disputeType: string | null; // "employment", "consumer", "housing", etc.
  
  // Parties
  parties: {
    user: string | null; // User's full name
    counterparty: string | null; // Company/person being sued
    relationship: string | null; // "employer", "seller", "landlord", etc.
  };
  
  // Key Details
  incidentDate: string | null; // When did this happen
  financialAmount: number | null; // Money being claimed
  
  // User's Chosen Legal Route (IMPORTANT - respect this!)
  chosenForum: string | null; // "letter_before_action", "county_court_small_claims", "employment_tribunal", etc.
  
  // Facts & Evidence
  facts: string[]; // Bullet points of what happened
  evidenceProvided: string[]; // What evidence user mentioned/uploaded
  contradictions: string[]; // Any inconsistencies detected
  
  // Contact Info (needed for court documents)
  userAddress: string | null;
  counterpartyAddress: string | null;
  
  // Readiness Assessment
  readinessScore: number; // 0-100
  missingCriticalInfo: string[]; // What's still needed
  recommendedState: "GATHERING_FACTS" | "WAITING_FOR_UPLOAD" | "CONFIRMING_SUMMARY";
}

/**
 * Extract facts from conversation history using GPT-4o
 */
export async function extractFacts(
  conversationHistory: { role: string; content: string }[],
  evidenceCount: number
): Promise<ExtractedFacts> {
  
  // Initialize OpenAI
  const { default: OpenAI } = await import("openai");
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  const prompt = `You are a silent fact extraction engine. Your job is to read a conversation between a user and a lawyer AI, then extract structured facts.

CONVERSATION HISTORY:
${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n\n')}

EVIDENCE FILES UPLOADED: ${evidenceCount}

---

TASK: Extract structured information from this conversation.

OUTPUT AS JSON:
{
  "disputeType": "employment" | "consumer" | "housing" | "debt" | "contract" | "personal_injury" | null,
  "parties": {
    "user": "Full name of the user (if provided)" | null,
    "counterparty": "Name of company/person being sued" | null,
    "relationship": "employer" | "seller" | "landlord" | "contractor" | "debtor" | null
  },
  "incidentDate": "YYYY-MM-DD or natural description" | null,
  "financialAmount": number (pounds sterling) | null,
  "chosenForum": "letter_before_action" | "county_court_small_claims" | "county_court_fast_track" | "employment_tribunal" | "money_claim_online" | null,
  "facts": ["Bullet point 1", "Bullet point 2", ...],
  "evidenceProvided": ["email", "photos", "contract", ...],
  "contradictions": ["Any contradictions found", ...],
  "userAddress": "Full address if provided" | null,
  "counterpartyAddress": "Full address if provided" | null,
  "readinessScore": 0-100 (percentage),
  "missingCriticalInfo": ["What's still needed", ...],
  "recommendedState": "GATHERING_FACTS" | "WAITING_FOR_UPLOAD" | "CONFIRMING_SUMMARY"
}

IMPORTANT FOR chosenForum:
- Extract the user's EXPLICIT choice of legal route
- "Letter Before Action" → "letter_before_action"
- "County Court" or "Small Claims" → "county_court_small_claims"
- "Employment Tribunal" → "employment_tribunal"
- If user hasn't chosen yet, use null
- RESPECT user's choice - don't override it

RULES FOR READINESS SCORE:
- Start at 0%
- +15% for dispute type identified
- +15% for user identified (name)
- +15% for counterparty identified (name/company)
- +10% for incident date
- +10% for financial amount
- +10% for at least 3 key facts
- +10% for user address
- +10% for counterparty address
- +5% for evidence mentioned/uploaded

RULES FOR RECOMMENDED STATE:
- "GATHERING_FACTS": Default state, still collecting info
- "WAITING_FOR_UPLOAD": User mentioned evidence but hasn't uploaded (evidenceCount=0)
- "CONFIRMING_SUMMARY": Readiness >= 75% AND (evidenceCount > 0 OR user chose simple route like "letter_before_action")

CRITICAL: Be conservative. Don't invent facts. If something wasn't mentioned, it's null.
CRITICAL: Don't assume relationships - extract exactly what was said.
CRITICAL: Facts should be concrete statements, not assumptions.

Return ONLY valid JSON, no explanations.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a fact extraction engine. Return only valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.1, // Very low - we want consistency
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const extracted = JSON.parse(content) as ExtractedFacts;
    
    // Validation & sanitization
    extracted.readinessScore = Math.min(100, Math.max(0, extracted.readinessScore || 0));
    extracted.facts = Array.isArray(extracted.facts) ? extracted.facts : [];
    extracted.evidenceProvided = Array.isArray(extracted.evidenceProvided) ? extracted.evidenceProvided : [];
    extracted.contradictions = Array.isArray(extracted.contradictions) ? extracted.contradictions : [];
    extracted.missingCriticalInfo = Array.isArray(extracted.missingCriticalInfo) ? extracted.missingCriticalInfo : [];
    
    console.log("[System B] Extracted facts:", {
      disputeType: extracted.disputeType,
      readiness: extracted.readinessScore,
      state: extracted.recommendedState,
      factsCount: extracted.facts.length,
      evidenceCount,
    });
    
    return extracted;
    
  } catch (error) {
    console.error("[System B] Fact extraction failed:", error);
    
    // Return safe default
    return {
      disputeType: null,
      parties: {
        user: null,
        counterparty: null,
        relationship: null,
      },
      incidentDate: null,
      financialAmount: null,
      chosenForum: null,
      facts: [],
      evidenceProvided: [],
      contradictions: [],
      userAddress: null,
      counterpartyAddress: null,
      readinessScore: 0,
      missingCriticalInfo: ["Unable to extract facts - please try again"],
      recommendedState: "GATHERING_FACTS",
    };
  }
}

/**
 * Enrich ExtractedFacts into document-generation-ready format
 * 
 * This function transforms System B's structured output into the format
 * expected by System 3's document generation helpers (keyFacts array with
 * enriched strings like "The other party is: XYZ")
 * 
 * @param extractedFacts - Raw output from System B
 * @returns Object compatible with CaseStrategy interface
 */
export function enrichFactsForDocumentGeneration(extractedFacts: ExtractedFacts): {
  keyFacts: string[];
  desiredOutcome: string;
  disputeType: string;
  // Pass-through fields for direct access by helpers
  counterpartyName: string | null;
  counterpartyAddress: string | null;
  claimantName: string | null;
  claimantAddress: string | null;
  amount: number | null;
  incidentDate: string | null;
  relationship: string | null;
  chosenForum: string | null;
} {
  const keyFacts: string[] = [];
  
  // Add enriched party info (format that helpers expect)
  if (extractedFacts.parties?.counterparty) {
    keyFacts.push(`The other party is: ${extractedFacts.parties.counterparty}`);
  }
  
  if (extractedFacts.parties?.user) {
    keyFacts.push(`The claimant is: ${extractedFacts.parties.user}`);
  }
  
  if (extractedFacts.parties?.relationship) {
    keyFacts.push(`Legal relationship: ${extractedFacts.parties.relationship}`);
  }
  
  if (extractedFacts.counterpartyAddress) {
    keyFacts.push(`Other party address: ${extractedFacts.counterpartyAddress}`);
  }
  
  if (extractedFacts.userAddress) {
    keyFacts.push(`Claimant address: ${extractedFacts.userAddress}`);
  }
  
  // Add financial amount in format helpers expect
  if (extractedFacts.financialAmount !== null && extractedFacts.financialAmount > 0) {
    keyFacts.push(`Amount claimed: £${extractedFacts.financialAmount}`);
  }
  
  // Add incident date
  if (extractedFacts.incidentDate) {
    keyFacts.push(`Date of incident: ${extractedFacts.incidentDate}`);
  }
  
  // Add chosen forum
  if (extractedFacts.chosenForum) {
    keyFacts.push(`Chosen legal route: ${extractedFacts.chosenForum}`);
  }
  
  // Add all original facts from conversation
  if (Array.isArray(extractedFacts.facts)) {
    keyFacts.push(...extractedFacts.facts);
  }
  
  // Build desired outcome from amount
  let desiredOutcome = "";
  if (extractedFacts.financialAmount !== null && extractedFacts.financialAmount > 0) {
    desiredOutcome = `Recovery of £${extractedFacts.financialAmount}`;
    if (extractedFacts.parties?.counterparty) {
      desiredOutcome += ` from ${extractedFacts.parties.counterparty}`;
    }
  }
  
  return {
    keyFacts,
    desiredOutcome,
    disputeType: extractedFacts.disputeType || "OTHER",
    // Direct access fields for helpers that check (strategy as any).fieldName
    counterpartyName: extractedFacts.parties?.counterparty || null,
    counterpartyAddress: extractedFacts.counterpartyAddress || null,
    claimantName: extractedFacts.parties?.user || null,
    claimantAddress: extractedFacts.userAddress || null,
    amount: extractedFacts.financialAmount,
    incidentDate: extractedFacts.incidentDate || null,
    relationship: extractedFacts.parties?.relationship || null,
    chosenForum: extractedFacts.chosenForum || null,
  };
}

/**
 * Generate a human-readable summary from extracted facts
 */
export function generateSummaryText(facts: ExtractedFacts): string {
  const parts: string[] = [];
  
  // Header
  parts.push("# Case Summary\n");
  
  // Dispute Type
  if (facts.disputeType) {
    parts.push(`**Type:** ${facts.disputeType.charAt(0).toUpperCase() + facts.disputeType.slice(1)} dispute\n`);
  }
  
  // Parties
  if (facts.parties.user || facts.parties.counterparty) {
    parts.push("## Parties\n");
    if (facts.parties.user) {
      parts.push(`- **You:** ${facts.parties.user}`);
      if (facts.userAddress) {
        parts.push(` (${facts.userAddress})`);
      }
      parts.push("\n");
    }
    if (facts.parties.counterparty) {
      parts.push(`- **Other Party:** ${facts.parties.counterparty}`);
      if (facts.parties.relationship) {
        parts.push(` (your ${facts.parties.relationship})`);
      }
      if (facts.counterpartyAddress) {
        parts.push(` - ${facts.counterpartyAddress}`);
      }
      parts.push("\n");
    }
  }
  
  // What Happened
  if (facts.facts.length > 0) {
    parts.push("\n## What Happened\n");
    facts.facts.forEach(fact => {
      parts.push(`- ${fact}\n`);
    });
  }
  
  // Financial & Date
  const details: string[] = [];
  if (facts.financialAmount) {
    details.push(`**Amount Claimed:** £${facts.financialAmount}`);
  }
  if (facts.incidentDate) {
    details.push(`**Date:** ${facts.incidentDate}`);
  }
  if (details.length > 0) {
    parts.push("\n## Details\n");
    parts.push(details.join(" | ") + "\n");
  }
  
  // Evidence
  if (facts.evidenceProvided.length > 0) {
    parts.push("\n## Evidence\n");
    facts.evidenceProvided.forEach(evidence => {
      parts.push(`- ${evidence}\n`);
    });
  }
  
  // Contradictions (if any)
  if (facts.contradictions.length > 0) {
    parts.push("\n## ⚠️ Inconsistencies Detected\n");
    facts.contradictions.forEach(contradiction => {
      parts.push(`- ${contradiction}\n`);
    });
  }
  
  return parts.join("");
}
