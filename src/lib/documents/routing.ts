/**
 * Document Routing Logic
 * Phase 7.2 Block 3A
 * 
 * Determines which documents to generate based on
 * case complexity and dispute type
 */

import type {
  CaseStrategyInput,
  PlannedDocument,
  DocumentStructureType,
  CaseComplexity,
} from "./types";
import { DOCUMENT_TYPES } from "./types";

/**
 * Document definitions with metadata
 */
const DOCUMENT_DEFINITIONS: Record<
  string,
  Omit<PlannedDocument, "order" | "required">
> = {
  COVER_LETTER: {
    type: DOCUMENT_TYPES.COVER_LETTER,
    title: "Cover Letter",
    description: "Summary and submission guidance for your document package",
  },
  FORMAL_LETTER: {
    type: DOCUMENT_TYPES.FORMAL_LETTER,
    title: "Formal Dispute Letter",
    description: "Detailed letter addressing your dispute",
  },
  EVIDENCE_SCHEDULE: {
    type: DOCUMENT_TYPES.EVIDENCE_SCHEDULE,
    title: "Evidence List",
    description: "Organized schedule of supporting evidence",
  },
  TIMELINE: {
    type: DOCUMENT_TYPES.TIMELINE,
    title: "Event Timeline",
    description: "Chronological breakdown of key events",
  },
  WITNESS_STATEMENT: {
    type: DOCUMENT_TYPES.WITNESS_STATEMENT,
    title: "Witness Statement Template",
    description: "Template for witness accounts and statements",
  },
  STATUTORY_DECLARATION: {
    type: DOCUMENT_TYPES.STATUTORY_DECLARATION,
    title: "Statutory Declaration",
    description: "Formal legal declaration under oath",
  },
  APPEAL_FORM: {
    type: DOCUMENT_TYPES.APPEAL_FORM,
    title: "Appeal Form",
    description: "Structured appeal or complaint form",
  },
};

/**
 * Determine document structure type based on complexity
 */
export function determineDocumentStructure(
  complexity: CaseComplexity
): DocumentStructureType {
  return complexity === "SIMPLE"
    ? "SINGLE_LETTER"
    : "MULTI_DOCUMENT_DOCKET";
}

/**
 * Build document list for SIMPLE cases
 * 
 * Simple cases get a single, comprehensive formal letter
 */
function buildSimpleDocumentList(
  strategy: CaseStrategyInput
): PlannedDocument[] {
  const disputeTypeLabel = strategy.disputeType?.replace(/_/g, " ") || "dispute";
  
  return [
    {
      ...DOCUMENT_DEFINITIONS.FORMAL_LETTER,
      title: `${disputeTypeLabel.charAt(0).toUpperCase() + disputeTypeLabel.slice(1)} Dispute Letter`,
      order: 1,
      required: true,
    },
  ];
}

/**
 * Build document list for COMPLEX cases
 * 
 * Complex cases get a multi-document docket with
 * documents tailored to the dispute type
 */
function buildComplexDocumentList(
  strategy: CaseStrategyInput
): PlannedDocument[] {
  const documents: PlannedDocument[] = [];
  let order = 1;

  // Always include cover letter for complex cases
  documents.push({
    ...DOCUMENT_DEFINITIONS.COVER_LETTER,
    order: order++,
    required: true,
  });

  // Always include main formal letter
  const disputeTypeLabel = strategy.disputeType?.replace(/_/g, " ") || "dispute";
  documents.push({
    ...DOCUMENT_DEFINITIONS.FORMAL_LETTER,
    title: `Main ${disputeTypeLabel.charAt(0).toUpperCase() + disputeTypeLabel.slice(1)} Letter`,
    order: order++,
    required: true,
  });

  // Always include evidence schedule if evidence exists
  if (strategy.evidenceMentioned.length > 0) {
    documents.push({
      ...DOCUMENT_DEFINITIONS.EVIDENCE_SCHEDULE,
      order: order++,
      required: true,
    });
  }

  // Include timeline if many facts (5+)
  if (strategy.keyFacts.length >= 5) {
    documents.push({
      ...DOCUMENT_DEFINITIONS.TIMELINE,
      order: order++,
      required: true,
    });
  }

  // Dispute-type specific documents
  const disputeType = strategy.disputeType;

  switch (disputeType) {
    case "employment":
      // Employment disputes often need witness statements and appeal forms
      if (hasWitnessEvidence(strategy)) {
        documents.push({
          ...DOCUMENT_DEFINITIONS.WITNESS_STATEMENT,
          order: order++,
          required: false, // Optional - user may not have witnesses
        });
      }
      if (requiresAppeal(strategy)) {
        documents.push({
          ...DOCUMENT_DEFINITIONS.APPEAL_FORM,
          title: "Employment Tribunal Form",
          description: "Structured form for employment tribunal submission",
          order: order++,
          required: true,
        });
      }
      break;

    case "benefits":
      // Benefits disputes typically need appeal forms
      documents.push({
        ...DOCUMENT_DEFINITIONS.APPEAL_FORM,
        title: "Benefits Appeal Form",
        description: "Structured form for benefits appeal",
        order: order++,
        required: true,
      });
      if (hasMedicalEvidence(strategy)) {
        documents.push({
          ...DOCUMENT_DEFINITIONS.STATUTORY_DECLARATION,
          title: "Medical Evidence Declaration",
          description: "Declaration for medical evidence submission",
          order: order++,
          required: false,
        });
      }
      break;

    case "immigration":
      // Immigration cases need comprehensive evidence schedules
      if (!documents.find((d) => d.type === DOCUMENT_TYPES.EVIDENCE_SCHEDULE)) {
        documents.push({
          ...DOCUMENT_DEFINITIONS.EVIDENCE_SCHEDULE,
          order: order++,
          required: true,
        });
      }
      if (hasWitnessEvidence(strategy)) {
        documents.push({
          ...DOCUMENT_DEFINITIONS.WITNESS_STATEMENT,
          title: "Supporting Statement",
          description: "Supporting statements from family, employer, or references",
          order: order++,
          required: false,
        });
      }
      break;

    case "landlord":
      // Landlord disputes benefit from timelines (important for deposit claims)
      if (!documents.find((d) => d.type === DOCUMENT_TYPES.TIMELINE)) {
        documents.push({
          ...DOCUMENT_DEFINITIONS.TIMELINE,
          order: order++,
          required: true,
        });
      }
      break;

    case "speeding_ticket":
      // Speeding tickets may need statutory declarations
      if (requiresStatutoryDeclaration(strategy)) {
        documents.push({
          ...DOCUMENT_DEFINITIONS.STATUTORY_DECLARATION,
          title: "Statutory Declaration",
          description: "Legal declaration that you were not the driver",
          order: order++,
          required: false,
        });
      }
      break;

    // Other dispute types use base documents only
    default:
      break;
  }

  return documents;
}

/**
 * Helper: Check if strategy mentions witnesses
 */
function hasWitnessEvidence(strategy: CaseStrategyInput): boolean {
  const evidenceStr = strategy.evidenceMentioned.join(" ").toLowerCase();
  const factStr = strategy.keyFacts.join(" ").toLowerCase();
  const combined = `${evidenceStr} ${factStr}`;

  return (
    combined.includes("witness") ||
    combined.includes("colleague") ||
    combined.includes("friend") ||
    combined.includes("family") ||
    combined.includes("testimony")
  );
}

/**
 * Helper: Check if strategy mentions medical evidence
 */
function hasMedicalEvidence(strategy: CaseStrategyInput): boolean {
  const evidenceStr = strategy.evidenceMentioned.join(" ").toLowerCase();
  const factStr = strategy.keyFacts.join(" ").toLowerCase();
  const combined = `${evidenceStr} ${factStr}`;

  return (
    combined.includes("medical") ||
    combined.includes("doctor") ||
    combined.includes("hospital") ||
    combined.includes("diagnosis") ||
    combined.includes("prescription") ||
    combined.includes("health")
  );
}

/**
 * Helper: Check if outcome requires appeal/tribunal
 */
function requiresAppeal(strategy: CaseStrategyInput): boolean {
  const outcome = strategy.desiredOutcome?.toLowerCase() || "";

  return (
    outcome.includes("tribunal") ||
    outcome.includes("appeal") ||
    outcome.includes("hearing") ||
    outcome.includes("adjudication")
  );
}

/**
 * Helper: Check if statutory declaration is needed
 */
function requiresStatutoryDeclaration(strategy: CaseStrategyInput): boolean {
  const factStr = strategy.keyFacts.join(" ").toLowerCase();
  const outcome = strategy.desiredOutcome?.toLowerCase() || "";

  return (
    factStr.includes("not the driver") ||
    factStr.includes("wasn't driving") ||
    factStr.includes("someone else") ||
    outcome.includes("statutory declaration")
  );
}

/**
 * Main routing function
 * 
 * Determines complete document list based on complexity and dispute type
 */
export function routeDocuments(
  strategy: CaseStrategyInput,
  complexity: CaseComplexity
): PlannedDocument[] {
  if (complexity === "SIMPLE") {
    return buildSimpleDocumentList(strategy);
  } else {
    return buildComplexDocumentList(strategy);
  }
}

/**
 * Get document count summary
 */
export function getDocumentSummary(documents: PlannedDocument[]): {
  total: number;
  required: number;
  optional: number;
} {
  return {
    total: documents.length,
    required: documents.filter((d) => d.required).length,
    optional: documents.filter((d) => !d.required).length,
  };
}
