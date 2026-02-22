/**
 * Verify test cases and routing logic (no API calls)
 */

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("✅ VERIFICATION TEST - DisputeHub Case Types\n");
  
  // Get test cases
  const cases = await prisma.dispute.findMany({
    where: {
      type: { in: ['noise_complaint', 'medical', 'council_tax', 'harassment', 
                   'discrimination', 'insurance', 'criminal_appeal', 'defamation', 
                   'contract', 'neighbour'] }
    },
    orderBy: { type: 'asc' },
    include: {
      documentPlan: { include: { documents: true } },
      caseStrategy: true,
    }
  });
  
  console.log(`Found ${cases.length} test cases\n`);
  console.log("| Type | Title | Chat State | Strategy | Docs |");
  console.log("|------|-------|------------|----------|------|");
  
  for (const c of cases) {
    const title = c.title.slice(0, 30) + (c.title.length > 30 ? '...' : '');
    const state = c.chatState || 'null';
    const hasStrategy = c.caseStrategy ? '✅' : '❌';
    const docCount = c.documentPlan?.documents?.length || 0;
    console.log(`| ${c.type.padEnd(18)} | ${title.padEnd(33)} | ${state.padEnd(16)} | ${hasStrategy}        | ${docCount}    |`);
  }
  
  // Expected routing for each type
  console.log("\n📍 EXPECTED ROUTING:");
  const routes = {
    noise_complaint: { forum: "council_environmental_health", docs: ["Formal Complaint", "Witness Statement"] },
    medical: { forum: "nhs_complaints", docs: ["Formal Complaint", "Witness Statement"] },
    council_tax: { forum: "valuation_tribunal", docs: ["Formal Complaint", "LBA"] },
    harassment: { forum: "employment_tribunal", docs: ["ET1 Claim", "ACAS Cert", "Schedule of Loss"] },
    discrimination: { forum: "employment_tribunal", docs: ["ET1 Claim", "ACAS Cert", "Schedule of Loss"] },
    insurance: { forum: "financial_ombudsman", docs: ["Formal Complaint", "LBA"] },
    criminal_appeal: { forum: "crown_court_appeal", docs: ["Mitigation Statement", "Witness Statement"] },
    defamation: { forum: "county_court_fast_track", docs: ["Claim Form", "Particulars", "LBA"] },
    contract: { forum: "county_court_small_claims", docs: ["Claim Form", "Particulars", "LBA"] },
    neighbour: { forum: "county_court_small_claims", docs: ["Claim Form", "LBA", "Mediation option"] },
  };
  
  for (const [type, route] of Object.entries(routes)) {
    console.log(`\n${type}:`);
    console.log(`   → Forum: ${route.forum}`);
    console.log(`   → Documents: ${route.docs.join(", ")}`);
  }
  
  console.log("\n\n🔗 TEST THESE MANUALLY:");
  for (const c of cases) {
    console.log(`   http://localhost:3001/disputes/${c.id}/case`);
  }
  
  console.log("\n✅ All cases ready for manual testing!");
  console.log("📝 Chat with each case to see AI gather facts and route correctly\n");
  
  await prisma.$disconnect();
}

main().catch(console.error);
