/**
 * Decision Gate (Phase 8.2.5)
 * 
 * System-owned logic that automatically transitions a case from
 * conversation mode to document generation mode.
 * 
 * CRITICAL RULES:
 * - NO user buttons
 * - NO AI guessing
 * - NO manual triggers
 * - System decides based on isStrategyComplete()
 * 
 * Flow:
 * 1. Check if strategy is complete
 * 2. Lock strategy (prevent further AI exploration)
 * 3. Create timeline event (STRATEGY_FINALISED)
 * 4. Generate document plan
 * 5. Start batch document generation
 * 6. Update lifecycle status
 */

import { prisma } from "@/lib/prisma";
import { isStrategyComplete } from "@/lib/strategy/isStrategyComplete";
import { createTimelineEvent } from "@/lib/timeline/timeline";
import { persistDocumentPlan } from "@/lib/documents/persistence";
import { batchGenerateDocuments } from "@/lib/documents/document-generator";
import { computeDocumentPlan } from "@/lib/documents/plan-generator";

/**
 * Check if decision gate should trigger
 * 
 * @param caseId - Case ID
 * @returns true if gate should trigger, false otherwise
 */
export async function shouldTriggerDecisionGate(
  caseId: string
): Promise<boolean> {
  console.log(`[Decision Gate] Checking if gate should trigger for case ${caseId}`);
  
  // Fetch case with strategy
  const dispute = await prisma.dispute.findUnique({
    where: { id: caseId },
    include: { caseStrategy: true },
  });

  if (!dispute) {
    console.log(`[Decision Gate] ❌ Case not found`);
    return false;
  }

  // Already locked? Don't trigger again
  if (dispute.strategyLocked) {
    console.log(`[Decision Gate] ⏭️  Already locked, skipping`);
    return false;
  }

  // Restricted cases don't auto-generate
  if (dispute.restricted) {
    console.log(`[Decision Gate] ⏭️  Case is restricted, skipping`);
    return false;
  }

  // Check if strategy is complete
  const isComplete = isStrategyComplete(dispute.caseStrategy);
  console.log(`[Decision Gate] Strategy complete: ${isComplete ? '✅ YES' : '❌ NO'}`);
  return isComplete;
}

/**
 * Execute decision gate
 * 
 * This is the critical system transition point.
 * 
 * Process:
 * 1. Lock strategy (prevent further AI exploration)
 * 2. Create STRATEGY_FINALISED timeline event
 * 3. Generate document plan (if not exists)
 * 4. Create DOCUMENT_PLAN_CREATED timeline event
 * 5. Start batch document generation
 * 6. Create DOCUMENTS_GENERATING timeline event
 * 
 * @param caseId - Case ID
 * @returns true if gate executed, false if skipped
 */
export async function executeDecisionGate(
  caseId: string
): Promise<boolean> {
  try {
    // Double-check trigger conditions
    const shouldTrigger = await shouldTriggerDecisionGate(caseId);

    if (!shouldTrigger) {
      return false;
    }

    console.log(`[Decision Gate] Executing for case ${caseId}`);

    const now = new Date();

    // Step 1: Lock strategy
    await prisma.dispute.update({
      where: { id: caseId },
      data: {
        strategyLocked: true,
      },
    });

    console.log(`[Decision Gate] Strategy locked for case ${caseId}`);

    // Step 2: Create STRATEGY_FINALISED timeline event
    await createTimelineEvent(
      caseId,
      "STRATEGY_FINALISED",
      "Case strategy completed and locked",
      undefined,
      now
    );

    console.log(`[Decision Gate] STRATEGY_FINALISED event created`);

    // Step 3: Generate document plan (if not exists)
    let documentPlan = await prisma.documentPlan.findUnique({
      where: { caseId },
    });

    if (!documentPlan) {
      console.log(`[Decision Gate] Creating document plan...`);
      
      // Fetch strategy for plan computation
      const strategy = await prisma.caseStrategy.findUnique({
        where: { caseId },
      });

      if (!strategy) {
        throw new Error("No strategy found for document plan creation");
      }

      // Compute the document plan
      const computedPlan = computeDocumentPlan(strategy);
      console.log(`[Decision Gate] Computed plan: ${computedPlan.documentType}, ${computedPlan.documents.length} documents`);
      
      // Persist the plan to database
      const plan = await persistDocumentPlan(caseId, computedPlan);
      
      if (!plan) {
        throw new Error("Failed to create document plan");
      }

      documentPlan = plan as any;

      // Step 4: Create DOCUMENT_PLAN_CREATED timeline event
      await createTimelineEvent(
        caseId,
        "DOCUMENT_PLAN_CREATED",
        "Document plan created automatically",
        undefined,
        now
      );

      console.log(`[Decision Gate] Document plan created`);
    } else {
      console.log(`[Decision Gate] Document plan already exists`);
    }

    // Step 5: Create DOCUMENTS_GENERATING timeline event
    await createTimelineEvent(
      caseId,
      "DOCUMENTS_GENERATING",
      "Document generation started",
      undefined,
      now
    );

    console.log(`[Decision Gate] DOCUMENTS_GENERATING event created`);

    // Step 6: Start batch document generation
    // Run it synchronously so documents actually generate
    console.log(`[Decision Gate] Starting document generation...`);
    try {
      const result = await batchGenerateDocuments(caseId);
      console.log(`[Decision Gate] ✅ Document generation complete: ${result.completed} completed, ${result.failed} failed`);
    } catch (error) {
      console.error(`[Decision Gate] ❌ Document generation error:`, error);
    }

    console.log(`[Decision Gate] Document generation finished`);

    return true;
  } catch (error) {
    console.error(`[Decision Gate] Error executing gate:`, error);
    return false;
  }
}
