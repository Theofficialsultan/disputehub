const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCaseStatus() {
  const caseId = 'cmkx7mn5l0000xro6oguu1swn';
  
  const dispute = await prisma.dispute.findUnique({
    where: { id: caseId },
    include: {
      documentPlan: true,
      strategy: true
    }
  });
  
  console.log('Dispute phase:', dispute?.phase);
  console.log('Chat locked:', dispute?.chatLocked);
  console.log('Lock reason:', dispute?.lockReason);
  console.log('\nDocument plan:', dispute?.documentPlan);
  console.log('\nStrategy:', {
    keyFacts: dispute?.strategy?.keyFacts?.length || 0,
    desiredOutcome: dispute?.strategy?.desiredOutcome,
    disputeType: dispute?.strategy?.disputeType
  });
  
  await prisma.$disconnect();
}

checkCaseStatus().catch(console.error);
