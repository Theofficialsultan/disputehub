import { prisma } from "@/lib/prisma";
import { fetchGmailInbox } from "./oauth-gmail";
import { fetchOutlookInbox } from "./oauth-outlook";

/**
 * Sync inbox for a specific email account
 * Fetches new messages and stores them, matching to cases where possible
 */
export async function syncInbox(emailAccountId: string) {
  const account = await prisma.emailAccount.findUnique({
    where: { id: emailAccountId },
    include: { user: true },
  });

  if (!account || !account.isActive) {
    throw new Error("Email account not found or inactive");
  }

  let rawMessages: any[] = [];

  if (account.provider === "GMAIL") {
    const result = await fetchGmailInbox(emailAccountId, { maxResults: 30 });
    rawMessages = result.messages;
  } else if (account.provider === "OUTLOOK") {
    const result = await fetchOutlookInbox(emailAccountId, { top: 30 });
    rawMessages = result.messages;
  }

  let newCount = 0;

  for (const msg of rawMessages) {
    // Skip if already stored
    const existing = await prisma.emailMessage.findFirst({
      where: {
        emailAccountId: account.id,
        externalMessageId: msg.externalMessageId,
      },
    });

    if (existing) continue;

    // Try to match to a case
    const disputeId = await matchEmailToCase(msg, account.userId);

    // Determine direction
    const isOutbound = msg.senderEmail.toLowerCase() === account.email.toLowerCase();

    await prisma.emailMessage.create({
      data: {
        emailAccountId: account.id,
        disputeId,
        externalMessageId: msg.externalMessageId,
        threadId: msg.threadId,
        direction: isOutbound ? "OUTBOUND" : "INBOUND",
        senderEmail: msg.senderEmail,
        senderName: msg.senderName,
        recipientEmail: msg.recipientEmail,
        recipientName: msg.recipientName,
        subject: msg.subject,
        bodyText: msg.bodyText,
        bodyHtml: msg.bodyHtml,
        snippet: msg.snippet,
        receivedAt: msg.receivedAt,
        isRead: msg.isRead,
        hasAttachments: msg.hasAttachments || false,
      },
    });

    newCount++;

    // If inbound and matched to a case, create a case event
    if (!isOutbound && disputeId) {
      await prisma.caseEvent.create({
        data: {
          caseId: disputeId,
          type: "RESPONSE_RECEIVED",
          description: `Email received: "${msg.subject}" from ${msg.senderEmail}`,
          occurredAt: msg.receivedAt,
        },
      });

      // Update case lifecycle
      await prisma.dispute.update({
        where: { id: disputeId },
        data: { lifecycleStatus: "RESPONSE_RECEIVED" },
      });
    }
  }

  // Update sync timestamp
  await prisma.emailAccount.update({
    where: { id: emailAccountId },
    data: { lastSyncAt: new Date() },
  });

  return { synced: newCount, total: rawMessages.length };
}

/**
 * Match an email to a case using multiple strategies
 */
async function matchEmailToCase(
  msg: { threadId?: string; senderEmail: string; subject: string; bodyText?: string },
  userId: string
): Promise<string | null> {
  // Strategy 1: Match by thread ID (if we've seen this thread before)
  if (msg.threadId) {
    const threadMatch = await prisma.emailMessage.findFirst({
      where: {
        threadId: msg.threadId,
        disputeId: { not: null },
      },
      select: { disputeId: true },
    });

    if (threadMatch?.disputeId) return threadMatch.disputeId;
  }

  // Strategy 2: Match by subject line containing case reference
  const disputes = await prisma.dispute.findMany({
    where: { userId },
    select: { id: true, title: true },
  });

  for (const dispute of disputes) {
    // Check if subject or body mentions the dispute title
    const titleLower = dispute.title.toLowerCase();
    const subjectLower = msg.subject.toLowerCase();

    if (subjectLower.includes(titleLower) || titleLower.includes(subjectLower)) {
      return dispute.id;
    }
  }

  // Strategy 3: Match by sender email (if we've sent them something before)
  const previousOutbound = await prisma.emailMessage.findFirst({
    where: {
      recipientEmail: msg.senderEmail,
      direction: "OUTBOUND",
      disputeId: { not: null },
    },
    select: { disputeId: true },
    orderBy: { receivedAt: "desc" },
  });

  if (previousOutbound?.disputeId) return previousOutbound.disputeId;

  return null;
}

/**
 * Sync all active email accounts for a user
 */
export async function syncAllUserInboxes(userId: string) {
  const accounts = await prisma.emailAccount.findMany({
    where: { userId, isActive: true },
  });

  const results = [];
  for (const account of accounts) {
    try {
      const result = await syncInbox(account.id);
      results.push({ accountId: account.id, provider: account.provider, ...result });
    } catch (error: any) {
      results.push({
        accountId: account.id,
        provider: account.provider,
        error: error.message,
      });
    }
  }

  return results;
}
