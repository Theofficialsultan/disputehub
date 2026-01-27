/**
 * Document Plan Persistence Service
 * Phase 7.2 Block 3B
 * 
 * Handles database operations for document plans
 * Uses transactions for atomicity
 */

import { prisma } from "@/lib/prisma";
import type { DocumentPlan, PlannedDocument, ComplexityBreakdown } from "./types";
import type { CaseComplexity, DocumentStructureType } from "@prisma/client";

/**
 * Create and persist a document plan with all documents
 * 
 * Uses a database transaction to ensure atomicity:
 * - DocumentPlan record created
 * - All GeneratedDocument records created
 * - If any step fails, entire operation rolls back
 * 
 * @throws Error if creation fails
 */
export async function persistDocumentPlan(
  caseId: string,
  plan: DocumentPlan
): Promise<any> {
  // Use transaction for atomicity
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create DocumentPlan record
    const documentPlan = await tx.documentPlan.create({
      data: {
        caseId,
        complexity: plan.complexity as CaseComplexity,
        complexityScore: plan.complexityScore,
        complexityBreakdown: plan.complexityBreakdown as any, // JSON field
        documentType: plan.documentType as DocumentStructureType,
      },
    });

    // 2. Create all GeneratedDocument records (bulk operation)
    const documents = await Promise.all(
      plan.documents.map((doc) =>
        tx.generatedDocument.create({
          data: {
            planId: documentPlan.id,
            type: doc.type,
            title: doc.title,
            description: doc.description,
            order: doc.order,
            required: doc.required,
            status: "PENDING", // Always PENDING initially
            content: null, // NULL until Block 3C
          },
        })
      )
    );

    return {
      ...documentPlan,
      documents,
    };
  });

  // Return with typed breakdown
  return {
    ...result,
    complexityBreakdown: result.complexityBreakdown as ComplexityBreakdown,
  };
}

/**
 * Fetch persisted document plan by case ID
 * 
 * Returns null if no plan exists
 */
export async function getPersistedDocumentPlan(
  caseId: string
): Promise<any | null> {
  const plan = await prisma.documentPlan.findUnique({
    where: { caseId },
    include: {
      documents: {
        orderBy: { order: "asc" }, // Always return in order
      },
    },
  });

  if (!plan) {
    return null;
  }

  return {
    ...plan,
    complexityBreakdown: plan.complexityBreakdown as ComplexityBreakdown,
  };
}

/**
 * Check if a document plan exists for a case
 * 
 * Efficient existence check without fetching full data
 */
export async function documentPlanExists(caseId: string): Promise<boolean> {
  const count = await prisma.documentPlan.count({
    where: { caseId },
  });

  return count > 0;
}

/**
 * Delete a document plan and all its documents
 * 
 * Cascade delete handled by database foreign key
 * (Future feature: Allow plan regeneration)
 */
export async function deleteDocumentPlan(caseId: string): Promise<void> {
  await prisma.documentPlan.delete({
    where: { caseId },
  });
}
