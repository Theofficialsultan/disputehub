/**
 * POST /api/disputes/[id]/documents/generate
 * 
 * Generates legal documents for a case based on the extracted strategy.
 * This is called automatically when the AI has gathered enough information.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { generateAIContent } from "@/lib/ai/document-content";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const caseId = params.id;
    console.log(`[Generate Docs] Starting generation for case ${caseId}`);

    // 1. Get the case and verify ownership
    const dispute = await prisma.dispute.findFirst({
      where: { id: caseId, userId },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // 2. Check if documents already exist - delete them to regenerate
    const existingDocs = await prisma.generatedDocument.findMany({
      where: { caseId },
    });
    
    if (existingDocs.length > 0) {
      console.log(`[Generate Docs] Deleting ${existingDocs.length} existing documents to regenerate`);
      await prisma.generatedDocument.deleteMany({
        where: { caseId },
      });
    }

    // 3. Get the case strategy
    const strategy = await prisma.caseStrategy.findFirst({
      where: { caseId },
    });

    if (!strategy) {
      return NextResponse.json(
        { error: "No case strategy found. Continue chatting with the AI." },
        { status: 400 }
      );
    }

    console.log(`[Generate Docs] Strategy found:`, {
      disputeType: strategy.disputeType,
      keyFacts: strategy.keyFacts?.length || 0,
      outcome: strategy.desiredOutcome?.substring(0, 50),
    });

    // 4. Get evidence items
    const evidence = await prisma.evidenceItem.findMany({
      where: { caseId },
      orderBy: { evidenceIndex: "asc" },
    });

    console.log(`[Generate Docs] Found ${evidence.length} evidence items`);

    // 5. Determine what documents to generate based on dispute type
    const documentTypes = getDocumentTypesForDispute(strategy.disputeType || "general");
    console.log(`[Generate Docs] Will generate: ${documentTypes.join(", ")}`);

    // 6. Generate each document
    const generatedDocs = [];
    for (let i = 0; i < documentTypes.length; i++) {
      const docType = documentTypes[i];
      console.log(`[Generate Docs] Generating ${docType} (${i + 1}/${documentTypes.length})...`);

      try {
        // Generate AI content for this document
        const content = await generateAIContent({
          documentType: docType,
          strategy,
          evidence,
          caseTitle: dispute.title,
        });

        if (!content || content.trim().length < 100) {
          console.error(`[Generate Docs] ❌ Content too short for ${docType}: ${content?.length || 0} chars`);
          throw new Error(`Generated content for ${docType} is too short`);
        }

        console.log(`[Generate Docs] ✅ Generated ${content.length} chars for ${docType}`);

        // Save to database
        const doc = await prisma.generatedDocument.create({
          data: {
            caseId,
            type: docType,
            title: getDocumentTitle(docType),
            content,
            status: "COMPLETED",
          },
        });

        generatedDocs.push(doc);
        console.log(`[Generate Docs] ✅ Saved ${docType} to database`);
      } catch (error) {
        console.error(`[Generate Docs] ❌ Failed to generate ${docType}:`, error);
        
        // Save failed document
        await prisma.generatedDocument.create({
          data: {
            caseId,
            type: docType,
            title: getDocumentTitle(docType),
            content: "",
            status: "FAILED",
            lastError: error instanceof Error ? error.message : "Unknown error",
          },
        });
      }
    }

    console.log(`[Generate Docs] ✅ All done! Generated ${generatedDocs.length}/${documentTypes.length} documents`);

    return NextResponse.json({
      success: true,
      message: `Generated ${generatedDocs.length} documents`,
      documents: generatedDocs,
    });

  } catch (error) {
    console.error("[Generate Docs] ❌ Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate documents" },
      { status: 500 }
    );
  }
}

// Helper: Determine which documents to generate based on dispute type
function getDocumentTypesForDispute(disputeType: string): string[] {
  const baseDocuments = ["demand_letter", "case_summary"];
  
  const typeSpecificDocs: Record<string, string[]> = {
    employment: ["employment_claim", "evidence_list"],
    contract: ["breach_analysis", "remedy_calculation"],
    consumer: ["complaint_letter", "evidence_list"],
    property: ["property_dispute_notice", "evidence_list"],
    debt: ["debt_validation_letter", "dispute_letter"],
  };

  const specific = typeSpecificDocs[disputeType.toLowerCase()] || ["evidence_list"];
  return [...baseDocuments, ...specific];
}

// Helper: Get human-readable title for document type
function getDocumentTitle(type: string): string {
  const titles: Record<string, string> = {
    demand_letter: "Demand Letter",
    case_summary: "Case Summary",
    employment_claim: "Employment Claim Document",
    evidence_list: "Evidence List & Analysis",
    breach_analysis: "Contract Breach Analysis",
    remedy_calculation: "Damages & Remedy Calculation",
    complaint_letter: "Formal Complaint Letter",
    property_dispute_notice: "Property Dispute Notice",
    debt_validation_letter: "Debt Validation Request",
    dispute_letter: "Dispute Resolution Letter",
  };
  return titles[type] || type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}
