require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  
  const d = await prisma.dispute.findUnique({ 
    where: { id: 'cml7zvwl90000zro6ne8r2pry' },
    select: { caseSummary: true, summaryConfirmed: true, chatState: true }
  });
  console.log('Case Summary:', JSON.stringify(d, null, 2));

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
