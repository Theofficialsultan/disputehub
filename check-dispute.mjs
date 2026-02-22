import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const d = await prisma.dispute.findUnique({ 
  where: { id: 'cml7zvwl90000zro6ne8r2pry' },
  select: { phase: true, chatState: true, lifecycleStatus: true, chatLocked: true, lockReason: true }
});
console.log('Dispute:', JSON.stringify(d, null, 2));

const plan = await prisma.documentPlan.findFirst({ where: { caseId: 'cml7zvwl90000zro6ne8r2pry' }});
console.log('Document Plan:', plan ? JSON.stringify(plan, null, 2) : 'null');

await prisma.$disconnect();
