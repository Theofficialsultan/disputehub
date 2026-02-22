require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create adapter
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function resetCase() {
  const caseId = 'cml7zvwl90000zro6ne8r2pry';
  
  try {
    // Delete any existing document plan
    await prisma.documentPlan.deleteMany({ where: { caseId } });
    console.log('Deleted document plans');
    
    await prisma.generatedDocument.deleteMany({ where: { caseId } });
    console.log('Deleted generated documents');
    
    await prisma.caseEvent.deleteMany({ where: { caseId } });
    console.log('Deleted case events');
    
    // Reset the case to GATHERING phase
    await prisma.dispute.update({
      where: { id: caseId },
      data: {
        phase: 'GATHERING',
        chatState: 'GATHERING_FACTS',
        chatLocked: false,
        lockReason: null,
        summaryConfirmed: false,
        summaryConfirmedAt: null
      }
    });
    
    console.log('Case reset successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

resetCase();
