import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { generateAIResponse } from "@/lib/ai/openai";
import { getGuidancePrompt, isGuidanceAssistantActive } from "@/lib/ai/guidance-prompt";
import { z } from "zod";

/**
 * GUIDANCE ASSISTANT API
 * Phase 8.6 - Read-Only Support AI
 * 
 * This endpoint ONLY provides explanations and reassurance.
 * It CANNOT change case data, gather facts, or trigger workflows.
 */

const guidanceMessageSchema = z.object({
  content: z.string().min(1).max(1000),
});

// POST /api/disputes/[id]/guidance - Send message to Guidance Assistant (read-only)
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

    // Verify case exists and belongs to user (READ ONLY)
    const dispute = await prisma.dispute.findFirst({
      where: {
        id: caseId,
        userId,
      },
      select: {
        id: true,
        phase: true,
        lifecycleStatus: true,
        chatLocked: true,
        lockReason: true,
        mode: true,
        documents: {
          select: {
            id: true,
            status: true,
          },
        },
        timeline: {
          orderBy: { occurredAt: "desc" },
          take: 3,
          select: {
            type: true,
            title: true,
            occurredAt: true,
          },
        },
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

    // CRITICAL: Check if Guidance Assistant should be active
    if (!isGuidanceAssistantActive(dispute.phase)) {
      return NextResponse.json(
        {
          error: "Guidance Assistant not available",
          reason: `Guidance Assistant is only available during system-controlled phases. Current phase: ${dispute.phase}`,
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = guidanceMessageSchema.parse(body);

    // Build guidance prompt with current case context (READ ONLY)
    const guidancePrompt = getGuidancePrompt(
      dispute.phase,
      dispute.lifecycleStatus,
      dispute.documents.length
    );

    // Add recent timeline context for more accurate responses
    let timelineContext = "";
    if (dispute.timeline.length > 0) {
      timelineContext = `\n\nRecent Timeline Events:\n`;
      timelineContext += dispute.timeline
        .map((event) => {
          const date = new Date(event.occurredAt).toLocaleDateString("en-GB");
          return `- ${event.title} (${date})`;
        })
        .join("\n");
    }

    // Add lock reason if chat is locked
    if (dispute.chatLocked && dispute.lockReason) {
      timelineContext += `\n\nChat Lock Reason: ${dispute.lockReason}`;
    }

    const fullPrompt = guidancePrompt + timelineContext;

    // Generate response using Guidance Assistant AI (READ ONLY)
    // This AI is context-aware but CANNOT change anything
    const aiContent = await generateAIResponse(fullPrompt, [
      {
        role: "user",
        content: validatedData.content,
      },
    ]);

    // IMPORTANT: Do NOT save guidance messages to database
    // Guidance Assistant is ephemeral - it doesn't pollute case history
    
    // Return response directly without database write
    return NextResponse.json(
      {
        response: aiContent,
        phase: dispute.phase,
        documentsCount: dispute.documents.length,
        readOnly: true, // Flag to indicate this is guidance mode
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Guidance Assistant error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid message data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Guidance Assistant failed" },
      { status: 500 }
    );
  }
}
