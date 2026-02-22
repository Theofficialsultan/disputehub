import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const d = await prisma.dispute.findFirst({ 
  where: { id: 'cmlfk8y190001n6o6pvfhv4p3' }, 
  select: { id: true, caseSummary: true, summaryConfirmed: true, phase: true, chatState: true } 
});
console.log(JSON.stringify(d, null, 2));
await prisma.$disconnect();
