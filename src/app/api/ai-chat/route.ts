/**
 * POST /api/ai-chat
 * 
 * General AI Legal Assistant - answers legal questions without requiring a case
 */

import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const anthropic = new Anthropic();

const chatSchema = z.object({
  question: z.string().min(1, "Question is required").max(2000, "Question too long"),
});

const LEGAL_ASSISTANT_SYSTEM_PROMPT = `You are a helpful UK legal assistant. You provide general legal information to help people understand their rights and options.

IMPORTANT GUIDELINES:
1. Always clarify you are providing general information, not legal advice
2. Focus on UK law (England & Wales primarily)
3. Be helpful and empathetic
4. Suggest when professional legal advice might be needed
5. Keep responses concise but informative (2-4 paragraphs)
6. Use plain English, avoid excessive legal jargon
7. When relevant, mention time limits or deadlines
8. If unsure, say so rather than guessing

AREAS YOU CAN HELP WITH:
- Consumer rights (faulty goods, refunds, services)
- Tenancy and housing issues
- Employment rights (unfair dismissal, wages, discrimination)
- Small claims and debt
- Parking fines and traffic offences
- Neighbour disputes
- Insurance claims
- NHS and medical complaints

Always end by offering to help them start a case if they need specific documents or detailed assistance.`;

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { question } = chatSchema.parse(body);

    console.log(`[AI Chat] User ${userId} asked: ${question.substring(0, 100)}...`);

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: LEGAL_ASSISTANT_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: question,
        },
      ],
    });

    const answer = response.content[0].type === "text" 
      ? response.content[0].text 
      : "I apologize, but I couldn't generate a response. Please try again.";

    console.log(`[AI Chat] Response generated (${answer.length} chars)`);

    return NextResponse.json({ answer });

  } catch (error) {
    console.error("[AI Chat] Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process question" },
      { status: 500 }
    );
  }
}
