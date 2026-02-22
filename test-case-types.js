/**
 * Test script for different case types
 * Tests: criminal appeal, neighbour dispute, medical complaint, etc.
 */

// Load env FIRST before importing PrismaClient
require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create adapter
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

// Test cases with different scenarios (NOT just money claims)
const testCases = [
  {
    name: "Noise Complaint",
    type: "noise_complaint",
    title: "Constant late night parties from neighbour",
    description: `My neighbour at 42 Oak Street has been having loud parties every weekend for the past 3 months. 
The noise regularly continues past 2am on Friday and Saturday nights, featuring loud music, shouting, and sometimes fighting in the garden.
I have spoken to them twice politely but they were dismissive. I have recordings from 5 different occasions showing noise levels that exceeded 85 decibels at 1am.
The council environmental health team has been notified but progress has been slow.
I want them to stop the antisocial behaviour and respect quiet hours.`,
  },
  {
    name: "Medical Complaint",
    type: "medical",
    title: "GP misdiagnosed serious condition",
    description: `I visited my GP Dr. Smith at Riverside Medical Centre on 15th December 2025 with severe stomach pain and blood in my stool.
The doctor dismissed my concerns, said it was "probably just stress" and prescribed antacids without ordering any tests.
Three weeks later, I collapsed and was rushed to A&E where I was diagnosed with a perforated ulcer requiring emergency surgery.
The hospital consultant said if the condition had been caught earlier, surgery could have been avoided.
I have been off work for 6 weeks recovering. I want a formal investigation into the misdiagnosis and an apology.`,
  },
  {
    name: "Council Tax Dispute",
    type: "council_tax",
    title: "Incorrectly banded property for council tax",
    description: `My property at 15 Elm Road has been assessed as Band E for council tax since I purchased it in 2020.
After researching neighbouring properties, I discovered that 13 Elm Road and 17 Elm Road (identical semi-detached houses built at the same time) are both Band D.
I have photographs showing all three properties are structurally identical with the same floor area.
I submitted a challenge to the Valuation Office Agency 6 months ago but have received no response.
I am seeking a rebanding to Band D and a refund of the overpaid council tax (approximately £3,600 over 4 years).`,
  },
  {
    name: "Harassment at Work",
    type: "harassment",
    title: "Bullying and harassment by line manager",
    description: `I have worked at ABC Company Ltd for 5 years. Over the past 8 months, my new line manager Sarah Jones has subjected me to persistent bullying.
This includes: constant criticism in front of colleagues, exclusion from team meetings, unrealistic deadlines set only for me, and mocking my accent.
I raised a grievance with HR on 1st November 2025 which was dismissed after a superficial investigation that only interviewed my manager.
Two other colleagues have witnessed the behaviour and are willing to provide statements.
I have suffered anxiety and depression as a result, documented by my GP. I want the company to properly investigate and take action against the manager.`,
  },
  {
    name: "Discrimination Claim",
    type: "discrimination",
    title: "Denied promotion due to pregnancy",
    description: `I am a Senior Analyst at XYZ Corp and announced my pregnancy to my employer on 1st September 2025.
On 15th October, I applied for a Team Lead position I was highly qualified for - I have 7 years experience and excellent performance reviews.
The position was given to a male colleague with only 2 years experience and lower performance ratings.
When I asked for feedback, my manager said "we need someone who can commit long-term" and mentioned my "upcoming circumstances."
I have email evidence of this conversation and my superior qualifications compared to the successful candidate.
I believe this is pregnancy discrimination and want the company to reconsider the decision.`,
  },
  {
    name: "Insurance Dispute",
    type: "insurance",
    title: "Home insurance claim unfairly rejected",
    description: `My home was damaged by a burst pipe on 20th December 2025 while I was away for Christmas.
The damage includes ruined flooring in the kitchen and living room, water damage to walls, and destroyed furniture - estimated at £12,000.
I submitted a claim to SafeGuard Insurance (Policy #HI-789456) on 2nd January 2026.
They rejected my claim saying I "failed to maintain the property" because I was away for 5 days, citing a policy clause about "unoccupied properties."
However, the policy defines unoccupied as 30+ consecutive days, and I was only away for 5 days.
I have photos of the damage, plumber's report confirming the pipe failure was due to age not neglect, and my travel dates.`,
  },
  {
    name: "Criminal Appeal",
    type: "criminal_appeal",
    title: "Appealing speeding conviction - faulty camera",
    description: `I was convicted of speeding on 5th November 2025 at Thames Valley Magistrates Court for allegedly doing 45mph in a 30mph zone on London Road.
I am appealing because:
1. The speed camera (serial #SC-2847) had failed its calibration test 2 weeks before my alleged offence, according to FOI data I obtained.
2. My dashcam footage shows my speedometer reading 32mph at the exact location and time.
3. The NIP (Notice of Intended Prosecution) was sent to my old address and I only received it after the 14-day deadline.
I was fined £300 and received 3 penalty points. I want the conviction overturned.`,
  },
  {
    name: "Defamation",
    type: "defamation",
    title: "False accusations posted on social media",
    description: `John Thompson, owner of Thompson Plumbing Services, posted on the local Facebook community group (12,000 members) on 10th January 2026 claiming I "stole equipment from his van" and am a "known thief."
This is completely false. I have never met this person or been to his property.
The post received 234 comments and was shared 45 times before it was removed.
Several people have since refused to do business with me citing "what they saw on Facebook."
I have screenshots of the original post, the comments, and messages from customers cancelling orders.
I want a public apology and removal of all defamatory content.`,
  },
  {
    name: "Contract Dispute",
    type: "contract",
    title: "Builder abandoned renovation halfway through",
    description: `I hired Dave's Building Services Ltd to renovate my kitchen and bathroom for £15,000. I paid £7,500 upfront as agreed in our written contract dated 1st October 2025.
Work started on 15th October. By 30th November, only the demolition was complete (about 20% of the work).
On 1st December, Dave stopped answering calls and texts. His company website is now down.
I have the signed contract, bank transfer receipts, photos of the incomplete work, and all text message communications.
I need to hire another builder to complete the work, which has been quoted at £14,000.
I want to recover my £7,500 deposit plus the additional costs.`,
  },
  {
    name: "Neighbour Fence Dispute",
    type: "neighbour",
    title: "Neighbour built fence on my property",
    description: `My neighbour at 24 Garden Lane erected a 6-foot fence on 5th December 2025 that encroaches approximately 8 inches onto my property along the entire 40-foot boundary.
This has effectively reduced my garden by about 27 square feet.
I have the original boundary survey from when I purchased my property in 2019, which clearly shows the boundary line.
I asked my neighbour to move the fence but they refused, claiming "it's always been there" (it hasn't - they just moved in).
I want the fence moved to the correct boundary position.`,
  }
];

async function findTestUser() {
  // Find the test user
  const user = await prisma.user.findFirst({
    where: { email: "officialsaed@outlook.com" },
  });
  return user;
}

async function createTestCase(userId, testCase) {
  console.log(`\n📋 Creating: ${testCase.name}`);
  
  try {
    const dispute = await prisma.dispute.create({
      data: {
        userId,
        title: testCase.title,
        description: testCase.description,
        type: testCase.type,
        status: "DRAFT",
        mode: "GUIDED",
        lifecycleStatus: "DRAFT",
      },
    });
    
    console.log(`   ✅ Created dispute: ${dispute.id}`);
    return dispute;
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log("🧪 Testing Different Case Types");
  console.log("================================\n");
  
  const user = await findTestUser();
  if (!user) {
    console.error("❌ Test user not found!");
    process.exit(1);
  }
  
  console.log(`👤 Found user: ${user.email}`);
  
  // Create test cases
  const createdCases = [];
  for (const testCase of testCases) {
    const dispute = await createTestCase(user.id, testCase);
    if (dispute) {
      createdCases.push({ ...testCase, disputeId: dispute.id });
    }
  }
  
  console.log("\n✨ Summary");
  console.log("==========");
  console.log(`Created ${createdCases.length}/${testCases.length} test cases`);
  
  console.log("\n📝 Test Cases Created:");
  for (const c of createdCases) {
    console.log(`   - ${c.name} (${c.type}): /disputes/${c.disputeId}/case`);
  }
  
  console.log("\n🔗 Test these URLs:");
  for (const c of createdCases) {
    console.log(`   http://localhost:3001/disputes/${c.disputeId}/case`);
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
