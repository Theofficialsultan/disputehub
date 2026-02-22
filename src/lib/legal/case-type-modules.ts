/**
 * CASE-TYPE LOGIC MODULES
 * 
 * The KEY architectural component - these define the legal theory, allowed remedies,
 * and evidence requirements for each case type.
 * 
 * These modules plug into the universal document skeleton to generate domain-specific content.
 */

import { LegalForum } from "./forum-language-guard";

// ============================================================================
// CASE TYPE MODULE INTERFACE
// ============================================================================

export interface CaseTypeModule {
  id: string;
  name: string;
  domains: CaseDomain[];
  forums: LegalForum[];
  
  /** Legal theories that apply to this case type */
  legalTheories: LegalTheory[];
  
  /** What remedies/relief can be claimed */
  allowedRemedies: RemedyRule[];
  
  /** What remedies are FORBIDDEN */
  forbiddenRemedies: string[];
  
  /** Evidence expectations */
  evidenceRequirements: EvidenceRequirement[];
  
  /** Forum-specific language rules */
  languageRules: LanguageRule[];
  
  /** Proportionality rules (e.g. claim value vs document length) */
  proportionalityRules: ProportionalityRule[];
}

export type CaseDomain = 
  | "contract_debt"
  | "employment_wages"
  | "housing_disrepair"
  | "parking_ticket_private"
  | "consumer_goods"
  | "professional_fees"
  | "landlord_tenant"
  | "neighbor_dispute";

export interface LegalTheory {
  name: string;
  description: string;
  /** When this theory applies */
  applicableWhen: string[];
  /** Key legal tests */
  legalTests: string[];
  /** Statutory basis (if any) */
  statutoryBasis?: string;
}

export interface RemedyRule {
  remedy: string;
  description: string;
  /** Conditions for claiming this remedy */
  requiresUserConfirmation?: boolean;
  /** Maximum value or cap */
  cap?: number | "proportional";
}

export interface EvidenceRequirement {
  category: "critical" | "recommended" | "helpful";
  description: string;
  examples: string[];
}

export interface LanguageRule {
  use: string[];
  avoid: string[];
  context: string;
}

export interface ProportionalityRule {
  condition: string;
  maxLength?: string;
  maxComplexity?: string;
  warning?: string;
}

// ============================================================================
// MODULE: SELF-EMPLOYED UNPAID WORK (CONTRACT DEBT)
// ============================================================================

export const SelfEmployedUnpaidWorkModule: CaseTypeModule = {
  id: "contract_debt_self_employed",
  name: "Self-Employed Unpaid Work (Contract Debt)",
  domains: ["contract_debt"],
  forums: ["COUNTY_COURT_SMALL_CLAIMS", "COUNTY_COURT_FAST_TRACK"],
  
  legalTheories: [
    {
      name: "Contract Formation",
      description: "Establishing a binding agreement",
      applicableWhen: [
        "Clear offer and acceptance",
        "Agreement on rate/terms",
        "Work performed"
      ],
      legalTests: [
        "Offer",
        "Acceptance",
        "Consideration",
        "Intention to create legal relations"
      ]
    },
    {
      name: "Substantial Performance",
      description: "Contract performed except for minor deficiencies",
      applicableWhen: [
        "Work substantially completed",
        "Minor shortfall only"
      ],
      legalTests: [
        "Was the contract substantially performed?",
        "Is non-performance minor or material?"
      ]
    },
    {
      name: "Quantum Meruit",
      description: "Payment for work done (fallback if contract disputed)",
      applicableWhen: [
        "Work done but contract disputed",
        "No fixed price agreed",
        "Reasonable value claim"
      ],
      legalTests: [
        "Was work requested?",
        "Was work performed?",
        "What is reasonable value?"
      ]
    }
  ],
  
  allowedRemedies: [
    {
      remedy: "principal_sum",
      description: "The unpaid contractual amount",
      requiresUserConfirmation: false
    },
    {
      remedy: "statutory_interest",
      description: "Interest under s.69 County Courts Act 1984 (8% p.a.)",
      requiresUserConfirmation: true
    },
    {
      remedy: "court_fee",
      description: "The cost of issuing the claim",
      requiresUserConfirmation: false
    }
  ],
  
  forbiddenRemedies: [
    "distress",
    "injury to feelings",
    "costs (small claims)",
    "exemplary damages",
    "aggravated damages"
  ],
  
  evidenceRequirements: [
    {
      category: "critical",
      description: "Proof of agreement (rate/terms)",
      examples: [
        "WhatsApp messages confirming rate",
        "Email with job details",
        "Prior course of dealing at same rate"
      ]
    },
    {
      category: "critical",
      description: "Proof of work performed",
      examples: [
        "Photos of site/work",
        "Timesheet or log",
        "Third-party confirmation"
      ]
    },
    {
      category: "recommended",
      description: "Proof of non-payment",
      examples: [
        "Bank statement showing no payment",
        "Chasing messages",
        "Unfulfilled payment promise"
      ]
    }
  ],
  
  languageRules: [
    {
      use: ["breach of contract", "agreed fee", "services rendered", "sum due"],
      avoid: ["unfair dismissal", "unlawful deduction", "employment rights"],
      context: "This is a commercial debt claim, not employment"
    }
  ],
  
  proportionalityRules: [
    {
      condition: "claim_value < £1000",
      maxLength: "3 pages",
      maxComplexity: "simple",
      warning: "Keep it brief - judges hate waffle in small claims"
    }
  ]
};

// ============================================================================
// MODULE: EMPLOYMENT – UNPAID WAGES
// ============================================================================

export const EmploymentUnpaidWagesModule: CaseTypeModule = {
  id: "employment_unpaid_wages",
  name: "Employment – Unpaid Wages",
  domains: ["employment_wages"],
  forums: ["EMPLOYMENT_TRIBUNAL"],
  
  legalTheories: [
    {
      name: "Employment Status Test",
      description: "Establishing worker/employee status",
      applicableWhen: ["Claimed as worker", "Claimed as employee"],
      legalTests: [
        "Personal service",
        "Mutuality of obligation",
        "Control",
        "Integration into business"
      ],
      statutoryBasis: "Employment Rights Act 1996"
    },
    {
      name: "Unlawful Deduction of Wages",
      description: "Employer failed to pay wages owed",
      applicableWhen: ["Wages withheld", "Partial payment only"],
      legalTests: [
        "Was payment of wages due?",
        "Was deduction authorized?",
        "Was worker notified?"
      ],
      statutoryBasis: "s.13 Employment Rights Act 1996"
    },
    {
      name: "ACAS Early Conciliation",
      description: "Mandatory pre-claim requirement",
      applicableWhen: ["All employment tribunal claims"],
      legalTests: [
        "Was ACAS certificate obtained?",
        "Within time limit?"
      ],
      statutoryBasis: "s.18 Enterprise and Regulatory Reform Act 2013"
    }
  ],
  
  allowedRemedies: [
    {
      remedy: "unpaid_wages",
      description: "Wages owed for work performed"
    },
    {
      remedy: "unpaid_holiday_pay",
      description: "Accrued but unpaid holiday entitlement"
    },
    {
      remedy: "notice_pay",
      description: "Pay in lieu of notice (if applicable)",
      requiresUserConfirmation: true
    }
  ],
  
  forbiddenRemedies: [
    "interest (usually not claimed in ET)",
    "costs (except very limited circumstances)",
    "county court language"
  ],
  
  evidenceRequirements: [
    {
      category: "critical",
      description: "Proof of employment/worker status",
      examples: [
        "Contract of employment",
        "Payslips",
        "Rota/schedule",
        "Evidence of control"
      ]
    },
    {
      category: "critical",
      description: "Proof of hours worked",
      examples: [
        "Timesheets",
        "Clocking records",
        "Shift patterns",
        "Messages about shifts"
      ]
    },
    {
      category: "critical",
      description: "ACAS Early Conciliation certificate",
      examples: ["ACAS certificate with reference number"]
    }
  ],
  
  languageRules: [
    {
      use: ["unlawful deduction", "worker", "employment status", "ERA 1996"],
      avoid: ["breach of contract (use tribunal language)", "quantum meruit", "common law"],
      context: "Employment tribunal has its own statutory language"
    }
  ],
  
  proportionalityRules: [
    {
      condition: "claim_value < £5000",
      maxLength: "5 pages",
      warning: "ET judges prefer concise claims"
    }
  ]
};

// ============================================================================
// MODULE: HOUSING DISREPAIR
// ============================================================================

export const HousingDisrepairModule: CaseTypeModule = {
  id: "housing_disrepair",
  name: "Housing Disrepair",
  domains: ["housing_disrepair", "landlord_tenant"],
  forums: ["COUNTY_COURT_SMALL_CLAIMS", "COUNTY_COURT_FAST_TRACK"],
  
  legalTheories: [
    {
      name: "Landlord Repairing Obligations",
      description: "Statutory duty to repair",
      applicableWhen: ["Tenancy exists", "Landlord notified of disrepair"],
      legalTests: [
        "Is landlord responsible for repair?",
        "Was landlord given notice?",
        "Has reasonable time passed?"
      ],
      statutoryBasis: "s.11 Landlord and Tenant Act 1985"
    },
    {
      name: "Fitness for Human Habitation",
      description: "Property must be habitable",
      applicableWhen: ["Property uninhabitable", "Serious hazards"],
      legalTests: [
        "Is property unfit?",
        "Does it pose health/safety risk?"
      ],
      statutoryBasis: "Homes (Fitness for Human Habitation) Act 2018"
    }
  ],
  
  allowedRemedies: [
    {
      remedy: "rent_abatement",
      description: "Reduction in rent for period of disrepair",
      cap: "proportional"
    },
    {
      remedy: "damages_discomfort",
      description: "Compensation for loss of amenity/distress"
    },
    {
      remedy: "damages_property",
      description: "Damage to belongings"
    },
    {
      remedy: "repairs_order",
      description: "Order for landlord to carry out repairs",
      requiresUserConfirmation: true
    }
  ],
  
  forbiddenRemedies: [
    "rent withholding (not a remedy, potential breach)",
    "excessive distress damages"
  ],
  
  evidenceRequirements: [
    {
      category: "critical",
      description: "Proof of disrepair",
      examples: [
        "Photos of issues",
        "Videos",
        "Environmental health report"
      ]
    },
    {
      category: "critical",
      description: "Proof of notice to landlord",
      examples: [
        "Emails/letters to landlord",
        "Repair requests",
        "Landlord's knowledge"
      ]
    },
    {
      category: "recommended",
      description: "Impact evidence",
      examples: [
        "Doctor's note",
        "Receipts for damaged items",
        "Temporary accommodation costs"
      ]
    }
  ],
  
  languageRules: [
    {
      use: ["disrepair", "landlord's repairing obligations", "s.11 LTA 1985"],
      avoid: ["breach of contract (use statutory language)"],
      context: "Housing law has specific statutory framework"
    }
  ],
  
  proportionalityRules: [
    {
      condition: "minor_disrepair",
      maxLength: "4 pages",
      warning: "Don't over-claim for minor issues"
    }
  ]
};

// ============================================================================
// MODULE: PRIVATE PARKING TICKET
// ============================================================================

export const PrivateParkingTicketModule: CaseTypeModule = {
  id: "parking_ticket_private",
  name: "Private Parking Ticket Appeal",
  domains: ["parking_ticket_private"],
  forums: ["COUNTY_COURT_SMALL_CLAIMS"], // parking_appeals not in LegalForum type yet
  
  legalTheories: [
    {
      name: "Contractual Signage",
      description: "Was there a valid contract formed via signage?",
      applicableWhen: ["Private land parking charge"],
      legalTests: [
        "Were signs clear and visible?",
        "Did driver see signs?",
        "Were terms reasonable?"
      ]
    },
    {
      name: "Authority to Contract",
      description: "Did parking company have authority from landowner?",
      applicableWhen: ["Disputed parking charge"],
      legalTests: [
        "Is parking company authorized?",
        "Is landowner's permission valid?"
      ]
    },
    {
      name: "Keeper Liability",
      description: "Protection of Freedoms Act 2012 keeper liability",
      applicableWhen: ["Charge sent to registered keeper"],
      legalTests: [
        "Was NTK sent within 14 days?",
        "Does it comply with POFA requirements?"
      ],
      statutoryBasis: "Protection of Freedoms Act 2012"
    }
  ],
  
  allowedRemedies: [
    {
      remedy: "appeal",
      description: "Request cancellation of charge"
    },
    {
      remedy: "cancellation",
      description: "Full cancellation if appeal successful"
    }
  ],
  
  forbiddenRemedies: [
    "money claim (this is a defense, not a claim)",
    "damages",
    "costs (unless court proceedings)"
  ],
  
  evidenceRequirements: [
    {
      category: "critical",
      description: "Photos of signage (or lack thereof)",
      examples: [
        "Photos from driver's approach angle",
        "Wide shots showing visibility",
        "Close-ups of sign text"
      ]
    },
    {
      category: "recommended",
      description: "Timeline evidence",
      examples: [
        "Parking ticket timestamp",
        "Entry/exit times",
        "NTK receipt date"
      ]
    }
  ],
  
  languageRules: [
    {
      use: ["Notice to Keeper", "POFA 2012", "contractual signage", "BPA Code"],
      avoid: ["criminal offense", "penalty", "fine (it's a 'charge')"],
      context: "Private parking is contractual, not criminal"
    }
  ],
  
  proportionalityRules: [
    {
      condition: "appeal_stage",
      maxLength: "2 pages",
      warning: "Appeals should be brief and focused"
    }
  ]
};

// ============================================================================
// MODULE REGISTRY
// ============================================================================

export const CASE_TYPE_MODULES: Record<string, CaseTypeModule> = {
  "contract_debt_self_employed": SelfEmployedUnpaidWorkModule,
  "employment_unpaid_wages": EmploymentUnpaidWagesModule,
  "housing_disrepair": HousingDisrepairModule,
  "parking_ticket_private": PrivateParkingTicketModule,
};

// ============================================================================
// MODULE SELECTOR
// ============================================================================

export interface CaseProfile {
  domain: CaseDomain;
  forum: LegalForum;
  relationship?: string;
  claimValue?: number;
}

/**
 * Select the appropriate case type module based on case profile
 */
export function selectCaseTypeModule(profile: CaseProfile): CaseTypeModule | null {
  // Try to find exact match first
  const moduleKey = `${profile.domain}_${profile.relationship || ''}`.replace(/_+$/, '');
  
  if (CASE_TYPE_MODULES[moduleKey]) {
    return CASE_TYPE_MODULES[moduleKey];
  }
  
  // Fall back to domain match
  for (const module of Object.values(CASE_TYPE_MODULES)) {
    if (module.domains.includes(profile.domain) && module.forums.includes(profile.forum)) {
      return module;
    }
  }
  
  return null;
}

/**
 * Get allowed remedies for a case profile
 */
export function getAllowedRemedies(profile: CaseProfile): string[] {
  const module = selectCaseTypeModule(profile);
  return module ? module.allowedRemedies.map(r => r.remedy) : [];
}

/**
 * Get forbidden remedies for a case profile
 */
export function getForbiddenRemedies(profile: CaseProfile): string[] {
  const module = selectCaseTypeModule(profile);
  return module ? module.forbiddenRemedies : [];
}

/**
 * Check if a remedy is allowed for a case profile
 */
export function isRemedyAllowed(profile: CaseProfile, remedy: string): boolean {
  const module = selectCaseTypeModule(profile);
  if (!module) return false;
  
  return module.allowedRemedies.some(r => r.remedy === remedy);
}
