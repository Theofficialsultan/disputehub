const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetCase() {
  const caseId = 'cmkx7mn5l0000xro6oguu1swn';
  
  // Reset the case phase and unlock chat
  await prisma.dispute.update({
    where: { id: caseId },
    data: {
      phase: 'GATHERING',
      chatLocked: false,
      lockReason: null,
      lockedAt: null
    }
  });
  
  // Delete any existing document plan
  await prisma.documentPlan.deleteMany({
    where: { caseId }
  });
  
  console.log('✅ Case reset successfully!');
  console.log('Phase: GATHERING');
  console.log('Chat locked: false');
  console.log('Document plan: deleted');
  
  await prisma.$disconnect();
}

resetCase().catch(console.error);
