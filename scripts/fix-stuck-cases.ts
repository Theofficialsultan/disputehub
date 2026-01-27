/**
 * Fix Stuck Cases Script
 * 
 * This script resets cases that are stuck in "strategyLocked = true"
 * but don't have enough information to actually generate documents.
 * 
 * Run with: npx tsx scripts/fix-stuck-cases.ts
 */

import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env" });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function fixStuckCases() {
  console.log("🔍 Finding stuck cases...\n");

  // Find all cases where strategyLocked = true
  const lockedCases = await prisma.dispute.findMany({
    where: {
      strategyLocked: true,
    },
    include: {
      caseStrategy: true,
      documentPlan: true,
    },
  });

  console.log(`Found ${lockedCases.length} locked cases\n`);

  let fixedCount = 0;

  for (const dispute of lockedCases) {
    const strategy = dispute.caseStrategy;

    // Check if strategy actually meets NEW requirements
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
      console.log(`📝 Case: ${dispute.title}`);
      console.log(`   ID: ${dispute.id}`);
      console.log(`   Key Facts: ${keyFactsCount}/5`);
      console.log(`   Evidence: ${evidenceCount}/2`);
      console.log(`   Detailed Outcome: ${hasDetailedOutcome ? "Yes" : "No"}`);
      console.log(`   Status: STUCK - Unlocking...`);

      // Unlock the case
      await prisma.dispute.update({
        where: { id: dispute.id },
        data: {
          strategyLocked: false,
          conversationStatus: "OPEN",
        },
      });

      // Delete any incomplete document plans
      if (dispute.documentPlan) {
        const documents = await prisma.generatedDocument.findMany({
          where: { planId: dispute.documentPlan.id },
        });

        if (documents.length === 0 || documents.every((d) => d.status === "PENDING")) {
          console.log(`   Removing incomplete document plan...`);
          await prisma.documentPlan.delete({
            where: { id: dispute.documentPlan.id },
          });
        }
      }

      console.log(`   ✅ Case unlocked and ready for more conversation\n`);
      fixedCount++;
    } else {
      console.log(`✅ Case: ${dispute.title} - Already meets requirements\n`);
    }
  }

  console.log(`\n🎉 Fixed ${fixedCount} stuck case(s)!`);
  console.log(`\nThese cases are now unlocked and can continue conversation.`);
}

fixStuckCases()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
