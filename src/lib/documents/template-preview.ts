/**
 * Feature 3: Template Preview
 * Show document preview before generating
 */

import type { CaseStrategy, Dispute, EvidenceItem } from "@prisma/client";

export interface TemplatePreviewData {
  templateId: string;
  templateName: string;
  templateDescription: string;
  placeholders: TemplatePlaceholder[];
  sampleOutput: string;
  estimatedLength: string;
  documentType: "letter" | "form" | "notice";
  requiredFields: string[];
  optionalFields: string[];
}

export interface TemplatePlaceholder {
  key: string;
  label: string;
  description: string;
  example: string;
  required: boolean;
  source: "user" | "case" | "evidence" | "computed";
}

// Template definitions for common document types
const TEMPLATE_DEFINITIONS: Record<string, Omit<TemplatePreviewData, "sampleOutput">> = {
  "UK-LBA-GENERAL": {
    templateId: "UK-LBA-GENERAL",
    templateName: "Letter Before Action (General)",
    templateDescription:
      "A formal pre-court letter giving the recipient a final opportunity to resolve the dispute before legal proceedings are issued.",
    placeholders: [
      {
        key: "sender_name",
        label: "Your Full Name",
        description: "Your legal name as it will appear on the letter",
        example: "John Smith",
        required: true,
        source: "user",
      },
      {
        key: "sender_address",
        label: "Your Address",
        description: "Your full postal address",
        example: "123 High Street, London, SW1A 1AA",
        required: true,
        source: "user",
      },
      {
        key: "recipient_name",
        label: "Recipient Name",
        description: "Name of the person or company you're writing to",
        example: "ABC Company Ltd",
        required: true,
        source: "case",
      },
      {
        key: "recipient_address",
        label: "Recipient Address",
        description: "Full address of the recipient",
        example: "456 Business Park, Manchester, M1 2AB",
        required: true,
        source: "case",
      },
      {
        key: "claim_amount",
        label: "Claim Amount",
        description: "The total amount you are claiming",
        example: "£2,500.00",
        required: true,
        source: "case",
      },
      {
        key: "incident_date",
        label: "Date of Incident",
        description: "When the issue occurred",
        example: "15 January 2024",
        required: true,
        source: "case",
      },
      {
        key: "facts_summary",
        label: "Summary of Facts",
        description: "Brief description of what happened",
        example: "Goods not delivered despite payment",
        required: true,
        source: "case",
      },
      {
        key: "evidence_list",
        label: "Evidence References",
        description: "List of evidence supporting your claim",
        example: "Receipt dated 10/01/2024, Email correspondence",
        required: false,
        source: "evidence",
      },
      {
        key: "response_deadline",
        label: "Response Deadline",
        description: "Date by which you require a response (typically 14 days)",
        example: "14 days from the date of this letter",
        required: true,
        source: "computed",
      },
    ],
    estimatedLength: "1-2 pages",
    documentType: "letter",
    requiredFields: [
      "sender_name",
      "sender_address",
      "recipient_name",
      "recipient_address",
      "claim_amount",
      "incident_date",
      "facts_summary",
      "response_deadline",
    ],
    optionalFields: ["evidence_list"],
  },
  "UK-COMPLAINT-LETTER-GENERAL": {
    templateId: "UK-COMPLAINT-LETTER-GENERAL",
    templateName: "Formal Complaint Letter",
    templateDescription:
      "A structured complaint letter to formally raise an issue with a company or organisation.",
    placeholders: [
      {
        key: "sender_name",
        label: "Your Full Name",
        description: "Your legal name",
        example: "Jane Doe",
        required: true,
        source: "user",
      },
      {
        key: "account_reference",
        label: "Account/Reference Number",
        description: "Any relevant account or reference number",
        example: "ACC-123456",
        required: false,
        source: "case",
      },
      {
        key: "complaint_details",
        label: "Complaint Details",
        description: "Clear description of your complaint",
        example: "Service was not provided as agreed",
        required: true,
        source: "case",
      },
      {
        key: "desired_resolution",
        label: "Desired Resolution",
        description: "What you want to happen to resolve the issue",
        example: "Full refund of £150",
        required: true,
        source: "case",
      },
    ],
    estimatedLength: "1 page",
    documentType: "letter",
    requiredFields: ["sender_name", "complaint_details", "desired_resolution"],
    optionalFields: ["account_reference"],
  },
  "UK-SAR-GDPR-REQUEST": {
    templateId: "UK-SAR-GDPR-REQUEST",
    templateName: "Subject Access Request (GDPR)",
    templateDescription:
      "A request under GDPR for an organisation to provide all personal data they hold about you.",
    placeholders: [
      {
        key: "sender_name",
        label: "Your Full Name",
        description: "Your legal name for identification",
        example: "John Smith",
        required: true,
        source: "user",
      },
      {
        key: "sender_dob",
        label: "Date of Birth",
        description: "Your date of birth for identification",
        example: "01/01/1980",
        required: true,
        source: "user",
      },
      {
        key: "previous_addresses",
        label: "Previous Addresses",
        description: "Any previous addresses relevant to the data",
        example: "789 Old Road, Leeds, LS1 1AA (2018-2022)",
        required: false,
        source: "user",
      },
      {
        key: "specific_data",
        label: "Specific Data Requested",
        description: "Any specific types of data you want",
        example: "All emails, call recordings, and account notes",
        required: false,
        source: "case",
      },
    ],
    estimatedLength: "1 page",
    documentType: "letter",
    requiredFields: ["sender_name", "sender_dob"],
    optionalFields: ["previous_addresses", "specific_data"],
  },
};

/**
 * Get preview data for a template
 */
export function getTemplatePreview(templateId: string): TemplatePreviewData | null {
  const template = TEMPLATE_DEFINITIONS[templateId];
  if (!template) return null;

  return {
    ...template,
    sampleOutput: generateSampleOutput(templateId),
  };
}

/**
 * Get all available templates for preview
 */
export function getAllTemplates(): TemplatePreviewData[] {
  return Object.keys(TEMPLATE_DEFINITIONS).map((id) => ({
    ...TEMPLATE_DEFINITIONS[id],
    sampleOutput: generateSampleOutput(id),
  }));
}

/**
 * Generate a sample output for a template
 */
function generateSampleOutput(templateId: string): string {
  const samples: Record<string, string> = {
    "UK-LBA-GENERAL": `
[Your Name]
[Your Address]
[Your Email]
[Your Phone]

[Date]

[Recipient Name]
[Recipient Address]

LETTER BEFORE ACTION

Dear Sir/Madam,

RE: Formal Notice of Intended Legal Proceedings
Claim Amount: [£X,XXX.XX]

I write to notify you that unless the matter set out below is resolved within 14 days of the date of this letter, I intend to issue court proceedings against you without further notice.

BACKGROUND

[Summary of the facts of your dispute will appear here, based on the information you have provided during the case interview.]

CLAIM

I am therefore claiming the sum of [£X,XXX.XX], being:
- [Breakdown of claim amounts]

EVIDENCE

The following evidence supports my claim:
[List of evidence items with reference numbers]

REQUIRED ACTION

Please respond to this letter within 14 days confirming:
1. Whether you accept or dispute the claim
2. Your proposals for resolving this matter

Failure to respond may result in court proceedings being issued against you.

Yours faithfully,

[Your Name]
    `.trim(),
    "UK-COMPLAINT-LETTER-GENERAL": `
[Your Name]
[Your Address]
[Your Email]

[Date]

[Company Name]
[Company Address]

FORMAL COMPLAINT

Dear Sir/Madam,

Reference: [Account Number]

I am writing to formally complain about [brief summary of issue].

DETAILS OF COMPLAINT

[Full description of the complaint, including dates, times, and relevant details from your case information.]

IMPACT

[Description of how this has affected you]

RESOLUTION SOUGHT

To resolve this complaint, I request:
[Your desired outcome]

Please respond to this complaint within 8 weeks as required by regulation.

Yours faithfully,

[Your Name]
    `.trim(),
    "UK-SAR-GDPR-REQUEST": `
[Your Name]
[Your Address]
[Your Email]

[Date]

Data Protection Officer
[Organisation Name]
[Organisation Address]

SUBJECT ACCESS REQUEST UNDER UK GDPR

Dear Sir/Madam,

I am writing to make a subject access request under Article 15 of the UK General Data Protection Regulation (UK GDPR).

Please provide me with a copy of all personal data you hold about me. This should include, but is not limited to:
- Account information and records
- Communications (emails, letters, call recordings and notes)
- Transaction history
- Any profiling or automated decision-making data

For identification purposes:
Full Name: [Your Name]
Date of Birth: [Your DOB]
Current Address: [Your Address]

Please respond within one calendar month as required by UK GDPR Article 12(3).

Yours faithfully,

[Your Name]
    `.trim(),
  };

  return samples[templateId] || "Sample output not available for this template.";
}

/**
 * Preview a document with actual case data
 */
export function previewWithCaseData(
  templateId: string,
  caseData: Dispute & { caseStrategy: CaseStrategy | null },
  userData: { firstName: string; lastName: string; email: string; addressLine1?: string; city?: string; postcode?: string },
  evidence: EvidenceItem[]
): string {
  const template = getTemplatePreview(templateId);
  if (!template) return "Template not found";

  let preview = template.sampleOutput;

  // Replace user placeholders
  preview = preview.replace(/\[Your Name\]/g, `${userData.firstName} ${userData.lastName}`);
  preview = preview.replace(/\[Your Email\]/g, userData.email);
  if (userData.addressLine1) {
    const address = [userData.addressLine1, userData.city, userData.postcode]
      .filter(Boolean)
      .join(", ");
    preview = preview.replace(/\[Your Address\]/g, address);
  }

  // Replace date
  preview = preview.replace(/\[Date\]/g, new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }));

  // Replace case placeholders
  if (caseData.caseStrategy) {
    const strategy = caseData.caseStrategy as unknown as {
      keyFacts?: string[];
      desiredOutcome?: string;
    };
    
    if (strategy.keyFacts && strategy.keyFacts.length > 0) {
      preview = preview.replace(
        /\[Summary of the facts.*?\]/g,
        strategy.keyFacts.join("\n\n")
      );
    }
    
    if (strategy.desiredOutcome) {
      preview = preview.replace(/\[Your desired outcome\]/g, strategy.desiredOutcome);
    }
  }

  // Replace evidence list
  if (evidence.length > 0) {
    const evidenceList = evidence
      .map((e) => `Evidence Item #${e.evidenceIndex}: ${e.title}`)
      .join("\n");
    preview = preview.replace(/\[List of evidence.*?\]/g, evidenceList);
  }

  return preview;
}

/**
 * Get templates suitable for a case type
 */
export function getTemplatesForCaseType(disputeType: string): TemplatePreviewData[] {
  const typeMapping: Record<string, string[]> = {
    consumer: ["UK-COMPLAINT-LETTER-GENERAL", "UK-LBA-GENERAL"],
    employment: ["UK-COMPLAINT-LETTER-GENERAL"],
    housing: ["UK-COMPLAINT-LETTER-GENERAL", "UK-LBA-GENERAL"],
    data_protection: ["UK-SAR-GDPR-REQUEST"],
    financial: ["UK-COMPLAINT-LETTER-GENERAL", "UK-LBA-GENERAL"],
  };

  const templateIds = typeMapping[disputeType] || Object.keys(TEMPLATE_DEFINITIONS);
  
  return templateIds
    .map((id) => getTemplatePreview(id))
    .filter((t): t is TemplatePreviewData => t !== null);
}
