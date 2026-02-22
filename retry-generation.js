require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  
  // Reset to CONFIRMING_SUMMARY state so user can re-confirm
  await prisma.dispute.update({
    where: { id: 'cml7zvwl90000zro6ne8r2pry' },
    data: {
      phase: 'GATHERING',
      chatState: 'CONFIRMING_SUMMARY',
      chatLocked: false,
      lockReason: null,
      summaryConfirmed: false,
      summaryConfirmedAt: null
    }
  });
  
  console.log('✅ Case reset to CONFIRMING_SUMMARY - user can confirm again!');

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
