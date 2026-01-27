/**
 * Backfill caseId for existing GeneratedDocuments
 * Run: npx tsx scripts/backfill-document-caseid.ts
 */

import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("🔄 Backfilling caseId for GeneratedDocuments...");

  // Get all documents without caseId
  const docs = await prisma.generatedDocument.findMany({
    where: {
      caseId: null,
    },
    include: {
      plan: true,
    },
  });

  console.log(`Found ${docs.length} documents to backfill`);

  let updated = 0;
  let skipped = 0;

  for (const doc of docs) {
    if (doc.plan?.caseId) {
      await prisma.generatedDocument.update({
        where: { id: doc.id },
        data: { caseId: doc.plan.caseId },
      });
      updated++;
      console.log(`✅ Updated document ${doc.id} with caseId ${doc.plan.caseId}`);
    } else {
      skipped++;
      console.log(`⏭️  Skipped document ${doc.id} (no plan or caseId)`);
    }
  }

  console.log(`\n✨ Done! Updated: ${updated}, Skipped: ${skipped}`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
