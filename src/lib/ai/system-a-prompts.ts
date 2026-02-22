/**
 * SYSTEM A - LAWYER INTERFACE AI (Claude Opus 4)
 * 
 * This is the ONLY AI that talks to the user during information gathering.
 * Philosophy: Professional solicitor using universal 9-stage gathering methodology.
 * Goal: Gather facts deliberately, let user choose route, prepare for routing.
 */

import type { ChatState } from "@prisma/client";
import type { ExtractedFacts } from "./system-b-extractor";
import { 
  UNIVERSAL_GATHERING_PROMPT, 
  formatGatheringStateContext, 
  type GatheringState,
  type GatheringStage 
} from "./universal-gathering";

/**
 * Convert ChatState to GatheringStage
 */
function chatStateToGatheringStage(chatState: ChatState): GatheringStage {
  const mapping: Record<ChatState, GatheringStage> = {
    "GATHERING_FACTS": "FACTS_GATHERING",
    "WAITING_FOR_UPLOAD": "WAITING_FOR_EVIDENCE",
    "CONFIRMING_SUMMARY": "READY_FOR_ROUTING",
    "ROUTING_DECISION": "READY_FOR_ROUTING",
    "DOCUMENTS_PREPARING": "READY_FOR_ROUTING",
    "GUIDANCE_ONLY": "READY_FOR_ROUTING",
    "CLOSED": "READY_FOR_ROUTING",
  };
  
  return mapping[chatState] || "INITIAL";
}

/**
 * Build gathering state from extracted facts
 */
function buildGatheringState(
  chatState: ChatState,
  extractedFacts?: ExtractedFacts
): GatheringState {
  const stage = chatStateToGatheringStage(chatState);
  
  return {
    stage,
    domain: extractedFacts?.disputeType as any,
    relationship: extractedFacts?.parties.relationship,
    otherParty: extractedFacts?.parties.counterparty,
    whatHappened: extractedFacts?.facts.join("; "),
    amount: extractedFacts?.financialAmount,
    desiredRoute: undefined, // Will be filled when user chooses
    evidenceRequested: extractedFacts ? extractedFacts.evidenceProvided.length > 0 : false,
    evidenceConfirmed: extractedFacts ? extractedFacts.evidenceProvided.length > 0 : false,
    completedStages: [] // TODO: Track this in database
  };
}

/**
 * Get complete system prompt for Claude Opus 4
 * Now uses universal gathering methodology
 */
export function getSystemAPrompt(
  chatState: ChatState,
  extractedFacts?: ExtractedFacts,
  evidenceFiles: any[] = []
): string {
  // Build gathering state
  const gatheringState = buildGatheringState(chatState, extractedFacts);
  
  // Format state context
  const stateContext = formatGatheringStateContext(gatheringState, evidenceFiles);
  
  // Return universal gathering prompt with state context
  return `${UNIVERSAL_GATHERING_PROMPT}

${stateContext}

---

## ADDITIONAL CONTEXT FROM SYSTEM B (FACT EXTRACTOR):

${extractedFacts ? `
### FACTS EXTRACTED SO FAR:
- Dispute type: ${extractedFacts.disputeType || "Not yet identified"}
- User: ${extractedFacts.parties.user || "Not provided"}
- Other party: ${extractedFacts.parties.counterparty || "Not provided"}
- Relationship: ${extractedFacts.parties.relationship || "Not clear"}
- Amount: ${extractedFacts.financialAmount ? `£${extractedFacts.financialAmount}` : "Not mentioned"}
- Date: ${extractedFacts.incidentDate || "Not provided"}
- Evidence uploaded: ${extractedFacts.evidenceProvided.length} items
- Key facts: ${extractedFacts.facts.slice(0, 5).join("; ")}
- Readiness: ${extractedFacts.readinessScore}%

### STILL MISSING:
${extractedFacts.missingCriticalInfo.length > 0 
  ? extractedFacts.missingCriticalInfo.map(m => `- ${m}`).join('\n') 
  : "Nothing critical - consider moving to route selection"}
` : "This is the first message - start gathering information"}

---

## OUTPUT FORMAT:

Write naturally. Keep responses under 100 words unless presenting route options.
Remember: You're a competent solicitor. Be direct, be efficient, be human.
`;
}

/**
 * Get the model to use for System A
 */
export function getSystemAModel(): string {
  return "claude-opus-4-20250514";
}
