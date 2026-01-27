/**
 * OFFICIAL UK LEGAL FORM REGISTRY
 * 
 * This registry defines all official UK legal forms with explicit IDs,
 * metadata, and validation rules. System 3 can ONLY generate forms
 * that exist in this registry.
 */

// ============================================================================
// OFFICIAL FORM IDs (Explicit UK Form Identifiers)
// ============================================================================

export const OFFICIAL_FORM_IDS = {
  
  // EMPLOYMENT TRIBUNAL
  EMPLOYMENT_TRIBUNAL_CLAIM: "UK-ET1-EMPLOYMENT-TRIBUNAL-2024",
  EMPLOYMENT_TRIBUNAL_RESPONSE: "UK-ET3-EMPLOYMENT-TRIBUNAL-2024",
  ACAS_EARLY_CONCILIATION_CERT: "UK-ACAS-EC-CERTIFICATE",
  SCHEDULE_OF_LOSS: "UK-ET-SCHEDULE-OF-LOSS",
  
  // COUNTY COURT
  COUNTY_COURT_CLAIM_FORM: "UK-N1-COUNTY-COURT-CLAIM",
  COUNTY_COURT_DEFENSE: "UK-N11-DEFENSE-ADMISSION",
  PARTICULARS_OF_CLAIM: "UK-N1-PARTICULARS-OF-CLAIM",
  COUNTY_COURT_APPLICATION: "UK-N244-APPLICATION-NOTICE",
  SMALL_CLAIMS_DIRECTIONS: "UK-N180-DIRECTIONS-QUESTIONNAIRE",
  
  // SOCIAL SECURITY TRIBUNAL
  BENEFITS_APPEAL_FORM: "UK-SSCS1-SOCIAL-SECURITY-APPEAL",
  MANDATORY_RECONSIDERATION_REQUEST: "UK-SSCS5-MANDATORY-RECONSIDERATION",
  
  // PROPERTY TRIBUNAL
  PROPERTY_TRIBUNAL_APPLICATION: "UK-FTT-PROP-APPLICATION",
  RENT_ASSESSMENT_APPLICATION: "UK-FTT-PROP-RENT-ASSESSMENT",
  
  // TAX TRIBUNAL
  TAX_APPEAL_NOTICE: "UK-FTT-TAX-APPEAL-NOTICE",
  
  // IMMIGRATION TRIBUNAL
  IMMIGRATION_APPEAL_FORM: "UK-IAFT5-IMMIGRATION-APPEAL",
  ADMIN_REVIEW_REQUEST: "UK-HO-ADMIN-REVIEW-REQUEST",
  
  // MAGISTRATES COURT
  GUILTY_PLEA_LETTER: "UK-MAG-GUILTY-PLEA-LETTER",
  MITIGATION_STATEMENT: "UK-MAG-MITIGATION-STATEMENT",
  MEANS_FORM: "UK-MAG-MC100-MEANS-FORM",
  
  // PARKING & TRAFFIC
  POPLA_APPEAL: "UK-POPLA-PARKING-APPEAL",
  IAS_APPEAL: "UK-IAS-PARKING-APPEAL",
  TEC_APPEAL: "UK-TEC-TRAFFIC-PENALTY-APPEAL",
  
  // OMBUDSMAN & ADR
  FINANCIAL_OMBUDSMAN_COMPLAINT: "UK-FOS-COMPLAINT-FORM",
  HOUSING_OMBUDSMAN_COMPLAINT: "UK-HO-COMPLAINT-FORM",
  
  // EU REGULATIONS
  EU261_FLIGHT_DELAY_CLAIM: "EU-EU261-COMPENSATION-CLAIM",
  
  // SUPPORTING DOCUMENTS (Universal)
  WITNESS_STATEMENT: "UK-CPR32-WITNESS-STATEMENT",
  EVIDENCE_BUNDLE_INDEX: "UK-EVIDENCE-BUNDLE-INDEX",
  CHRONOLOGY: "UK-CHRONOLOGY-OF-EVENTS",
  SCHEDULE_OF_DAMAGES: "UK-SCHEDULE-OF-DAMAGES",
  
  // PRE-ACTION LETTERS
  LETTER_BEFORE_CLAIM: "UK-LBC-PRE-ACTION-PROTOCOL",
  LETTER_BEFORE_ACTION: "UK-LBA-GENERAL",
  DEMAND_LETTER: "UK-DEMAND-LETTER-GENERAL",
  FORMAL_COMPLAINT_LETTER: "UK-COMPLAINT-LETTER-GENERAL",
  GRIEVANCE_LETTER: "UK-GRIEVANCE-LETTER-EMPLOYMENT",
  
} as const;

export type OfficialFormID = typeof OFFICIAL_FORM_IDS[keyof typeof OFFICIAL_FORM_IDS];

// ============================================================================
// VALIDATION RULES
// ============================================================================

export interface ValidationRule {
  field: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  type?: "string" | "number" | "date" | "email" | "postcode";
  pattern?: string; // Regex pattern as string
  errorMessage?: string;
}

export interface SectionValidation {
  sectionName: string;
  required: boolean;
  minLength?: number;
  mustContain?: string[];  // Keywords that MUST appear
  mustNotContain?: string[];  // Forbidden content (placeholders)
}

export interface StructureCheck {
  checkType: "has_heading" | "has_numbering" | "has_signature_block" | "has_date" | "has_address_block";
  pattern: string; // Regex pattern as string
  errorMessage: string;
}

// ============================================================================
// FORM METADATA
// ============================================================================

export interface FormMetadata {
  id: OfficialFormID;
  officialName: string;
  jurisdiction: string;
  forum: string;
  version: string;
  lastUpdated: string;
  requiredSections: SectionValidation[];
  minimumLength: number;
  structureChecks: StructureCheck[];
  validationRules: ValidationRule[];
  aiModel: "gpt-4o" | "claude-opus-4" | "grok-2";  // Specialized model for this form
}

export const FORM_METADATA: Record<string, FormMetadata> = {
  
  // ============================================================================
  // EMPLOYMENT TRIBUNAL FORMS
  // ============================================================================
  
  "UK-ET1-EMPLOYMENT-TRIBUNAL-2024": {
    id: "UK-ET1-EMPLOYMENT-TRIBUNAL-2024",
    officialName: "Employment Tribunal Claim Form (ET1)",
    jurisdiction: "england_wales",
    forum: "employment_tribunal",
    version: "2024",
    lastUpdated: "2024-01-01",
    minimumLength: 800,
    aiModel: "claude-opus-4",
    
    requiredSections: [
      {
        sectionName: "SECTION 1: CLAIMANT DETAILS",
        required: true,
        minLength: 100,
        mustContain: ["Name:", "Address:", "Contact:"],
        mustNotContain: ["[LEAVE BLANK]", "[USER TO COMPLETE]", "[INSERT"]
      },
      {
        sectionName: "SECTION 2: RESPONDENT",
        required: true,
        minLength: 100,
        mustContain: ["Respondent Name:", "Address:"],
        mustNotContain: ["[LEAVE BLANK]"]
      },
      {
        sectionName: "SECTION 3: EMPLOYMENT DETAILS",
        required: true,
        minLength: 150,
        mustContain: ["Start Date:", "Job Title:", "Pay:"],
        mustNotContain: []
      },
      {
        sectionName: "SECTION 4: TYPE OF CLAIM",
        required: true,
        minLength: 50,
        mustContain: [],
        mustNotContain: []
      },
      {
        sectionName: "SECTION 5: CLAIM DETAILS",
        required: true,
        minLength: 400,
        mustContain: ["I claim"],
        mustNotContain: ["[INSERT DETAILS]", "Lorem ipsum", "[DESCRIBE"]
      },
      {
        sectionName: "SECTION 6: WHAT YOU WANT",
        required: true,
        minLength: 100,
        mustContain: [],
        mustNotContain: []
      },
      {
        sectionName: "ACAS",
        required: true,
        minLength: 10,
        mustContain: [],
        mustNotContain: ["[ACAS NUMBER]"]
      }
    ],
    
    structureChecks: [
      {
        checkType: "has_heading",
        pattern: "SECTION \\d+:",
        errorMessage: "ET1 must have numbered sections (SECTION 1:, SECTION 2:, etc.)"
      },
      {
        checkType: "has_signature_block",
        pattern: "Signed:|Signature:",
        errorMessage: "ET1 must have signature block"
      },
      {
        checkType: "has_date",
        pattern: "Date:|Dated:",
        errorMessage: "ET1 must have date field"
      }
    ],
    
    validationRules: [
      {
        field: "acas_certificate",
        required: true,
        pattern: "R\\d{6}",
        errorMessage: "ACAS certificate number must be provided (format: R000000)"
      },
      {
        field: "claim_details",
        required: true,
        minLength: 400,
        errorMessage: "Claim details must be substantial (minimum 400 characters)"
      }
    ]
  },
  
  // ============================================================================
  // COUNTY COURT FORMS
  // ============================================================================
  
  "UK-N1-COUNTY-COURT-CLAIM": {
    id: "UK-N1-COUNTY-COURT-CLAIM",
    officialName: "County Court Claim Form (N1)",
    jurisdiction: "england_wales",
    forum: "county_court",
    version: "2023",
    lastUpdated: "2023-04-01",
    minimumLength: 400,
    aiModel: "gpt-4o",
    
    requiredSections: [
      {
        sectionName: "CLAIMANT",
        required: true,
        minLength: 50,
        mustContain: ["Name:", "Address:"],
        mustNotContain: ["[LEAVE BLANK]"]
      },
      {
        sectionName: "DEFENDANT",
        required: true,
        minLength: 50,
        mustContain: ["Name:", "Address:"],
        mustNotContain: []
      },
      {
        sectionName: "CLAIM VALUE",
        required: true,
        minLength: 20,
        mustContain: ["£"],
        mustNotContain: ["[AMOUNT]"]
      },
      {
        sectionName: "BRIEF DETAILS",
        required: true,
        minLength: 100,
        mustContain: [],
        mustNotContain: ["[INSERT]", "[DESCRIBE]"]
      },
      {
        sectionName: "PARTICULARS OF CLAIM",
        required: true,
        minLength: 200,
        mustContain: [],
        mustNotContain: ["Lorem ipsum"]
      }
    ],
    
    structureChecks: [
      {
        checkType: "has_numbering",
        pattern: "^\\d+\\.",
        errorMessage: "Particulars of Claim should use numbered paragraphs"
      },
      {
        checkType: "has_signature_block",
        pattern: "Signed:|Statement of Truth",
        errorMessage: "N1 must have signature/statement of truth"
      }
    ],
    
    validationRules: [
      {
        field: "claim_value",
        required: true,
        type: "number",
        errorMessage: "Claim value must be specified"
      },
      {
        field: "defendant_name",
        required: true,
        minLength: 2,
        errorMessage: "Defendant name required"
      }
    ]
  },
  
  // ============================================================================
  // BENEFITS APPEAL
  // ============================================================================
  
  "UK-SSCS1-SOCIAL-SECURITY-APPEAL": {
    id: "UK-SSCS1-SOCIAL-SECURITY-APPEAL",
    officialName: "Social Security Appeal Form (SSCS1)",
    jurisdiction: "england_wales",
    forum: "first_tier_tribunal_sscs",
    version: "2023",
    lastUpdated: "2023-01-01",
    minimumLength: 300,
    aiModel: "gpt-4o",
    
    requiredSections: [
      {
        sectionName: "APPELLANT DETAILS",
        required: true,
        minLength: 50,
        mustContain: ["Name:", "Address:"],
        mustNotContain: []
      },
      {
        sectionName: "DWP DECISION",
        required: true,
        minLength: 50,
        mustContain: ["Decision Date:"],
        mustNotContain: ["[DATE]"]
      },
      {
        sectionName: "MANDATORY RECONSIDERATION",
        required: true,
        minLength: 30,
        mustContain: [],
        mustNotContain: []
      },
      {
        sectionName: "GROUNDS OF APPEAL",
        required: true,
        minLength: 150,
        mustContain: ["I disagree", "because"],
        mustNotContain: ["[EXPLAIN]"]
      }
    ],
    
    structureChecks: [
      {
        checkType: "has_signature_block",
        pattern: "Signed:",
        errorMessage: "SSCS1 must be signed"
      }
    ],
    
    validationRules: [
      {
        field: "mandatory_reconsideration_notice",
        required: true,
        errorMessage: "Mandatory Reconsideration Notice reference required"
      },
      {
        field: "grounds_of_appeal",
        required: true,
        minLength: 150,
        errorMessage: "Grounds of appeal must be detailed"
      }
    ]
  },
  
  // ============================================================================
  // SUPPORTING DOCUMENTS
  // ============================================================================
  
  "UK-EVIDENCE-BUNDLE-INDEX": {
    id: "UK-EVIDENCE-BUNDLE-INDEX",
    officialName: "Evidence Bundle & Index",
    jurisdiction: "england_wales",
    forum: "universal",
    version: "2024",
    lastUpdated: "2024-01-01",
    minimumLength: 200,
    aiModel: "gpt-4o",
    
    requiredSections: [
      {
        sectionName: "PART 1: INDEX",
        required: true,
        minLength: 50,
        mustContain: ["E1", "E2"],
        mustNotContain: []
      },
      {
        sectionName: "PART 2: PHOTOGRAPHIC EVIDENCE",
        required: false,
        minLength: 0,
        mustContain: [],
        mustNotContain: []
      }
    ],
    
    structureChecks: [
      {
        checkType: "has_heading",
        pattern: "EVIDENCE BUNDLE",
        errorMessage: "Must have 'EVIDENCE BUNDLE' heading"
      }
    ],
    
    validationRules: []
  },
  
  "UK-SCHEDULE-OF-DAMAGES": {
    id: "UK-SCHEDULE-OF-DAMAGES",
    officialName: "Schedule of Damages",
    jurisdiction: "england_wales",
    forum: "universal",
    version: "2024",
    lastUpdated: "2024-01-01",
    minimumLength: 200,
    aiModel: "gpt-4o",
    
    requiredSections: [
      {
        sectionName: "CALCULATION",
        required: true,
        minLength: 100,
        mustContain: ["£", "TOTAL"],
        mustNotContain: ["[AMOUNT]"]
      }
    ],
    
    structureChecks: [
      {
        checkType: "has_numbering",
        pattern: "^\\d+\\.",
        errorMessage: "Schedule should use numbered items"
      }
    ],
    
    validationRules: []
  },
  
  // ============================================================================
  // LETTERS
  // ============================================================================
  
  "UK-LBA-GENERAL": {
    id: "UK-LBA-GENERAL",
    officialName: "Letter Before Action",
    jurisdiction: "england_wales",
    forum: "pre_action",
    version: "2024",
    lastUpdated: "2024-01-01",
    minimumLength: 300,
    aiModel: "gpt-4o",
    
    requiredSections: [
      {
        sectionName: "ADDRESS_BLOCK",
        required: true,
        minLength: 30,
        mustContain: [],
        mustNotContain: ["[YOUR NAME]", "[YOUR ADDRESS]"]
      },
      {
        sectionName: "BODY",
        required: true,
        minLength: 200,
        mustContain: ["Dear", "Re:"],
        mustNotContain: []
      }
    ],
    
    structureChecks: [
      {
        checkType: "has_address_block",
        pattern: "\\[.*Address.*\\]|^[A-Z]",
        errorMessage: "Letter must have address block"
      },
      {
        checkType: "has_date",
        pattern: "Date:",
        errorMessage: "Letter must have date"
      },
      {
        checkType: "has_signature_block",
        pattern: "Yours (faithfully|sincerely)",
        errorMessage: "Letter must have proper closing"
      }
    ],
    
    validationRules: []
  },
  
  "UK-GRIEVANCE-LETTER-EMPLOYMENT": {
    id: "UK-GRIEVANCE-LETTER-EMPLOYMENT",
    officialName: "Formal Grievance Letter",
    jurisdiction: "england_wales",
    forum: "employment_pre_action",
    version: "2024",
    lastUpdated: "2024-01-01",
    minimumLength: 400,
    aiModel: "claude-opus-4",
    
    requiredSections: [
      {
        sectionName: "HEADER",
        required: true,
        minLength: 50,
        mustContain: ["Re: Formal Grievance"],
        mustNotContain: []
      },
      {
        sectionName: "GRIEVANCE_DETAILS",
        required: true,
        minLength: 200,
        mustContain: ["I am writing to raise a formal grievance"],
        mustNotContain: ["[DESCRIBE]", "[INSERT]"]
      }
    ],
    
    structureChecks: [
      {
        checkType: "has_address_block",
        pattern: "\\[.*\\]|Dear",
        errorMessage: "Grievance letter must have proper address format"
      },
      {
        checkType: "has_signature_block",
        pattern: "Yours (faithfully|sincerely)",
        errorMessage: "Letter must have closing"
      }
    ],
    
    validationRules: []
  }
  
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getFormMetadata(formId: OfficialFormID): FormMetadata | undefined {
  return FORM_METADATA[formId];
}

export function isValidFormId(formId: string): formId is OfficialFormID {
  return Object.values(OFFICIAL_FORM_IDS).includes(formId as OfficialFormID);
}

export function getFormsByForum(forum: string): OfficialFormID[] {
  return Object.values(FORM_METADATA)
    .filter(meta => meta.forum === forum)
    .map(meta => meta.id as OfficialFormID);
}

export function getAIModelForForm(formId: OfficialFormID): "gpt-4o" | "claude-opus-4" | "grok-2" {
  const metadata = getFormMetadata(formId);
  return metadata?.aiModel || "gpt-4o";
}
