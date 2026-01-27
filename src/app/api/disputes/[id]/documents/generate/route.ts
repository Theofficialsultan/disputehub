/**
 * POST /api/disputes/[id]/documents/generate
 * 
 * Production-ready document generation with:
 * - DocumentPlan creation with complexity scoring
 * - Proper error handling and retry logic
 * - Timeline event creation for audit trail
 * - Batch generation with progress tracking
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { generateAIContent } from "@/lib/ai/document-content";
import { calculateComplexity } from "@/lib/documents/complexity";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  const caseId = params.id;

  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`[Generate Docs] Starting for case ${caseId}`);

    // 1. Verify case ownership
    const dispute = await prisma.dispute.findFirst({
      where: { id: caseId, userId },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // 2. Get strategy and evidence
    const strategy = await prisma.caseStrategy.findFirst({
      where: { caseId },
    });

    if (!strategy) {
      return NextResponse.json(
        { error: "No case strategy found. Continue chatting with the AI." },
        { status: 400 }
      );
    }

    const evidence = await prisma.evidenceItem.findMany({
      where: { caseId },
      orderBy: { evidenceIndex: "asc" },
    });

    console.log(`[Generate Docs] Strategy: ${strategy.keyFacts?.length || 0} facts, Evidence: ${evidence.length} items`);

    // 3. Calculate complexity score
    const complexityAnalysis = calculateComplexity(strategy, evidence.length);
    console.log(`[Generate Docs] Complexity: ${complexityAnalysis.level} (${complexityAnalysis.score}/100)`);

    // 4. Create or update DocumentPlan
    const documentPlan = await prisma.documentPlan.upsert({
      where: { caseId },
      create: {
        caseId,
        complexity: complexityAnalysis.level,
        complexityScore: complexityAnalysis.score,
        complexityBreakdown: complexityAnalysis.breakdown as any,
        documentType: complexityAnalysis.documentStructure,
      },
      update: {
        complexity: complexityAnalysis.level,
        complexityScore: complexityAnalysis.score,
        complexityBreakdown: complexityAnalysis.breakdown as any,
        documentType: complexityAnalysis.documentStructure,
      },
    });

    console.log(`[Generate Docs] DocumentPlan created/updated: ${documentPlan.id}`);

    // 5. Delete old documents to regenerate
    const existingDocs = await prisma.generatedDocument.deleteMany({
      where: { planId: documentPlan.id },
    });

    if (existingDocs.count > 0) {
      console.log(`[Generate Docs] Deleted ${existingDocs.count} existing documents`);
    }

    // 6. Generate each document
    const documentsToGenerate = complexityAnalysis.recommendedDocuments;
    console.log(`[Generate Docs] Will generate: ${documentsToGenerate.join(", ")}`);

    const generatedDocs = [];
    const failedDocs = [];

    for (let i = 0; i < documentsToGenerate.length; i++) {
      const docType = documentsToGenerate[i];
      console.log(`[Generate Docs] ${i + 1}/${documentsToGenerate.length}: ${docType}...`);

      try {
        // Generate AI content
        const content = await generateAIContent({
          documentType: docType,
          strategy,
          evidence,
          caseTitle: dispute.title,
        });

        if (!content || content.trim().length < 100) {
          throw new Error(`Generated content too short: ${content?.length || 0} chars`);
        }

        // Save to database
        const doc = await prisma.generatedDocument.create({
          data: {
            planId: documentPlan.id,
            caseId, // Direct reference for easy querying
            type: docType,
            title: getDocumentTitle(docType),
            description: getDocumentDescription(docType),
            order: i + 1,
            content,
            status: "COMPLETED",
          },
        });

        generatedDocs.push(doc);
        console.log(`[Generate Docs] ✅ ${docType} complete (${content.length} chars)`);

      } catch (error) {
        console.error(`[Generate Docs] ❌ ${docType} failed:`, error);

        // Save failed document for retry
        const failedDoc = await prisma.generatedDocument.create({
          data: {
            planId: documentPlan.id,
            caseId,
            type: docType,
            title: getDocumentTitle(docType),
            description: getDocumentDescription(docType),
            order: i + 1,
            content: "",
            status: "FAILED",
            lastError: error instanceof Error ? error.message : "Unknown error",
            retryCount: 0,
          },
        });

        failedDocs.push(failedDoc);
      }
    }

    // 7. Create timeline event for audit trail
    await prisma.caseEvent.create({
      data: {
        caseId,
        type: "DOCUMENTS_GENERATED",
        title: "Documents Generated",
        description: `Generated ${generatedDocs.length}/${documentsToGenerate.length} documents (${complexityAnalysis.level} complexity)`,
        metadata: {
          planId: documentPlan.id,
          complexity: complexityAnalysis.level,
          complexityScore: complexityAnalysis.score,
          successCount: generatedDocs.length,
          failedCount: failedDocs.length,
          documentTypes: documentsToGenerate,
          duration: Date.now() - startTime,
        } as any,
      },
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[Generate Docs] ✅ Complete! ${generatedDocs.length} success, ${failedDocs.length} failed (${duration}s)`);

    return NextResponse.json({
      success: true,
      message: `Generated ${generatedDocs.length} documents`,
      plan: {
        id: documentPlan.id,
        complexity: documentPlan.complexity,
        complexityScore: documentPlan.complexityScore,
        documentType: documentPlan.documentType,
      },
      documents: [...generatedDocs, ...failedDocs],
      stats: {
        total: documentsToGenerate.length,
        success: generatedDocs.length,
        failed: failedDocs.length,
        duration: `${duration}s`,
      },
    });

  } catch (error) {
    console.error("[Generate Docs] ❌ Fatal error:", error);
    
    // Create error event
    try {
      await prisma.caseEvent.create({
        data: {
          caseId,
          type: "DOCUMENTS_FAILED",
          title: "Document Generation Failed",
          description: error instanceof Error ? error.message : "Unknown error occurred",
          metadata: {
            error: error instanceof Error ? error.message : "Unknown error",
            duration: Date.now() - startTime,
          } as any,
        },
      });
    } catch (eventError) {
      console.error("[Generate Docs] Failed to create error event:", eventError);
    }

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to generate documents",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// Helper: Get human-readable document title
function getDocumentTitle(type: string): string {
  const titles: Record<string, string> = {
    case_summary: "Case Summary",
    demand_letter: "Formal Demand Letter",
    employment_claim: "Employment Tribunal Claim (ET1)",
    grievance_letter: "Formal Grievance Letter",
    breach_notice: "Contract Breach Notice",
    damages_calculation: "Damages Calculation Schedule",
    complaint_letter: "Formal Complaint Letter",
    ccj_response: "CCJ Defence Response",
    dispute_notice: "Dispute Notice",
    claim_form: "Court Claim Form (N1)",
    debt_validation: "Debt Validation Request",
    dispute_letter: "Debt Dispute Letter",
    statute_barred_notice: "Statute Barred Notice",
    appeal_letter: "PCN Appeal Letter",
    witness_statement: "Witness Statement",
    evidence_bundle: "Evidence Bundle & Index",
    chronology: "Chronology of Events",
  };
  return titles[type] || type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

// Helper: Get document description
function getDocumentDescription(type: string): string {
  const descriptions: Record<string, string> = {
    case_summary: "Comprehensive overview of your case, facts, and legal position",
    demand_letter: "Formal letter demanding resolution before legal action",
    employment_claim: "Official claim form for employment tribunal proceedings",
    grievance_letter: "Formal written grievance to employer",
    breach_notice: "Notice of contract breach and demand for remedy",
    damages_calculation: "Detailed breakdown of financial losses and compensation sought",
    complaint_letter: "Formal complaint to service provider or regulator",
    ccj_response: "Defence against County Court Judgment claim",
    dispute_notice: "Official notice of dispute to opposing party",
    claim_form: "Court claim form for civil proceedings",
    debt_validation: "Request for debt validation under consumer law",
    dispute_letter: "Letter disputing alleged debt",
    statute_barred_notice: "Notice that debt is statute-barred",
    appeal_letter: "Appeal against parking charge notice",
    witness_statement: "Formal statement of evidence for court",
    evidence_bundle: "Organized collection of all case evidence",
    chronology: "Timeline of all key events in chronological order",
  };
  return descriptions[type] || "";
}
