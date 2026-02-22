import { prisma } from "@/lib/prisma";

interface DraftEmailParams {
  disputeId: string;
  userId: string;
  emailType: "LBA" | "FOLLOW_UP" | "RESPONSE" | "TRIBUNAL_SUBMISSION" | "EVIDENCE_REQUEST" | "SETTLEMENT_OFFER" | "COMPLAINT" | "OTHER";
  recipientEmail?: string;
  recipientName?: string;
  inReplyToId?: string;
  customInstructions?: string;
}

/**
 * AI-powered email draft generator
 * Uses case context to generate professional legal correspondence
 */
export async function generateEmailDraft(params: DraftEmailParams) {
  const { disputeId, userId, emailType, recipientEmail, recipientName, inReplyToId, customInstructions } = params;

  // Fetch case context
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          postcode: true,
        },
      },
      caseStrategy: true,
      caseMessages: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          role: true,
          content: true,
        },
      },
      generatedDocuments: {
        where: { status: "COMPLETED" },
        select: {
          title: true,
          type: true,
          content: true,
        },
        take: 5,
      },
      emailMessages: {
        orderBy: { receivedAt: "desc" },
        take: 5,
        select: {
          direction: true,
          senderEmail: true,
          subject: true,
          bodyText: true,
          receivedAt: true,
          aiAnalysis: true,
        },
      },
    },
  });

  if (!dispute) throw new Error("Case not found");

  // Build in-reply-to context
  let replyContext = "";
  if (inReplyToId) {
    const originalEmail = await prisma.emailMessage.findUnique({
      where: { id: inReplyToId },
      select: {
        subject: true,
        senderEmail: true,
        senderName: true,
        bodyText: true,
        receivedAt: true,
        aiAnalysis: true,
      },
    });
    if (originalEmail) {
      replyContext = `
REPLYING TO THIS EMAIL:
From: ${originalEmail.senderName || originalEmail.senderEmail}
Date: ${originalEmail.receivedAt}
Subject: ${originalEmail.subject}
Body:
${originalEmail.bodyText?.substring(0, 2000) || ""}

AI Analysis of the original email: ${JSON.stringify(originalEmail.aiAnalysis || {})}
`;
    }
  }

  // Previous email history
  const emailHistory = dispute.emailMessages
    .map((e) => `${e.direction === "OUTBOUND" ? "SENT" : "RECEIVED"} (${new Date(e.receivedAt).toLocaleDateString("en-GB")}): ${e.subject}\n${e.bodyText?.substring(0, 500) || ""}`)
    .join("\n---\n");

  // Key facts
  const strategy = dispute.caseStrategy;
  const keyFacts = strategy?.keyFacts ? JSON.stringify(strategy.keyFacts) : "Not yet extracted";
  const desiredOutcome = strategy?.desiredOutcome || "Not specified";
  const disputeType = strategy?.disputeType || dispute.type;

  // User details for signature
  const userName = [dispute.user.firstName, dispute.user.lastName].filter(Boolean).join(" ") || "The Claimant";
  const userAddress = [dispute.user.addressLine1, dispute.user.addressLine2, dispute.user.city, dispute.user.postcode]
    .filter(Boolean)
    .join(", ");

  const EMAIL_TYPE_INSTRUCTIONS: Record<string, string> = {
    LBA: `Generate a formal Letter Before Action (Pre-Action Protocol letter) in email format. This must:
- Reference relevant pre-action protocol (e.g., Practice Direction on Pre-Action Conduct)
- State the legal basis of the claim
- Set a reasonable deadline (typically 14 days) for a response
- Warn of court proceedings if no satisfactory response
- Use formal but clear language
- Include all required elements under Civil Procedure Rules`,
    FOLLOW_UP: `Generate a follow-up email. This should:
- Reference the previous correspondence
- Note the deadline that has passed or is approaching
- Reiterate the key demands
- Escalate the tone appropriately
- Mention next steps if no response`,
    RESPONSE: `Generate a response to the received email. This should:
- Address each point raised in the original email
- Maintain the user's position based on case facts
- Be professional but firm
- Reference relevant law or regulations
- Propose next steps`,
    TRIBUNAL_SUBMISSION: `Generate a formal tribunal/court submission email. This should:
- Use proper formal addressing (e.g., "Dear Sir/Madam" or appropriate tribunal address)
- Reference any case numbers or references
- Follow correct procedural format
- Include all required information for the submission
- Be concise and legally precise`,
    EVIDENCE_REQUEST: `Generate a request for evidence/documents. This should:
- Clearly specify what documents are needed
- Reference any legal right to the information (e.g., Subject Access Request, disclosure obligations)
- Set a reasonable deadline
- Explain why the documents are relevant`,
    SETTLEMENT_OFFER: `Generate a without prejudice settlement offer. This should:
- Mark clearly as "Without Prejudice"
- State the offer terms clearly
- Reference the strengths of the user's case
- Set a deadline for acceptance
- Include standard settlement terms`,
    COMPLAINT: `Generate a formal complaint. This should:
- Clearly state the grounds for complaint
- Reference relevant regulations or standards
- Include specific examples and dates
- State the desired resolution
- Set expectations for response time`,
    OTHER: `Generate a professional legal correspondence email appropriate for the case context.`,
  };

  const prompt = `You are a UK legal email drafting AI for DisputeHub. Generate a professional legal email.

CASE DETAILS:
- Case Type: ${disputeType}
- Case Title: ${dispute.title}
- Description: ${dispute.description.substring(0, 1000)}
- Key Facts: ${keyFacts}
- Desired Outcome: ${desiredOutcome}

USER DETAILS (for signature):
- Name: ${userName}
- Address: ${userAddress || "Not provided"}
- Phone: ${dispute.user.phone || "Not provided"}
- Email: ${dispute.user.email}

EMAIL TYPE: ${emailType}
${EMAIL_TYPE_INSTRUCTIONS[emailType] || EMAIL_TYPE_INSTRUCTIONS.OTHER}

${recipientEmail ? `RECIPIENT: ${recipientName || ""} <${recipientEmail}>` : ""}

${replyContext}

${emailHistory ? `PREVIOUS EMAIL HISTORY:\n${emailHistory}` : ""}

${customInstructions ? `ADDITIONAL INSTRUCTIONS:\n${customInstructions}` : ""}

IMPORTANT RULES:
1. Use UK English spelling and legal terminology
2. Reference UK law, not US/other jurisdictions
3. Be professional, clear, and legally accurate
4. Do NOT make up facts - only use what's provided
5. Include appropriate greeting and sign-off
6. Format for email (not letter)
7. Keep paragraph lengths reasonable

Respond with ONLY a JSON object (no markdown, no code fences):
{
  "subject": "the email subject line",
  "body": "the full email body in plain text",
  "recipientEmail": "${recipientEmail || 'the most appropriate recipient email if known, otherwise empty string'}",
  "recipientName": "${recipientName || 'the recipient name if known, otherwise empty string'}"
}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI draft generation failed: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text || "";
  const parsed = JSON.parse(content);

  // Get user's default email account
  const emailAccount = await prisma.emailAccount.findFirst({
    where: { userId, isActive: true },
    select: { id: true },
  });

  // Save as draft
  const draft = await prisma.emailDraft.create({
    data: {
      disputeId,
      userId,
      emailAccountId: emailAccount?.id || null,
      recipientEmail: parsed.recipientEmail || recipientEmail || "",
      recipientName: parsed.recipientName || recipientName || null,
      subject: parsed.subject,
      body: parsed.body,
      emailType,
      inReplyToId: inReplyToId || null,
      status: "DRAFT",
    },
    include: {
      emailAccount: {
        select: { email: true, provider: true },
      },
    },
  });

  return draft;
}
