import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { createMessageSchema } from "@/lib/validations/message";
import { generateAIResponse } from "@/lib/ai/openai";
import { getSystemPrompt, formatConversationHistory } from "@/lib/ai/prompts";
import { detectExtremeCase } from "@/lib/safety/detection";
import { getSafetyMessage } from "@/lib/safety/messages";
import { extractCaseStrategy, mergeStrategy } from "@/lib/ai/strategy";
import { z } from "zod";

// Helper: Check if strategy is complete enough for document generation
function checkIfReadyForDocuments(strategy: any): boolean {
  // Must have dispute type
  if (!strategy.disputeType) return false;
  
  // Must have at least 5 key facts
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  if (facts.length < 5) return false;
  
  // Must have a desired outcome (at least 20 characters)
  const outcome = strategy.desiredOutcome || "";
  if (outcome.length < 20) return false;
  
  return true;
}

// GET /api/disputes/[id]/messages - Fetch all messages for a case
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const caseId = params.id;

    // Verify case exists and belongs to user
    const dispute = await prisma.dispute.findFirst({
      where: {
        id: caseId,
        userId,
      },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Verify case is GUIDED mode
    if (dispute.mode !== "GUIDED") {
      return NextResponse.json(
        { error: "Not a guided case" },
        { status: 403 }
      );
    }

    // Fetch messages (allowed even if restricted)
    const messages = await prisma.caseMessage.findMany({
      where: { caseId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        role: true,
        content: true,
        intent: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST /api/disputes/[id]/messages - Create USER message and generate AI response
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const caseId = params.id;

    // Verify case exists and belongs to user
    const dispute = await prisma.dispute.findFirst({
      where: {
        id: caseId,
        userId,
      },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Verify case is GUIDED mode
    if (dispute.mode !== "GUIDED") {
      return NextResponse.json(
        { error: "Not a guided case" },
        { status: 403 }
      );
    }

    // Check if case is restricted
    if (dispute.restricted) {
      return NextResponse.json(
        { error: "This case is restricted. New messages are not allowed." },
        { status: 403 }
      );
    }

    // Verify conversation is OPEN
    if (dispute.conversationStatus !== "OPEN") {
      return NextResponse.json(
        { error: "Case is not open for conversation" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createMessageSchema.parse(body);

    // Create USER message (enforced server-side)
    const userMessage = await prisma.caseMessage.create({
      data: {
        caseId,
        role: "USER",
        content: validatedData.content,
        intent: validatedData.intent,
      },
    });

    // SAFETY CHECK: Detect extreme cases (ONLY on USER messages)
    const extremeCase = detectExtremeCase(validatedData.content);

    if (extremeCase.detected) {
      // RESTRICT THE CASE
      await prisma.dispute.update({
        where: { id: caseId },
        data: {
          restricted: true,
          conversationStatus: "CLOSED",
        },
      });

      // Create final safety message with intent = UPDATE
      const safetyMessageContent = getSafetyMessage(extremeCase.category);
      const safetyMessage = await prisma.caseMessage.create({
        data: {
          caseId,
          role: "AI",
          content: safetyMessageContent,
          intent: "UPDATE", // Not ANSWER - this is a status update
        },
      });

      // Return both messages with restriction flag
      return NextResponse.json(
        {
          userMessage,
          aiMessage: safetyMessage,
          restricted: true,
        },
        { status: 201 }
      );
    }

    // Generate AI response (only if NOT extreme case)
    let aiMessage = null;

    try {
      // Fetch conversation history (last 12 messages for context)
      const conversationHistory = await prisma.caseMessage.findMany({
        where: { caseId },
        orderBy: { createdAt: "asc" },
        select: {
          role: true,
          content: true,
        },
        take: 12, // Limit context to last 12 messages
      });

      // Fetch evidence items for context
      const evidenceItems = await prisma.evidenceItem.findMany({
        where: { caseId },
        orderBy: { evidenceIndex: "asc" },
        select: {
          evidenceIndex: true,
          title: true,
          description: true,
          fileType: true,
          evidenceDate: true,
        },
      });

      // Build system prompt (mode-aware)
      // Phase 8.2.5: Pass strategyLocked flag to change AI behavior
      let systemPrompt = getSystemPrompt(
        dispute.mode,
        dispute.type,
        dispute.strategyLocked
      );

      // Add evidence context to system prompt
      if (evidenceItems.length > 0) {
        const evidenceContext = evidenceItems
          .map((item) => {
            const dateStr = item.evidenceDate
              ? ` (dated ${item.evidenceDate.toLocaleDateString("en-GB")})`
              : "";
            return `- Evidence #${item.evidenceIndex}: ${item.title}${dateStr}\n  Type: ${item.fileType}\n  ${item.description || "No description"}`;
          })
          .join("\n");

        systemPrompt += `\n\n✅ EVIDENCE UPLOADED BY USER (${evidenceItems.length} items):\n${evidenceContext}\n\nThe user HAS uploaded evidence. You can reference these items by their number (e.g., "Evidence #1"). Acknowledge that you've seen the evidence they uploaded.`;
      } else {
        systemPrompt += `\n\n⚠️ NO EVIDENCE UPLOADED YET\nThe user has not uploaded any evidence. If they mention having photos, screenshots, emails, or documents, ask them to upload it using the Evidence section.`;
      }

      // Format for OpenAI API
      const formattedHistory = formatConversationHistory(conversationHistory);

      // Generate AI response
      const aiContent = await generateAIResponse(systemPrompt, formattedHistory);

      // Save AI response to database
      aiMessage = await prisma.caseMessage.create({
        data: {
          caseId,
          role: "AI",
          content: aiContent,
          intent: "ANSWER",
        },
      });

      // UPDATE STRATEGY after AI message is saved
      // Only if conversation is OPEN and not restricted
      if (dispute.conversationStatus === "OPEN" && !dispute.restricted) {
        try {
          // Fetch conversation history for strategy extraction (last 8 messages - independent cap)
          const strategyConversation = await prisma.caseMessage.findMany({
            where: { caseId },
            orderBy: { createdAt: "asc" },
            select: {
              role: true,
              content: true,
            },
            take: 8, // Independent cap for strategy context
          });

          // Extract strategy from conversation
          const extracted = await extractCaseStrategy(strategyConversation);

          // Only proceed if extraction was successful
          if (extracted) {
            // Fetch existing strategy (if any)
            const existingStrategy = await prisma.caseStrategy.findUnique({
              where: { caseId },
              select: {
                disputeType: true,
                keyFacts: true,
                evidenceMentioned: true,
                desiredOutcome: true,
              },
            });

            // Merge existing with extracted
            const merged = mergeStrategy(
              existingStrategy
                ? {
                    disputeType: existingStrategy.disputeType,
                    keyFacts: existingStrategy.keyFacts as string[],
                    evidenceMentioned: existingStrategy.evidenceMentioned as string[],
                    desiredOutcome: existingStrategy.desiredOutcome,
                  }
                : null,
              extracted
            );

            // Upsert strategy (create if not exists, update if exists)
            await prisma.caseStrategy.upsert({
              where: { caseId },
              create: {
                caseId,
                disputeType: merged.disputeType,
                keyFacts: merged.keyFacts,
                evidenceMentioned: merged.evidenceMentioned,
                desiredOutcome: merged.desiredOutcome,
              },
              update: {
                disputeType: merged.disputeType,
                keyFacts: merged.keyFacts,
                evidenceMentioned: merged.evidenceMentioned,
                desiredOutcome: merged.desiredOutcome,
              },
            });

            // AUTOMATIC DOCUMENT GENERATION
            // If we have enough information, trigger document generation
            const shouldGenerate = checkIfReadyForDocuments(merged);
            
            if (shouldGenerate) {
              console.log(`[API] ✅ Strategy complete! Triggering document generation...`);
              
              // Trigger document generation asynchronously (don't wait)
              fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/disputes/${caseId}/documents/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
              }).catch(err => {
                console.error("[API] Document generation trigger failed:", err);
              });
            } else {
              console.log(`[API] Strategy not yet complete. Continue conversation.`);
            }

          }
        } catch (strategyError) {
          // Strategy extraction is best-effort
          // Don't fail the request if it fails
          console.error("Strategy extraction failed:", strategyError);
        }
      }
    } catch (aiError) {
      console.error("AI response generation failed:", aiError);
      // Don't fail the entire request - user message was saved successfully
      // Client will handle missing AI response gracefully
    }

    // Return both messages
    return NextResponse.json(
      {
        userMessage,
        aiMessage,
        restricted: false,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating message:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid message data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
