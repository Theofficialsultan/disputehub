import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  // Find a case that's ready for document generation
  const cases = await prisma.dispute.findMany({
    where: {
      phase: { in: ['STRATEGY_COMPLETE', 'COMPLETED', 'DOCUMENTS_READY'] }
    },
    include: {
      documentPlan: {
        include: { documents: true }
      },
      caseStrategy: true
    },
    orderBy: { updatedAt: 'desc' },
    take: 3
  });

  console.log(`\nFound ${cases.length} cases:\n`);
  
  for (const c of cases) {
    console.log(`📋 ${c.title}`);
    console.log(`   ID: ${c.id}`);
    console.log(`   Phase: ${c.phase}`);
    console.log(`   Docs: ${c.documentPlan?.documents.length || 0}`);
    if (c.documentPlan?.allowedDocuments) {
      console.log(`   Allowed: ${JSON.stringify(c.documentPlan.allowedDocuments)}`);
    }
    console.log('');
  }

  if (cases.length > 0) {
    console.log(`\n🔗 Test URL: http://localhost:3000/disputes/${cases[0].id}/case`);
  }
}

test()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
