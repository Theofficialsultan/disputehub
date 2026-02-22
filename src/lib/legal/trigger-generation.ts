/**
 * Triggers document generation after summary confirmation
 * This is called directly from the confirm endpoint (no HTTP needed)
 */

import { prisma } from "@/lib/prisma";
import { executeRoutingEngine } from "@/lib/legal/routing-engine";
import { validateRoutingDecision } from "@/lib/legal/gate-validator";
import { generateFormSpecificDocument } from "@/lib/ai/system3-generation";
import { getFormMetadata, type OfficialFormID } from "@/lib/legal/form-registry";
import type { ClassificationInput } from "@/lib/legal/routing-types";
import { generateEmailDraft } from "@/lib/email/ai-draft-generator";

export async function triggerDocumentGeneration(caseId: string): Promise<{
  success: boolean;
  error?: string;
  documents?: string[];
}> {
  const startTime = Date.now();

  try {
    console.log(`[TriggerGeneration] Starting for case ${caseId}`);

    // Get dispute data with user info
    const dispute = await prisma.dispute.findUnique({
      where: { id: caseId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });

    if (!dispute) {
      return { success: false, error: "Case not found" };
    }
    
    // Build user's full name from profile
    const userFullName = dispute.user?.firstName && dispute.user?.lastName 
      ? `${dispute.user.firstName} ${dispute.user.lastName}`.trim()
      : null;
    const userEmail = dispute.user?.email || null;

    if (!dispute.caseSummary || !dispute.summaryConfirmed) {
      return { success: false, error: "Case summary not confirmed" };
    }

    const evidence = await prisma.evidenceItem.findMany({
      where: { caseId },
      orderBy: { evidenceIndex: "asc" },
    });

    // Parse caseSummary
    const extractedFacts = typeof dispute.caseSummary === 'string' 
      ? JSON.parse(dispute.caseSummary)
      : dispute.caseSummary;

    // ========================================================================
    // Transform extractedFacts into a CaseStrategy-like object for System 3
    // ========================================================================
    
    // Build enriched keyFacts that include party names, amounts, etc.
    const enrichedKeyFacts: string[] = [
      ...(extractedFacts.facts || extractedFacts.keyFacts || []),
    ];
    
    // Add party information as facts
    if (extractedFacts.parties?.counterparty) {
      enrichedKeyFacts.push(`The other party is: ${extractedFacts.parties.counterparty}`);
    }
    // Use user profile name if case summary doesn't have it
    const claimantName = extractedFacts.parties?.user || userFullName;
    if (claimantName) {
      enrichedKeyFacts.push(`The claimant is: ${claimantName}`);
    }
    if (userEmail) {
      enrichedKeyFacts.push(`Claimant email: ${userEmail}`);
    }
    if (extractedFacts.parties?.relationship) {
      enrichedKeyFacts.push(`The relationship is: ${extractedFacts.parties.relationship}`);
    }
    
    // Add financial information
    if (extractedFacts.financialAmount) {
      enrichedKeyFacts.push(`Amount claimed: £${extractedFacts.financialAmount}`);
    }
    
    // Add date information  
    if (extractedFacts.incidentDate) {
      enrichedKeyFacts.push(`Date of incident: ${extractedFacts.incidentDate}`);
    }
    
    // Add addresses if available
    if (extractedFacts.userAddress) {
      enrichedKeyFacts.push(`Claimant address: ${extractedFacts.userAddress}`);
    }
    if (extractedFacts.counterpartyAddress) {
      enrichedKeyFacts.push(`Other party address: ${extractedFacts.counterpartyAddress}`);
    }
    
    // Create a CaseStrategy-compatible object for System 3
    const strategyForGeneration = {
      id: caseId,
      caseId: caseId,
      disputeType: extractedFacts.disputeType || dispute.type || "OTHER",
      keyFacts: enrichedKeyFacts,
      evidenceMentioned: extractedFacts.evidenceProvided || evidence.map(e => e.title || e.fileName),
      desiredOutcome: extractedFacts.desiredOutcome || `Claim £${extractedFacts.financialAmount || 'unspecified amount'}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Additional fields System 3 might need
      counterpartyName: extractedFacts.parties?.counterparty || null,
      claimantName: claimantName || null,
      claimantEmail: userEmail || null,
      amount: extractedFacts.financialAmount || null,
      relationship: extractedFacts.parties?.relationship || null,
    };
    
    console.log(`[TriggerGeneration] Built strategy with ${enrichedKeyFacts.length} enriched facts`);

    // ========================================================================
    // STEP 1: Execute System 2 Routing
    // ========================================================================

    console.log(`[TriggerGeneration] Running routing engine...`);

    // Update to ROUTING phase
    await prisma.dispute.update({
      where: { id: caseId },
      data: {
        phase: "ROUTING",
        chatLocked: true,
        lockReason: "Analyzing legal route...",
        lockedAt: new Date()
      }
    });

    const classificationInput: ClassificationInput = {
      caseId,
      caseTitle: dispute.title,
      // Support both "facts" (from System B extractor) and "keyFacts" (legacy)
      keyFacts: extractedFacts.keyFacts || extractedFacts.facts || [],
      disputeType: extractedFacts.disputeType || dispute.type || "OTHER",
      desiredOutcome: extractedFacts.desiredOutcome || "",
      evidenceCount: evidence.length,
      evidenceTypes: evidence.map(e => e.fileType || "unknown"),
      userChosenForum: extractedFacts.chosenForum || null, // Respect user's choice!
    };

    const routingResponse = await executeRoutingEngine(classificationInput);

    if (!routingResponse.success) {
      await prisma.dispute.update({
        where: { id: caseId },
        data: {
          phase: "BLOCKED",
          lockReason: routingResponse.error || "Routing failed"
        }
      });
      return { success: false, error: routingResponse.error || "Routing failed" };
    }

    const decision = routingResponse.decision!;

    // ========================================================================
    // STEP 2: Create/Update DocumentPlan
    // ========================================================================

    console.log(`[TriggerGeneration] Creating DocumentPlan...`);

    const documentPlan = await prisma.documentPlan.upsert({
      where: { caseId },
      create: {
        caseId,
        complexity: decision.confidence >= 0.90 ? "COMPLEX" : "SIMPLE",
        complexityScore: Math.round(decision.confidence * 100),
        complexityBreakdown: {},
        documentType: "MULTI_DOCUMENT_DOCKET",
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

    console.log(`[TriggerGeneration] DocumentPlan created: ${documentPlan.id}`);

    // ========================================================================
    // STEP 3: Validate gates
    // ========================================================================

    const routingDecision = {
      status: decision.status,
      confidence: decision.confidence,
      jurisdiction: decision.jurisdiction,
      relationship: decision.relationship,
      counterparty: decision.counterparty,
      domain: decision.domain,
      forum: decision.forum,
      forumReasoning: decision.forumReasoning,
      allowedDocs: decision.allowedDocs,
      blockedDocs: decision.blockedDocs,
      prerequisites: decision.prerequisites,
      prerequisitesMet: decision.prerequisitesMet,
      timeLimit: decision.timeLimit,
      reason: decision.reason,
      userMessage: decision.userMessage,
      alternativeRoutes: decision.alternativeRoutes,
      classifiedAt: new Date(),
      classifiedBy: "claude-opus-4" as const
    };

    const gateValidation = validateRoutingDecision(routingDecision);

    if (!gateValidation.allowed) {
      console.log(`[TriggerGeneration] ❌ GATE BLOCKED: ${gateValidation.gateName}`);
      
      await prisma.dispute.update({
        where: { id: caseId },
        data: {
          phase: "BLOCKED",
          chatLocked: true,
          lockReason: gateValidation.userMessage
        }
      });

      return { success: false, error: gateValidation.error };
    }

    // ========================================================================
    // STEP 4: Generate documents
    // ========================================================================

    console.log(`[TriggerGeneration] Starting document generation...`);

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
      data: { generationStartedAt: new Date() }
    });

    // Delete existing docs
    await prisma.generatedDocument.deleteMany({
      where: { planId: documentPlan.id },
    });

    const documentsToGenerate = decision.allowedDocs;
    const generatedDocs: string[] = [];
    const failedDocs: Array<{ formId: string; error: string }> = [];

    for (let i = 0; i < documentsToGenerate.length; i++) {
      const formId = documentsToGenerate[i];
      const metadata = getFormMetadata(formId);

      if (!metadata) {
        failedDocs.push({ formId, error: "No form metadata" });
        continue;
      }

      console.log(`[TriggerGeneration] ${i + 1}/${documentsToGenerate.length}: ${formId}...`);

      try {
        const result = await generateFormSpecificDocument(
          formId,
          routingDecision,
          strategyForGeneration as any, // Use enriched strategy
          evidence,
          dispute.title
        );

        const isPdf = typeof result === 'object' && result.type === "PDF";
        const content = isPdf ? `[PDF FORM - ${result.filename}]` : result as string;

        let pdfBinaryData: Buffer | null = null;
        let filename: string | null = null;
        
        if (isPdf) {
          pdfBinaryData = Buffer.from(result.data);
          filename = result.filename;
        }

        await prisma.generatedDocument.create({
          data: {
            planId: documentPlan.id,
            caseId,
            type: formId,
            title: metadata.officialName,
            description: `Official ${metadata.officialName}${isPdf ? ' (PDF)' : ''}`,
            order: i + 1,
            content,
            pdfData: pdfBinaryData,
            pdfFilename: filename,
            status: "COMPLETED",
            retryCount: 0
          }
        });

        generatedDocs.push(formId);
        console.log(`[TriggerGeneration] ✅ ${formId} completed`);

      } catch (error) {
        console.error(`[TriggerGeneration] ❌ ${formId} error:`, error);

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
    // STEP 5: Complete
    // ========================================================================

    await prisma.caseEvent.create({
      data: {
        caseId,
        type: "DOCUMENTS_GENERATING",
        description: `Generated ${generatedDocs.length}/${documentsToGenerate.length} documents via ${decision.forum}`,
        occurredAt: new Date()
      }
    });

    await prisma.dispute.update({
      where: { id: caseId },
      data: {
        phase: "COMPLETED",
        chatLocked: true,
        lockReason: "Documents generated. Case ready for action."
      }
    });

    // ========================================================================
    // STEP 6: Auto-draft email for user to review
    // Generates an LBA or initial correspondence email based on case context
    // ========================================================================
    try {
      // Determine email type based on the documents generated and case context
      const hasLBA = documentsToGenerate.some((d: string) =>
        d.includes("LBA") || d.includes("letter_before_action")
      );
      const hasTribunalForm = documentsToGenerate.some((d: string) =>
        d.includes("ET1") || d.includes("SSCS") || d.includes("N1")
      );
      const emailType = hasLBA ? "LBA" : hasTribunalForm ? "TRIBUNAL_SUBMISSION" : "COMPLAINT";

      // Get counterparty info from extracted facts for the recipient
      const counterparty = extractedFacts?.parties?.counterparty || "";
      const counterpartyEmail = extractedFacts?.counterpartyEmail || "";

      await generateEmailDraft({
        disputeId: caseId,
        userId: dispute.userId,
        emailType: emailType as any,
        recipientEmail: counterpartyEmail,
        recipientName: counterparty,
        customInstructions: `Documents have just been generated for this case (${generatedDocs.length} documents via ${decision.forum}). Draft an appropriate initial email to send alongside or referencing these documents. The email should be ready to send as the first formal correspondence in this dispute.`,
      });

      console.log(`[TriggerGeneration] ✅ Email draft generated (type: ${emailType})`);

      // Log the event
      await prisma.caseEvent.create({
        data: {
          caseId,
          type: "DOCUMENT_GENERATED",
          description: `AI drafted ${emailType === "LBA" ? "Letter Before Action" : emailType === "TRIBUNAL_SUBMISSION" ? "tribunal submission" : "complaint"} email for your review`,
          occurredAt: new Date(),
        },
      });
    } catch (emailError) {
      // Non-fatal: documents still generated successfully even if email draft fails
      console.error(`[TriggerGeneration] ⚠️ Email draft generation failed (non-fatal):`, emailError);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[TriggerGeneration] ✅ Complete! ${generatedDocs.length} success, ${failedDocs.length} failed (${duration}s)`);

    return {
      success: true,
      documents: generatedDocs
    };

  } catch (error) {
    console.error(`[TriggerGeneration] Fatal error:`, error);

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

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
