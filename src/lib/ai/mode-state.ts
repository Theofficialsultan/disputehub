/**
 * AI MODE STATE MACHINE
 * Manages explicit AI operating modes with event-driven transitions
 */

export type AIMode =
  | "INFO_GATHERING"
  | "GUIDANCE"
  | "WAITING_FOR_UPLOAD"
  | "PROCESSING"
  | "LOCKED";

export type AIEvent =
  | "EVIDENCE_UPLOADED"
  | "EVIDENCE_REMOVED"
  | "USER_ASKS_FOR_GUIDANCE"
  | "USER_CONFIRMS_UPLOAD_INTENT"
  | "FACTS_COMPLETE"
  | "DOCUMENTS_TRIGGERED";

export interface AIState {
  mode: AIMode;
  lastTransitionAt: Date;
  lastMessageAt: Date | null;
  canSendMessage: boolean;
  waitingReason: string | null;
}

/**
 * Determine if user message is asking for guidance about evidence
 */
export function detectGuidanceRequest(userMessage: string): boolean {
  const lowerMessage = userMessage.toLowerCase();
  
  const guidancePatterns = [
    "what evidence",
    "what should i upload",
    "what do you need",
    "what files",
    "what documents",
    "which evidence",
    "what proof",
    "wait what",
  ];

  return guidancePatterns.some((pattern) => lowerMessage.includes(pattern));
}

/**
 * Determine if user is confirming intent to upload
 */
export function detectUploadIntent(userMessage: string): boolean {
  const lowerMessage = userMessage.toLowerCase();
  
  const intentPatterns = [
    "i'll upload",
    "ill upload",
    "i will upload",
    "uploading now",
    "let me upload",
    "going to upload",
    "i'm uploading",
    "im uploading",
  ];

  return intentPatterns.some((pattern) => lowerMessage.includes(pattern));
}

/**
 * Compute next AI mode based on current state and event
 */
export function computeNextMode(
  currentMode: AIMode,
  event: AIEvent,
  evidenceExists: boolean,
  factsComplete: boolean
): AIMode {
  // Event-driven state transitions
  switch (event) {
    case "EVIDENCE_UPLOADED":
      // Evidence uploaded → always return to info gathering
      return "INFO_GATHERING";

    case "USER_ASKS_FOR_GUIDANCE":
      // User needs help → guidance mode
      return "GUIDANCE";

    case "USER_CONFIRMS_UPLOAD_INTENT":
      // User said they'll upload → waiting mode
      if (!evidenceExists) {
        return "WAITING_FOR_UPLOAD";
      }
      return currentMode;

    case "FACTS_COMPLETE":
      // Facts gathered, check evidence
      if (!evidenceExists) {
        return "GUIDANCE"; // Explain what evidence is needed
      }
      return "PROCESSING";

    case "DOCUMENTS_TRIGGERED":
      return "LOCKED";

    default:
      return currentMode;
  }
}

/**
 * Determine if AI can send a message in current mode
 */
export function canSendMessage(
  mode: AIMode,
  lastMessageAt: Date | null,
  event: AIEvent | null
): boolean {
  switch (mode) {
    case "INFO_GATHERING":
      return true; // Always can send in gathering mode

    case "GUIDANCE":
      return true; // Always can send guidance

    case "WAITING_FOR_UPLOAD":
      // In waiting mode, can ONLY send if:
      // 1. This is the first time entering waiting mode (lastMessageAt is null)
      // 2. An event occurred (evidence uploaded)
      if (event === "EVIDENCE_UPLOADED") {
        return true;
      }
      return lastMessageAt === null;

    case "PROCESSING":
      return false; // Silent during processing

    case "LOCKED":
      return false; // Silent when locked

    default:
      return false;
  }
}

/**
 * Build AI state from conversation context
 */
export function buildAIState(
  currentPhase: string,
  evidenceExists: boolean,
  lastUserMessage: string | null,
  lastAIMessageAt: Date | null
): AIState {
  // Determine mode based on phase and context
  let mode: AIMode = "INFO_GATHERING";

  if (currentPhase === "LOCKED" || currentPhase === "COMPLETED") {
    mode = "LOCKED";
  } else if (currentPhase === "GENERATING" || currentPhase === "ROUTING") {
    mode = "PROCESSING";
  } else if (lastUserMessage && detectGuidanceRequest(lastUserMessage)) {
    mode = "GUIDANCE";
  } else if (
    lastUserMessage &&
    detectUploadIntent(lastUserMessage) &&
    !evidenceExists
  ) {
    mode = "WAITING_FOR_UPLOAD";
  }

  return {
    mode,
    lastTransitionAt: new Date(),
    lastMessageAt: lastAIMessageAt,
    canSendMessage: canSendMessage(mode, lastAIMessageAt, null),
    waitingReason: mode === "WAITING_FOR_UPLOAD" ? "evidence_upload" : null,
  };
}

/**
 * Determines if AI should exit WAITING mode based on evidence state
 * 
 * CRITICAL FIX: Exit waiting mode immediately when evidence is uploaded
 */
export function shouldExitWaitingMode(
  currentMode: AIMode,
  evidenceCount: number
): boolean {
  // If in WAITING mode and evidence exists, exit immediately
  if (currentMode === "WAITING_FOR_UPLOAD" && evidenceCount > 0) {
    return true;
  }

  return false;
}

/**
 * Get mode-specific instruction for AI prompt
 */
export function getModeInstruction(mode: AIMode): string {
  switch (mode) {
    case "INFO_GATHERING":
      return `MODE: INFO_GATHERING
You are gathering facts about the case.
Ask ONE clear question at a time.
Acknowledge what you learn briefly.`;

    case "GUIDANCE":
      return `MODE: GUIDANCE
The user is asking what evidence they need.
Explain clearly:
1. What evidence is required
2. Why each item matters
3. Examples of acceptable evidence
4. How to upload it

Do NOT say "upload now" repeatedly.
Give clear guidance then STOP.`;

    case "WAITING_FOR_UPLOAD":
      return `MODE: WAITING_FOR_UPLOAD
The user said they will upload evidence.

CRITICAL: Send ONLY ONE message:
"No rush — I'll continue once something is uploaded."

Then you MUST remain SILENT.
Do NOT send any more messages until evidence appears.
Do NOT repeat "I'm waiting".`;

    case "PROCESSING":
      return `MODE: PROCESSING
Documents are being generated by the system.
You are SILENT. Do not respond.`;

    case "LOCKED":
      return `MODE: LOCKED
This case is locked. You should not be receiving messages.`;

    default:
      return "";
  }
}
