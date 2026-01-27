/**
 * Mock AI Preview Generator
 * Generates realistic preview data based on dispute type and description
 * This will be replaced with real AI in Phase 3
 */

type DisputeType = string;

interface MockPreview {
  summary: string;
  keyPoints: string[];
  strength: "weak" | "moderate" | "strong";
  fullLetterPreview: string;
  lockedContent: {
    fullLetter: string;
    legalReferences: string[];
    submissionSteps: string[];
  };
}

const MOCK_TEMPLATES: Record<string, Partial<MockPreview>> = {
  speeding_ticket: {
    summary:
      "Based on your description, you have grounds to challenge this speeding ticket. The key factors include potential calibration issues with the speed detection device and mitigating circumstances that may have contributed to the incident.",
    keyPoints: [
      "Speed detection device calibration may be questionable",
      "Mitigating circumstances present in your case",
      "Procedural requirements may not have been fully met",
      "Evidence supports your version of events",
      "Timeline inconsistencies in the official report",
    ],
    strength: "moderate",
  },
  parking_fine: {
    summary:
      "Your parking fine dispute shows strong potential for success. There appear to be significant procedural errors in how the penalty was issued, and your evidence demonstrates compliance with parking regulations at the time.",
    keyPoints: [
      "Clear signage issues identified at the location",
      "Payment records show valid parking session",
      "Photographic evidence supports your claim",
      "Authority failed to follow proper notice procedures",
      "Similar cases have been successfully appealed",
    ],
    strength: "strong",
  },
  landlord: {
    summary:
      "Your landlord dispute presents a moderate to strong case. The issues you've described may constitute breaches of tenancy obligations, and you have documented evidence of the problems and your attempts to resolve them.",
    keyPoints: [
      "Documented evidence of property issues",
      "Multiple attempts to contact landlord on record",
      "Potential breach of repair obligations",
      "Photographic evidence of conditions",
      "Timeline of events clearly established",
    ],
    strength: "moderate",
  },
  default: {
    summary:
      "Based on the information provided, your dispute has merit and warrants formal challenge. The key factors in your case include documented evidence, clear timeline of events, and potential procedural issues with how the matter was handled.",
    keyPoints: [
      "Clear documentation of the disputed matter",
      "Timeline of events well established",
      "Evidence supports your position",
      "Procedural requirements may not have been met",
      "Mitigating factors present in your case",
    ],
    strength: "moderate",
  },
};

const FULL_LETTER_PREVIEW = `Dear Sir/Madam,

I am writing to formally dispute [MATTER] dated [DATE], reference number [REF].

I believe this [PENALTY/DECISION] was issued in error for the following reasons:

1. [FIRST KEY POINT FROM ANALYSIS]
2. [SECOND KEY POINT FROM ANALYSIS]
3. [THIRD KEY POINT FROM ANALYSIS]

[BLURRED CONTENT - LOCKED]`;

export function generateMockPreview(
  type: DisputeType,
  description: string,
  evidenceCount: number = 0
): MockPreview {
  // Get template or use default
  const template = MOCK_TEMPLATES[type] || MOCK_TEMPLATES.default;

  // Adjust strength based on description length and evidence
  let strength = template.strength || "moderate";
  if (description.length > 500 && evidenceCount >= 2) {
    strength = "strong";
  } else if (description.length < 200 && evidenceCount === 0) {
    strength = "weak";
  }

  // Generate preview
  return {
    summary: template.summary || MOCK_TEMPLATES.default.summary!,
    keyPoints: template.keyPoints || MOCK_TEMPLATES.default.keyPoints!,
    strength,
    fullLetterPreview: FULL_LETTER_PREVIEW,
    lockedContent: {
      fullLetter: generateFullLetter(type, description),
      legalReferences: generateLegalReferences(type),
      submissionSteps: generateSubmissionSteps(type),
    },
  };
}

function generateFullLetter(type: string, description: string): string {
  return `[FULL DISPUTE LETTER - LOCKED]

This is a complete, professionally formatted dispute letter tailored to your specific case. It includes:

- Formal salutation and reference details
- Clear statement of the dispute
- Detailed explanation of your position
- Supporting evidence references
- Legal basis for your challenge
- Requested outcome and next steps
- Professional closing

Unlock to access the full letter ready for submission.`;
}

function generateLegalReferences(type: string): string[] {
  const references: Record<string, string[]> = {
    speeding_ticket: [
      "Road Traffic Regulation Act 1984",
      "Road Traffic Offenders Act 1988",
      "ACPO Speed Enforcement Policy Guidelines",
    ],
    parking_fine: [
      "Traffic Management Act 2004",
      "Civil Enforcement of Parking Contraventions Regulations",
      "British Parking Association Code of Practice",
    ],
    landlord: [
      "Landlord and Tenant Act 1985",
      "Housing Act 2004",
      "Homes (Fitness for Human Habitation) Act 2018",
    ],
    default: [
      "Relevant statutory provisions",
      "Case law precedents",
      "Industry codes of practice",
    ],
  };

  return references[type] || references.default;
}

function generateSubmissionSteps(type: string): string[] {
  return [
    "Review the complete dispute letter for accuracy",
    "Gather all supporting evidence documents",
    "Submit via the official appeals process",
    "Keep copies of all correspondence",
    "Follow up within the specified timeframe",
  ];
}
