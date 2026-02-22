require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  
  const doc = await prisma.generatedDocument.findFirst({
    where: { 
      caseId: 'cml7zvwl90000zro6ne8r2pry',
      type: 'UK-LBA-GENERAL'
    },
    select: { content: true }
  });
  
  console.log(doc?.content || 'No document found');

  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
