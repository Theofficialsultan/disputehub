/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EVIDENCE SUFFICIENCY CHECKER
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * CRITICAL: Check if user has uploaded enough evidence to support their claim.
 * 
 * Does NOT block generation - but warns user if case would be stronger.
 * 
 * Prevents:
 * - Filing without key evidence (rate confirmation, contract, etc.)
 * - Proceeding with weak cases unknowingly
 * - Setting false expectations
 */

import type { EvidenceItem } from "@prisma/client";
import type { LegalForum } from "./forum-language-guard";

export type EvidenceType =
  | "RATE_CONFIRMATION"        // Email/text confirming hourly rate
  | "INVOICE"                  // Invoice showing amount due
  | "CONTRACT"                 // Written contract
  | "PAYSLIP"                  // Wage slip
  | "BANK_STATEMENT"           // Bank transaction
  | "EMPLOYMENT_CONTRACT"      // Employment contract
  | "ROTA"                     // Work rota/schedule
  | "CORRESPONDENCE"           // Emails, letters, texts
  | "PHOTO"                    // Photographic evidence
  | "VIDEO"                    // Video evidence
  | "WITNESS_STATEMENT"        // Statement from witness
  | "EXPERT_REPORT"            // Expert opinion
  | "MEDICAL_EVIDENCE"         // Medical report
  | "DECISION_LETTER"          // DWP/HMRC decision
  | "LEASE"                    // Tenancy agreement
  | "SERVICE_CHARGE_DEMAND";   // Service charge invoice

/**
 * Required evidence for each type of claim
 */
export const EVIDENCE_REQUIREMENTS: Record<string, {
  critical: EvidenceType[];      // MUST have at least ONE
  recommended: EvidenceType[];   // Should have
  helpful: EvidenceType[];       // Nice to have
}> = {
  // Civil debt claims
  "DEBT_UNPAID_SERVICES": {
    critical: [
      "RATE_CONFIRMATION",     // OR
      "INVOICE",               // OR
      "CONTRACT"               // OR correspondence showing agreement
    ],
    recommended: [
      "CORRESPONDENCE",        // Chasing payment
      "PHOTO"                  // Proof of attendance/work done
    ],
    helpful: [
      "BANK_STATEMENT",        // Prior payments at same rate
      "WITNESS_STATEMENT"
    ]
  },

  "DEBT_GOODS_SOLD": {
    critical: [
      "INVOICE",
      "CONTRACT"               // OR correspondence
    ],
    recommended: [
      "CORRESPONDENCE",
      "BANK_STATEMENT"         // Delivery confirmation
    ],
    helpful: [
      "PHOTO"                  // Photo of goods delivered
    ]
  },

  // Employment claims
  "EMPLOYMENT_UNPAID_WAGES": {
    critical: [
      "EMPLOYMENT_CONTRACT",   // OR
      "PAYSLIP",               // OR
      "ROTA"                   // OR correspondence confirming rate
    ],
    recommended: [
      "BANK_STATEMENT",        // Previous payments
      "CORRESPONDENCE"         // Requesting payment
    ],
    helpful: [
      "WITNESS_STATEMENT"
    ]
  },

  "EMPLOYMENT_UNFAIR_DISMISSAL": {
    critical: [
      "EMPLOYMENT_CONTRACT",   // Showing employment status
      "CORRESPONDENCE"         // Dismissal letter or evidence
    ],
    recommended: [
      "PAYSLIP",               // Proof of employment
      "ROTA",
      "WITNESS_STATEMENT"
    ],
    helpful: [
      "MEDICAL_EVIDENCE"       // If health-related
    ]
  },

  // Benefits appeals
  "BENEFITS_APPEAL": {
    critical: [
      "DECISION_LETTER"        // MANDATORY - must have DWP decision
    ],
    recommended: [
      "MEDICAL_EVIDENCE",
      "CORRESPONDENCE"
    ],
    helpful: [
      "WITNESS_STATEMENT",
      "EXPERT_REPORT"
    ]
  },

  // Property
  "PROPERTY_SERVICE_CHARGE": {
    critical: [
      "LEASE",
      "SERVICE_CHARGE_DEMAND"
    ],
    recommended: [
      "CORRESPONDENCE",
      "BANK_STATEMENT"         // Payments made
    ],
    helpful: [
      "EXPERT_REPORT"          // If challenging reasonableness
    ]
  }
};

/**
 * Analyze uploaded evidence
 */
export function analyzeEvidence(
  evidence: EvidenceItem[]
): Map<EvidenceType, EvidenceItem[]> {
  const categorized = new Map<EvidenceType, EvidenceItem[]>();

  evidence.forEach(item => {
    const types = categorizeEvidence(item);
    types.forEach(type => {
      if (!categorized.has(type)) {
        categorized.set(type, []);
      }
      categorized.get(type)!.push(item);
    });
  });

  return categorized;
}

/**
 * Categorize a single evidence item
 */
function categorizeEvidence(item: EvidenceItem): EvidenceType[] {
  const types: EvidenceType[] = [];
  const titleLower = (item.title || "").toLowerCase();
  const fileNameLower = item.fileName.toLowerCase();
  const descLower = (item.description || "").toLowerCase();

  const allText = `${titleLower} ${fileNameLower} ${descLower}`;

  // Rate confirmation
  if (allText.match(/rate|£\d+.*hour|pay.*hour|agreed.*£/)) {
    types.push("RATE_CONFIRMATION");
  }

  // Invoice
  if (allText.match(/invoice|bill|quot/)) {
    types.push("INVOICE");
  }

  // Contract
  if (allText.match(/contract|agreement/)) {
    types.push("CONTRACT");
  }

  // Employment contract
  if (allText.match(/employment.*contract|job.*contract|offer.*letter/)) {
    types.push("EMPLOYMENT_CONTRACT");
  }

  // Payslip
  if (allText.match(/payslip|pay.*slip|wage.*slip|p60|p45/)) {
    types.push("PAYSLIP");
  }

  // Rota
  if (allText.match(/rota|schedule|shift|roster/)) {
    types.push("ROTA");
  }

  // Bank statement
  if (allText.match(/bank.*statement|transaction|payment.*proof/)) {
    types.push("BANK_STATEMENT");
  }

  // Correspondence
  if (allText.match(/email|letter|text|message|whatsapp|correspondence/)) {
    types.push("CORRESPONDENCE");
  }

  // Photo
  if (item.fileType === "IMAGE" || allText.match(/photo|picture|image|jpg|png/)) {
    types.push("PHOTO");
  }

  // Video
  if (item.fileType === "VIDEO" || allText.match(/video|mp4|recording/)) {
    types.push("VIDEO");
  }

  // Decision letter
  if (allText.match(/decision.*letter|dwp|hmrc.*decision|esa.*decision|pip.*decision/)) {
    types.push("DECISION_LETTER");
  }

  // Medical
  if (allText.match(/medical|doctor|gp|hospital|diagnosis|prescription/)) {
    types.push("MEDICAL_EVIDENCE");
  }

  // Lease
  if (allText.match(/lease|tenancy.*agreement/)) {
    types.push("LEASE");
  }

  // Service charge
  if (allText.match(/service.*charge|ground.*rent|maintenance.*fee/)) {
    types.push("SERVICE_CHARGE_DEMAND");
  }

  return types;
}

/**
 * Check evidence sufficiency for a claim type
 */
export function checkEvidenceSufficiency(
  evidence: EvidenceItem[],
  claimType: string
): {
  sufficient: boolean;
  hasCritical: boolean;
  missing: {
    critical: EvidenceType[];
    recommended: EvidenceType[];
  };
  recommendations: string[];
} {
  const requirements = EVIDENCE_REQUIREMENTS[claimType];
  
  if (!requirements) {
    // Unknown claim type - assume sufficient
    return {
      sufficient: true,
      hasCritical: true,
      missing: { critical: [], recommended: [] },
      recommendations: []
    };
  }

  const categorized = analyzeEvidence(evidence);
  const hasTypes = new Set(categorized.keys());

  // Check if we have at least ONE critical evidence type
  const hasCritical = requirements.critical.some(type => hasTypes.has(type));

  // Find missing evidence
  const missingCritical = requirements.critical.filter(type => !hasTypes.has(type));
  const missingRecommended = requirements.recommended.filter(type => !hasTypes.has(type));

  // Generate recommendations
  const recommendations: string[] = [];

  if (!hasCritical) {
    recommendations.push(
      `⚠️  CRITICAL: Your case would be stronger with evidence of: ${missingCritical.map(t => t.replace(/_/g, ' ').toLowerCase()).join(" OR ")}`
    );
  }

  if (missingRecommended.length > 0) {
    recommendations.push(
      `📋 RECOMMENDED: Consider uploading: ${missingRecommended.slice(0, 2).map(t => t.replace(/_/g, ' ').toLowerCase()).join(", ")}`
    );
  }

  // Special warnings
  if (claimType === "DEBT_UNPAID_SERVICES" && !hasTypes.has("RATE_CONFIRMATION")) {
    recommendations.push(
      "💡 TIP: Evidence confirming the agreed rate (email, text, previous invoice) would significantly strengthen your claim"
    );
  }

  if (claimType.includes("EMPLOYMENT") && !hasTypes.has("PAYSLIP") && !hasTypes.has("EMPLOYMENT_CONTRACT")) {
    recommendations.push(
      "💡 TIP: Payslips or an employment contract would help prove your employment status and usual pay"
    );
  }

  return {
    sufficient: hasCritical || evidence.length > 0, // Don't block, but flag
    hasCritical,
    missing: {
      critical: missingCritical,
      recommended: missingRecommended
    },
    recommendations
  };
}

/**
 * Determine claim type from case strategy
 */
export function determineClaimType(
  disputeType: string,
  forum: LegalForum
): string {
  const typeUpper = disputeType.toUpperCase();

  if (forum === "COUNTY_COURT_SMALL_CLAIMS") {
    if (typeUpper.includes("SERVICE") || typeUpper.includes("WORK")) {
      return "DEBT_UNPAID_SERVICES";
    }
    if (typeUpper.includes("GOODS") || typeUpper.includes("SALE")) {
      return "DEBT_GOODS_SOLD";
    }
  }

  if (forum === "EMPLOYMENT_TRIBUNAL") {
    if (typeUpper.includes("WAGE") || typeUpper.includes("PAY")) {
      return "EMPLOYMENT_UNPAID_WAGES";
    }
    if (typeUpper.includes("DISMISS") || typeUpper.includes("TERMINATION")) {
      return "EMPLOYMENT_UNFAIR_DISMISSAL";
    }
  }

  if (forum === "SOCIAL_SECURITY_TRIBUNAL") {
    return "BENEFITS_APPEAL";
  }

  if (forum === "PROPERTY_TRIBUNAL") {
    if (typeUpper.includes("SERVICE") || typeUpper.includes("CHARGE")) {
      return "PROPERTY_SERVICE_CHARGE";
    }
  }

  return "UNKNOWN";
}

/**
 * Generate evidence sufficiency report for user
 */
export function generateEvidenceReport(
  evidence: EvidenceItem[],
  claimType: string
): string {
  const check = checkEvidenceSufficiency(evidence, claimType);

  if (check.recommendations.length === 0) {
    return `✅ Evidence uploaded: ${evidence.length} item(s) - sufficient for filing`;
  }

  return `
📊 Evidence Assessment

Uploaded: ${evidence.length} item(s)
${check.hasCritical ? "✅" : "⚠️"} Critical evidence: ${check.hasCritical ? "Present" : "Missing"}

${check.recommendations.join("\n\n")}

${!check.hasCritical ? `
⚠️  You can still file this claim, but be aware that without key evidence, the court/tribunal may:
   • Ask for more information
   • Question the basis of your claim
   • Find against you if the other side disputes it

Consider uploading additional evidence before proceeding.
` : ""}
  `.trim();
}
