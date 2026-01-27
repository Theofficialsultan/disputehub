/**
 * Deadline Engine (Phase 8.2.2)
 * 
 * System-owned deadline management and lifecycle tracking.
 * 
 * Rules:
 * - Lifecycle status is system-owned
 * - Users cannot set or edit it
 * - AI cannot set or edit it
 * - Changes only happen via backend logic
 */

import { prisma } from "@/lib/prisma";
import { createTimelineEvent } from "@/lib/timeline/timeline";

/**
 * Default deadline period in days
 */
const DEFAULT_DEADLINE_DAYS = 14;

/**
 * Mark a document as sent
 * 
 * This triggers the deadline engine:
 * 1. Updates dispute lifecycle status to AWAITING_RESPONSE
 * 2. Sets waitingUntil to now + 14 days
 * 3. Creates DOCUMENT_SENT timeline event
 * 
 * @param documentId - Document ID
 * @param userId - User ID (for authorization)
 * @returns Updated dispute
 */
export async function markDocumentAsSent(
  documentId: string,
  userId: string
): Promise<void> {
  // Fetch document with case
  const document = await prisma.generatedDocument.findUnique({
    where: { id: documentId },
    include: {
      plan: {
        include: {
          case: true,
        },
      },
    },
  });

  if (!document) {
    throw new Error("Document not found");
  }

  // Verify ownership
  if (document.plan.case.userId !== userId) {
    throw new Error("Unauthorized");
  }

  // Verify document is completed
  if (document.status !== "COMPLETED") {
    throw new Error("Only completed documents can be marked as sent");
  }

  const caseId = document.plan.caseId;
  const sentAt = new Date();
  const waitingUntil = new Date(
    sentAt.getTime() + DEFAULT_DEADLINE_DAYS * 24 * 60 * 60 * 1000
  );

  // Update dispute lifecycle
  await prisma.dispute.update({
    where: { id: caseId },
    data: {
      lifecycleStatus: "AWAITING_RESPONSE",
      waitingUntil,
    },
  });

  // Create timeline event
  await createTimelineEvent(
    caseId,
    "DOCUMENT_SENT",
    `Document '${document.type}' was sent`,
    documentId,
    sentAt
  );
}

/**
 * Check for missed deadlines
 * 
 * Finds disputes where:
 * - lifecycleStatus = AWAITING_RESPONSE
 * - waitingUntil < now()
 * 
 * For each:
 * - Updates lifecycleStatus to DEADLINE_MISSED
 * - Creates DEADLINE_MISSED timeline event
 * 
 * This function is designed to be called by a cron job (future).
 * For now, it can be called manually.
 * 
 * @returns Number of disputes updated
 */
export async function checkMissedDeadlines(): Promise<number> {
  const now = new Date();

  // Find disputes with missed deadlines
  const disputes = await prisma.dispute.findMany({
    where: {
      lifecycleStatus: "AWAITING_RESPONSE",
      waitingUntil: {
        lt: now,
      },
    },
  });

  // Update each dispute
  for (const dispute of disputes) {
    await prisma.dispute.update({
      where: { id: dispute.id },
      data: {
        lifecycleStatus: "DEADLINE_MISSED",
      },
    });

    // Create timeline event
    await createTimelineEvent(
      dispute.id,
      "DEADLINE_MISSED",
      "Response deadline missed",
      undefined,
      now
    );
  }

  return disputes.length;
}

/**
 * Get waiting status for a case
 * 
 * @param caseId - Case ID
 * @returns Waiting status information
 */
export async function getWaitingStatus(caseId: string) {
  const dispute = await prisma.dispute.findUnique({
    where: { id: caseId },
    select: {
      lifecycleStatus: true,
      waitingUntil: true,
    },
  });

  if (!dispute) {
    throw new Error("Dispute not found");
  }

  let daysRemaining: number | null = null;

  if (dispute.waitingUntil) {
    const now = new Date();
    const diffMs = dispute.waitingUntil.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    daysRemaining = diffDays;
  }

  return {
    lifecycleStatus: dispute.lifecycleStatus,
    waitingUntil: dispute.waitingUntil,
    daysRemaining,
  };
}

/**
 * Process Missed Deadlines and Generate Follow-Ups
 * 
 * Phase 8.2.3 - System-Triggered Follow-Ups
 * 
 * Finds disputes with missed deadlines and automatically generates follow-up letters.
 * 
 * Rules:
 * - Only processes disputes with lifecycleStatus = DEADLINE_MISSED
 * - Checks if follow-up already generated (prevents duplicates)
 * - Generates FOLLOW_UP_LETTER document
 * - Resets waiting cycle (new 14-day deadline)
 * - Creates timeline events (FOLLOW_UP_GENERATED, DEADLINE_SET)
 * 
 * This function is designed to be called by a cron job (future).
 * For now, it can be called manually.
 * 
 * @returns Number of follow-ups generated
 */
export async function processMissedDeadlines(): Promise<number> {
  const now = new Date();
  let followUpsGenerated = 0;

  // Find disputes with missed deadlines
  const disputes = await prisma.dispute.findMany({
    where: {
      lifecycleStatus: "DEADLINE_MISSED",
      restricted: false, // Don't process restricted cases
    },
    include: {
      documentPlan: {
        include: {
          documents: true,
        },
      },
    },
  });

  for (const dispute of disputes) {
    // Skip if no document plan exists
    if (!dispute.documentPlan) {
      continue;
    }

    // Check if follow-up already generated for this cycle
    const existingFollowUp = dispute.documentPlan.documents.find(
      (doc) => doc.isFollowUp === true
    );

    if (existingFollowUp) {
      // Follow-up already exists, skip
      continue;
    }

    // Generate follow-up document record
    const followUpDocument = await prisma.generatedDocument.create({
      data: {
        planId: dispute.documentPlan.id,
        type: "FOLLOW_UP_LETTER",
        title: "Follow-Up Letter",
        description: "Follow-up letter requesting response to original correspondence",
        order: dispute.documentPlan.documents.length + 1, // Add to end
        required: true,
        status: "PENDING",
        isFollowUp: true,
      },
    });

    // Reset waiting cycle
    const newWaitingUntil = new Date(
      now.getTime() + DEFAULT_DEADLINE_DAYS * 24 * 60 * 60 * 1000
    );

    await prisma.dispute.update({
      where: { id: dispute.id },
      data: {
        lifecycleStatus: "AWAITING_RESPONSE",
        waitingUntil: newWaitingUntil,
      },
    });

    // Create timeline events
    await createTimelineEvent(
      dispute.id,
      "FOLLOW_UP_GENERATED",
      "Follow-up letter generated due to no response",
      followUpDocument.id,
      now
    );

    await createTimelineEvent(
      dispute.id,
      "DEADLINE_SET",
      "New response deadline set after follow-up",
      undefined,
      now
    );

    followUpsGenerated++;
  }

  return followUpsGenerated;
}
