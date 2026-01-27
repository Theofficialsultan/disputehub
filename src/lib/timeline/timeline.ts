/**
 * Case Timeline Engine (Phase 8.2.1)
 * 
 * System-owned, append-only event log for case history.
 * 
 * Rules:
 * - Events are immutable (append-only)
 * - Users cannot create events directly
 * - AI cannot create events directly
 * - Only system can create events
 */

import { prisma } from "@/lib/prisma";
import type { CaseEventType } from "@prisma/client";
import {
  notifyDocumentReady,
  notifyDocumentSent,
  notifyDeadlineMissed,
  notifyFollowUpGenerated,
  notifyCaseClosed,
} from "@/lib/notifications/triggers";
import { sendEmailNotification } from "@/lib/notifications/email";

/**
 * Create a timeline event
 * 
 * This is the ONLY way to create timeline events.
 * Phase 8.4: Also triggers notifications
 * 
 * @param caseId - Case ID
 * @param type - Event type
 * @param description - Human-readable description
 * @param relatedDocumentId - Optional document ID
 * @param occurredAt - When the event occurred (defaults to now)
 */
export async function createTimelineEvent(
  caseId: string,
  type: CaseEventType,
  description: string,
  relatedDocumentId?: string,
  occurredAt?: Date
): Promise<void> {
  // Create timeline event
  await prisma.caseEvent.create({
    data: {
      caseId,
      type,
      description,
      relatedDocumentId,
      occurredAt: occurredAt || new Date(),
    },
  });

  // Phase 8.4: Trigger notifications based on event type
  // Get case and user info for notifications
  const caseData = await prisma.dispute.findUnique({
    where: { id: caseId },
    select: {
      id: true,
      userId: true,
      title: true,
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  if (!caseData) return;

  // Trigger notifications for specific events
  try {
    switch (type) {
      case "DOCUMENT_SENT":
        await notifyDocumentSent(caseId, caseData.userId, "document");
        await sendEmailNotification({
          to: caseData.user.email,
          caseId,
          caseTitle: caseData.title,
          type: "DOCUMENT_SENT",
        });
        break;

      case "DEADLINE_MISSED":
        await notifyDeadlineMissed(caseId, caseData.userId);
        await sendEmailNotification({
          to: caseData.user.email,
          caseId,
          caseTitle: caseData.title,
          type: "DEADLINE_MISSED",
        });
        break;

      case "FOLLOW_UP_GENERATED":
        await notifyFollowUpGenerated(caseId, caseData.userId);
        await sendEmailNotification({
          to: caseData.user.email,
          caseId,
          caseTitle: caseData.title,
          type: "FOLLOW_UP_GENERATED",
        });
        break;

      case "CASE_CLOSED":
        await notifyCaseClosed(caseId, caseData.userId);
        await sendEmailNotification({
          to: caseData.user.email,
          caseId,
          caseTitle: caseData.title,
          type: "CASE_CLOSED",
        });
        break;
    }
  } catch (error) {
    // Log error but don't fail the timeline event creation
    console.error("Failed to send notification:", error);
  }
}

/**
 * Create event for successful document generation
 * Phase 8.4: Also triggers DOCUMENT_READY notification
 */
export async function createDocumentGeneratedEvent(
  caseId: string,
  documentId: string,
  documentType: string,
  success: boolean
): Promise<void> {
  const description = success
    ? `Document '${documentType}' generated successfully`
    : `Document '${documentType}' failed to generate`;

  await createTimelineEvent(
    caseId,
    "DOCUMENT_GENERATED",
    description,
    documentId
  );

  // Phase 8.4: Notify when document is ready (success only)
  if (success) {
    try {
      const caseData = await prisma.dispute.findUnique({
        where: { id: caseId },
        select: {
          userId: true,
          title: true,
          user: {
            select: {
              email: true,
            },
          },
        },
      });

      if (caseData) {
        await notifyDocumentReady(caseId, caseData.userId, documentType);
        await sendEmailNotification({
          to: caseData.user.email,
          caseId,
          caseTitle: caseData.title,
          type: "DOCUMENT_READY",
        });
      }
    } catch (error) {
      console.error("Failed to send document ready notification:", error);
    }
  }
}

/**
 * Fetch all timeline events for a case
 * 
 * @param caseId - Case ID
 * @returns Events ordered by occurredAt ASC
 */
export async function getCaseTimeline(caseId: string) {
  return await prisma.caseEvent.findMany({
    where: { caseId },
    orderBy: { occurredAt: "asc" },
    select: {
      id: true,
      type: true,
      description: true,
      relatedDocumentId: true,
      occurredAt: true,
      createdAt: true,
    },
  });
}
