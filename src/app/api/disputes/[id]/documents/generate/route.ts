/**
 * POST /api/disputes/[id]/documents/generate
 * 
 * Phase 8.5-8.7: Legal Intelligence System
 * 
 * HARD-GATED DOCUMENT GENERATION
 * - System 2 routing decision MUST exist and be APPROVED
 * - Only generates documents in allowedDocs list
 * - Enforces prerequisites and time limits
 * - Strong validation before saving
 * - One-way control flow (chat locks after generation starts)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { generateFormSpecificDocument } from "@/lib/ai/system3-generation"; // System 3
import { enrichFactsForDocumentGeneration, type ExtractedFacts } from "@/lib/ai/system-b-extractor";
import { executeRoutingEngine } from "@/lib/legal/routing-engine";
import { validateRoutingDecision, validateDocumentGeneration } from "@/lib/legal/gate-validator";
import { validateGeneratedDocument, getValidationDetails } from "@/lib/legal/document-validator";
import { getFormMetadata, type OfficialFormID } from "@/lib/legal/form-registry";
import type { ClassificationInput } from "@/lib/legal/routing-types";

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

    console.log(`[System 3] Document generation requested for case ${caseId}`);

    // ========================================================================
    // STEP 1: Verify case ownership and get data
    // ========================================================================

    const dispute = await prisma.dispute.findFirst({
      where: { id: caseId, userId },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Check if chat is locked
    if (dispute.chatLocked && dispute.phase !== "GATHERING") {
      console.log(`[System 3] Case already in phase: ${dispute.phase}`);
    }

    // NEW: Use caseSummary from dispute (4-layer system)
    console.log(`[System 3] caseSummary exists: ${!!dispute.caseSummary}, summaryConfirmed: ${dispute.summaryConfirmed}`);
    if (!dispute.caseSummary) {
      console.log(`[System 3] ❌ Blocked: No case summary exists`);
      return NextResponse.json(
        { error: "No case summary available. Please complete the chat first to gather case details." },
        { status: 400 }
      );
    }
    
    // Auto-confirm summary if it exists but isn't confirmed yet (mobile app UX improvement)
    if (!dispute.summaryConfirmed) {
      console.log(`[System 3] Auto-confirming summary for mobile app flow`);
      await prisma.dispute.update({
        where: { id: caseId },
        data: { summaryConfirmed: true, summaryConfirmedAt: new Date() }
      });
    }

    // Fetch user profile for document personalization
    const userProfile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        postcode: true,
      }
    });
    
    // ========================================================================
    // PROFILE COMPLETENESS CHECK - Required for legal documents
    // ========================================================================
    
    const requiredFields = ['firstName', 'lastName', 'addressLine1', 'city', 'postcode'];
    const missingFields = requiredFields.filter(field => 
      !userProfile || !userProfile[field as keyof typeof userProfile]
    );
    
    if (missingFields.length > 0) {
      console.log(`[System 3] ❌ Profile incomplete. Missing: ${missingFields.join(', ')}`);
      return NextResponse.json({
        error: "Profile incomplete",
        code: "PROFILE_INCOMPLETE",
        message: "Your profile must be complete to generate legal documents. Your name and address will appear on official documents.",
        missingFields,
        requiresProfileCompletion: true
      }, { status: 400 });
    }
    
    console.log(`[System 3] ✅ Profile complete: ${userProfile?.firstName} ${userProfile?.lastName}`);

    const evidence = await prisma.evidenceItem.findMany({
      where: { caseId },
      orderBy: { evidenceIndex: "asc" },
    });

    // Parse caseSummary as ExtractedFacts
    const rawExtractedFacts: ExtractedFacts = typeof dispute.caseSummary === 'string' 
      ? JSON.parse(dispute.caseSummary)
      : dispute.caseSummary;

    // CRITICAL: Enrich extracted facts into document-generation-ready format
    // This transforms System B's structured output (parties.counterparty, financialAmount)
    // into the keyFacts[] format that document generators expect ("The other party is: XYZ")
    const enrichedStrategy = enrichFactsForDocumentGeneration(rawExtractedFacts);
    
    console.log(`[System 3] Data: ${enrichedStrategy.keyFacts?.length || 0} enriched facts, ${evidence.length} evidence items`);
    console.log(`[System 3] Enriched: counterparty=${enrichedStrategy.counterpartyName}, amount=${enrichedStrategy.amount}`);

    // ========================================================================
    // STEP 2: Get or create DocumentPlan with routing decision
    // ========================================================================

    let documentPlan = await prisma.documentPlan.findUnique({
      where: { caseId }
    });

    // If no plan exists OR routing not done, run System 2
    if (!documentPlan || documentPlan.routingStatus === "PENDING") {
      console.log(`[System 3] No routing decision found. Executing System 2...`);

      // Transition to ROUTING phase
      await prisma.dispute.update({
        where: { id: caseId },
        data: {
          phase: "ROUTING",
          chatLocked: true,
          lockReason: "Analyzing legal route...",
          lockedAt: new Date()
        }
      });

      // Execute System 2
      // Use enriched keyFacts for routing, but also pass raw extracted data
      const classificationInput: ClassificationInput = {
        caseId,
        caseTitle: dispute.title,
        keyFacts: enrichedStrategy.keyFacts || [],
        disputeType: rawExtractedFacts.disputeType || dispute.type || "OTHER",
        desiredOutcome: enrichedStrategy.desiredOutcome || "",
        evidenceCount: evidence.length,
        evidenceTypes: evidence.map(e => e.fileType || "unknown"),
        // CRITICAL: Pass user's explicitly chosen forum to respect their decision
        userChosenForum: rawExtractedFacts.chosenForum || undefined,
      };

      const routingResponse = await executeRoutingEngine(classificationInput);

      if (!routingResponse.success) {
        // Routing failed
        await prisma.dispute.update({
          where: { id: caseId },
          data: {
            phase: "BLOCKED",
            lockReason: routingResponse.error || "Routing failed"
          }
        });

        return NextResponse.json({
          error: "Routing failed",
          details: routingResponse.error,
          requiresClarification: routingResponse.requiresClarification
        }, { status: 400 });
      }

      const decision = routingResponse.decision!;

      // Save routing decision to DocumentPlan
      documentPlan = await prisma.documentPlan.upsert({
        where: { caseId },
        create: {
          caseId,
          // Legacy fields (for backward compatibility)
          complexity: decision.confidence >= 0.90 ? "COMPLEX" : "SIMPLE",
          complexityScore: Math.round(decision.confidence * 100),
          complexityBreakdown: {},
          documentType: "MULTI_DOCUMENT_DOCKET",
          // System 2 routing decision
          routingStatus: decision.status,
          routingConfidence: decision.confidence,
          routingReason: decision.reason,
          jurisdiction: decision.jurisdiction,
          legalRelationship: decision.relationship,
          counterparty: decision.counterparty,
          domain: decision.domain,
          forum: decision.forum,
          forumReasoning: decision.forumReasoning,
          allowedDocuments: decision.allowedDocs,
          blockedDocuments: decision.blockedDocs,
          prerequisitesMet: decision.prerequisitesMet,
          prerequisitesList: decision.prerequisites as any,
          timeLimitDeadline: decision.timeLimit?.deadline,
          timeLimitMet: decision.timeLimit?.met,
          timeLimitDescription: decision.timeLimit?.description,
          alternativeRoutes: decision.alternativeRoutes as any,
          routingCompletedAt: new Date()
        },
        update: {
          routingStatus: decision.status,
          routingConfidence: decision.confidence,
          routingReason: decision.reason,
          jurisdiction: decision.jurisdiction,
          legalRelationship: decision.relationship,
          counterparty: decision.counterparty,
          domain: decision.domain,
          forum: decision.forum,
          forumReasoning: decision.forumReasoning,
          allowedDocuments: decision.allowedDocs,
          blockedDocuments: decision.blockedDocs,
          prerequisitesMet: decision.prerequisitesMet,
          prerequisitesList: decision.prerequisites as any,
          timeLimitDeadline: decision.timeLimit?.deadline,
          timeLimitMet: decision.timeLimit?.met,
          timeLimitDescription: decision.timeLimit?.description,
          alternativeRoutes: decision.alternativeRoutes as any,
          routingCompletedAt: new Date()
        }
      });

      console.log(`[System 3] Routing decision saved: ${decision.status}`);
    }

    // ========================================================================
    // STEP 3: HARD GATE VALIDATION
    // ========================================================================

    // Reconstruct routing decision from database
    const routingDecision = documentPlan.routingStatus ? {
      status: documentPlan.routingStatus as any,
      confidence: documentPlan.routingConfidence || 0,
      jurisdiction: documentPlan.jurisdiction as any,
      relationship: documentPlan.legalRelationship as any,
      counterparty: documentPlan.counterparty as any,
      domain: documentPlan.domain as any,
      forum: documentPlan.forum as any,
      forumReasoning: documentPlan.forumReasoning || "",
      allowedDocs: documentPlan.allowedDocuments as OfficialFormID[],
      blockedDocs: documentPlan.blockedDocuments as OfficialFormID[],
      prerequisites: documentPlan.prerequisitesList as any || [],
      prerequisitesMet: documentPlan.prerequisitesMet,
      timeLimit: documentPlan.timeLimitDeadline ? {
        deadline: documentPlan.timeLimitDeadline,
        daysRemaining: Math.ceil((documentPlan.timeLimitDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        met: documentPlan.timeLimitMet || false,
        description: documentPlan.timeLimitDescription || ""
      } : undefined,
      reason: documentPlan.routingReason || "",
      userMessage: documentPlan.routingReason || "",
      alternativeRoutes: documentPlan.alternativeRoutes as any,
      classifiedAt: documentPlan.routingCompletedAt || new Date(),
      classifiedBy: "claude-opus-4" as const
    } : null;

    const gateValidation = validateRoutingDecision(routingDecision);

    if (!gateValidation.allowed) {
      console.log(`[System 3] ❌ GATE BLOCKED: ${gateValidation.gateName}`);
      console.log(`[System 3] Reason: ${gateValidation.error}`);

      // Update case phase to BLOCKED
      await prisma.dispute.update({
        where: { id: caseId },
        data: {
          phase: "BLOCKED",
          chatLocked: true,
          lockReason: gateValidation.userMessage
        }
      });

      // Update DocumentPlan with block details
      await prisma.documentPlan.update({
        where: { id: documentPlan.id },
        data: {
          routingStatus: "BLOCKED",
          nextAction: gateValidation.nextAction
        }
      });

      return NextResponse.json({
        error: "Document generation blocked",
        gate: gateValidation.gateName,
        reason: gateValidation.error,
        userMessage: gateValidation.userMessage,
        nextAction: gateValidation.nextAction
      }, { status: 403 });
    }

    console.log(`[System 3] ✅ All gates passed. Proceeding with generation.`);

    // ========================================================================
    // STEP 4: Transition to GENERATING phase
    // ========================================================================

    await prisma.dispute.update({
      where: { id: caseId },
      data: {
        phase: "GENERATING",
        chatLocked: true,
        lockReason: "Generating legal documents..."
      }
    });

    await prisma.documentPlan.update({
      where: { id: documentPlan.id },
      data: {
        generationStartedAt: new Date()
      }
    });

    // ========================================================================
    // STEP 5: Delete old documents
    // ========================================================================

    const existingDocs = await prisma.generatedDocument.deleteMany({
      where: { planId: documentPlan.id },
    });

    if (existingDocs.count > 0) {
      console.log(`[System 3] Deleted ${existingDocs.count} existing documents`);
    }

    // ========================================================================
    // STEP 6: Generate documents (ONLY from allowedDocs list)
    // ========================================================================

    const documentsToGenerate = routingDecision!.allowedDocs;
    console.log(`[System 3] Generating ${documentsToGenerate.length} documents:`, documentsToGenerate);

    const generatedDocs: string[] = [];
    const failedDocs: Array<{ formId: string; error: string }> = [];

    for (let i = 0; i < documentsToGenerate.length; i++) {
      const formId = documentsToGenerate[i];
      const metadata = getFormMetadata(formId);

      if (!metadata) {
        console.error(`[System 3] ❌ No metadata for form ${formId}`);
        failedDocs.push({ formId, error: "No form metadata" });
        continue;
      }

      console.log(`[System 3] ${i + 1}/${documentsToGenerate.length}: Generating ${formId}...`);

      try {
        // Generate AI content or PDF using System 3 (form-specific generation)
        // Pass enrichedStrategy which has keyFacts[] in the format document helpers expect
        const result = await generateFormSpecificDocument(
          formId,
          routingDecision!,
          enrichedStrategy as any, // Enriched facts compatible with CaseStrategy interface
          evidence,
          dispute.title,
          userProfile || undefined // Pass user profile for document personalization
        );

        // Check if result is a PDF or text document
        const isPdf = typeof result === 'object' && result.type === "PDF";
        const content = isPdf ? `[PDF FORM - ${result.filename}]` : result as string;

        // If PDF, save binary data separately
        let pdfBinaryData: Buffer | null = null;
        let filename: string | null = null;
        
        if (isPdf) {
          pdfBinaryData = Buffer.from(result.data);
          filename = result.filename;
          console.log(`[System 3] 📄 Generated PDF: ${filename} (${pdfBinaryData.length.toLocaleString()} bytes)`);
        }

        // STRONG VALIDATION (only for text documents)
        if (!isPdf) {
          const validation = await validateGeneratedDocument(content, formId);

          if (!validation.valid) {
            // FAIL IMMEDIATELY - don't save invalid document
            console.error(`[System 3] ❌ ${formId} FAILED VALIDATION:`);
            console.error(getValidationDetails(validation));

            await prisma.generatedDocument.create({
              data: {
                planId: documentPlan.id,
                caseId,
                type: formId,
                title: metadata.officialName,
                description: `Official ${metadata.officialName}`,
                order: i + 1,
                content: "", // Empty - validation failed
                status: "FAILED",
                lastError: `Validation failed: ${validation.errors.join("; ")}`,
                validationErrors: validation.errors,
                validationWarnings: validation.warnings,
                validatedAt: validation.validatedAt,
                retryCount: 0
              }
            });

            failedDocs.push({ formId, error: validation.errors.join("; ") });
            continue;
          }

          // Validation passed - save text document
          await prisma.generatedDocument.create({
            data: {
              planId: documentPlan.id,
              caseId,
              type: formId,
              title: metadata.officialName,
              description: `Official ${metadata.officialName}`,
              order: i + 1,
              content,
              status: "COMPLETED",
              validationWarnings: validation.warnings.length > 0 ? (validation.warnings as any) : null,
              validatedAt: validation.validatedAt,
              retryCount: 0
            }
          });

          generatedDocs.push(formId);
          console.log(`[System 3] ✅ ${formId} completed (${content.length.toLocaleString()} chars)`);
        } else {
          // Save PDF document
          await prisma.generatedDocument.create({
            data: {
              planId: documentPlan.id,
              caseId,
              type: formId,
              title: metadata.officialName,
              description: `Official ${metadata.officialName} (PDF)`,
              order: i + 1,
              content, // Placeholder text
              pdfData: pdfBinaryData as any,
              pdfFilename: filename,
              status: "COMPLETED",
              retryCount: 0
            }
          });

          generatedDocs.push(formId);
          console.log(`[System 3] ✅ ${formId} completed as PDF`);
        }
      } catch (error) {
        console.error(`[System 3] ❌ ${formId} generation error:`, error);

        await prisma.generatedDocument.create({
          data: {
            planId: documentPlan.id,
            caseId,
            type: formId,
            title: metadata.officialName,
            description: `Official ${metadata.officialName}`,
            order: i + 1,
            content: "",
            status: "FAILED",
            lastError: error instanceof Error ? error.message : "Unknown error",
            retryCount: 0
          }
        });

        failedDocs.push({
          formId,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    // ========================================================================
    // STEP 7: Create timeline event
    // ========================================================================

    await prisma.caseEvent.create({
      data: {
        caseId,
        type: "DOCUMENTS_GENERATING",
        description: `Generated ${generatedDocs.length}/${documentsToGenerate.length} documents via System 2 routing (${routingDecision!.forum})`,
        occurredAt: new Date()
      }
    });

    // ========================================================================
    // STEP 8: Transition to COMPLETED phase
    // ========================================================================

    await prisma.dispute.update({
      where: { id: caseId },
      data: {
        phase: "COMPLETED",
        chatLocked: true,
        lockReason: "Documents generated. Case ready for action."
      }
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[System 3] ✅ Complete! ${generatedDocs.length} success, ${failedDocs.length} failed (${duration}s)`);

    return NextResponse.json({
      success: true,
      stats: {
        total: documentsToGenerate.length,
        success: generatedDocs.length,
        failed: failedDocs.length,
        duration: `${duration}s`
      },
      routing: {
        forum: routingDecision!.forum,
        jurisdiction: routingDecision!.jurisdiction,
        confidence: routingDecision!.confidence
      },
      documents: generatedDocs,
      failed: failedDocs,
      phase: "COMPLETED"
    });

  } catch (error) {
    console.error(`[System 3] Fatal error:`, error);

    // Try to update case to BLOCKED state
    try {
      await prisma.dispute.update({
        where: { id: caseId },
        data: {
          phase: "BLOCKED",
          lockReason: "Document generation failed"
        }
      });
    } catch (e) {
      // Ignore
    }

    return NextResponse.json(
      {
        error: "Document generation failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
