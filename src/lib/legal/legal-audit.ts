/**
 * ═══════════════════════════════════════════════════════════════════════════
 * POST-GENERATION LEGAL AUDIT (System 4 Light)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * FINAL SAFETY NET: Run all checks before delivering document to user.
 * 
 * This is the last line of defense against:
 * - Fact violations
 * - Forum language errors
 * - Relief misalignment
 * - Overclaiming
 * - Placeholders
 * - Length/proportion issues
 * 
 * If ANY critical check fails → DO NOT DELIVER DOCUMENT
 */

import type { CaseStrategy, EvidenceItem } from "@prisma/client";
import type { RoutingDecision } from "./routing-types";
import { validateAgainstLockedFacts, detectOverclaiming, type LockedFact } from "../ai/fact-lock";
import { validateForumLanguage, getForumFromRouting, type LegalForum } from "./forum-language-guard";
import { validateRelief, extractReliefFromDocument } from "./relief-validator";
import { checkEvidenceSufficiency, determineClaimType } from "./evidence-sufficiency";

export interface LegalAuditResult {
  passed: boolean;
  critical: string[];      // MUST fix - blocks delivery
  warnings: string[];      // Should fix - allows delivery but logged
  recommendations: string[]; // Nice to have - purely advisory
  score: number;           // 0-10
}

/**
 * Run comprehensive legal audit on generated document
 */
export async function auditGeneratedDocument(
  content: string,
  strategy: CaseStrategy,
  routingDecision: RoutingDecision,
  evidence: EvidenceItem[],
  lockedFacts: LockedFact[],
  claimValue?: number
): Promise<LegalAuditResult> {
  
  const critical: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  console.log(`[Legal Audit] Running comprehensive checks...`);

  // ============================================================================
  // CHECK 1: FACT VIOLATIONS
  // ============================================================================
  
  const factCheck = validateAgainstLockedFacts(content, lockedFacts);
  
  if (!factCheck.locked) {
    factCheck.violations.forEach(v => {
      if (v.includes("CRITICAL") || v.includes("placeholder")) {
        critical.push(`FACT VIOLATION: ${v}`);
      } else {
        warnings.push(`Fact inconsistency: ${v}`);
      }
    });
  }

  // ============================================================================
  // CHECK 2: OVERCLAIMING
  // ============================================================================
  
  const keyFacts = Array.isArray(strategy.keyFacts) 
    ? strategy.keyFacts as string[]
    : typeof strategy.keyFacts === 'string'
    ? JSON.parse(strategy.keyFacts)
    : [];

  const concessions = keyFacts.filter(f => 
    f.toLowerCase().includes("don't want") ||
    f.toLowerCase().includes("not claiming") ||
    f.toLowerCase().includes("not seeking")
  );

  const overclaimCheck = detectOverclaiming(content, keyFacts, concessions);
  
  if (overclaimCheck.length > 0) {
    overclaimCheck.forEach(w => {
      critical.push(`OVERCLAIMING: ${w}`);
    });
  }

  // ============================================================================
  // CHECK 3: FORUM LANGUAGE
  // ============================================================================
  
  const forum = getForumFromRouting(
    routingDecision.domain || "civil_debt",
    routingDecision.forum || "County Court"
  );

  const languageCheck = validateForumLanguage(content, forum);
  
  if (!languageCheck.valid) {
    languageCheck.forbiddenPhrases.forEach(phrase => {
      critical.push(`FORBIDDEN LANGUAGE: "${phrase}" not allowed in ${forum}`);
    });
    
    languageCheck.missingRequired.forEach(phrase => {
      warnings.push(`MISSING REQUIRED: "${phrase}" should appear in ${forum} document`);
    });
  }

  languageCheck.warnings.forEach(w => warnings.push(w));

  // ============================================================================
  // CHECK 4: RELIEF ALIGNMENT
  // ============================================================================
  
  const requestedRelief = extractReliefFromDocument(content);
  const reliefCheck = validateRelief(requestedRelief, forum, claimValue);

  if (!reliefCheck.valid) {
    reliefCheck.forbiddenRelief.forEach(r => {
      critical.push(`FORBIDDEN RELIEF: ${r.replace(/_/g, " ")} not available in ${forum}`);
    });
  }

  reliefCheck.warnings.forEach(w => warnings.push(w));

  // ============================================================================
  // CHECK 5: PROPORTIONALITY
  // ============================================================================
  
  const wordCount = content.split(/\s+/).length;
  const pageEstimate = Math.ceil(wordCount / 500);

  if (claimValue && claimValue < 1000) {
    if (wordCount > 1500) {
      warnings.push(`PROPORTIONALITY: Document is ${pageEstimate} pages for £${claimValue} claim - consider condensing`);
    }

    if (content.toLowerCase().includes("complex") || 
        content.toLowerCase().includes("sophisticated")) {
      warnings.push("LANGUAGE: Avoid complex language for small value claims - keep it simple");
    }
  }

  if (forum === "COUNTY_COURT_SMALL_CLAIMS" && pageEstimate > 3) {
    warnings.push(`LENGTH: ${pageEstimate} pages may be excessive for small claims - aim for 2-3 pages max`);
  }

  // ============================================================================
  // CHECK 6: AMOUNTS & CALCULATIONS
  // ============================================================================
  
  // Check for unfilled placeholders
  const placeholderRegex = /\[(AMOUNT|TOTAL|DATE|NAME|ADDRESS|YOUR)[^\]]*\]/gi;
  const placeholders = Array.from(content.matchAll(placeholderRegex));
  
  if (placeholders.length > 0) {
    placeholders.forEach(match => {
      critical.push(`PLACEHOLDER UNFILLED: "${match[0]}" - document not court-ready`);
    });
  }

  // Check for amount consistency
  const amounts = Array.from(content.matchAll(/£(\d+(?:,\d{3})*(?:\.\d{2})?)/g));
  if (claimValue && amounts.length > 0) {
    const claimedAmount = parseFloat(amounts[0][1].replace(/,/g, ''));
    
    if (Math.abs(claimedAmount - claimValue) > 0.01 && claimValue > 0) {
      warnings.push(`AMOUNT MISMATCH: Document claims £${claimedAmount} but case value is £${claimValue}`);
    }
  }

  // ============================================================================
  // CHECK 7: TIME SENSITIVITY (if near deadline)
  // ============================================================================
  
  if (routingDecision.timeLimitDeadline) {
    const deadline = new Date(routingDecision.timeLimitDeadline);
    const now = new Date();
    const daysToDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysToDeadline < 14 && daysToDeadline > 0) {
      if (!content.toLowerCase().includes("prompt")) {
        recommendations.push(`TIME LIMIT: ${daysToDeadline} days to deadline - consider adding "prompt action" language`);
      }
    }

    if (daysToDeadline < 0) {
      critical.push(`TIME LIMIT: Deadline has passed - claim may be statute-barred`);
    }
  }

  // ============================================================================
  // CHECK 8: EVIDENCE SUFFICIENCY
  // ============================================================================
  
  const claimType = determineClaimType(strategy.disputeType || "", forum);
  const evidenceCheck = checkEvidenceSufficiency(evidence, claimType);

  if (!evidenceCheck.hasCritical) {
    warnings.push(`EVIDENCE: Case would be stronger with critical evidence (see recommendations)`);
  }

  evidenceCheck.recommendations.forEach(r => recommendations.push(r));

  // ============================================================================
  // CALCULATE SCORE
  // ============================================================================
  
  let score = 10;

  // Critical issues: -2 points each
  score -= critical.length * 2;

  // Warnings: -0.5 points each
  score -= warnings.length * 0.5;

  // Floor at 0
  score = Math.max(0, score);

  // ============================================================================
  // DECISION
  // ============================================================================
  
  const passed = critical.length === 0;

  console.log(`[Legal Audit] Result: ${passed ? "PASSED" : "FAILED"}`);
  console.log(`[Legal Audit] Score: ${score.toFixed(1)}/10`);
  console.log(`[Legal Audit] Critical issues: ${critical.length}`);
  console.log(`[Legal Audit] Warnings: ${warnings.length}`);

  return {
    passed,
    critical,
    warnings,
    recommendations,
    score
  };
}

/**
 * Format audit result for logging/display
 */
export function formatAuditResult(result: LegalAuditResult): string {
  let report = `
═══════════════════════════════════════════════════════════════════════════
LEGAL AUDIT REPORT
═══════════════════════════════════════════════════════════════════════════

Status: ${result.passed ? "✅ PASSED" : "❌ FAILED"}
Score: ${result.score.toFixed(1)}/10

`;

  if (result.critical.length > 0) {
    report += `
❌ CRITICAL ISSUES (MUST FIX BEFORE FILING):
${result.critical.map((c, i) => `${i + 1}. ${c}`).join("\n")}

`;
  }

  if (result.warnings.length > 0) {
    report += `
⚠️  WARNINGS (SHOULD REVIEW):
${result.warnings.map((w, i) => `${i + 1}. ${w}`).join("\n")}

`;
  }

  if (result.recommendations.length > 0) {
    report += `
💡 RECOMMENDATIONS:
${result.recommendations.map((r, i) => `${i + 1}. ${r}`).join("\n")}

`;
  }

  if (result.passed && result.warnings.length === 0 && result.recommendations.length === 0) {
    report += `
✅ DOCUMENT IS COURT-READY

All checks passed. Document can be filed.

`;
  }

  report += `═══════════════════════════════════════════════════════════════════════════`;

  return report;
}

/**
 * Quick check - just return pass/fail
 */
export function quickAudit(
  content: string,
  lockedFacts: LockedFact[]
): { passed: boolean; reason?: string } {
  // Check for placeholders
  if (content.match(/\[(AMOUNT|TOTAL|DATE|NAME|ADDRESS|YOUR)[^\]]*\]/i)) {
    return {
      passed: false,
      reason: "Document contains unfilled placeholders"
    };
  }

  // Check fact violations
  const factCheck = validateAgainstLockedFacts(content, lockedFacts);
  if (!factCheck.locked && factCheck.violations.some(v => v.includes("CRITICAL"))) {
    return {
      passed: false,
      reason: "Critical fact violations detected"
    };
  }

  return { passed: true };
}
