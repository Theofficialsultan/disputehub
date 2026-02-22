/**
 * TIER CLASSIFICATION SYSTEM
 * 
 * Helps route users to the appropriate document type based on their dispute stage:
 * - Tier 1: Simple letters (direct resolution)
 * - Tier 2: Complex/ADR (pre-action, ombudsman)
 * - Tier 3: Court/Tribunal (formal proceedings)
 */

import type { OfficialFormID } from "./form-registry";

// ============================================================================
// TIER DEFINITIONS
// ============================================================================

export type DisputeTier = "TIER_1_SIMPLE" | "TIER_2_ADR" | "TIER_3_COURT";

export interface TierInfo {
  tier: DisputeTier;
  name: string;
  description: string;
  documents: OfficialFormID[];
  prerequisites: string[];
  typicalDuration: string;
  costRange: string;
}

// ============================================================================
// TIER 1: SIMPLE LETTERS
// ============================================================================

export const TIER_1: TierInfo = {
  tier: "TIER_1_SIMPLE",
  name: "Direct Resolution",
  description: "Quick letters to resolve issues without escalation",
  typicalDuration: "1-4 weeks",
  costRange: "Free (self-representation)",
  prerequisites: [],
  documents: [
    "UK-COMPLAINT-LETTER-GENERAL",
    "UK-DEMAND-LETTER-GENERAL",
    "UK-REFUND-REQUEST-LETTER",
    "UK-GRIEVANCE-LETTER-EMPLOYMENT",
    "UK-SECTION-75-CREDIT-CARD-CLAIM",
    "UK-CHARGEBACK-REQUEST-LETTER",
    "UK-WARRANTY-CLAIM-LETTER",
    "UK-INSURANCE-CLAIM-LETTER",
    "UK-CANCELLATION-LETTER",
    "UK-CEASE-AND-DESIST-LETTER",
  ],
};

// ============================================================================
// TIER 2: COMPLEX / ADR
// ============================================================================

export const TIER_2: TierInfo = {
  tier: "TIER_2_ADR",
  name: "Pre-Action & ADR",
  description: "Formal steps before court, alternative resolution pathways",
  typicalDuration: "4-12 weeks",
  costRange: "Free to £500",
  prerequisites: [
    "You have already complained directly to the organisation",
    "You have received a final response OR waited the required time",
  ],
  documents: [
    // Pre-Action
    "UK-LBA-GENERAL",
    "UK-LBC-PRE-ACTION-PROTOCOL",
    
    // Data Protection
    "UK-SAR-GDPR-REQUEST",
    "UK-FOI-REQUEST-LETTER",
    "UK-ICO-COMPLAINT-FORM",
    
    // Ombudsman Services
    "UK-FOS-COMPLAINT-FORM",
    "UK-HO-COMPLAINT-FORM",
    "UK-LGSCO-LOCAL-GOV-OMBUDSMAN",
    "UK-PHSO-PARLIAMENTARY-HEALTH-OMBUDSMAN",
    "UK-ENERGY-OMBUDSMAN-COMPLAINT",
    "UK-LEGAL-OMBUDSMAN-COMPLAINT",
    
    // Other ADR
    "UK-INTERNAL-APPEAL-LETTER",
    "UK-MEDIATION-REQUEST-LETTER",
  ],
};

// ============================================================================
// TIER 3: COURT / TRIBUNAL
// ============================================================================

export const TIER_3: TierInfo = {
  tier: "TIER_3_COURT",
  name: "Formal Proceedings",
  description: "Court or tribunal filings for legal resolution",
  typicalDuration: "3-18 months",
  costRange: "£35-£10,000+",
  prerequisites: [
    "You have sent a Letter Before Action (LBA) and waited 14+ days",
    "For Employment Tribunal: ACAS Early Conciliation completed",
    "For Benefits: Mandatory Reconsideration completed",
    "Alternative resolution has failed or is not appropriate",
  ],
  documents: [
    // Employment Tribunal
    "UK-ET1-EMPLOYMENT-TRIBUNAL-2024",
    "UK-ET-SCHEDULE-OF-LOSS",
    "UK-CPR32-WITNESS-STATEMENT",
    
    // County Court
    "UK-N1-COUNTY-COURT-CLAIM",
    "UK-N1-PARTICULARS-OF-CLAIM",
    "UK-SCHEDULE-OF-DAMAGES",
    "UK-EVIDENCE-BUNDLE-INDEX",
    "UK-CHRONOLOGY-OF-EVENTS",
    
    // Social Security / Benefits
    "UK-SSCS1-SOCIAL-SECURITY-APPEAL",
    
    // Immigration
    "UK-IAFT5-IMMIGRATION-APPEAL",
    
    // Property
    "UK-FTT-PROP-APPLICATION",
    "UK-FTT-LEASEHOLD-APPLICATION",
    "UK-FTT-SERVICE-CHARGE-DISPUTE",
    
    // Tax
    "UK-FTT-TAX-APPEAL-NOTICE",
    
    // Parking/Traffic
    "UK-POPLA-PARKING-APPEAL",
    "UK-TEC-TRAFFIC-PENALTY-APPEAL",
  ],
};

// ============================================================================
// DISPUTE CATEGORY TO TIER MAPPING
// ============================================================================

export interface DisputeCategory {
  id: string;
  name: string;
  description: string;
  tier1Options: string[]; // Document IDs available at Tier 1
  tier2Options: string[]; // Document IDs available at Tier 2
  tier3Options: string[]; // Document IDs available at Tier 3
  recommendedStartTier: DisputeTier;
  specialRequirements?: string[];
}

export const DISPUTE_CATEGORIES: DisputeCategory[] = [
  {
    id: "consumer_goods",
    name: "Consumer Goods",
    description: "Faulty products, refunds, warranties",
    recommendedStartTier: "TIER_1_SIMPLE",
    tier1Options: [
      "UK-COMPLAINT-LETTER-GENERAL",
      "UK-REFUND-REQUEST-LETTER",
      "UK-WARRANTY-CLAIM-LETTER",
      "UK-SECTION-75-CREDIT-CARD-CLAIM",
      "UK-CHARGEBACK-REQUEST-LETTER",
    ],
    tier2Options: [
      "UK-LBA-GENERAL",
      "UK-MEDIATION-REQUEST-LETTER",
    ],
    tier3Options: [
      "UK-N1-COUNTY-COURT-CLAIM",
      "UK-N1-PARTICULARS-OF-CLAIM",
      "UK-SCHEDULE-OF-DAMAGES",
    ],
  },
  {
    id: "consumer_services",
    name: "Consumer Services",
    description: "Bad service, professional negligence",
    recommendedStartTier: "TIER_1_SIMPLE",
    tier1Options: [
      "UK-COMPLAINT-LETTER-GENERAL",
      "UK-REFUND-REQUEST-LETTER",
      "UK-SECTION-75-CREDIT-CARD-CLAIM",
    ],
    tier2Options: [
      "UK-LBA-GENERAL",
      "UK-LEGAL-OMBUDSMAN-COMPLAINT",
      "UK-MEDIATION-REQUEST-LETTER",
    ],
    tier3Options: [
      "UK-N1-COUNTY-COURT-CLAIM",
      "UK-N1-PARTICULARS-OF-CLAIM",
    ],
  },
  {
    id: "employment_wages",
    name: "Employment - Unpaid Wages",
    description: "Wages, holiday pay, notice pay owed",
    recommendedStartTier: "TIER_1_SIMPLE",
    tier1Options: [
      "UK-DEMAND-LETTER-GENERAL",
      "UK-GRIEVANCE-LETTER-EMPLOYMENT",
    ],
    tier2Options: [
      "UK-LBA-GENERAL",
      "UK-MEDIATION-REQUEST-LETTER",
    ],
    tier3Options: [
      "UK-ET1-EMPLOYMENT-TRIBUNAL-2024",
      "UK-ET-SCHEDULE-OF-LOSS",
      "UK-N1-COUNTY-COURT-CLAIM", // Contract claims can go to CC
    ],
    specialRequirements: ["ACAS Early Conciliation required before Employment Tribunal"],
  },
  {
    id: "employment_dismissal",
    name: "Employment - Unfair Dismissal",
    description: "Wrongful termination, redundancy issues",
    recommendedStartTier: "TIER_1_SIMPLE",
    tier1Options: [
      "UK-GRIEVANCE-LETTER-EMPLOYMENT",
      "UK-INTERNAL-APPEAL-LETTER",
    ],
    tier2Options: [
      "UK-LBA-GENERAL",
      "UK-MEDIATION-REQUEST-LETTER",
    ],
    tier3Options: [
      "UK-ET1-EMPLOYMENT-TRIBUNAL-2024",
      "UK-ET-SCHEDULE-OF-LOSS",
      "UK-CPR32-WITNESS-STATEMENT",
    ],
    specialRequirements: [
      "ACAS Early Conciliation required",
      "3 month time limit from dismissal date",
      "Must have 2 years continuous employment for ordinary unfair dismissal",
    ],
  },
  {
    id: "employment_discrimination",
    name: "Employment - Discrimination",
    description: "Protected characteristic discrimination",
    recommendedStartTier: "TIER_1_SIMPLE",
    tier1Options: [
      "UK-GRIEVANCE-LETTER-EMPLOYMENT",
    ],
    tier2Options: [
      "UK-LBA-GENERAL",
      "UK-SAR-GDPR-REQUEST",
    ],
    tier3Options: [
      "UK-ET1-EMPLOYMENT-TRIBUNAL-2024",
      "UK-ET-SCHEDULE-OF-LOSS",
      "UK-CPR32-WITNESS-STATEMENT",
    ],
    specialRequirements: [
      "ACAS Early Conciliation required",
      "3 month time limit",
      "No minimum service required",
    ],
  },
  {
    id: "contractor_payment",
    name: "Contractor/Freelancer Payment",
    description: "Unpaid invoices, contract disputes",
    recommendedStartTier: "TIER_1_SIMPLE",
    tier1Options: [
      "UK-DEMAND-LETTER-GENERAL",
    ],
    tier2Options: [
      "UK-LBA-GENERAL",
      "UK-MEDIATION-REQUEST-LETTER",
    ],
    tier3Options: [
      "UK-N1-COUNTY-COURT-CLAIM",
      "UK-N1-PARTICULARS-OF-CLAIM",
      "UK-SCHEDULE-OF-DAMAGES",
    ],
  },
  {
    id: "housing_deposit",
    name: "Housing - Deposit Dispute",
    description: "Unreturned or unfairly deducted deposit",
    recommendedStartTier: "TIER_1_SIMPLE",
    tier1Options: [
      "UK-DEMAND-LETTER-GENERAL",
    ],
    tier2Options: [
      "UK-LBA-GENERAL",
      // Deposit schemes have their own ADR
    ],
    tier3Options: [
      "UK-N1-COUNTY-COURT-CLAIM",
      "UK-N1-PARTICULARS-OF-CLAIM",
    ],
    specialRequirements: [
      "Check if deposit was protected in a scheme",
      "If not protected, can claim 1-3x deposit as penalty",
    ],
  },
  {
    id: "housing_disrepair",
    name: "Housing - Disrepair",
    description: "Landlord not maintaining property",
    recommendedStartTier: "TIER_1_SIMPLE",
    tier1Options: [
      "UK-COMPLAINT-LETTER-GENERAL",
    ],
    tier2Options: [
      "UK-LBA-GENERAL",
      "UK-HO-COMPLAINT-FORM", // Housing Ombudsman (social housing)
      "UK-LGSCO-LOCAL-GOV-OMBUDSMAN",
    ],
    tier3Options: [
      "UK-N1-COUNTY-COURT-CLAIM",
      "UK-FTT-PROP-APPLICATION",
    ],
  },
  {
    id: "financial_services",
    name: "Financial Services",
    description: "Bank, insurance, investment disputes",
    recommendedStartTier: "TIER_1_SIMPLE",
    tier1Options: [
      "UK-COMPLAINT-LETTER-GENERAL",
      "UK-SECTION-75-CREDIT-CARD-CLAIM",
      "UK-CHARGEBACK-REQUEST-LETTER",
    ],
    tier2Options: [
      "UK-FOS-COMPLAINT-FORM",
      "UK-SAR-GDPR-REQUEST",
    ],
    tier3Options: [
      "UK-N1-COUNTY-COURT-CLAIM",
    ],
    specialRequirements: [
      "Must complain to provider first",
      "Wait 8 weeks or receive final response before FOS",
    ],
  },
  {
    id: "utilities",
    name: "Utility Bills & Services",
    description: "Gas, electricity, water disputes",
    recommendedStartTier: "TIER_1_SIMPLE",
    tier1Options: [
      "UK-COMPLAINT-LETTER-GENERAL",
    ],
    tier2Options: [
      "UK-ENERGY-OMBUDSMAN-COMPLAINT",
    ],
    tier3Options: [
      "UK-N1-COUNTY-COURT-CLAIM",
    ],
    specialRequirements: [
      "Must complain to supplier first",
      "Wait 8 weeks or get deadlock letter",
    ],
  },
  {
    id: "data_protection",
    name: "Data Protection & Privacy",
    description: "GDPR breaches, data access requests",
    recommendedStartTier: "TIER_2_ADR",
    tier1Options: [],
    tier2Options: [
      "UK-SAR-GDPR-REQUEST",
      "UK-FOI-REQUEST-LETTER",
      "UK-ICO-COMPLAINT-FORM",
    ],
    tier3Options: [
      "UK-N1-COUNTY-COURT-CLAIM",
    ],
  },
  {
    id: "benefits",
    name: "Benefits & Welfare",
    description: "DWP decisions, benefits appeals",
    recommendedStartTier: "TIER_2_ADR",
    tier1Options: [],
    tier2Options: [
      // Mandatory reconsideration first
    ],
    tier3Options: [
      "UK-SSCS1-SOCIAL-SECURITY-APPEAL",
    ],
    specialRequirements: [
      "Mandatory Reconsideration MUST be completed first",
      "1 month time limit after MR decision",
    ],
  },
  {
    id: "local_authority",
    name: "Local Authority / Council",
    description: "Council services, planning, social care",
    recommendedStartTier: "TIER_1_SIMPLE",
    tier1Options: [
      "UK-COMPLAINT-LETTER-GENERAL",
    ],
    tier2Options: [
      "UK-FOI-REQUEST-LETTER",
      "UK-SAR-GDPR-REQUEST",
      "UK-LGSCO-LOCAL-GOV-OMBUDSMAN",
    ],
    tier3Options: [
      "UK-N1-COUNTY-COURT-CLAIM",
    ],
  },
  {
    id: "nhs_healthcare",
    name: "NHS & Healthcare",
    description: "Medical treatment, NHS complaints",
    recommendedStartTier: "TIER_1_SIMPLE",
    tier1Options: [
      "UK-COMPLAINT-LETTER-GENERAL",
    ],
    tier2Options: [
      "UK-SAR-GDPR-REQUEST",
      "UK-PHSO-PARLIAMENTARY-HEALTH-OMBUDSMAN",
    ],
    tier3Options: [
      "UK-N1-COUNTY-COURT-CLAIM", // Clinical negligence
    ],
    specialRequirements: [
      "Must complete NHS complaints procedure first",
      "Clinical negligence claims need expert evidence",
    ],
  },
  {
    id: "parking",
    name: "Parking Tickets",
    description: "Private parking charges, council PCNs",
    recommendedStartTier: "TIER_2_ADR",
    tier1Options: [],
    tier2Options: [
      // Appeal to operator first
    ],
    tier3Options: [
      "UK-POPLA-PARKING-APPEAL",
      "UK-TEC-TRAFFIC-PENALTY-APPEAL",
    ],
  },
  {
    id: "harassment",
    name: "Harassment & Defamation",
    description: "Stalking, online abuse, defamatory statements",
    recommendedStartTier: "TIER_1_SIMPLE",
    tier1Options: [
      "UK-CEASE-AND-DESIST-LETTER",
    ],
    tier2Options: [
      "UK-LBA-GENERAL",
      "UK-ICO-COMPLAINT-FORM", // For data/privacy aspects
    ],
    tier3Options: [
      "UK-N1-COUNTY-COURT-CLAIM",
    ],
    specialRequirements: [
      "Consider reporting to police for criminal harassment",
      "Keep evidence of all incidents",
    ],
  },
  {
    id: "leasehold",
    name: "Leasehold & Service Charges",
    description: "Service charge disputes, lease issues",
    recommendedStartTier: "TIER_1_SIMPLE",
    tier1Options: [
      "UK-COMPLAINT-LETTER-GENERAL",
    ],
    tier2Options: [
      "UK-LBA-GENERAL",
    ],
    tier3Options: [
      "UK-FTT-LEASEHOLD-APPLICATION",
      "UK-FTT-SERVICE-CHARGE-DISPUTE",
    ],
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the recommended tier for a dispute category
 */
export function getRecommendedTier(categoryId: string): DisputeTier {
  const category = DISPUTE_CATEGORIES.find(c => c.id === categoryId);
  return category?.recommendedStartTier || "TIER_1_SIMPLE";
}

/**
 * Get available documents for a category and tier
 */
export function getDocumentsForCategoryAndTier(
  categoryId: string,
  tier: DisputeTier
): OfficialFormID[] {
  const category = DISPUTE_CATEGORIES.find(c => c.id === categoryId);
  if (!category) return [];
  
  switch (tier) {
    case "TIER_1_SIMPLE":
      return category.tier1Options as OfficialFormID[];
    case "TIER_2_ADR":
      return category.tier2Options as OfficialFormID[];
    case "TIER_3_COURT":
      return category.tier3Options as OfficialFormID[];
    default:
      return [];
  }
}

/**
 * Get all tiers with their info
 */
export function getAllTiers(): TierInfo[] {
  return [TIER_1, TIER_2, TIER_3];
}

/**
 * Get tier info by tier type
 */
export function getTierInfo(tier: DisputeTier): TierInfo {
  switch (tier) {
    case "TIER_1_SIMPLE":
      return TIER_1;
    case "TIER_2_ADR":
      return TIER_2;
    case "TIER_3_COURT":
      return TIER_3;
  }
}

/**
 * Check if a document is appropriate for a tier
 */
export function isDocumentInTier(formId: OfficialFormID, tier: DisputeTier): boolean {
  const tierInfo = getTierInfo(tier);
  return tierInfo.documents.includes(formId);
}

/**
 * Get the tier a document belongs to
 */
export function getDocumentTier(formId: OfficialFormID): DisputeTier {
  if (TIER_1.documents.includes(formId)) return "TIER_1_SIMPLE";
  if (TIER_2.documents.includes(formId)) return "TIER_2_ADR";
  return "TIER_3_COURT";
}

/**
 * Get special requirements for a category
 */
export function getCategoryRequirements(categoryId: string): string[] {
  const category = DISPUTE_CATEGORIES.find(c => c.id === categoryId);
  return category?.specialRequirements || [];
}

/**
 * Suggest next steps based on current tier and outcome
 */
export function suggestEscalation(
  categoryId: string,
  currentTier: DisputeTier,
  outcome: "no_response" | "rejected" | "partial" | "resolved"
): { nextTier: DisputeTier | null; documents: OfficialFormID[]; advice: string } {
  const category = DISPUTE_CATEGORIES.find(c => c.id === categoryId);
  
  if (outcome === "resolved") {
    return {
      nextTier: null,
      documents: [],
      advice: "Great! Your dispute has been resolved. Keep records for future reference.",
    };
  }
  
  if (currentTier === "TIER_1_SIMPLE") {
    return {
      nextTier: "TIER_2_ADR",
      documents: category?.tier2Options as OfficialFormID[] || [],
      advice: "Consider escalating to a formal Letter Before Action or relevant Ombudsman.",
    };
  }
  
  if (currentTier === "TIER_2_ADR") {
    return {
      nextTier: "TIER_3_COURT",
      documents: category?.tier3Options as OfficialFormID[] || [],
      advice: "If ADR has failed, you may need to consider court or tribunal proceedings.",
    };
  }
  
  return {
    nextTier: null,
    documents: [],
    advice: "You are at the final tier. Consult a solicitor for complex matters.",
  };
}
