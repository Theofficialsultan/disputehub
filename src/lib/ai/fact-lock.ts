/**
 * ═══════════════════════════════════════════════════════════════════════════
 * FACT LOCKING SYSTEM - PREVENT AI HALLUCINATION
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * CRITICAL: Once facts are confirmed by the user, they are LOCKED.
 * AI CANNOT modify, embellish, or contradict locked facts.
 * 
 * This prevents:
 * - AI making up details not provided by user
 * - AI changing times, amounts, or durations
 * - AI ignoring user concessions
 * - AI overclaiming
 */

import type { CaseStrategy } from "@prisma/client";

export interface LockedFact {
  field: string;
  value: any;
  lockedAt: Date;
  source: "user_confirmed" | "evidence" | "concession";
  immutable: boolean;
}

export interface FactLockResult {
  locked: boolean;
  violations: string[];
  lockedFacts: LockedFact[];
}

/**
 * Extract and lock facts from confirmed strategy
 * These facts are IMMUTABLE and must be used exactly as stated
 */
export function lockFactsFromStrategy(strategy: CaseStrategy): LockedFact[] {
  const lockedFacts: LockedFact[] = [];
  const now = new Date();

  // Extract key facts as JSON
  const keyFacts = Array.isArray(strategy.keyFacts) 
    ? strategy.keyFacts 
    : typeof strategy.keyFacts === 'string'
    ? JSON.parse(strategy.keyFacts)
    : [];

  keyFacts.forEach((fact: any, index: number) => {
    lockedFacts.push({
      field: `keyFact_${index}`,
      value: fact,
      lockedAt: now,
      source: "user_confirmed",
      immutable: true
    });
  });

  // Lock specific critical fields
  if (strategy.disputeType) {
    lockedFacts.push({
      field: "disputeType",
      value: strategy.disputeType,
      lockedAt: now,
      source: "user_confirmed",
      immutable: true
    });
  }

  if (strategy.desiredOutcome) {
    lockedFacts.push({
      field: "desiredOutcome",
      value: strategy.desiredOutcome,
      lockedAt: now,
      source: "user_confirmed",
      immutable: true
    });
  }

  return lockedFacts;
}

/**
 * Validate that generated content respects locked facts
 * Returns violations if AI contradicted user facts
 */
export function validateAgainstLockedFacts(
  generatedContent: string,
  lockedFacts: LockedFact[]
): FactLockResult {
  const violations: string[] = [];

  // Check for time/duration contradictions
  const timeRegex = /(\d+)\s*(hours?|hrs?)/gi;
  const matches = Array.from(generatedContent.matchAll(timeRegex));

  // Check for amount contradictions
  const amountRegex = /£(\d+(?:,\d{3})*(?:\.\d{2})?)/g;
  const amountMatches = Array.from(generatedContent.matchAll(amountRegex));

  // Check for unfilled placeholders (CRITICAL ERROR)
  const placeholderRegex = /\[(AMOUNT|TOTAL|DATE|NAME|ADDRESS)[^\]]*\]/gi;
  const placeholderMatches = Array.from(generatedContent.matchAll(placeholderRegex));

  if (placeholderMatches.length > 0) {
    placeholderMatches.forEach(match => {
      violations.push(`CRITICAL: Unfilled placeholder "${match[0]}" - document not ready for filing`);
    });
  }

  // Validate specific facts from locked data
  lockedFacts.forEach(locked => {
    if (locked.field === "disputeType" && locked.value) {
      // Ensure dispute type is consistent
      const type = String(locked.value).toLowerCase();
      if (type.includes("employment") && !generatedContent.toLowerCase().includes("employment")) {
        violations.push(`Dispute type "${locked.value}" not reflected in document`);
      }
    }
  });

  return {
    locked: violations.length === 0,
    violations,
    lockedFacts
  };
}

/**
 * Extract user concessions from facts
 * AI MUST respect these - cannot claim what user explicitly waived
 */
export function extractConcessions(keyFacts: string[]): string[] {
  const concessions: string[] = [];
  
  const concessionKeywords = [
    "don't want payment for",
    "not claiming",
    "not seeking",
    "waiving",
    "left early",
    "only worked",
    "approximately",
    "about",
    "roughly"
  ];

  keyFacts.forEach(fact => {
    const factLower = fact.toLowerCase();
    concessionKeywords.forEach(keyword => {
      if (factLower.includes(keyword)) {
        concessions.push(fact);
      }
    });
  });

  return concessions;
}

/**
 * Check if AI is overclaiming vs user's stated facts
 */
export function detectOverclaiming(
  generatedContent: string,
  userFacts: string[],
  concessions: string[]
): string[] {
  const warnings: string[] = [];

  // If user said "worked 11 hours", AI cannot claim "full 12 hours"
  const userHoursMatch = userFacts.join(" ").match(/worked.*?(\d+)\s*hours?/i);
  const claimedHoursMatches = Array.from(generatedContent.matchAll(/worked.*?(\d+)\s*hours?/gi));

  if (userHoursMatch && claimedHoursMatches.length > 0) {
    const userHours = parseInt(userHoursMatch[1]);
    claimedHoursMatches.forEach(match => {
      const claimedHours = parseInt(match[1]);
      if (claimedHours > userHours) {
        warnings.push(
          `OVERCLAIMING: Document claims ${claimedHours} hours but user stated only ${userHours} hours worked`
        );
      }
    });
  }

  // Check for claiming waived amounts
  concessions.forEach(concession => {
    if (concession.toLowerCase().includes("not seeking") || 
        concession.toLowerCase().includes("don't want")) {
      const concessionLower = concession.toLowerCase();
      if (generatedContent.toLowerCase().includes(concessionLower.replace("not seeking", "seeking")) ||
          generatedContent.toLowerCase().includes(concessionLower.replace("don't want", "claim"))) {
        warnings.push(`VIOLATION: Document claims something user explicitly waived: "${concession}"`);
      }
    }
  });

  return warnings;
}

/**
 * Generate system instructions for AI to respect locked facts
 */
export function generateFactLockInstructions(lockedFacts: LockedFact[]): string {
  const instructions = [
    "⚠️ CRITICAL: LOCKED FACTS - DO NOT MODIFY OR CONTRADICT",
    "",
    "The following facts have been confirmed by the user and are IMMUTABLE:",
    ""
  ];

  lockedFacts.forEach((fact, index) => {
    instructions.push(`${index + 1}. ${fact.field}: ${JSON.stringify(fact.value)}`);
  });

  instructions.push("");
  instructions.push("YOU MUST:");
  instructions.push("- Use these facts EXACTLY as stated");
  instructions.push("- Do NOT add details not provided");
  instructions.push("- Do NOT change times, amounts, or durations");
  instructions.push("- Do NOT claim amounts user has waived");
  instructions.push("- If a fact says 'approximately 11 hours', use EXACTLY that");
  instructions.push("- If user concedes something, do NOT claim it");
  instructions.push("");
  instructions.push("ANY VIOLATION WILL CAUSE DOCUMENT REJECTION.");

  return instructions.join("\n");
}
