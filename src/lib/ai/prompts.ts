import type { CaseMode } from "@prisma/client";
import { 
  UNIVERSAL_GATHERING_PROMPT, 
  formatGatheringStateContext, 
  type GatheringState 
} from "./universal-gathering";

// System prompts for different case modes
const GUIDED_SYSTEM_PROMPT = UNIVERSAL_GATHERING_PROMPT;

// Phase 8.6 - Strategy Locked Prompt (redirect to Guidance Assistant)
const STRATEGY_LOCKED_PROMPT = `You should not be seeing this message.

If you are seeing this, the system has routed incorrectly.

During system-controlled phases (ROUTING, GENERATING, COMPLETED, BLOCKED), 
the Guidance Assistant should be active, not the main AI.

The main AI is ONLY active during the GATHERING phase.`;

const QUICK_SYSTEM_PROMPT = `You are a helpful assistant for DisputeHub.

Provide brief, direct answers to dispute questions.
Keep responses short (1-2 sentences), factual, and non-conversational.
Focus on practical information only.`;

/**
 * Generate system prompt based on case mode, context, and gathering state
 * 
 * Phase 8.2.5: If strategy is locked, use locked prompt
 * New: Includes gathering state context for smart information collection
 */
export function getSystemPrompt(
  mode: CaseMode,
  disputeType?: string,
  strategyLocked?: boolean,
  gatheringState?: GatheringState,
  evidenceFiles?: any[]
): string {
  // Phase 8.2.5 - Strategy locked takes precedence
  if (strategyLocked && mode === "GUIDED") {
    return STRATEGY_LOCKED_PROMPT;
  }

  const basePrompt =
    mode === "GUIDED" ? GUIDED_SYSTEM_PROMPT : QUICK_SYSTEM_PROMPT;

  // Add gathering state context for GUIDED mode
  if (mode === "GUIDED" && gatheringState && evidenceFiles) {
    const stateContext = formatGatheringStateContext(gatheringState, evidenceFiles);
    return `${basePrompt}\n\n${stateContext}`;
  }

  if (disputeType && disputeType !== "") {
    const typeLabel = disputeType.replace(/_/g, " ");
    return `${basePrompt}\n\nCase Context: This is a ${typeLabel} dispute.`;
  }

  return basePrompt;
}

/**
 * Format conversation history for OpenAI API
 * Limits to last N messages for context window management
 */
export function formatConversationHistory(
  messages: Array<{ role: string; content: string }>,
  maxMessages: number = 12
): Array<{ role: "user" | "assistant"; content: string }> {
  // Take only the last N messages
  const recentMessages = messages.slice(-maxMessages);

  return recentMessages.map((msg) => ({
    role: msg.role === "USER" ? ("user" as const) : ("assistant" as const),
    content: msg.content,
  }));
}
