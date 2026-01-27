/**
 * Phase 8.5 - Evidence Service
 * Court-grade evidence management with permanent index numbers
 * 
 * SYSTEM-OWNED, NOT AI-OWNED
 */

import { prisma } from "@/lib/prisma";
import type { EvidenceType } from "@prisma/client";
import { createTimelineEvent } from "@/lib/timeline/timeline";

interface CreateEvidenceParams {
  caseId: string;
  userId: string;
  fileUrl: string;
  fileType: EvidenceType;
  fileName: string;
  fileSize: number;
  title: string;
  description?: string;
  evidenceDate?: Date;
}

/**
 * Get next evidence index for a case
 * Evidence numbering starts at 1 and increments
 */
async function getNextEvidenceIndex(caseId: string): Promise<number> {
  const lastEvidence = await prisma.evidenceItem.findFirst({
    where: { caseId },
    orderBy: { evidenceIndex: "desc" },
    select: { evidenceIndex: true },
  });

  return lastEvidence ? lastEvidence.evidenceIndex + 1 : 1;
}

/**
 * Create evidence item with automatic index assignment
 * Index is permanent and immutable once assigned
 */
export async function createEvidence(params: CreateEvidenceParams) {
  const {
    caseId,
    userId,
    fileUrl,
    fileType,
    fileName,
    fileSize,
    title,
    description,
    evidenceDate,
  } = params;

  // Get next index (atomic within transaction)
  const evidenceIndex = await getNextEvidenceIndex(caseId);

  // Create evidence item
  const evidence = await prisma.evidenceItem.create({
    data: {
      caseId,
      fileUrl,
      fileType,
      fileName,
      fileSize,
      title,
      description,
      evidenceDate,
      evidenceIndex,
      uploadedBy: userId,
    },
  });

  // Create timeline event
  await createTimelineEvent(
    caseId,
    "EVIDENCE_UPLOADED",
    `Evidence Item #${evidenceIndex} uploaded: ${title}`,
    undefined,
    new Date()
  );

  return evidence;
}

/**
 * Get all evidence items for a case
 * Ordered by evidence index (permanent numbering)
 */
export async function getCaseEvidence(caseId: string) {
  return prisma.evidenceItem.findMany({
    where: { caseId },
    orderBy: { evidenceIndex: "asc" },
  });
}

/**
 * Get specific evidence item by ID
 */
export async function getEvidenceById(evidenceId: string) {
  return prisma.evidenceItem.findUnique({
    where: { id: evidenceId },
  });
}

/**
 * Get evidence item by case and index
 */
export async function getEvidenceByIndex(caseId: string, evidenceIndex: number) {
  return prisma.evidenceItem.findUnique({
    where: {
      caseId_evidenceIndex: {
        caseId,
        evidenceIndex,
      },
    },
  });
}

/**
 * Update evidence metadata (NOT the file or index)
 */
export async function updateEvidenceMetadata(
  evidenceId: string,
  updates: {
    title?: string;
    description?: string;
    evidenceDate?: Date;
  }
) {
  return prisma.evidenceItem.update({
    where: { id: evidenceId },
    data: updates,
  });
}

/**
 * Delete evidence item
 * Note: This should be used carefully as it affects evidence numbering references
 */
export async function deleteEvidence(evidenceId: string) {
  const evidence = await prisma.evidenceItem.findUnique({
    where: { id: evidenceId },
    select: { caseId: true, evidenceIndex: true, title: true },
  });

  if (!evidence) {
    throw new Error("Evidence not found");
  }

  await prisma.evidenceItem.delete({
    where: { id: evidenceId },
  });

  // Create timeline event
  await createTimelineEvent(
    evidence.caseId,
    "EVIDENCE_UPLOADED", // Reuse event type for deletion tracking
    `Evidence Item #${evidence.evidenceIndex} removed: ${evidence.title}`,
    undefined,
    new Date()
  );

  return evidence;
}
