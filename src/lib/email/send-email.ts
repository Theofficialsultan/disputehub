import { prisma } from "@/lib/prisma";
import { sendGmailEmail } from "./oauth-gmail";
import { sendOutlookEmail } from "./oauth-outlook";

/**
 * Unified email sender - resolves provider and sends
 */
export async function sendEmail(draftId: string) {
  const draft = await prisma.emailDraft.findUnique({
    where: { id: draftId },
    include: {
      emailAccount: true,
      inReplyTo: true,
    },
  });

  if (!draft) throw new Error("Draft not found");
  if (draft.status === "SENT") throw new Error("Draft already sent");
  if (!draft.emailAccountId) throw new Error("No email account linked to draft");

  const account = draft.emailAccount;
  if (!account || !account.isActive) {
    throw new Error("Email account is disconnected or inactive");
  }

  try {
    // Update status to sending
    await prisma.emailDraft.update({
      where: { id: draftId },
      data: { status: "APPROVED" },
    });

    let result: { messageId: string | null; threadId: string | null };

    // In-Reply-To header (external message ID of original)
    const replyToExternalId = draft.inReplyTo?.externalMessageId || undefined;

    if (account.provider === "GMAIL") {
      result = await sendGmailEmail(
        account.id,
        draft.recipientEmail,
        draft.subject,
        draft.bodyHtml || draft.body,
        replyToExternalId || undefined
      );
    } else if (account.provider === "OUTLOOK") {
      result = await sendOutlookEmail(
        account.id,
        draft.recipientEmail,
        draft.subject,
        draft.bodyHtml || draft.body,
        replyToExternalId || undefined
      );
    } else {
      throw new Error(`Unsupported provider: ${account.provider}`);
    }

    // Mark as sent
    await prisma.emailDraft.update({
      where: { id: draftId },
      data: {
        status: "SENT",
        sentAt: new Date(),
        externalMessageId: result.messageId,
      },
    });

    // Store as outbound message
    await prisma.emailMessage.create({
      data: {
        emailAccountId: account.id,
        disputeId: draft.disputeId,
        externalMessageId: result.messageId,
        threadId: result.threadId,
        direction: "OUTBOUND",
        senderEmail: account.email,
        recipientEmail: draft.recipientEmail,
        recipientName: draft.recipientName,
        subject: draft.subject,
        bodyText: draft.body,
        bodyHtml: draft.bodyHtml,
        receivedAt: new Date(),
        isRead: true,
      },
    });

    // Create case event
    await prisma.caseEvent.create({
      data: {
        caseId: draft.disputeId,
        type: "DOCUMENT_SENT",
        description: `Email sent: "${draft.subject}" to ${draft.recipientEmail}`,
        occurredAt: new Date(),
      },
    });

    return { success: true, messageId: result.messageId };
  } catch (error: any) {
    // Mark as failed
    await prisma.emailDraft.update({
      where: { id: draftId },
      data: {
        status: "FAILED",
        lastError: error.message,
        retryCount: { increment: 1 },
      },
    });

    throw error;
  }
}
