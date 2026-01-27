// Mirror Prisma enums exactly
export type MessageRole = "USER" | "AI";
export type MessageIntent = "QUESTION" | "ANSWER" | "INSTRUCTION" | "UPDATE";

export type Message = {
  id: string;
  role: MessageRole;
  content: string;
  intent: MessageIntent;
  timestamp: Date;
};

// Case Strategy type (Phase 7.2)
export type CaseStrategy = {
  disputeType: string | null;
  keyFacts: string[];
  evidenceMentioned: string[];
  desiredOutcome: string | null;
};
