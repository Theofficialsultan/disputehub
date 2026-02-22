/**
 * POST /api/disputes/[id]/acknowledge-evidence
 * 
 * Triggers an automatic AI response acknowledging newly uploaded evidence
 * Called after evidence upload completes
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { generateAIResponse } from "@/lib/ai/openai";
import { getSystemPrompt } from "@/lib/ai/prompts";

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

    // Verify case ownership
    const dispute = await prisma.dispute.findFirst({
      where: {
        id: caseId,
        userId,
      },
    });

    if (!dispute) {
      return NextResponse.json(
        { error: "Case not found" },
        { status: 404 }
      );
    }

    // Don't respond if chat is locked
    if (dispute.strategyLocked || dispute.restricted) {
      return NextResponse.json(
        { message: "Chat is locked, no AI response needed" },
        { status: 200 }
      );
    }

    // Fetch evidence items to tell AI about them
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

    if (evidenceItems.length === 0) {
      return NextResponse.json(
        { message: "No evidence to acknowledge" },
        { status: 200 }
      );
    }

    // Get recent conversation history (last 6 messages for context)
    const conversationHistory = await prisma.caseMessage.findMany({
      where: { caseId },
      orderBy: { createdAt: "asc" },
      select: {
        role: true,
        content: true,
      },
      take: 6,
    });

    // Build system prompt with evidence context
    let systemPrompt = getSystemPrompt(
      dispute.mode,
      dispute.type,
      dispute.strategyLocked
    );

    const evidenceContext = evidenceItems
      .map((item) => {
        const dateStr = item.evidenceDate
          ? ` (dated ${item.evidenceDate.toLocaleDateString("en-GB")})`
          : "";
        return `- Evidence #${item.evidenceIndex}: ${item.title}${dateStr}\n  Type: ${item.fileType}\n  ${item.description || "No description"}`;
      })
      .join("\n");

    systemPrompt += `\n\n✅ EVIDENCE JUST UPLOADED (${evidenceItems.length} items):\n${evidenceContext}\n\nThe user just uploaded new evidence. Acknowledge receipt of the evidence (be specific about what they uploaded) and ask relevant follow-up questions about this evidence. Keep it natural and conversational.`;

    // Format conversation history
    const formattedHistory = conversationHistory.map((msg) => ({
      role: msg.role === "USER" ? ("user" as const) : ("assistant" as const),
      content: msg.content,
    }));

    // Generate AI response acknowledging the evidence
    const aiContent = await generateAIResponse(systemPrompt, formattedHistory);

    // Save AI response
    await prisma.caseMessage.create({
      data: {
        caseId,
        role: "AI",
        content: aiContent,
        intent: "QUESTION",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "AI acknowledged evidence",
        aiResponse: aiContent,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error acknowledging evidence:", error);
    return NextResponse.json(
      { error: "Failed to acknowledge evidence" },
      { status: 500 }
    );
  }
}
