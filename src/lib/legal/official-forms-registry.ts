/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OFFICIAL FORMS REGISTRY - PRODUCTION ARCHITECTURE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * CRITICAL DESIGN PRINCIPLES:
 * 
 * 1. GOV.UK PAGES ARE CANONICAL SOURCE (never hard-code PDF URLs)
 * 2. Forms are NEVER assumed to have stable direct PDF links
 * 3. Local caching is an optimization, not a requirement
 * 4. System must gracefully handle URL changes
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import type { OfficialFormID } from "./form-registry";

/**
 * Fetch strategy for each form
 */
export type FetchStrategy = 
  | "LOCAL_CACHED"      // We have a local copy (fastest)
  | "GOVUK_REDIRECT"    // Fetch latest from GOV.UK page (safe, always current)
  | "ONLINE_ONLY"       // No PDF - user must complete online
  | "DIRECT_PDF";       // Stable direct PDF URL (rare, only for verified stable forms)

/**
 * Official UK Government Form Metadata
 */
export interface OfficialFormMetadata {
  code: string;                    // Form code (e.g., "N1", "ET1")
  name: string;                    // Human-readable name
  authority: string;               // Issuing authority (HMCTS, HMRC, etc.)
  jurisdiction: string;            // Geographic scope
  govukPage: string;               // CANONICAL SOURCE - always use this
  directPdfUrl?: string;           // Optional: only for verified stable PDFs
  onlinePortalUrl?: string;        // If online submission available
  fetchStrategy: FetchStrategy;   // How to get the latest version
  localCachePath?: string;         // Where we cache it locally
  lastVerified: Date;              // Last time we checked GOV.UK
  usageFrequency: "HIGH" | "MEDIUM" | "LOW";
  isDeprecated: boolean;           // If form has been replaced
  replacedBy?: string;             // New form code if deprecated
  notes?: string;                  // Special instructions
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * OFFICIAL FORMS REGISTRY
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const OFFICIAL_FORMS_REGISTRY: Record<string, OfficialFormMetadata> = {
  
  // =========================================================================
  // EMPLOYMENT TRIBUNAL FORMS
  // =========================================================================
  
  "ET1": {
    code: "ET1",
    name: "Employment Tribunal Claim Form",
    authority: "HMCTS Employment Tribunals",
    jurisdiction: "England & Wales",
    govukPage: "https://www.gov.uk/government/publications/make-a-claim-to-an-employment-tribunal",
    directPdfUrl: "https://assets.publishing.service.gov.uk/media/65bcbd214a666f000d1747ba/ET1_0224.pdf",
    onlinePortalUrl: "https://www.employmenttribunals.service.gov.uk",
    fetchStrategy: "LOCAL_CACHED", // We have it, but can refresh from GOV.UK
    localCachePath: "public/official-forms/employment/ET1-claim-form-2024.pdf",
    lastVerified: new Date("2026-01-24"),
    usageFrequency: "HIGH",
    isDeprecated: false,
    notes: "Most common form in DisputeHub. Has 90 fillable fields."
  },
  
  "ET3": {
    code: "ET3",
    name: "Employment Tribunal Response Form",
    authority: "HMCTS Employment Tribunals",
    jurisdiction: "England & Wales",
    govukPage: "https://www.gov.uk/government/publications/respond-to-an-employment-tribunal-claim",
    directPdfUrl: "https://assets.publishing.service.gov.uk/media/65bcbec74a666f00101747b6/ET3_0224.pdf",
    fetchStrategy: "LOCAL_CACHED",
    localCachePath: "public/official-forms/employment/ET3-response-form-2024.pdf",
    lastVerified: new Date("2026-01-24"),
    usageFrequency: "MEDIUM",
    isDeprecated: false,
    notes: "For employers defending claims. DisputeHub focuses on claimant side."
  },
  
  // =========================================================================
  // COUNTY COURT FORMS (CIVIL CLAIMS)
  // =========================================================================
  
  "N1": {
    code: "N1",
    name: "County Court Claim Form",
    authority: "HMCTS County Court",
    jurisdiction: "England & Wales",
    govukPage: "https://www.gov.uk/government/publications/form-n1-claim-form-cpr-part-7",
    directPdfUrl: "https://assets.publishing.service.gov.uk/media/6411a6d98fa8f5556f84bc1f/N1_CC__0922_save.pdf",
    onlinePortalUrl: "https://www.moneyclaim.gov.uk",
    fetchStrategy: "LOCAL_CACHED",
    localCachePath: "public/official-forms/county-court/N1-claim-form-2024.pdf",
    lastVerified: new Date("2026-01-24"),
    usageFrequency: "HIGH",
    isDeprecated: false,
    notes: "43 fillable fields. Field names are generic (Text Field 48) - needs semantic mapping."
  },
  
  "N11": {
    code: "N11",
    name: "Defence and Counterclaim",
    authority: "HMCTS County Court",
    jurisdiction: "England & Wales",
    govukPage: "https://www.gov.uk/government/publications/form-n11-defence-and-counterclaim",
    fetchStrategy: "GOVUK_REDIRECT", // URLs change frequently
    lastVerified: new Date("2026-01-24"),
    usageFrequency: "MEDIUM",
    isDeprecated: false,
    notes: "Multiple versions exist. Always fetch from GOV.UK."
  },
  
  "N180": {
    code: "N180",
    name: "Directions Questionnaire (Small Claims)",
    authority: "HMCTS County Court",
    jurisdiction: "England & Wales",
    govukPage: "https://www.gov.uk/government/publications/form-n180-directions-questionnaire-small-claims-track",
    directPdfUrl: "https://assets.publishing.service.gov.uk/media/673341e779e9143625613543/N180_1124.pdf",
    fetchStrategy: "LOCAL_CACHED",
    localCachePath: "public/official-forms/county-court/N180-directions-small-claims-2024.pdf",
    lastVerified: new Date("2026-01-24"),
    usageFrequency: "HIGH",
    isDeprecated: false,
    notes: "72 fillable fields. Used after claim issued."
  },
  
  "N181": {
    code: "N181",
    name: "Directions Questionnaire (Fast Track)",
    authority: "HMCTS County Court",
    jurisdiction: "England & Wales",
    govukPage: "https://www.gov.uk/government/publications/form-n181-directions-questionnaire-fast-track",
    directPdfUrl: "https://assets.publishing.service.gov.uk/media/668505584e8630de328546ef/N181_0624.pdf",
    fetchStrategy: "LOCAL_CACHED",
    localCachePath: "public/official-forms/county-court/N181-directions-fast-track-2024.pdf",
    lastVerified: new Date("2026-01-24"),
    usageFrequency: "MEDIUM",
    isDeprecated: false,
    notes: "For claims £10,000-£25,000"
  },
  
  "N244": {
    code: "N244",
    name: "Application Notice",
    authority: "HMCTS County Court",
    jurisdiction: "England & Wales",
    govukPage: "https://www.gov.uk/government/publications/form-n244-application-notice",
    directPdfUrl: "https://assets.publishing.service.gov.uk/media/65eb1c6b5b652445f6f21b01/N244_0622_save.pdf",
    fetchStrategy: "LOCAL_CACHED",
    localCachePath: "public/official-forms/county-court/N244-application-notice-2024.pdf",
    lastVerified: new Date("2026-01-24"),
    usageFrequency: "HIGH",
    isDeprecated: false,
    notes: "Often bundled with guidance. Apply for court orders."
  },
  
  "N9": {
    code: "N9",
    name: "Response Pack",
    authority: "HMCTS County Court",
    jurisdiction: "England & Wales",
    govukPage: "https://www.gov.uk/government/publications/form-n9-response-pack",
    fetchStrategy: "GOVUK_REDIRECT",
    lastVerified: new Date("2026-01-24"),
    usageFrequency: "MEDIUM",
    isDeprecated: false,
    notes: "Served as a pack, not single PDF. Fetch from GOV.UK."
  },
  
  "N245": {
    code: "N245",
    name: "Application for Suspension of Warrant",
    authority: "HMCTS County Court",
    jurisdiction: "England & Wales",
    govukPage: "https://www.gov.uk/government/publications/form-n245-application-for-suspension-of-warrant",
    fetchStrategy: "GOVUK_REDIRECT",
    lastVerified: new Date("2026-01-24"),
    usageFrequency: "LOW",
    isDeprecated: false,
    notes: "Filename changes frequently"
  },
  
  "N260": {
    code: "N260",
    name: "Application for Warrant of Control",
    authority: "HMCTS County Court",
    jurisdiction: "England & Wales",
    govukPage: "https://www.gov.uk/government/publications/form-n260-application-for-warrant-of-control",
    directPdfUrl: "https://assets.publishing.service.gov.uk/media/601aa6558fa8f53fc93db12c/n260-eng.pdf",
    fetchStrategy: "LOCAL_CACHED",
    localCachePath: "public/official-forms/county-court/N260-warrant-control-2024.pdf",
    lastVerified: new Date("2026-01-24"),
    usageFrequency: "MEDIUM",
    isDeprecated: false,
    notes: "Enforce judgment by seizing goods"
  },
  
  "N215": {
    code: "N215",
    name: "Certificate of Service",
    authority: "HMCTS County Court",
    jurisdiction: "England & Wales",
    govukPage: "https://www.gov.uk/government/publications/form-n215-certificate-of-service",
    directPdfUrl: "https://assets.publishing.service.gov.uk/media/5ffefcf2e90e0763a8db97bb/n215-eng.pdf",
    fetchStrategy: "GOVUK_REDIRECT", // Reissued frequently
    lastVerified: new Date("2026-01-24"),
    usageFrequency: "MEDIUM",
    isDeprecated: false,
    notes: "Proof of service of documents"
  },
  
  // =========================================================================
  // SOCIAL SECURITY APPEALS (BENEFITS TRIBUNAL)
  // =========================================================================
  
  "SSCS1": {
    code: "SSCS1",
    name: "Social Security and Child Support Appeal",
    authority: "HMCTS Tribunals",
    jurisdiction: "England & Wales",
    govukPage: "https://www.gov.uk/government/publications/appeal-a-social-security-benefits-decision",
    onlinePortalUrl: "https://www.gov.uk/appeal-benefit-decision",
    fetchStrategy: "ONLINE_ONLY", // Online submission preferred
    localCachePath: "public/official-forms/benefits/SSCS1-appeal-form-2024.pdf",
    lastVerified: new Date("2026-01-24"),
    usageFrequency: "HIGH",
    isDeprecated: false,
    notes: "⚠️ FLAT PDF - NO FILLABLE FIELDS. Generate guidance for online portal."
  },
  
  "SSCS5": {
    code: "SSCS5",
    name: "Mandatory Reconsideration Request",
    authority: "HMCTS Tribunals",
    jurisdiction: "England & Wales",
    govukPage: "https://www.gov.uk/government/publications/appeal-a-social-security-benefits-decision-form-sscs5",
    directPdfUrl: "https://assets.publishing.service.gov.uk/media/65e5ae947bc329e58db8c1b8/SSCS5_Largeprint_0224.pdf",
    fetchStrategy: "LOCAL_CACHED",
    localCachePath: "public/official-forms/benefits/SSCS5-mandatory-reconsideration-2024.pdf",
    lastVerified: new Date("2026-01-24"),
    usageFrequency: "HIGH",
    isDeprecated: false,
    notes: "Required BEFORE SSCS1 appeal. Mixed appeal + MR versions exist."
  },
  
  // =========================================================================
  // TAX TRIBUNAL
  // =========================================================================
  
  "T240": {
    code: "T240",
    name: "Tax Tribunal Appeal Notice",
    authority: "First-tier Tribunal (Tax)",
    jurisdiction: "England & Wales",
    govukPage: "https://www.gov.uk/government/publications/form-t240-appeal-notice",
    directPdfUrl: "https://assets.publishing.service.gov.uk/media/68cd2919c908572e81248a57/T240_0925.pdf",
    fetchStrategy: "LOCAL_CACHED",
    localCachePath: "public/official-forms/tax/T240-tax-appeal-2025.pdf",
    lastVerified: new Date("2026-01-24"),
    usageFrequency: "MEDIUM",
    isDeprecated: false,
    notes: "Appeal HMRC decisions"
  },
  
  "T247": {
    code: "T247",
    name: "Application for Permission to Appeal",
    authority: "First-tier Tribunal (Tax)",
    jurisdiction: "England & Wales",
    govukPage: "https://www.gov.uk/government/publications/form-t247-application-for-permission-to-appeal-decision-of-the-tax-tribunal",
    fetchStrategy: "GOVUK_REDIRECT", // Tribunal-specific updates
    lastVerified: new Date("2026-01-24"),
    usageFrequency: "LOW",
    isDeprecated: false,
    notes: "Appeal FTT decision to Upper Tribunal"
  },
  
  // =========================================================================
  // PROPERTY TRIBUNAL
  // =========================================================================
  
  "T601": {
    code: "T601",
    name: "Property Tribunal Appeal Notice",
    authority: "First-tier Tribunal (Property)",
    jurisdiction: "England & Wales",
    govukPage: "https://www.gov.uk/government/publications/form-t601-notice-of-appeal",
    fetchStrategy: "GOVUK_REDIRECT", // Property tribunal revisions
    lastVerified: new Date("2026-01-24"),
    usageFrequency: "LOW",
    isDeprecated: false,
    notes: "Leasehold, rent assessment, etc."
  },
  
  "T602": {
    code: "T602",
    name: "Property Tribunal Permission to Appeal",
    authority: "First-tier Tribunal (Property)",
    jurisdiction: "England & Wales",
    govukPage: "https://www.gov.uk/government/publications/form-t602-application-for-permission-to-appeal",
    fetchStrategy: "GOVUK_REDIRECT",
    lastVerified: new Date("2026-01-24"),
    usageFrequency: "LOW",
    isDeprecated: false,
    notes: "Appeal FTT decision to Upper Tribunal"
  },
  
  // =========================================================================
  // IMMIGRATION & ASYLUM TRIBUNAL
  // =========================================================================
  
  "IAFT-1": {
    code: "IAFT-1",
    name: "Immigration and Asylum Appeal Form",
    authority: "HMCTS Immigration & Asylum Chamber",
    jurisdiction: "England & Wales",
    govukPage: "https://www.gov.uk/government/publications/appeal-an-immigration-or-asylum-decision-form-iaft-1",
    directPdfUrl: "https://assets.publishing.service.gov.uk/media/691c5f02b9226dd8e81ab89c/IAFT1_1125.pdf",
    fetchStrategy: "GOVUK_REDIRECT", // Immigration rules change constantly
    localCachePath: "public/official-forms/immigration/IAFT1-immigration-appeal-2025.pdf",
    lastVerified: new Date("2026-01-24"),
    usageFrequency: "MEDIUM",
    isDeprecated: false,
    notes: "Appeal Home Office immigration decisions"
  },
  
  "IAFT-2": {
    code: "IAFT-2",
    name: "Immigration Appeal Grounds",
    authority: "HMCTS Immigration & Asylum Chamber",
    jurisdiction: "England & Wales",
    govukPage: "https://www.gov.uk/government/publications/reasons-for-appealing-a-home-office-decision-form-iaft-2",
    directPdfUrl: "https://assets.publishing.service.gov.uk/media/679763b54686aac1586062ec/IAFT2_0225.pdf",
    fetchStrategy: "GOVUK_REDIRECT",
    localCachePath: "public/official-forms/immigration/IAFT2-appeal-reasons-2025.pdf",
    lastVerified: new Date("2026-01-24"),
    usageFrequency: "MEDIUM",
    isDeprecated: false,
    notes: "Detailed grounds of appeal"
  },
  
  "IAFT-4": {
    code: "IAFT-4",
    name: "Immigration Tribunal Application",
    authority: "HMCTS Immigration & Asylum Chamber",
    jurisdiction: "England & Wales",
    govukPage: "https://www.gov.uk/government/publications/make-an-application-form-iaft-4",
    directPdfUrl: "https://assets.publishing.service.gov.uk/media/6824a877b9226dd8e81ab898/IAFT4_AW_04.pdf",
    fetchStrategy: "LOCAL_CACHED",
    localCachePath: "public/official-forms/immigration/IAFT4-tribunal-application-2025.pdf",
    lastVerified: new Date("2026-01-24"),
    usageFrequency: "LOW",
    isDeprecated: false,
    notes: "Various applications during proceedings"
  },
  
  // =========================================================================
  // MAGISTRATES COURT
  // =========================================================================
  
  "MC100": {
    code: "MC100",
    name: "Statement of Means (Magistrates Court)",
    authority: "HMCTS Magistrates Court",
    jurisdiction: "England & Wales",
    govukPage: "https://www.gov.uk/government/publications/form-mc100-statement-of-means",
    directPdfUrl: "https://assets.publishing.service.gov.uk/media/5aa6b46aed915d4f595c551e/mc100-eng.pdf",
    fetchStrategy: "LOCAL_CACHED",
    localCachePath: "public/official-forms/magistrates/MC100-statement-means-2024.pdf",
    lastVerified: new Date("2026-01-24"),
    usageFrequency: "MEDIUM",
    isDeprecated: false,
    notes: "Financial information for fines/penalties"
  },
  
  // =========================================================================
  // FAMILY COURT
  // =========================================================================
  
  "D8": {
    code: "D8",
    name: "Divorce Application",
    authority: "HMCTS Family Court",
    jurisdiction: "England & Wales",
    govukPage: "https://www.gov.uk/government/publications/form-d8-application-for-a-divorce-dissolution-or-judicial-separation",
    directPdfUrl: "https://assets.publishing.service.gov.uk/media/6790fd78e2b9324a911e26a1/D8_0125.pdf",
    onlinePortalUrl: "https://www.apply-divorce.service.gov.uk",
    fetchStrategy: "ONLINE_ONLY", // Online service is strongly preferred
    localCachePath: "public/official-forms/family/D8-divorce-application-2025.pdf",
    lastVerified: new Date("2026-01-24"),
    usageFrequency: "MEDIUM",
    isDeprecated: false,
    notes: "Online digital service available and preferred"
  },
  
  "C100": {
    code: "C100",
    name: "Child Arrangements Order Application",
    authority: "HMCTS Family Court",
    jurisdiction: "England & Wales",
    govukPage: "https://www.gov.uk/government/publications/form-c100-application-under-the-children-act-1989",
    directPdfUrl: "https://assets.publishing.service.gov.uk/media/66a772f9ab418ab055592e93/C100_0424.pdf",
    onlinePortalUrl: "https://www.apply-childcare-arrangements.service.gov.uk",
    fetchStrategy: "LOCAL_CACHED",
    localCachePath: "public/official-forms/family/C100-child-arrangements-2024.pdf",
    lastVerified: new Date("2026-01-24"),
    usageFrequency: "HIGH",
    isDeprecated: false,
    notes: "234 fillable fields - MOST COMPLEX FORM. Child arrangements after separation."
  },
  
  // =========================================================================
  // ONLINE-ONLY SERVICES (NO PDF)
  // =========================================================================
  
  "ACAS-EC": {
    code: "ACAS-EC",
    name: "ACAS Early Conciliation",
    authority: "Advisory, Conciliation and Arbitration Service",
    jurisdiction: "England, Wales & Scotland",
    govukPage: "https://www.gov.uk/guidance/early-conciliation",
    onlinePortalUrl: "https://www.acas.org.uk/early-conciliation",
    fetchStrategy: "ONLINE_ONLY",
    lastVerified: new Date("2026-01-24"),
    usageFrequency: "HIGH",
    isDeprecated: false,
    notes: "REQUIRED before ET1. Online service only - no PDF form."
  },
  
  "POPLA": {
    code: "POPLA",
    name: "Parking Appeals (POPLA)",
    authority: "Parking on Private Land Appeals",
    jurisdiction: "England & Wales",
    govukPage: "https://www.gov.uk/appeal-parking-ticket",
    onlinePortalUrl: "https://www.popla.co.uk",
    fetchStrategy: "ONLINE_ONLY",
    lastVerified: new Date("2026-01-24"),
    usageFrequency: "HIGH",
    isDeprecated: false,
    notes: "Online appeal portal - no PDF form"
  },
  
  "FOS": {
    code: "FOS",
    name: "Financial Ombudsman Service Complaint",
    authority: "Financial Ombudsman Service",
    jurisdiction: "UK",
    govukPage: "https://www.financial-ombudsman.org.uk",
    onlinePortalUrl: "https://www.financial-ombudsman.org.uk/consumers/how-to-complain",
    fetchStrategy: "ONLINE_ONLY",
    lastVerified: new Date("2026-01-24"),
    usageFrequency: "MEDIUM",
    isDeprecated: false,
    notes: "Bank, insurance, investment complaints"
  },
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HELPER FUNCTIONS
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Get form metadata by code
 */
export function getFormMetadata(formCode: string): OfficialFormMetadata | undefined {
  return OFFICIAL_FORMS_REGISTRY[formCode];
}

/**
 * Get all forms with LOCAL_CACHED strategy
 */
export function getCachedForms(): OfficialFormMetadata[] {
  return Object.values(OFFICIAL_FORMS_REGISTRY)
    .filter(form => form.fetchStrategy === "LOCAL_CACHED");
}

/**
 * Get all forms requiring GOV.UK redirect
 */
export function getGovUKRedirectForms(): OfficialFormMetadata[] {
  return Object.values(OFFICIAL_FORMS_REGISTRY)
    .filter(form => form.fetchStrategy === "GOVUK_REDIRECT");
}

/**
 * Get online-only forms
 */
export function getOnlineOnlyForms(): OfficialFormMetadata[] {
  return Object.values(OFFICIAL_FORMS_REGISTRY)
    .filter(form => form.fetchStrategy === "ONLINE_ONLY");
}

/**
 * Get forms by authority
 */
export function getFormsByAuthority(authority: string): OfficialFormMetadata[] {
  return Object.values(OFFICIAL_FORMS_REGISTRY)
    .filter(form => form.authority === authority);
}

/**
 * Get high-frequency forms (most commonly used)
 */
export function getHighFrequencyForms(): OfficialFormMetadata[] {
  return Object.values(OFFICIAL_FORMS_REGISTRY)
    .filter(form => form.usageFrequency === "HIGH");
}

/**
 * Check if form is deprecated
 */
export function isFormDeprecated(formCode: string): boolean {
  return OFFICIAL_FORMS_REGISTRY[formCode]?.isDeprecated ?? false;
}

/**
 * Get replacement form if deprecated
 */
export function getReplacementForm(formCode: string): string | undefined {
  const form = OFFICIAL_FORMS_REGISTRY[formCode];
  return form?.isDeprecated ? form.replacedBy : undefined;
}

/**
 * Get canonical GOV.UK page for a form
 */
export function getGovUKPage(formCode: string): string | undefined {
  return OFFICIAL_FORMS_REGISTRY[formCode]?.govukPage;
}

/**
 * Get online portal URL if available
 */
export function getOnlinePortalUrl(formCode: string): string | undefined {
  return OFFICIAL_FORMS_REGISTRY[formCode]?.onlinePortalUrl;
}

/**
 * Check if form has online submission option
 */
export function hasOnlineSubmission(formCode: string): boolean {
  return !!OFFICIAL_FORMS_REGISTRY[formCode]?.onlinePortalUrl;
}

/**
 * Get all form codes
 */
export function getAllFormCodes(): string[] {
  return Object.keys(OFFICIAL_FORMS_REGISTRY);
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BUSINESS LOGIC
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Determine how to present a form to the user
 */
export function getFormPresentationStrategy(formCode: string): {
  method: "FILL_PDF" | "REDIRECT_GOVUK" | "REDIRECT_ONLINE" | "ERROR";
  url: string;
  message: string;
} {
  const form = OFFICIAL_FORMS_REGISTRY[formCode];
  
  if (!form) {
    return {
      method: "ERROR",
      url: "",
      message: `Unknown form: ${formCode}`
    };
  }
  
  if (form.isDeprecated) {
    return {
      method: "ERROR",
      url: form.govukPage,
      message: `Form ${formCode} is deprecated. ${form.replacedBy ? `Use ${form.replacedBy} instead.` : ""}`
    };
  }
  
  switch (form.fetchStrategy) {
    case "LOCAL_CACHED":
      return {
        method: "FILL_PDF",
        url: form.localCachePath!,
        message: `Filling ${formCode} with your case details...`
      };
    
    case "DIRECT_PDF":
      return {
        method: "FILL_PDF",
        url: form.directPdfUrl!,
        message: `Downloading and filling ${formCode}...`
      };
    
    case "ONLINE_ONLY":
      return {
        method: "REDIRECT_ONLINE",
        url: form.onlinePortalUrl || form.govukPage,
        message: `${formCode} must be completed online at: ${form.onlinePortalUrl || form.govukPage}`
      };
    
    case "GOVUK_REDIRECT":
      return {
        method: "REDIRECT_GOVUK",
        url: form.govukPage,
        message: `Download the latest ${formCode} from GOV.UK: ${form.govukPage}`
      };
    
    default:
      return {
        method: "ERROR",
        url: form.govukPage,
        message: `Unable to process ${formCode}. Visit: ${form.govukPage}`
      };
  }
}
