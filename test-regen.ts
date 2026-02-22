/**
 * Direct document regeneration test - bypasses API auth
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { generateFormSpecificDocument } from "./src/lib/ai/system3-generation";
import type { RoutingDecision } from "./src/lib/legal/routing-types";

async function testRegeneration() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const caseId = "cmlcqr4pm0000s9o64n5cxalp";
    
    // Get case with all related data
    const dispute = await prisma.dispute.findUnique({
      where: { id: caseId },
      include: {
        caseStrategy: true,
        documentPlan: true,
        evidenceItems: true,
      },
    });

    if (!dispute) {
      console.log("❌ Case not found");
      return;
    }

    console.log(`\n📋 Case: ${dispute.title || "(no title)"}`);
    console.log(`   Phase: ${dispute.phase}`);
    
    if (!dispute.documentPlan) {
      console.log("❌ No document plan");
      return;
    }

    // Build routing decision from document plan
    const routingDecision: RoutingDecision = {
      status: dispute.documentPlan.routingStatus as any || "APPROVED",
      confidence: dispute.documentPlan.routingConfidence || 0.8,
      jurisdiction: dispute.documentPlan.jurisdiction as any || "england_wales",
      relationship: dispute.documentPlan.legalRelationship as any,
      counterparty: dispute.documentPlan.counterparty as any,
      domain: dispute.documentPlan.domain as any,
      forum: dispute.documentPlan.forum as any || "county_court",
      forumReasoning: dispute.documentPlan.forumReasoning || "",
      allowedDocs: dispute.documentPlan.allowedDocuments as any[] || [],
      blockedDocs: [],
      prerequisites: [],
      prerequisitesMet: true,
      reason: "",
      userMessage: "",
      classifiedAt: new Date(),
      classifiedBy: "claude-opus-4",
    };

    // Build strategy
    const strategy = {
      disputeType: dispute.caseStrategy?.disputeType || "civil",
      keyFacts: Array.isArray(dispute.caseStrategy?.keyFacts) 
        ? dispute.caseStrategy.keyFacts 
        : [],
      evidenceMentioned: [],
      desiredOutcome: dispute.caseStrategy?.desiredOutcome || "",
    };

    console.log(`\n🔧 Testing N1 generation...`);
    console.log(`   Forum: ${routingDecision.forum}`);
    console.log(`   Allowed docs: ${routingDecision.allowedDocs.join(", ")}`);

    // Test N1 specifically
    const formId = "UK-N1-COUNTY-COURT-CLAIM";
    
    console.log(`\n⚡ Generating ${formId}...`);
    
    const result = await generateFormSpecificDocument(
      formId,
      routingDecision,
      strategy as any,
      dispute.evidenceItems,
      dispute.title || "Test Case"
    );

    if (typeof result === "string") {
      console.log(`\n✅ SUCCESS! Generated ${result.length} characters`);
      console.log(`\n--- PREVIEW (first 500 chars) ---`);
      console.log(result.substring(0, 500));
      console.log(`\n--- END PREVIEW ---`);
    } else {
      console.log(`\n✅ Generated PDF: ${result.filename}`);
    }

  } catch (error: any) {
    console.error(`\n❌ ERROR: ${error.message}`);
    console.error(error.stack);
  } finally {
    await pool.end();
    await prisma.$disconnect();
  }
}

testRegeneration();
