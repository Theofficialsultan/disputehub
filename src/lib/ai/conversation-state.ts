/**
 * CONVERSATION STATE TRACKER
 * Source of truth for what has been asked, answered, and uploaded
 * 
 * This prevents the AI from repeating questions or hallucinating evidence.
 */

export interface ConversationState {
  // What questions have been asked
  questionsAsked: string[];
  
  // What information already exists in strategy
  answersProvided: {
    disputeType: boolean;
    otherParty: boolean;
    whatHappened: boolean;
    amount: boolean;
    relationship: boolean;
  };
  
  // Evidence state (SOURCE OF TRUTH from backend)
  evidenceRequested: boolean;
  evidenceRequestedAt: Date | null;
  evidenceUploaded: number; // Count from database
  evidenceUploadedAt: Date | null;
  
  // Waiting mode
  waitingForEvidence: boolean;
  waitingSince: Date | null;
  
  // Completion
  strategyComplete: boolean;
  chatLocked: boolean;
  
  // Conversation phase
  phase: "GATHERING" | "WAITING" | "READY" | "LOCKED";
}

/**
 * Build conversation state from database data
 */
export function buildConversationState(
  messages: Array<{ role: string; content: string; createdAt: Date }>,
  strategy: any,
  evidenceCount: number,
  chatLocked: boolean
): ConversationState {
  
  // Extract questions that have been asked by AI
  const questionsAsked: string[] = [];
  const aiMessages = messages.filter(m => m.role === "AI");
  
  aiMessages.forEach(msg => {
    const content = msg.content.toLowerCase();
    if (content.includes("?")) {
      // Extract the question
      const sentences = msg.content.split(/[.!?]/);
      const questions = sentences.filter(s => s.includes("?"));
      questionsAsked.push(...questions);
    }
  });
  
  // Check what information already exists in strategy
  const answersProvided = {
    disputeType: !!strategy?.disputeType,
    otherParty: hasOtherParty(strategy),
    whatHappened: hasWhatHappened(strategy),
    amount: hasAmount(strategy),
    relationship: hasRelationship(strategy),
  };
  
  // Check if evidence has been requested
  const evidenceRequested = aiMessages.some(msg => 
    msg.content.toLowerCase().includes("evidence") &&
    (msg.content.toLowerCase().includes("upload") || 
     msg.content.toLowerCase().includes("need"))
  );
  
  const evidenceRequestMessage = aiMessages.find(msg =>
    msg.content.toLowerCase().includes("evidence") &&
    msg.content.toLowerCase().includes("upload")
  );
  
  // Detect if AI is in waiting mode
  const lastAIMessage = aiMessages[aiMessages.length - 1];
  const waitingForEvidence = lastAIMessage?.content.toLowerCase().includes("i'll wait") ||
                             lastAIMessage?.content.toLowerCase().includes("no rush") ||
                             (evidenceRequested && evidenceCount === 0);
  
  // Determine phase
  let phase: ConversationState["phase"] = "GATHERING";
  
  if (chatLocked) {
    phase = "LOCKED";
  } else if (waitingForEvidence && evidenceCount === 0) {
    phase = "WAITING";
  } else if (allAnswersProvided(answersProvided) && evidenceCount > 0) {
    phase = "READY";
  }
  
  return {
    questionsAsked,
    answersProvided,
    evidenceRequested,
    evidenceRequestedAt: evidenceRequestMessage?.createdAt || null,
    evidenceUploaded: evidenceCount,
    evidenceUploadedAt: evidenceCount > 0 ? new Date() : null,
    waitingForEvidence,
    waitingSince: waitingForEvidence ? (evidenceRequestMessage?.createdAt || new Date()) : null,
    strategyComplete: allAnswersProvided(answersProvided) && evidenceCount > 0,
    chatLocked,
    phase,
  };
}

/**
 * Determine if AI can send a message based on state
 */
export function canAISendMessage(state: ConversationState): {
  allowed: boolean;
  reason?: string;
} {
  // LOCKED: No messages allowed
  if (state.phase === "LOCKED") {
    return {
      allowed: false,
      reason: "Chat is locked",
    };
  }
  
  // WAITING: AI is silent until evidence appears
  if (state.phase === "WAITING" && state.evidenceUploaded === 0) {
    return {
      allowed: false,
      reason: "Waiting for evidence upload - AI must remain silent",
    };
  }
  
  // READY: Only final confirmation message allowed
  if (state.phase === "READY" && state.strategyComplete) {
    return {
      allowed: true,
      reason: "Send final confirmation and lock chat",
    };
  }
  
  // GATHERING: Normal conversation
  return {
    allowed: true,
    reason: "Normal gathering mode",
  };
}

/**
 * Generate state-aware instruction for AI
 */
export function getStateInstruction(state: ConversationState): string {
  let instruction = `═══════════════════════════════════════════════════════════════════════════
CONVERSATION STATE (YOUR MEMORY)
═══════════════════════════════════════════════════════════════════════════

`;

  // Show what information already exists
  instruction += `INFORMATION ALREADY PROVIDED:\n`;
  if (state.answersProvided.disputeType) instruction += `✅ Dispute type identified\n`;
  if (state.answersProvided.otherParty) instruction += `✅ Other party identified\n`;
  if (state.answersProvided.whatHappened) instruction += `✅ What happened described\n`;
  if (state.answersProvided.amount) instruction += `✅ Amount/outcome specified\n`;
  if (state.answersProvided.relationship) instruction += `✅ Relationship clarified\n`;
  
  const answeredCount = Object.values(state.answersProvided).filter(Boolean).length;
  instruction += `\nProgress: ${answeredCount}/5 core facts\n\n`;
  
  // Show evidence state
  instruction += `EVIDENCE STATE:\n`;
  if (state.evidenceUploaded > 0) {
    instruction += `✅ ${state.evidenceUploaded} file(s) uploaded\n`;
    instruction += `You MAY acknowledge these files exist.\n\n`;
  } else {
    instruction += `❌ 0 files uploaded\n`;
    if (state.evidenceRequested) {
      instruction += `⏳ Evidence requested - WAITING MODE ACTIVE\n`;
      instruction += `YOU MUST REMAIN SILENT until evidence appears.\n\n`;
    } else {
      instruction += `Evidence not yet requested.\n\n`;
    }
  }
  
  // Phase-specific instruction
  instruction += `CURRENT PHASE: ${state.phase}\n\n`;
  
  switch (state.phase) {
    case "GATHERING":
      instruction += `MODE: GATHERING\n`;
      instruction += `Ask for ONE piece of missing information.\n`;
      instruction += `Do NOT re-ask questions already answered (check above).\n`;
      break;
      
    case "WAITING":
      instruction += `MODE: WAITING (CRITICAL)\n`;
      instruction += `YOU MUST NOT SEND ANY MESSAGE.\n`;
      instruction += `The user said they will upload evidence.\n`;
      instruction += `Remain SILENT until evidenceUploaded changes.\n`;
      instruction += `Do NOT say "I'm waiting" again.\n`;
      instruction += `Do NOT ask questions.\n`;
      instruction += `SILENCE IS REQUIRED.\n`;
      break;
      
    case "READY":
      instruction += `MODE: READY\n`;
      instruction += `All information collected + evidence uploaded.\n`;
      instruction += `Send ONE final message:\n`;
      instruction += `"Thanks - I have everything needed. Your documents will be prepared shortly."\n`;
      instruction += `Then STOP. No more messages.\n`;
      break;
      
    case "LOCKED":
      instruction += `MODE: LOCKED\n`;
      instruction += `You should not be responding.\n`;
      break;
  }
  
  return instruction;
}

// Helper functions

function hasOtherParty(strategy: any): boolean {
  if (!strategy?.keyFacts) return false;
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  return facts.some(f => 
    f.toLowerCase().includes("ltd") ||
    f.toLowerCase().includes("limited") ||
    f.toLowerCase().includes("company") ||
    f.toLowerCase().includes("council") ||
    f.length > 15
  );
}

function hasWhatHappened(strategy: any): boolean {
  if (!strategy?.keyFacts) return false;
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  return facts.some(f =>
    f.toLowerCase().includes("not paid") ||
    f.toLowerCase().includes("didn't pay") ||
    f.toLowerCase().includes("refused") ||
    f.toLowerCase().includes("breach") ||
    f.toLowerCase().includes("damage") ||
    f.toLowerCase().includes("failed")
  );
}

function hasAmount(strategy: any): boolean {
  if (!strategy?.desiredOutcome) return false;
  const outcome = strategy.desiredOutcome.toLowerCase();
  return outcome.includes("£") || 
         outcome.includes("$") || 
         outcome.includes("compensation") ||
         /\d+/.test(outcome);
}

function hasRelationship(strategy: any): boolean {
  if (!strategy?.keyFacts) return false;
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  return facts.some(f =>
    f.toLowerCase().includes("employee") ||
    f.toLowerCase().includes("worker") ||
    f.toLowerCase().includes("self-employed") ||
    f.toLowerCase().includes("tenant") ||
    f.toLowerCase().includes("customer")
  );
}

function allAnswersProvided(answers: ConversationState["answersProvided"]): boolean {
  return Object.values(answers).every(Boolean);
}
