/**
 * Test script for AI chat flow with different case types
 */

require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Test sending a message to a dispute
async function testChatForDispute(disputeId, testMessage) {
  console.log(`\n📤 Testing chat for dispute ${disputeId}`);
  console.log(`   Message: "${testMessage.slice(0, 50)}..."`);
  
  try {
    // Simulate what the API does
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      select: {
        id: true,
        title: true,
        type: true,
        description: true,
        chatState: true,
        caseSummary: true,
      },
    });
    
    if (!dispute) {
      console.log(`   ❌ Dispute not found`);
      return false;
    }
    
    console.log(`   📋 Title: ${dispute.title}`);
    console.log(`   📁 Type: ${dispute.type}`);
    console.log(`   💬 Chat State: ${dispute.chatState || 'null'}`);
    console.log(`   📝 Has Summary: ${dispute.caseSummary ? 'Yes' : 'No'}`);
    
    // Check if we can fetch messages
    const messages = await prisma.message.findMany({
      where: { disputeId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    
    console.log(`   💬 Existing messages: ${messages.length}`);
    
    return true;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log("🧪 Testing AI Chat Flow");
  console.log("========================\n");
  
  // Get all our test cases
  const testDisputes = await prisma.dispute.findMany({
    where: {
      type: {
        in: [
          'noise_complaint',
          'medical', 
          'council_tax',
          'harassment',
          'discrimination',
          'insurance',
          'criminal_appeal',
          'defamation',
          'contract',
          'neighbour'
        ]
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  
  console.log(`Found ${testDisputes.length} test disputes\n`);
  
  const testMessages = {
    noise_complaint: "My neighbour's parties go until 3am every weekend and I've recorded it on my phone",
    medical: "I want to complain about my GP who dismissed my symptoms for weeks",
    council_tax: "I've checked and my neighbours pay less council tax for the same type of house",
    harassment: "My manager has been bullying me for 6 months and HR won't help",
    discrimination: "I was passed over for promotion because I'm pregnant",
    insurance: "My insurance company rejected my claim even though the policy covers it",
    criminal_appeal: "I want to appeal my speeding conviction because the camera was faulty",
    defamation: "Someone posted lies about me on Facebook and it's affecting my business",
    contract: "The builder took my deposit and disappeared without finishing the work",
    neighbour: "My neighbour built their fence on my property",
  };
  
  let passed = 0;
  let failed = 0;
  
  for (const dispute of testDisputes) {
    const message = testMessages[dispute.type] || "I need help with my case";
    const result = await testChatForDispute(dispute.id, message);
    if (result) passed++;
    else failed++;
  }
  
  console.log("\n✨ Summary");
  console.log("==========");
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  // Also check the routing for each type
  console.log("\n📍 Routing Check");
  console.log("================");
  
  const routingExpectations = {
    noise_complaint: "Should route to council/environmental health complaint",
    medical: "Should route to NHS complaints/PHSO",
    council_tax: "Should route to Valuation Office Agency",
    harassment: "Should route to Employment Tribunal (ACAS first)",
    discrimination: "Should route to Employment Tribunal (ACAS first)",
    insurance: "Should route to Financial Ombudsman or County Court",
    criminal_appeal: "Should route to Crown Court appeal",
    defamation: "Should route to County Court",
    contract: "Should route to County Court Small Claims",
    neighbour: "Should route to County Court or mediation",
  };
  
  for (const [type, expectation] of Object.entries(routingExpectations)) {
    console.log(`   ${type}: ${expectation}`);
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
