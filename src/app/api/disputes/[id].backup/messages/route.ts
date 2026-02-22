import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { createMessageSchema } from "@/lib/validations/message";
import { generateAIResponse } from "@/lib/ai/openai";
import { getSystemPrompt, formatConversationHistory } from "@/lib/ai/prompts";
import { detectExtremeCase } from "@/lib/safety/detection";
import { getSafetyMessage } from "@/lib/safety/messages";
import { extractCaseStrategy, mergeStrategy } from "@/lib/ai/strategy";
import { detectEvidenceHallucination } from "@/lib/ai/state-validator";
import { buildEvidenceState, formatEvidenceStateForAI, type EvidenceItem } from "@/lib/ai/evidence-state";
import { 
  buildAIState, 
  detectGuidanceRequest, 
  detectUploadIntent, 
  computeNextMode, 
  canSendMessage, 
  getModeInstruction,
  type AIEvent
} from "@/lib/ai/mode-state";
import { 
  buildConversationState, 
  canAISendMessage, 
  getStateInstruction 
} from "@/lib/ai/conversation-state";
import { 
  checkCaseSufficiency, 
  shouldStopGathering, 
  getFinalConfirmationMessage,
  validateAIResponse,
  type CaseSufficiencyInput
} from "@/lib/ai/case-sufficiency";
import { z } from "zod";

// Helper: Check if legal sufficiency is met for document generation
// Phase 8.3: Stricter legal sufficiency rule
function checkIfReadyForDocuments(strategy: any, evidenceCount: number): boolean {
  // LEGAL SUFFICIENCY TEST:
  // 1. Dispute domain identified
  if (!strategy.disputeType) {
    console.log(`[Sufficiency] ❌ No dispute type identified`);
    return false;
  }
  
  // 2. Minimum necessary facts (reduced from 8 to 5 - focus on quality not quantity)
  const facts = Array.isArray(strategy.keyFacts) ? strategy.keyFacts : [];
  if (facts.length < 5) {
    console.log(`[Sufficiency] ❌ Insufficient facts: ${facts.length}/5`);
    return false;
  }
  
  // 3. Clear remedy/outcome identified (breach, non-payment, amount)
  const outcome = strategy.desiredOutcome || "";
  if (outcome.length < 20) {
    console.log(`[Sufficiency] ❌ Outcome too vague: ${outcome.length}/20 chars`);
    return false;
  }
  
  // 4. Evidence uploaded (REQUIRED for sufficiency)
  if (evidenceCount === 0) {
    console.log(`[Sufficiency] ❌ No evidence uploaded`);
    return false;
  }
  
  // SUFFICIENCY MET
  console.log(`[Sufficiency] ✅ LEGAL SUFFICIENCY MET`);
  console.log(`   • Domain: ${strategy.disputeType}`);
  console.log(`   • Facts: ${facts.length} items`);
  console.log(`   • Outcome: ${outcome.substring(0, 50)}...`);
  console.log(`   • Evidence: ${evidenceCount} items uploaded`);
  
  return true;
}

// Phase 8.5: System messages for locked chat phases
function getSystemMessageForPhase(phase: string): string {
  const messages: Record<string, string> = {
    ROUTING: "We're analyzing the best legal route for your case. This will take a moment...",
    GENERATING: "Your legal documents are being generated. You'll be able to download them shortly.",
    COMPLETED: "Your documents are ready! Check the Documents section to download them.",
    BLOCKED: "We've identified an issue that prevents document generation. Please review the information in the Documents section."
  };
  
  return messages[phase] || "Processing...";
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

    // Phase 8.6: Check if we're in system-controlled phase
    // If phase is ROUTING, GENERATING, COMPLETED, or BLOCKED → use Guidance Assistant
    if (["ROUTING", "GENERATING", "COMPLETED", "BLOCKED"].includes(dispute.phase)) {
      const systemMessage = getSystemMessageForPhase(dispute.phase);
      return NextResponse.json(
        {
          error: "Main AI not available",
          reason: "This case is in a system-controlled phase. Use the Guidance Assistant for questions.",
          phase: dispute.phase,
          systemMessage,
          useGuidanceAssistant: true, // Flag for frontend to switch to guidance mode
        },
        { status: 403 }
      );
    }

    // Phase 8.5: Check if chat is locked (legacy check, phase check above should handle this)
    if (dispute.chatLocked) {
      const systemMessage = getSystemMessageForPhase(dispute.phase);
      return NextResponse.json(
        {
          error: "Chat is locked",
          reason: dispute.lockReason,
          phase: dispute.phase,
          systemMessage
        },
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
          id: true,
          evidenceIndex: true,
          title: true,
          description: true,
          fileType: true,
          evidenceDate: true,
        },
      });
      
      // Fetch strategy for evidence state computation
      const strategy = await prisma.caseStrategy.findUnique({
        where: { caseId },
        select: {
          disputeType: true,
          keyFacts: true,
          desiredOutcome: true,
        },
      });

      // ========================================================================
      // CONVERSATION STATE (Single Source of Truth)
      // ========================================================================
      
      // Build conversation state from all available data
      const conversationState = buildConversationState(
        conversationHistory,
        strategy,
        evidenceItems.length,
        dispute.chatLocked || false
      );
      
      // Check if AI can send a message
      const canRespond = canAISendMessage(conversationState);
      
      // Log state for debugging
      console.log("[Conversation State]", {
        phase: conversationState.phase,
        evidenceUploaded: conversationState.evidenceUploaded,
        canRespond: canRespond.allowed,
        reason: canRespond.reason,
      });
      
      // ========================================================================
      // HARD BLOCK: AI cannot respond if in WAITING mode
      // ========================================================================
      
      if (!canRespond.allowed) {
        console.log("[AI BLOCKED]", canRespond.reason);
        
        // Return user message only, no AI response
        return NextResponse.json(
          {
            userMessage,
            aiMessage: null,
            restricted: false,
            conversationState: {
              phase: conversationState.phase,
              canRespond: false,
              reason: canRespond.reason,
            },
          },
          { status: 201 }
        );
      }
      
      // Build system prompt (state-aware)
      let systemPrompt = getSystemPrompt(
        dispute.mode,
        dispute.type,
        dispute.strategyLocked
      );

      // Add conversation state instruction (THIS IS THE AI'S MEMORY)
      systemPrompt += `\n\n${getStateInstruction(conversationState)}`;
      
      // Add evidence state for reference
      const evidenceState = buildEvidenceState(
        strategy?.disputeType || null,
        evidenceItems as EvidenceItem[]
      );
      systemPrompt += `\n\n${formatEvidenceStateForAI(evidenceState)}`;

      // Phase 8.6: Check case sufficiency (HARD STOP)
      const sufficiencyInput: CaseSufficiencyInput = {
        strategy,
        evidenceCount: evidenceItems.length,
        requiredEvidenceTypes: evidenceState.required.map(r => r.type),
        uploadedEvidenceTypes: evidenceItems.map((e: any) => e.fileType)
      };
      const sufficiency = checkCaseSufficiency(sufficiencyInput);
      
      console.log(`[Sufficiency Check] Score: ${sufficiency.score}/100, Sufficient: ${sufficiency.isSufficient}`);
      if (!sufficiency.isSufficient) {
        console.log(`[Sufficiency Check] Missing: ${sufficiency.missingItems.join(", ")}`);
      }

      // If case is sufficient, use final confirmation message
      let aiContent: string;
      if (shouldStopGathering(sufficiency)) {
        console.log(`[Sufficiency Check] ✅ Case sufficient - using final confirmation`);
        
        // Check if documents already triggered (prevent duplicate triggers)
        const existingPlan = await prisma.documentPlan.findUnique({
          where: { caseId }
        });
        
        if (!existingPlan) {
          aiContent = getFinalConfirmationMessage();
          
          // Trigger document generation (don't wait)
          console.log(`[Sufficiency Check] Triggering document generation...`);
          fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/disputes/${caseId}/documents/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          }).catch(err => {
            console.error("[Sufficiency Check] Document generation trigger failed:", err);
          });
        } else {
          // Documents already triggered - don't repeat the message
          console.log(`[Sufficiency Check] Documents already triggered, returning null`);
          return NextResponse.json({
            userMessage,
            aiMessage: null, // Silent mode
            restricted: false,
            conversationState
          });
        }
      } else {
        // Format for OpenAI API
        const formattedHistory = formatConversationHistory(conversationHistory);

        // Generate AI response
        aiContent = await generateAIResponse(systemPrompt, formattedHistory);
        
        // Validate AI response (block lawyer questions)
        const validation = validateAIResponse(aiContent, sufficiency);
        if (!validation.allowed) {
          console.warn(`[AI Response Blocked] ${validation.reason}`);
          // Override with a neutral response
          aiContent = "Thanks for sharing that. Let me ask you one more thing to make sure I understand correctly.";
        }
      }

      // CRITICAL: Detect evidence hallucination
      const hallucination = detectEvidenceHallucination(aiContent, evidenceItems.length);
      
      if (hallucination.detected) {
        console.error("[HALLUCINATION DETECTED]", {
          evidenceCount: evidenceItems.length,
          violations: hallucination.violations,
          response: aiContent.substring(0, 200),
        });
        
        // Override AI response with safe fallback
        const safeResponse = evidenceItems.length === 0
          ? "I'm gathering information about your case. Can you tell me more about what happened?"
          : "Thanks for that information. Let me ask you a few more questions to understand your case better.";
        
        aiMessage = await prisma.caseMessage.create({
          data: {
            caseId,
            role: "AI",
            content: safeResponse,
            intent: "ANSWER",
          },
        });
      } else {
        // Save AI response to database (no hallucination detected)
        aiMessage = await prisma.caseMessage.create({
          data: {
            caseId,
            role: "AI",
            content: aiContent,
            intent: "ANSWER",
          },
        });
      }

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
            const shouldGenerate = checkIfReadyForDocuments(merged, evidenceItems.length);
            
            if (shouldGenerate) {
              console.log(`[API] ✅ Strategy complete! Locking chat and triggering documents...`);
              
              // LOCK CHAT - No more user input allowed
              await prisma.dispute.update({
                where: { id: caseId },
                data: {
                  chatLocked: true,
                  phase: "ROUTING",
                  lockReason: "Strategy complete - preparing documents",
                },
              });
              
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
        { error: "Invalid message data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
