import { prisma } from "@/lib/prisma";

/**
 * Analyze an inbound email using AI
 * Determines intent, sentiment, key points, and suggests next action
 */
export async function analyzeEmail(emailMessageId: string) {
  const message = await prisma.emailMessage.findUnique({
    where: { id: emailMessageId },
    include: {
      dispute: {
        include: {
          caseStrategy: true,
          caseMessages: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      },
    },
  });

  if (!message) throw new Error("Email message not found");

  const bodyContent = message.bodyText || message.bodyHtml || message.snippet || "";

  // Build context for AI
  const caseContext = message.dispute
    ? `
Case: ${message.dispute.title}
Type: ${message.dispute.type}
Key Facts: ${JSON.stringify(message.dispute.caseStrategy?.keyFacts || [])}
Desired Outcome: ${message.dispute.caseStrategy?.desiredOutcome || "Not specified"}
Current Status: ${message.dispute.lifecycleStatus}
`
    : "No case matched.";

  const prompt = `You are a legal AI assistant for DisputeHub, a UK legal platform. Analyze this inbound email and provide structured analysis.

CASE CONTEXT:
${caseContext}

EMAIL:
From: ${message.senderEmail} (${message.senderName || "Unknown"})
Subject: ${message.subject}
Body:
${bodyContent.substring(0, 3000)}

Analyze and respond with ONLY a valid JSON object (no markdown, no code fences):
{
  "intent": "one of: acceptance, rejection, counter_offer, request_info, acknowledgement, threat, settlement, compliance, delay_tactic, irrelevant",
  "sentiment": "one of: positive, neutral, negative, hostile",
  "keyPoints": ["array of 2-5 key takeaways from the email"],
  "isLegallySignificant": true/false,
  "deadlineMentioned": "any deadline mentioned or null",
  "suggestedAction": "one of: draft_response, escalate, accept_offer, reject_offer, request_clarification, no_action, seek_legal_advice",
  "suggestedResponseSummary": "1-2 sentence summary of what the response should say",
  "urgency": "one of: low, medium, high, critical",
  "confidence": 0.0-1.0
}`;

  try {
    // Use Claude for analysis
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`AI analysis failed: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || "";

    // Parse AI response
    const analysis = JSON.parse(content);

    // Store analysis on the message
    await prisma.emailMessage.update({
      where: { id: emailMessageId },
      data: { aiAnalysis: analysis },
    });

    // If high urgency and matched to case, create notification
    if (message.disputeId && (analysis.urgency === "high" || analysis.urgency === "critical")) {
      const dispute = await prisma.dispute.findUnique({
        where: { id: message.disputeId },
        select: { userId: true },
      });

      if (dispute) {
        await prisma.notification.create({
          data: {
            userId: dispute.userId,
            caseId: message.disputeId,
            type: "DOCUMENT_READY",
            message: `Urgent email from ${message.senderEmail}: ${analysis.keyPoints?.[0] || message.subject}`,
          },
        });
      }
    }

    return analysis;
  } catch (error: any) {
    console.error("Email analysis failed:", error);
    // Store a fallback analysis
    const fallback = {
      intent: "unknown",
      sentiment: "neutral",
      keyPoints: ["AI analysis unavailable - please review manually"],
      isLegallySignificant: false,
      deadlineMentioned: null,
      suggestedAction: "no_action",
      suggestedResponseSummary: "Review this email manually.",
      urgency: "medium",
      confidence: 0,
      error: error.message,
    };

    await prisma.emailMessage.update({
      where: { id: emailMessageId },
      data: { aiAnalysis: fallback as any },
    });

    return fallback;
  }
}

/**
 * Analyze all unanalyzed inbound emails for a case
 */
export async function analyzeUnanalyzedEmails(disputeId: string) {
  const messages = await prisma.emailMessage.findMany({
    where: {
      disputeId,
      direction: "INBOUND",
      aiAnalysis: null,
    },
    orderBy: { receivedAt: "asc" },
  });

  const results = [];
  for (const msg of messages) {
    try {
      const analysis = await analyzeEmail(msg.id);
      results.push({ messageId: msg.id, analysis });
    } catch (error: any) {
      results.push({ messageId: msg.id, error: error.message });
    }
  }

  return results;
}
