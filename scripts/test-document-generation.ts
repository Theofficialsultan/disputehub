#!/usr/bin/env npx tsx
/**
 * DOCUMENT GENERATION TEST SUITE
 * 
 * Tests document generation quality across all dispute types.
 * Run: npx tsx scripts/test-document-generation.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ============================================================================
// TEST CASE DEFINITIONS
// ============================================================================

interface TestCase {
  name: string;
  type: string;
  title: string;
  caseSummary: {
    disputeType: string;
    parties: {
      counterparty: string;
      counterpartyType: string;
    };
    financialAmount?: number;
    timeline: {
      issueDate: string;
      keyEvents: string[];
    };
    keyFacts: string[];
    desiredOutcome: string;
    chosenForum?: string;
  };
  expectedDocuments: string[];
}

const TEST_CASES: TestCase[] = [
  // ========================
  // UNPAID WAGES - EMPLOYEE
  // ========================
  {
    name: "Unpaid Wages - Restaurant Worker",
    type: "UNPAID_WAGES",
    title: "Unpaid wages claim against Bella Italia Restaurant",
    caseSummary: {
      disputeType: "UNPAID_WAGES",
      parties: {
        counterparty: "Bella Italia Restaurant Ltd",
        counterpartyType: "EMPLOYER"
      },
      financialAmount: 2850,
      timeline: {
        issueDate: "2025-12-01",
        keyEvents: [
          "Started work as waiter on 1st June 2025",
          "Worked regular 40-hour weeks",
          "November and December wages not paid",
          "Employer claims cash flow problems",
          "Resigned on 15th January 2026"
        ]
      },
      keyFacts: [
        "I worked as a waiter at Bella Italia Restaurant",
        "My contract stated £12.50 per hour for 40 hours per week",
        "I was not paid for November 2025 (£2,000 gross)",
        "I was not paid for December 2025 partial (£850 gross)",
        "I have payslips showing previous payments",
        "I have my employment contract",
        "I resigned due to non-payment"
      ],
      desiredOutcome: "Full payment of £2,850 owed wages plus interest"
    },
    expectedDocuments: ["UK-LBA-GENERAL", "UK-SCHEDULE-OF-DAMAGES", "UK-EVIDENCE-BUNDLE-INDEX"]
  },

  // ========================
  // UNFAIR DISMISSAL
  // ========================
  {
    name: "Unfair Dismissal - Office Manager",
    type: "UNFAIR_DISMISSAL",
    title: "Unfair dismissal claim against TechCorp Solutions",
    caseSummary: {
      disputeType: "UNFAIR_DISMISSAL",
      parties: {
        counterparty: "TechCorp Solutions Ltd",
        counterpartyType: "EMPLOYER"
      },
      financialAmount: 15000,
      timeline: {
        issueDate: "2026-01-10",
        keyEvents: [
          "Employed since March 2022 as Office Manager",
          "Received positive performance reviews",
          "New manager started October 2025",
          "Dismissed on 10th January 2026",
          "Told reason was 'restructuring'",
          "Role was filled by cheaper hire 2 weeks later"
        ]
      },
      keyFacts: [
        "I was employed as Office Manager for nearly 4 years",
        "I received 'exceeds expectations' in my last 3 reviews",
        "I was dismissed and told it was due to restructuring",
        "Two weeks after my dismissal, my role was advertised",
        "A new person was hired at £10,000 less than my salary",
        "I was not offered redeployment or consultation",
        "I have copies of my performance reviews",
        "I have the dismissal letter",
        "I have the job advert for my old role"
      ],
      desiredOutcome: "Compensation for unfair dismissal, estimated £15,000"
    },
    expectedDocuments: ["UK-ET1-EMPLOYMENT-TRIBUNAL-2024", "UK-SCHEDULE-OF-DAMAGES", "UK-EVIDENCE-BUNDLE-INDEX"]
  },

  // ========================
  // CONSUMER - FAULTY GOODS
  // ========================
  {
    name: "Faulty Laptop - Consumer Claim",
    type: "CONSUMER_GOODS",
    title: "Claim against Curry's for faulty laptop",
    caseSummary: {
      disputeType: "CONSUMER_GOODS",
      parties: {
        counterparty: "Currys PC World",
        counterpartyType: "RETAILER"
      },
      financialAmount: 1299,
      timeline: {
        issueDate: "2025-11-15",
        keyEvents: [
          "Bought Dell XPS 15 laptop on 15th November 2025",
          "Screen started flickering after 3 weeks",
          "Reported to store on 8th December",
          "Store said it's software issue not covered",
          "Laptop now won't turn on at all",
          "Requested refund refused"
        ]
      },
      keyFacts: [
        "I purchased a Dell XPS 15 laptop for £1,299 on 15th November 2025",
        "The laptop developed screen flickering within 3 weeks",
        "I returned it to Currys on 8th December 2025",
        "They claimed it was a software issue and refused repair",
        "The laptop completely stopped working on 20th December",
        "I have the receipt and bank statement",
        "I have video of the flickering screen",
        "I have the email exchange with Currys refusing help"
      ],
      desiredOutcome: "Full refund of £1,299 under Consumer Rights Act 2015"
    },
    expectedDocuments: ["UK-LBA-GENERAL", "UK-EVIDENCE-BUNDLE-INDEX"]
  },

  // ========================
  // LANDLORD/TENANT - DEPOSIT
  // ========================
  {
    name: "Deposit Dispute - Unfair Deductions",
    type: "TENANCY_DEPOSIT",
    title: "Deposit dispute against landlord Mr Jenkins",
    caseSummary: {
      disputeType: "TENANCY_DEPOSIT",
      parties: {
        counterparty: "Mr David Jenkins",
        counterpartyType: "LANDLORD"
      },
      financialAmount: 1400,
      timeline: {
        issueDate: "2026-01-05",
        keyEvents: [
          "Tenancy started 1st February 2024",
          "Paid £1,400 deposit",
          "Tenancy ended 31st December 2025",
          "Left property in good condition",
          "Landlord claims £1,200 for 'damages'",
          "Damages were pre-existing wear and tear"
        ]
      },
      keyFacts: [
        "My deposit was £1,400 paid at start of tenancy",
        "I left the property clean and in good condition",
        "The landlord is claiming £1,200 for carpet stains and wall marks",
        "These were normal wear and tear over 2 years",
        "I have check-in photos showing pre-existing marks",
        "I have check-out photos showing same condition",
        "The deposit was protected with DPS",
        "I have not agreed to any deductions"
      ],
      desiredOutcome: "Return of full £1,400 deposit"
    },
    expectedDocuments: ["UK-LBA-GENERAL", "UK-EVIDENCE-BUNDLE-INDEX"]
  },

  // ========================
  // SMALL CLAIMS - SERVICES
  // ========================
  {
    name: "Poor Quality Building Work",
    type: "SERVICES_DISPUTE",
    title: "Claim against ABC Builders for poor workmanship",
    caseSummary: {
      disputeType: "SERVICES_DISPUTE",
      parties: {
        counterparty: "ABC Builders Ltd",
        counterpartyType: "TRADER"
      },
      financialAmount: 4500,
      timeline: {
        issueDate: "2025-10-01",
        keyEvents: [
          "Hired for kitchen extension October 2025",
          "Agreed price £15,000",
          "Work completed November 2025",
          "Discovered multiple defects",
          "Walls not straight, plumbing leaks",
          "Builder refuses to fix"
        ]
      },
      keyFacts: [
        "I hired ABC Builders for a kitchen extension",
        "We agreed a fixed price of £15,000",
        "I paid £15,000 in full upon completion",
        "After completion I discovered serious defects",
        "The walls are not plumb (up to 15mm deviation)",
        "The plumbing leaks under the sink",
        "The electrics failed inspection by Building Control",
        "I have a surveyor's report documenting defects",
        "The cost to remedy is quoted at £4,500",
        "ABC Builders have refused to return and fix"
      ],
      desiredOutcome: "£4,500 to cover remedial work costs"
    },
    expectedDocuments: ["UK-LBA-GENERAL", "UK-N1-COUNTY-COURT-CLAIM", "UK-SCHEDULE-OF-DAMAGES", "UK-EVIDENCE-BUNDLE-INDEX"]
  },

  // ========================
  // INVOICE DISPUTE - FREELANCER
  // ========================
  {
    name: "Unpaid Freelance Invoice",
    type: "UNPAID_INVOICE",
    title: "Unpaid invoice against Marketing Pro Agency",
    caseSummary: {
      disputeType: "UNPAID_INVOICE",
      parties: {
        counterparty: "Marketing Pro Agency Ltd",
        counterpartyType: "CLIENT"
      },
      financialAmount: 3200,
      timeline: {
        issueDate: "2025-11-01",
        keyEvents: [
          "Engaged as freelance designer November 2025",
          "Completed website redesign project",
          "Delivered all files on 25th November",
          "Client approved work",
          "Invoice sent 1st December, due 31st December",
          "No payment received despite reminders"
        ]
      },
      keyFacts: [
        "I am a self-employed freelance web designer",
        "I was engaged by Marketing Pro Agency to redesign their website",
        "We agreed a fee of £3,200 for the project",
        "I completed and delivered all work on 25th November 2025",
        "The client confirmed they were happy with the work",
        "I sent invoice #INV-2025-047 on 1st December",
        "Payment terms were 30 days",
        "I sent reminder emails on 2nd and 15th January",
        "No payment has been received",
        "I have the signed contract and email approvals"
      ],
      desiredOutcome: "Payment of £3,200 plus statutory interest"
    },
    expectedDocuments: ["UK-LBA-GENERAL", "UK-N1-COUNTY-COURT-CLAIM", "UK-SCHEDULE-OF-DAMAGES", "UK-EVIDENCE-BUNDLE-INDEX"]
  },

  // ========================
  // DISCRIMINATION
  // ========================
  {
    name: "Pregnancy Discrimination",
    type: "DISCRIMINATION",
    title: "Pregnancy discrimination claim against RetailMax",
    caseSummary: {
      disputeType: "DISCRIMINATION",
      parties: {
        counterparty: "RetailMax Stores Ltd",
        counterpartyType: "EMPLOYER"
      },
      financialAmount: 25000,
      timeline: {
        issueDate: "2026-01-15",
        keyEvents: [
          "Employed as store manager since 2021",
          "Announced pregnancy in September 2025",
          "Immediately removed from management meetings",
          "Passed over for promotion given to male colleague",
          "Subjected to comments about 'commitment'",
          "Demoted to assistant manager in December"
        ]
      },
      keyFacts: [
        "I have been store manager at RetailMax since June 2021",
        "I announced my pregnancy on 15th September 2025",
        "After announcing, I was excluded from management meetings",
        "My regional manager said 'we need someone fully committed'",
        "A promotion I was promised went to a male colleague",
        "I was demoted to assistant manager on 1st December 2025",
        "The reason given was 'restructuring' but no one else was affected",
        "I have emails showing the promised promotion",
        "I have a witness to the 'commitment' comment"
      ],
      desiredOutcome: "Compensation for pregnancy discrimination, reinstatement to manager role"
    },
    expectedDocuments: ["UK-ET1-EMPLOYMENT-TRIBUNAL-2024", "UK-SCHEDULE-OF-DAMAGES", "UK-EVIDENCE-BUNDLE-INDEX"]
  }
];

// ============================================================================
// TEST RUNNER
// ============================================================================

async function runTests() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("DISPUTEHUB DOCUMENT GENERATION TEST SUITE");
  console.log(`Date: ${new Date().toISOString()}`);
  console.log("═══════════════════════════════════════════════════════════════\n");

  // Get or create test user
  let testUser = await prisma.user.findFirst({
    where: { email: "test@disputehub.ai" }
  });

  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        id: "test-user-document-gen",
        clerkId: "test_clerk_id_document_gen",
        email: "test@disputehub.ai",
        firstName: "Test",
        lastName: "User",
        addressLine1: "123 Test Street",
        city: "London",
        postcode: "SW1A 1AA",
        phone: "07700900000"
      }
    });
    console.log("✅ Created test user\n");
  }

  const results: {
    name: string;
    status: "PASS" | "FAIL" | "PARTIAL";
    documentsGenerated: number;
    documentsFailed: number;
    duration: number;
    errors: string[];
  }[] = [];

  for (const testCase of TEST_CASES) {
    console.log(`\n───────────────────────────────────────────────────────────────`);
    console.log(`TEST: ${testCase.name}`);
    console.log(`Type: ${testCase.type}`);
    console.log(`───────────────────────────────────────────────────────────────`);

    const startTime = Date.now();
    const errors: string[] = [];

    try {
      // Create dispute
      const dispute = await prisma.dispute.create({
        data: {
          userId: testUser.id,
          title: testCase.title,
          description: testCase.title,
          type: testCase.type,
          status: "DRAFT",
          mode: "GUIDED",
          phase: "GATHERING",
          caseSummary: testCase.caseSummary as any,
          summaryConfirmed: true,
          summaryConfirmedAt: new Date()
        }
      });

      console.log(`📁 Created dispute: ${dispute.id}`);

      // Call document generation API
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      
      console.log(`🔄 Calling document generation API...`);
      
      const response = await fetch(`${baseUrl}/api/disputes/${dispute.id}/documents/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // In real test, you'd need auth headers
        }
      });

      const result = await response.json();

      if (!response.ok) {
        errors.push(`API Error: ${result.error || response.statusText}`);
        console.log(`❌ Generation failed: ${result.error}`);
      } else {
        console.log(`✅ Generated ${result.stats?.success || 0} documents`);
        
        if (result.failed?.length > 0) {
          for (const fail of result.failed) {
            errors.push(`${fail.formId}: ${fail.error}`);
            console.log(`   ⚠️  Failed: ${fail.formId}`);
          }
        }

        // Fetch and validate documents
        const docs = await prisma.generatedDocument.findMany({
          where: { caseId: dispute.id },
          orderBy: { order: "asc" }
        });

        console.log(`\n📄 Document Quality Check:`);
        
        for (const doc of docs) {
          const contentLength = doc.content?.length || 0;
          const hasPlaceholders = doc.content?.includes("[User to complete]") || 
                                   doc.content?.includes("[YOUR NAME]") ||
                                   doc.content?.includes("_______");
          
          const status = doc.status === "COMPLETED" ? "✅" : "❌";
          console.log(`   ${status} ${doc.type}: ${contentLength.toLocaleString()} chars`);
          
          if (doc.validationWarnings && (doc.validationWarnings as string[]).length > 0) {
            console.log(`      ⚠️  Warnings: ${(doc.validationWarnings as string[]).join(", ")}`);
          }
          
          // Quality checks
          if (contentLength < 500 && doc.status === "COMPLETED") {
            errors.push(`${doc.type}: Content too short (${contentLength} chars)`);
          }
          
          if (!hasPlaceholders && doc.content?.includes("undefined")) {
            errors.push(`${doc.type}: Contains 'undefined' values`);
          }
        }

        results.push({
          name: testCase.name,
          status: errors.length === 0 ? "PASS" : 
                  result.stats?.success > 0 ? "PARTIAL" : "FAIL",
          documentsGenerated: result.stats?.success || 0,
          documentsFailed: result.stats?.failed || 0,
          duration: Date.now() - startTime,
          errors
        });
      }

      // Cleanup - delete test dispute
      await prisma.generatedDocument.deleteMany({ where: { caseId: dispute.id } });
      await prisma.documentPlan.deleteMany({ where: { caseId: dispute.id } });
      await prisma.caseEvent.deleteMany({ where: { caseId: dispute.id } });
      await prisma.dispute.delete({ where: { id: dispute.id } });
      
      console.log(`🧹 Cleaned up test data`);

    } catch (error) {
      const duration = Date.now() - startTime;
      errors.push(`Exception: ${error instanceof Error ? error.message : String(error)}`);
      
      results.push({
        name: testCase.name,
        status: "FAIL",
        documentsGenerated: 0,
        documentsFailed: 0,
        duration,
        errors
      });
      
      console.log(`❌ Test failed with exception: ${error}`);
    }
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================

  console.log("\n\n═══════════════════════════════════════════════════════════════");
  console.log("TEST SUMMARY");
  console.log("═══════════════════════════════════════════════════════════════\n");

  const passed = results.filter(r => r.status === "PASS").length;
  const partial = results.filter(r => r.status === "PARTIAL").length;
  const failed = results.filter(r => r.status === "FAIL").length;

  console.log(`✅ Passed:  ${passed}/${results.length}`);
  console.log(`⚠️  Partial: ${partial}/${results.length}`);
  console.log(`❌ Failed:  ${failed}/${results.length}`);
  console.log("");

  for (const result of results) {
    const icon = result.status === "PASS" ? "✅" : 
                 result.status === "PARTIAL" ? "⚠️" : "❌";
    console.log(`${icon} ${result.name}`);
    console.log(`   Documents: ${result.documentsGenerated} success, ${result.documentsFailed} failed`);
    console.log(`   Duration: ${(result.duration / 1000).toFixed(2)}s`);
    
    if (result.errors.length > 0) {
      console.log(`   Errors:`);
      for (const err of result.errors) {
        console.log(`     - ${err}`);
      }
    }
    console.log("");
  }

  // Exit with error code if any tests failed
  if (failed > 0) {
    process.exit(1);
  }
}

// ============================================================================
// QUICK SINGLE DOCUMENT TEST
// ============================================================================

async function testSingleDocument(type: string) {
  const testCase = TEST_CASES.find(tc => tc.type === type);
  
  if (!testCase) {
    console.log(`❌ Unknown test case type: ${type}`);
    console.log(`Available: ${TEST_CASES.map(tc => tc.type).join(", ")}`);
    return;
  }

  console.log(`\nRunning single test: ${testCase.name}\n`);
  
  // Run just this one test
  const originalCases = [...TEST_CASES];
  TEST_CASES.length = 0;
  TEST_CASES.push(testCase);
  
  await runTests();
  
  TEST_CASES.length = 0;
  TEST_CASES.push(...originalCases);
}

// ============================================================================
// MAIN
// ============================================================================

const args = process.argv.slice(2);

if (args[0] === "--single" && args[1]) {
  testSingleDocument(args[1]).then(() => prisma.$disconnect());
} else if (args[0] === "--list") {
  console.log("Available test cases:");
  for (const tc of TEST_CASES) {
    console.log(`  - ${tc.type}: ${tc.name}`);
  }
} else {
  runTests()
    .then(() => prisma.$disconnect())
    .catch((err) => {
      console.error(err);
      prisma.$disconnect();
      process.exit(1);
    });
}
