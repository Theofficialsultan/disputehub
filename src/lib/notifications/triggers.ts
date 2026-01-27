import { createNotification } from "./service";
import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";

/**
 * Phase 8.4 - Notification Triggers
 * Maps system events to notifications
 * SYSTEM-ONLY, NO AI LOGIC
 */

/**
 * Trigger: Document generated successfully
 * Event: DOCUMENT_GENERATED (status: COMPLETED)
 */
export async function notifyDocumentReady(caseId: string, userId: string, documentType: string) {
  await createNotification({
    userId,
    caseId,
    type: "DOCUMENT_READY",
    message: "Your documents are ready.",
  });
}

/**
 * Trigger: Document marked as sent
 * Event: DOCUMENT_SENT
 */
export async function notifyDocumentSent(caseId: string, userId: string, documentType: string) {
  await createNotification({
    userId,
    caseId,
    type: "DOCUMENT_SENT",
    message: "Your document has been marked as sent.",
  });
}

/**
 * Trigger: Deadline approaching (3 days)
 * Condition: waitingUntil - 3 days
 */
export async function notifyDeadlineApproaching(caseId: string, userId: string, daysRemaining: number) {
  await createNotification({
    userId,
    caseId,
    type: "DEADLINE_APPROACHING",
    message: `You have ${daysRemaining} days left to receive a response.`,
  });
}

/**
 * Trigger: Deadline missed
 * Event: DEADLINE_MISSED
 */
export async function notifyDeadlineMissed(caseId: string, userId: string) {
  await createNotification({
    userId,
    caseId,
    type: "DEADLINE_MISSED",
    message: "No response was received within the deadline.",
  });
}

/**
 * Trigger: Follow-up generated
 * Event: FOLLOW_UP_GENERATED
 */
export async function notifyFollowUpGenerated(caseId: string, userId: string) {
  await createNotification({
    userId,
    caseId,
    type: "FOLLOW_UP_GENERATED",
    message: "A follow-up letter has been generated automatically.",
  });
}

/**
 * Trigger: Case closed
 * Event: CASE_CLOSED
 */
export async function notifyCaseClosed(caseId: string, userId: string) {
  await createNotification({
    userId,
    caseId,
    type: "CASE_CLOSED",
    message: "This case has been closed.",
  });
}

/**
 * Check for approaching deadlines (to be called by cron/scheduler)
 * Finds cases with deadlines within 3 days
 */
export async function checkApproachingDeadlines() {
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  // Find cases awaiting response with deadline in 3 days
  const cases = await prisma.dispute.findMany({
    where: {
      lifecycleStatus: "AWAITING_RESPONSE",
      waitingUntil: {
        gte: now,
        lte: threeDaysFromNow,
      },
    },
    select: {
      id: true,
      userId: true,
      waitingUntil: true,
    },
  });

  // Create notifications for each
  for (const caseData of cases) {
    if (caseData.waitingUntil) {
      const daysRemaining = Math.ceil(
        (caseData.waitingUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      await notifyDeadlineApproaching(caseData.id, caseData.userId, daysRemaining);
    }
  }

  return cases.length;
}
