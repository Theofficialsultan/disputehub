import { z } from "zod";
import { openai } from "./openai";

// Controlled vocabulary for dispute types
const DISPUTE_TYPES = [
  "parking_ticket",
  "speeding_ticket",
  "landlord",
  "employment",
  "consumer",
  "flight_delay",
  "benefits",
  "immigration",
  "other",
] as const;

// Validation schema for extracted strategy
const extractedStrategySchema = z.object({
  disputeType: z.enum(DISPUTE_TYPES).nullable(),
  keyFacts: z.array(z.string()).default([]),
  evidenceMentioned: z.array(z.string()).default([]),
  desiredOutcome: z.string().nullable(),
});

export type ExtractedStrategy = z.infer<typeof extractedStrategySchema>;

// System prompt for strategy extraction
const STRATEGY_EXTRACTION_PROMPT = `You are analyzing a legal case conversation to extract structured information.

Review the conversation and extract:

1. disputeType: What type of dispute is this? Choose from:
   - parking_ticket
   - speeding_ticket
   - landlord
   - employment
   - consumer
   - flight_delay
   - benefits
   - immigration
   - other (if none of the above fit)

2. keyFacts: Important concrete facts mentioned (not opinions or feelings)

3. evidenceMentioned: Specific evidence the user has mentioned (photos, receipts, emails, witnesses, documents, etc.)

4. desiredOutcome: What the user wants to achieve (refund, dismissal, compensation, etc.)

Return ONLY a valid JSON object. Use null for fields not yet discussed.
Use empty arrays [] for lists with no items yet.

Example output:
{
  "disputeType": "parking_ticket",
  "keyFacts": ["Parked at 2pm on residential street", "No visible signage"],
  "evidenceMentioned": ["Photo of parking spot"],
  "desiredOutcome": "Get ticket cancelled"
}`;

/**
 * Extract case strategy from conversation
 * Uses last 8 messages for context (independent cap)
 */
export async function extractCaseStrategy(
  conversationHistory: Array<{ role: string; content: string }>
): Promise<ExtractedStrategy | null> {
  try {
    // Take only last 8 messages for extraction context
    const recentMessages = conversationHistory.slice(-8);

    // Format for OpenAI
    const formattedMessages = recentMessages.map((msg) => ({
      role: msg.role === "USER" ? ("user" as const) : ("assistant" as const),
      content: msg.content,
    }));

    // Call OpenAI with extraction prompt
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: STRATEGY_EXTRACTION_PROMPT,
        },
        ...formattedMessages,
      ],
      temperature: 0.1, // Low for consistency
      max_tokens: 300,
      response_format: { type: "json_object" }, // Force JSON output
    });

    const responseContent = completion.choices[0]?.message?.content;

    if (!responseContent) {
      console.error("Empty response from strategy extraction");
      return null;
    }

    // Parse and validate JSON
    const parsed = JSON.parse(responseContent);
    const validated = extractedStrategySchema.parse(parsed);

    return validated;
  } catch (error) {
    // Discard silently if invalid (as per requirements)
    console.error("Strategy extraction failed:", error);
    return null;
  }
}

/**
 * Merge existing strategy with newly extracted data
 * Preserves all information, adds new facts
 */
export function mergeStrategy(
  existing: {
    disputeType: string | null;
    keyFacts: string[];
    evidenceMentioned: string[];
    desiredOutcome: string | null;
  } | null,
  extracted: ExtractedStrategy
): {
  disputeType: string | null;
  keyFacts: string[];
  evidenceMentioned: string[];
  desiredOutcome: string | null;
} {
  // If no existing strategy, use extracted as-is
  if (!existing) {
    return {
      disputeType: extracted.disputeType,
      keyFacts: extracted.keyFacts,
      evidenceMentioned: extracted.evidenceMentioned,
      desiredOutcome: extracted.desiredOutcome,
    };
  }

  // Merge existing with new extraction
  return {
    // disputeType: Keep first non-null value (rarely changes)
    disputeType: existing.disputeType || extracted.disputeType,

    // keyFacts: Merge arrays, deduplicate
    keyFacts: Array.from(
      new Set([...existing.keyFacts, ...extracted.keyFacts])
    ),

    // evidenceMentioned: Merge arrays, deduplicate
    evidenceMentioned: Array.from(
      new Set([...existing.evidenceMentioned, ...extracted.evidenceMentioned])
    ),

    // desiredOutcome: Use latest (may evolve)
    desiredOutcome: extracted.desiredOutcome || existing.desiredOutcome,
  };
}
