/**
 * EVIDENCE STATE MANAGER
 * Source of truth for evidence requirements and uploads
 * 
 * This is the ONLY authority on whether evidence exists or is required.
 */

export interface EvidenceItem {
  id: string;
  title: string;
  description: string | null;
  fileType: string;
  evidenceDate: Date | null;
  evidenceIndex: number;
}

export interface EvidenceRequirement {
  type: string;
  description: string;
  example: string;
  required: boolean;
}

export interface EvidenceState {
  required: EvidenceRequirement[];
  uploaded: EvidenceItem[];
  missing: string[];
  lastUploadAt: Date | null;
  hasMinimumEvidence: boolean;
}

/**
 * Compute evidence requirements based on case type
 */
export function computeEvidenceRequirements(
  disputeType: string | null
): EvidenceRequirement[] {
  if (!disputeType) {
    return [
      {
        type: "general",
        description: "Evidence of what happened",
        example: "Photos, emails, messages, contracts, receipts",
        required: true,
      },
    ];
  }

  const requirements: Record<string, EvidenceRequirement[]> = {
    employment: [
      {
        type: "correspondence",
        description: "Written communication about the issue",
        example: "Emails, letters, text messages from employer",
        required: true,
      },
      {
        type: "proof_of_work",
        description: "Evidence you worked",
        example: "Photos at workplace, timesheets, shift confirmations",
        required: true,
      },
    ],
    landlord: [
      {
        type: "tenancy_agreement",
        description: "Proof of tenancy",
        example: "Rental contract, emails confirming tenancy",
        required: true,
      },
      {
        type: "evidence_of_issue",
        description: "Photos or reports of the problem",
        example: "Photos of damage, mold, disrepair",
        required: true,
      },
    ],
    consumer: [
      {
        type: "proof_of_purchase",
        description: "Receipt or order confirmation",
        example: "Receipt, invoice, order email",
        required: true,
      },
      {
        type: "evidence_of_defect",
        description: "Photos or description of the problem",
        example: "Photos of faulty item, screenshots of error",
        required: true,
      },
    ],
    parking: [
      {
        type: "pcn_notice",
        description: "The parking charge notice",
        example: "Photo of the PCN ticket",
        required: true,
      },
      {
        type: "parking_evidence",
        description: "Photos showing the situation",
        example: "Photos of parking location, signs, pay machine",
        required: false,
      },
    ],
    default: [
      {
        type: "general",
        description: "Evidence supporting your claim",
        example: "Photos, emails, messages, documents, receipts",
        required: true,
      },
    ],
  };

  return requirements[disputeType] || requirements.default;
}

/**
 * Build EvidenceState from current system state
 */
export function buildEvidenceState(
  disputeType: string | null,
  uploadedEvidence: EvidenceItem[]
): EvidenceState {
  const requirements = computeEvidenceRequirements(disputeType);
  
  // Determine missing evidence types
  const missing: string[] = [];
  for (const req of requirements) {
    if (req.required && uploadedEvidence.length === 0) {
      missing.push(req.description);
    }
  }

  // Find most recent upload
  const lastUploadAt = uploadedEvidence.length > 0
    ? uploadedEvidence.reduce((latest, item) => {
        const itemDate = new Date(item.evidenceDate || 0);
        return itemDate > latest ? itemDate : latest;
      }, new Date(0))
    : null;

  // Check if minimum evidence requirement met
  const hasMinimumEvidence = uploadedEvidence.length >= 1;

  return {
    required: requirements,
    uploaded: uploadedEvidence,
    missing,
    lastUploadAt,
    hasMinimumEvidence,
  };
}

/**
 * Format evidence state for AI prompt
 */
export function formatEvidenceStateForAI(state: EvidenceState): string {
  let prompt = `═══════════════════════════════════════════════════════════════════════════
📎 EVIDENCE STATE (SOURCE OF TRUTH)
═══════════════════════════════════════════════════════════════════════════

`;

  // Show uploaded evidence
  if (state.uploaded.length > 0) {
    prompt += `✅ UPLOADED: ${state.uploaded.length} file(s) confirmed by system\n\n`;
    state.uploaded.forEach((item) => {
      const date = item.evidenceDate
        ? ` (${new Date(item.evidenceDate).toLocaleDateString("en-GB")})`
        : "";
      prompt += `Evidence #${item.evidenceIndex}: "${item.title}"${date}\n`;
      prompt += `   Type: ${item.fileType}\n`;
      if (item.description) {
        prompt += `   Description: ${item.description}\n`;
      }
      prompt += `\n`;
    });
    prompt += `You MAY acknowledge these files exist.\n`;
    prompt += `DO NOT say you "reviewed the content" - you can only see title/description.\n\n`;
  } else {
    prompt += `❌ UPLOADED: 0 files (NONE EXIST)\n\n`;
    prompt += `CRITICAL: You MUST NOT say:\n`;
    prompt += `• "I've reviewed the evidence"\n`;
    prompt += `• "Based on the files..."\n`;
    prompt += `• "The documents show..."\n\n`;
  }

  // Show required evidence
  if (state.required.length > 0 && !state.hasMinimumEvidence) {
    prompt += `📋 REQUIRED EVIDENCE:\n\n`;
    state.required.forEach((req, idx) => {
      prompt += `${idx + 1}. ${req.description}\n`;
      prompt += `   Example: ${req.example}\n`;
      if (!req.required) {
        prompt += `   (Optional)\n`;
      }
      prompt += `\n`;
    });
  }

  // Show status
  if (state.hasMinimumEvidence) {
    prompt += `✅ STATUS: Minimum evidence requirement met\n`;
  } else {
    prompt += `⚠️ STATUS: Evidence required but not yet uploaded\n`;
  }

  return prompt;
}
