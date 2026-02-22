/**
 * FORM TYPE CLASSIFICATION
 * 
 * Distinguishes between:
 * 1. FILLABLE_PDF: Official government forms (download, fill, return PDF)
 * 2. GENERATED: Narrative documents written by AI from scratch
 */

import type { OfficialFormID } from "./form-registry";

export type FormType = "FILLABLE_PDF" | "GENERATED";

export interface FormTypeMetadata {
  formId: OfficialFormID;
  type: FormType;
  officialPdfUrl?: string; // Where to download the official blank form
  description: string;
}

/**
 * CLASSIFICATION OF ALL FORMS
 */
export const FORM_TYPE_REGISTRY: Record<OfficialFormID, FormTypeMetadata> = {
  
  // ============================================================================
  // FILLABLE PDFs - Official government forms
  // ============================================================================
  
  "UK-ET1-EMPLOYMENT-TRIBUNAL-2024": {
    formId: "UK-ET1-EMPLOYMENT-TRIBUNAL-2024",
    type: "FILLABLE_PDF",
    officialPdfUrl: "https://assets.publishing.service.gov.uk/media/65a5e5d1e8f5ec000f1f5d3c/et1-eng.pdf",
    description: "Official ET1 Employment Tribunal Claim Form (PDF with fillable fields)"
  },
  
  "UK-ET3-EMPLOYMENT-TRIBUNAL-2024": {
    formId: "UK-ET3-EMPLOYMENT-TRIBUNAL-2024",
    type: "FILLABLE_PDF",
    officialPdfUrl: "https://assets.publishing.service.gov.uk/media/65a5e5d1e8f5ec000f1f5d3d/et3-eng.pdf",
    description: "Official ET3 Response to Employment Tribunal Claim"
  },
  
  "UK-N1-COUNTY-COURT-CLAIM": {
    formId: "UK-N1-COUNTY-COURT-CLAIM",
    type: "FILLABLE_PDF",
    officialPdfUrl: "https://assets.publishing.service.gov.uk/media/5a74b0ebe5274a59fa1a95b8/n1-eng.pdf",
    description: "Official N1 County Court Claim Form (PDF)"
  },
  
  "UK-N11-DEFENSE-ADMISSION": {
    formId: "UK-N11-DEFENSE-ADMISSION",
    type: "FILLABLE_PDF",
    officialPdfUrl: "https://assets.publishing.service.gov.uk/media/n11-eng.pdf",
    description: "Official N11 Defense and Counterclaim Form"
  },
  
  "UK-N244-APPLICATION-NOTICE": {
    formId: "UK-N244-APPLICATION-NOTICE",
    type: "FILLABLE_PDF",
    officialPdfUrl: "https://assets.publishing.service.gov.uk/media/n244-eng.pdf",
    description: "Official N244 Application Notice"
  },
  
  "UK-N180-DIRECTIONS-QUESTIONNAIRE": {
    formId: "UK-N180-DIRECTIONS-QUESTIONNAIRE",
    type: "FILLABLE_PDF",
    officialPdfUrl: "https://assets.publishing.service.gov.uk/media/n180-eng.pdf",
    description: "Official N180 Directions Questionnaire (Small Claims)"
  },
  
  "UK-SSCS1-SOCIAL-SECURITY-APPEAL": {
    formId: "UK-SSCS1-SOCIAL-SECURITY-APPEAL",
    type: "FILLABLE_PDF",
    officialPdfUrl: "https://assets.publishing.service.gov.uk/media/sscs1-eng.pdf",
    description: "Official SSCS1 Social Security Appeal Form"
  },
  
  "UK-SSCS5-MANDATORY-RECONSIDERATION": {
    formId: "UK-SSCS5-MANDATORY-RECONSIDERATION",
    type: "FILLABLE_PDF",
    officialPdfUrl: "https://assets.publishing.service.gov.uk/media/sscs5-eng.pdf",
    description: "Official SSCS5 Mandatory Reconsideration Request"
  },
  
  "UK-FTT-PROP-APPLICATION": {
    formId: "UK-FTT-PROP-APPLICATION",
    type: "FILLABLE_PDF",
    officialPdfUrl: "https://assets.publishing.service.gov.uk/media/ftt-prop-application.pdf",
    description: "Official First-tier Tribunal Property Application"
  },
  
  "UK-FTT-PROP-RENT-ASSESSMENT": {
    formId: "UK-FTT-PROP-RENT-ASSESSMENT",
    type: "FILLABLE_PDF",
    description: "Property Tribunal Rent Assessment Application"
  },
  
  "UK-FTT-TAX-APPEAL-NOTICE": {
    formId: "UK-FTT-TAX-APPEAL-NOTICE",
    type: "FILLABLE_PDF",
    description: "Tax Tribunal Appeal Notice"
  },
  
  "UK-IAFT5-IMMIGRATION-APPEAL": {
    formId: "UK-IAFT5-IMMIGRATION-APPEAL",
    type: "FILLABLE_PDF",
    officialPdfUrl: "https://assets.publishing.service.gov.uk/media/iaft5.pdf",
    description: "Official IAFT-5 Immigration and Asylum Appeal Form"
  },
  
  "UK-HO-ADMIN-REVIEW-REQUEST": {
    formId: "UK-HO-ADMIN-REVIEW-REQUEST",
    type: "FILLABLE_PDF",
    description: "Home Office Administrative Review Request Form"
  },
  
  "UK-MAG-MC100-MEANS-FORM": {
    formId: "UK-MAG-MC100-MEANS-FORM",
    type: "FILLABLE_PDF",
    description: "Magistrates Court MC100 Statement of Means"
  },
  
  "UK-POPLA-PARKING-APPEAL": {
    formId: "UK-POPLA-PARKING-APPEAL",
    type: "FILLABLE_PDF",
    description: "POPLA Parking Appeal Form (online form, can generate PDF summary)"
  },
  
  "UK-IAS-PARKING-APPEAL": {
    formId: "UK-IAS-PARKING-APPEAL",
    type: "FILLABLE_PDF",
    description: "Independent Appeals Service (IAS) Parking Appeal"
  },
  
  "UK-TEC-TRAFFIC-PENALTY-APPEAL": {
    formId: "UK-TEC-TRAFFIC-PENALTY-APPEAL",
    type: "FILLABLE_PDF",
    description: "Traffic Enforcement Centre (TEC) Appeal"
  },
  
  "UK-FOS-COMPLAINT-FORM": {
    formId: "UK-FOS-COMPLAINT-FORM",
    type: "FILLABLE_PDF",
    description: "Financial Ombudsman Service Complaint Form"
  },
  
  "UK-HO-COMPLAINT-FORM": {
    formId: "UK-HO-COMPLAINT-FORM",
    type: "FILLABLE_PDF",
    description: "Housing Ombudsman Complaint Form"
  },
  
  "UK-ACAS-EC-CERTIFICATE": {
    formId: "UK-ACAS-EC-CERTIFICATE",
    type: "GENERATED", // Not fillable - just a reference number
    description: "ACAS Early Conciliation Certificate (reference number only)"
  },
  
  "EU-EU261-COMPENSATION-CLAIM": {
    formId: "EU-EU261-COMPENSATION-CLAIM",
    type: "GENERATED", // Usually submitted via airline forms or letter
    description: "EU261 Flight Delay/Cancellation Compensation Claim Letter"
  },
  
  // ============================================================================
  // GENERATED DOCUMENTS - AI writes from scratch
  // ============================================================================
  
  "UK-N1-PARTICULARS-OF-CLAIM": {
    formId: "UK-N1-PARTICULARS-OF-CLAIM",
    type: "GENERATED",
    description: "Particulars of Claim (narrative document attached to N1 form)"
  },
  
  "UK-ET-SCHEDULE-OF-LOSS": {
    formId: "UK-ET-SCHEDULE-OF-LOSS",
    type: "GENERATED",
    description: "Employment Tribunal Schedule of Loss (supporting document)"
  },
  
  "UK-CPR32-WITNESS-STATEMENT": {
    formId: "UK-CPR32-WITNESS-STATEMENT",
    type: "GENERATED",
    description: "Witness Statement complying with CPR 32"
  },
  
  "UK-EVIDENCE-BUNDLE-INDEX": {
    formId: "UK-EVIDENCE-BUNDLE-INDEX",
    type: "GENERATED",
    description: "Evidence Bundle Index (lists all exhibits)"
  },
  
  "UK-CHRONOLOGY-OF-EVENTS": {
    formId: "UK-CHRONOLOGY-OF-EVENTS",
    type: "GENERATED",
    description: "Chronology of Events (timeline document)"
  },
  
  "UK-SCHEDULE-OF-DAMAGES": {
    formId: "UK-SCHEDULE-OF-DAMAGES",
    type: "GENERATED",
    description: "Schedule of Damages (calculation document)"
  },
  
  "UK-LBC-PRE-ACTION-PROTOCOL": {
    formId: "UK-LBC-PRE-ACTION-PROTOCOL",
    type: "GENERATED",
    description: "Letter Before Claim (Pre-Action Protocol letter)"
  },
  
  "UK-LBA-GENERAL": {
    formId: "UK-LBA-GENERAL",
    type: "GENERATED",
    description: "Letter Before Action (formal pre-action letter)"
  },
  
  "UK-DEMAND-LETTER-GENERAL": {
    formId: "UK-DEMAND-LETTER-GENERAL",
    type: "GENERATED",
    description: "Demand Letter (formal request for payment)"
  },
  
  "UK-COMPLAINT-LETTER-GENERAL": {
    formId: "UK-COMPLAINT-LETTER-GENERAL",
    type: "GENERATED",
    description: "Formal Complaint Letter"
  },
  
  "UK-GRIEVANCE-LETTER-EMPLOYMENT": {
    formId: "UK-GRIEVANCE-LETTER-EMPLOYMENT",
    type: "GENERATED",
    description: "Formal Grievance Letter (employment)"
  },
  
  "UK-MAG-GUILTY-PLEA-LETTER": {
    formId: "UK-MAG-GUILTY-PLEA-LETTER",
    type: "GENERATED",
    description: "Guilty Plea Letter to Magistrates Court"
  },
  
  "UK-MAG-MITIGATION-STATEMENT": {
    formId: "UK-MAG-MITIGATION-STATEMENT",
    type: "GENERATED",
    description: "Mitigation Statement (magistrates court)"
  },
  
};

/**
 * Check if a form is a fillable PDF or generated document
 */
export function isFormFillablePDF(formId: OfficialFormID): boolean {
  return FORM_TYPE_REGISTRY[formId]?.type === "FILLABLE_PDF";
}

/**
 * Check if a form is AI-generated
 */
export function isFormGenerated(formId: OfficialFormID): boolean {
  return FORM_TYPE_REGISTRY[formId]?.type === "GENERATED";
}

/**
 * Get the official PDF URL for a form (if it's fillable)
 */
export function getOfficialPdfUrl(formId: OfficialFormID): string | null {
  const metadata = FORM_TYPE_REGISTRY[formId];
  return metadata?.type === "FILLABLE_PDF" ? (metadata.officialPdfUrl || null) : null;
}

/**
 * Get all fillable PDF forms
 */
export function getAllFillableForms(): OfficialFormID[] {
  return Object.values(FORM_TYPE_REGISTRY)
    .filter(meta => meta.type === "FILLABLE_PDF")
    .map(meta => meta.formId);
}

/**
 * Get all generated document forms
 */
export function getAllGeneratedForms(): OfficialFormID[] {
  return Object.values(FORM_TYPE_REGISTRY)
    .filter(meta => meta.type === "GENERATED")
    .map(meta => meta.formId);
}
