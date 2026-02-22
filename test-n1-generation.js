const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testGeneration() {
  // Find a case with documents
  const dispute = await prisma.dispute.findFirst({
    where: { 
      phase: { in: ['COMPLETED', 'DOCUMENTS_READY', 'GENERATING'] }
    },
    include: {
      documentPlan: {
        include: {
          documents: true
        }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  if (!dispute) {
    console.log('❌ No suitable case found');
    return;
  }

  console.log(`\n📋 Case: ${dispute.title}`);
  console.log(`   Phase: ${dispute.phase}`);
  console.log(`   ID: ${dispute.id}`);
  
  if (dispute.documentPlan) {
    console.log(`\n📄 Document Plan:`);
    console.log(`   Allowed Docs: ${JSON.stringify(dispute.documentPlan.allowedDocuments)}`);
    console.log(`   Forum: ${dispute.documentPlan.forum}`);
    
    if (dispute.documentPlan.documents.length > 0) {
      console.log(`\n📑 Generated Documents (${dispute.documentPlan.documents.length}):`);
      for (const doc of dispute.documentPlan.documents) {
        const status = doc.content ? '✅' : '❌';
        const size = doc.content ? `${(doc.content.length / 1024).toFixed(1)}KB` : 'empty';
        console.log(`   ${status} ${doc.documentType} - ${doc.title} (${size})`);
      }
    } else {
      console.log('\n⚠️  No documents generated yet');
    }
  }
}

testGeneration()
  .then(() => prisma.$disconnect())
  .catch(e => { console.error(e); prisma.$disconnect(); });
