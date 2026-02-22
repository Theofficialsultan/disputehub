import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { createMessageSchema } from "@/lib/validations/message";
import { z } from "zod";

// ============================================================================
// 4-LAYER AI ARCHITECTURE - ACTIVE
// ============================================================================
// System A: Lawyer Interface AI (Claude Opus 4) - ONLY AI that talks to user
// System B: Silent Fact Extractor (GPT-4o) - Runs after every message
// System C: Routing Authority (Claude Opus 4) - Decides jurisdiction/forum
// System D: Document Generator (Claude/GPT/Grok) - Generates court documents
// ============================================================================

import { getSystemAPrompt, getSystemAModel } from "@/lib/ai/system-a-prompts";
import { extractFacts, generateSummaryText, type ExtractedFacts } from "@/lib/ai/system-b-extractor";

// Lazy-load Anthropic client
let anthropicClient: any = null;
async function getAnthropicClient() {
  if (!anthropicClient) {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

// ============================================================================
// GET /api/disputes/[id]/messages - Fetch all messages for a case
// ============================================================================
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

    // Fetch messages
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

// ============================================================================
// ============================================================================
// POST /api/disputes/[id]/messages - Create USER message and generate AI response
// ============================================================================
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log("🚀🚀🚀 POST /api/disputes/[id]/messages - REQUEST RECEIVED");
  
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const caseId = params.id;
    console.log(`🚀🚀🚀 Processing message for case: ${caseId}`);

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

    // ========================================================================
    // HARD GATES - Block user messages in certain chat states
    // ========================================================================
    
    const chatState = dispute.chatState || "GATHERING_FACTS";
    
    if (chatState === "CONFIRMING_SUMMARY") {
      return NextResponse.json(
        {
          error: "Awaiting summary confirmation",
          message: "Please confirm or reject the case summary before continuing.",
          showSummaryGate: true,
        },
        { status: 403 }
      );
    }
    
    if (chatState === "ROUTING_DECISION") {
      return NextResponse.json(
        {
          error: "Routing in progress",
          message: "System C is determining the best legal route for your case. Please wait...",
        },
        { status: 403 }
      );
    }
    
    if (chatState === "DOCUMENTS_PREPARING") {
      return NextResponse.json(
        {
          error: "Documents generating",
          message: "System D is preparing your legal documents. You can ask the Guidance Assistant questions while you wait.",
        },
        { status: 403 }
      );
    }
    
    if (chatState === "CLOSED") {
      return NextResponse.json(
        {
          error: "Case closed",
          message: "This case is complete. Your documents are ready for download.",
        },
        { status: 403 }
      );
    }

    // Check if case is restricted (safety block)
    if (dispute.restricted) {
      return NextResponse.json(
        { error: "This case is restricted. New messages are not allowed." },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createMessageSchema.parse(body);

    // Create USER message
    const userMessage = await prisma.caseMessage.create({
      data: {
        caseId,
        role: "USER",
        content: validatedData.content,
        intent: validatedData.intent,
      },
    });

    console.log(`[System A] New user message in ${chatState} state`);

    // ========================================================================
    // SYSTEM B - SILENT FACT EXTRACTOR
    // Runs AFTER every user message to extract structured facts
    // ========================================================================

    // Fetch conversation history (limit to last 30 messages to prevent token overflow)
    const conversationHistory = await prisma.caseMessage.findMany({
      where: { caseId },
      orderBy: { createdAt: "asc" },
      select: {
        role: true,
        content: true,
      },
      take: 30, // Prevent token overflow on long conversations
    });

    // Fetch evidence count
    const evidenceCount = await prisma.evidenceItem.count({
      where: { caseId },
    });
    
    // Fetch evidence files for gathering state context
    const evidenceFiles = await prisma.evidenceItem.findMany({
      where: { caseId },
      select: {
        fileName: true,
        title: true,
        description: true,
        fileType: true,
      },
    });

    // Extract facts using System B
    console.log(`🔥🔥🔥 [System B] ABOUT TO EXTRACT FACTS - Evidence count: ${evidenceCount}`);
    const extractedFacts = await extractFacts(conversationHistory, evidenceCount);
    console.log(`🔥🔥🔥 [System B] EXTRACTION COMPLETE!`);
    
    console.log(`[System B] Facts extracted:`, {
      readiness: extractedFacts.readinessScore,
      recommendedState: extractedFacts.recommendedState,
      factsCount: extractedFacts.facts.length,
      evidenceCount,
    });
    
    // Check if this case type needs evidence
    // Simple cases (LBA, complaints, demand letters) don't require evidence uploads
    const noEvidenceRoutes = ["letter_before_action", "formal_complaint", "demand_letter"];
    const caseNeedsEvidence = !noEvidenceRoutes.includes(extractedFacts.chosenForum || "");
    const evidenceRequirementMet = !caseNeedsEvidence || evidenceCount > 0;
    
    // HARD OVERRIDE: If readiness >= 75% AND evidence requirement met, force CONFIRMING_SUMMARY
    // This overrides GPT-4o's decision if it's being too conservative
    // Raised from 60% to 75% to prevent premature summary gate
    if (
      extractedFacts.readinessScore >= 75 &&
      evidenceRequirementMet &&
      extractedFacts.recommendedState !== "CONFIRMING_SUMMARY"
    ) {
      console.log(`[System B Override] Forcing CONFIRMING_SUMMARY (readiness: ${extractedFacts.readinessScore}%, evidence: ${evidenceCount}, needsEvidence: ${caseNeedsEvidence})`);
      extractedFacts.recommendedState = "CONFIRMING_SUMMARY";
    }
    
    // ALWAYS log what we're going to do
    console.log(`[System B] Final decision: ${extractedFacts.recommendedState} (readiness: ${extractedFacts.readinessScore}%, evidence: ${evidenceCount})`);
    console.log(`[State Check] Current chatState: "${chatState}"`);

    // Save extracted facts to database
    await prisma.dispute.update({
      where: { id: caseId },
      data: {
        caseSummary: extractedFacts as any, // Store as JSON
      },
    });

    // ========================================================================
    // STATE TRANSITIONS - Based on System B recommendations
    // ========================================================================

    let newChatState: any = chatState;
    let shouldShowSummary = false;
    let summaryText = "";

    // Check if we should transition to CONFIRMING_SUMMARY
    if (
      extractedFacts.recommendedState === "CONFIRMING_SUMMARY" &&
      (chatState as string) !== "CONFIRMING_SUMMARY" &&
      !dispute.summaryConfirmed
    ) {
      console.log(`[State Transition] ${chatState} → CONFIRMING_SUMMARY (readiness: ${extractedFacts.readinessScore}%)`);
      
      newChatState = "CONFIRMING_SUMMARY";
      shouldShowSummary = true;
      summaryText = generateSummaryText(extractedFacts);
      
      // Update state in database
      await prisma.dispute.update({
        where: { id: caseId },
        data: {
          chatState: "CONFIRMING_SUMMARY",
        },
      });
      
      // Return early - show summary gate, no AI response
      console.log(`[API Response] Returning Summary Gate UI trigger`);
      return NextResponse.json({
        userMessage,
        aiMessage: null,
        showSummaryGate: true,
        extractedFacts,
        summaryText,
      });
    }

    // Check if we should transition to WAITING_FOR_UPLOAD
    if (
      extractedFacts.recommendedState === "WAITING_FOR_UPLOAD" &&
      chatState === "GATHERING_FACTS"
    ) {
      console.log(`[State Transition] GATHERING_FACTS → WAITING_FOR_UPLOAD`);
      
      newChatState = "WAITING_FOR_UPLOAD";
      
      await prisma.dispute.update({
        where: { id: caseId },
        data: {
          chatState: "WAITING_FOR_UPLOAD",
        },
      });
    }

    // ========================================================================
    // SYSTEM A - LAWYER INTERFACE AI (Claude Opus 4)
    // ONLY AI that talks to the user
    // ========================================================================

    let aiMessage = null;

    // Build system prompt with current state, extracted facts, and evidence files
    const systemPrompt = getSystemAPrompt(newChatState as any, extractedFacts, evidenceFiles);
    
    // Format conversation history for Claude
    const claudeMessages = conversationHistory.map(msg => ({
      role: msg.role === "USER" ? "user" : "assistant",
      content: msg.content,
    }));
    
    // Retry logic for AI calls (up to 3 attempts)
    let aiContent: string | null = null;
    let lastError: any = null;
    
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const anthropic = await getAnthropicClient();
        
        console.log(`[System A] Attempt ${attempt}/3: Generating response with Claude Opus 4...`);
        
        // Call Claude Opus 4
        const response = await anthropic.messages.create({
          model: getSystemAModel(),
          max_tokens: 800, // Enough for proper legal guidance
          temperature: 0.4, // Lower = more consistent legal responses
          system: systemPrompt,
          messages: claudeMessages,
        });

        aiContent = response.content[0]?.text || null;
        
        if (aiContent && aiContent.length > 10) {
          console.log(`[System A] Response generated (${aiContent.length} chars)`);
          break; // Success - exit retry loop
        }
        
        console.warn(`[System A] Attempt ${attempt} returned empty/short response`);
        
      } catch (aiError) {
        lastError = aiError;
        console.error(`[System A] Attempt ${attempt} failed:`, aiError);
        
        if (attempt < 3) {
          // Wait before retry (exponential backoff: 1s, 2s)
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        }
      }
    }
    
    // Use response or fallback
    if (aiContent) {
      aiMessage = await prisma.caseMessage.create({
        data: {
          caseId,
          role: "AI",
          content: aiContent,
          intent: "ANSWER",
        },
      });
    } else {
      console.error("[System A] All retry attempts failed:", lastError);
      
      // Fallback response
      aiMessage = await prisma.caseMessage.create({
        data: {
          caseId,
          role: "AI",
          content: "I understand. Could you please tell me a bit more about the situation? I want to make sure I have all the details.",
          intent: "ANSWER",
        },
      });
    }

    // Return both messages
    return NextResponse.json(
      {
        userMessage,
        aiMessage,
        showSummaryGate: false,
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

// ============================================================================
// DELETE /api/disputes/[id]/messages - Delete all messages (for testing/reset)
// ============================================================================
export async function DELETE(
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

    // Delete all messages
    const result = await prisma.caseMessage.deleteMany({
      where: { caseId },
    });

    // Reset case state to GATHERING_FACTS
    await prisma.dispute.update({
      where: { id: caseId },
      data: {
        chatState: "GATHERING_FACTS",
        caseSummary: null as any,
        summaryConfirmed: false,
        summaryConfirmedAt: null,
        chatLocked: false,
        lockReason: null,
        phase: "GATHERING",
      },
    });

    console.log(`[RESET] Deleted ${result.count} messages from case ${caseId}`);

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: "Case reset successfully - ready for new 4-layer system",
    });
  } catch (error) {
    console.error("Error deleting messages:", error);
    return NextResponse.json(
      { error: "Failed to delete messages" },
      { status: 500 }
    );
  }
}
