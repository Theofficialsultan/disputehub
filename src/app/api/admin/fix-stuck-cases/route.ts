/**
 * Admin API: Fix Stuck Cases
 * Unlocks cases that are stuck in strategyLocked = true
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    console.log("[Fix Stuck Cases] Starting...");

    // Find all locked cases
    const lockedCases = await prisma.dispute.findMany({
      where: {
        strategyLocked: true,
      },
      include: {
        caseStrategy: true,
        documentPlan: true,
      },
    });

    console.log(`[Fix Stuck Cases] Found ${lockedCases.length} locked cases`);

    let fixedCount = 0;

    for (const dispute of lockedCases) {
      const strategy = dispute.caseStrategy;

      // Check if strategy meets NEW requirements
      const keyFactsCount = Array.isArray(strategy?.keyFacts) ? strategy.keyFacts.length : 0;
      const evidenceCount = Array.isArray(strategy?.evidenceMentioned)
        ? strategy.evidenceMentioned.length
        : 0;
      const hasDetailedOutcome = strategy?.desiredOutcome && strategy.desiredOutcome.length >= 15;

      const meetsNewRequirements =
        strategy?.disputeType &&
        keyFactsCount >= 5 &&
        evidenceCount >= 2 &&
        hasDetailedOutcome;

      if (!meetsNewRequirements) {
        console.log(`[Fix Stuck Cases] Unlocking case: ${dispute.id}`);

        // Unlock the case
        await prisma.dispute.update({
          where: { id: dispute.id },
          data: {
            strategyLocked: false,
            conversationStatus: "OPEN",
          },
        });

        // Delete incomplete document plans
        if (dispute.documentPlan) {
          const documents = await prisma.generatedDocument.findMany({
            where: { planId: dispute.documentPlan.id },
          });

          if (documents.length === 0 || documents.every((d) => d.status === "PENDING")) {
            console.log(`[Fix Stuck Cases] Removing incomplete document plan`);
            await prisma.documentPlan.delete({
              where: { id: dispute.documentPlan.id },
            });
          }
        }

        fixedCount++;
      }
    }

    console.log(`[Fix Stuck Cases] Fixed ${fixedCount} cases`);

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixedCount} stuck case(s)`,
      totalLocked: lockedCases.length,
      fixed: fixedCount,
    });
  } catch (error) {
    console.error("[Fix Stuck Cases] Error:", error);
    return NextResponse.json(
      { error: "Failed to fix stuck cases" },
      { status: 500 }
    );
  }
}
