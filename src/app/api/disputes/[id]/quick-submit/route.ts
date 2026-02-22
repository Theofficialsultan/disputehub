/**
 * POST /api/disputes/[id]/quick-submit
 * 
 * Handles Quick Letter submission from mobile app.
 * Sets caseSummary and auto-confirms it so documents can be generated.
 * 
 * AUDIT FIXES (2026-02-12):
 * - Added profile completeness check
 * - Fixed caseSummary format to match System 3 expectations
 * - Added dispute type inference
 * - Added counterparty type inference
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { z } from "zod";

const quickSubmitSchema = z.object({
  disputeType: z.string().optional(),
  opponentName: z.string().min(1, "Opponent name required"),
  opponentAddress: z.string().optional(),
  opponentEmail: z.string().optional(),
  opponentPhone: z.string().optional(),
  incidentDate: z.string().optional(),
  incidentLocation: z.string().optional(),
  incidentDescription: z.string().min(10, "Description required"),
  desiredOutcome: z.string().min(1, "Desired outcome required"),
  amountClaimed: z.string().optional(),
  deadline: z.string().optional(),
});

// ============================================================================
// INFERENCE HELPERS
// ============================================================================

function inferDisputeType(description: string): string {
  const lower = description.toLowerCase();
  
  // Parking
  if (lower.includes('parking') || lower.includes('pcn') || lower.includes('penalty charge')) {
    return 'PARKING';
  }
  // Consumer goods
  if (lower.includes('refund') || lower.includes('faulty') || lower.includes('broken') || lower.includes('defect')) {
    return 'CONSUMER_GOODS';
  }
  // Unpaid wages
  if (lower.includes('wage') || lower.includes('paid') || lower.includes('salary') || lower.includes('commission')) {
    return 'UNPAID_WAGES';
  }
  // Tenancy/deposit
  if (lower.includes('deposit') || lower.includes('landlord') || lower.includes('tenant') || lower.includes('rent')) {
    return 'TENANCY_DEPOSIT';
  }
  // Employment
  if (lower.includes('dismiss') || lower.includes('sacked') || lower.includes('fired') || lower.includes('redundan')) {
    return 'UNFAIR_DISMISSAL';
  }
  if (lower.includes('discriminat') || lower.includes('harass')) {
    return 'DISCRIMINATION';
  }
  // Insurance
  if (lower.includes('insurance') || lower.includes('claim rejected') || lower.includes('policy')) {
    return 'INSURANCE';
  }
  // Services
  if (lower.includes('builder') || lower.includes('plumber') || lower.includes('contractor') || lower.includes('workmanship')) {
    return 'SERVICES_DISPUTE';
  }
  // Invoice
  if (lower.includes('invoice') || lower.includes('freelance') || lower.includes('client')) {
    return 'UNPAID_INVOICE';
  }
  // Speeding/traffic
  if (lower.includes('speeding') || lower.includes('speed camera') || lower.includes('nip')) {
    return 'SPEEDING';
  }
  // Benefits
  if (lower.includes('pip') || lower.includes('universal credit') || lower.includes('esa') || lower.includes('dwp') || lower.includes('benefit')) {
    return 'BENEFITS';
  }
  
  return 'OTHER';
}

function inferCounterpartyType(disputeType: string): string {
  const typeMap: Record<string, string> = {
    'PARKING': 'PARKING_COMPANY',
    'CONSUMER_GOODS': 'RETAILER',
    'UNPAID_WAGES': 'EMPLOYER',
    'TENANCY_DEPOSIT': 'LANDLORD',
    'UNFAIR_DISMISSAL': 'EMPLOYER',
    'DISCRIMINATION': 'EMPLOYER',
    'INSURANCE': 'INSURER',
    'SERVICES_DISPUTE': 'TRADER',
    'UNPAID_INVOICE': 'CLIENT',
    'SPEEDING': 'POLICE',
    'BENEFITS': 'DWP',
    'OTHER': 'ORGANISATION',
  };
  return typeMap[disputeType] || 'ORGANISATION';
}

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

    // ========================================================================
    // PROFILE COMPLETENESS CHECK
    // ========================================================================
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        addressLine1: true,
        city: true,
        postcode: true,
      }
    });
    
    const requiredFields = ['firstName', 'lastName', 'addressLine1', 'city', 'postcode'];
    const missingFields = requiredFields.filter(f => !user || !user[f as keyof typeof user]);
    
    if (missingFields.length > 0) {
      console.log(`[Quick Submit] Profile incomplete. Missing: ${missingFields.join(', ')}`);
      return NextResponse.json({
        error: "Profile incomplete",
        code: "PROFILE_INCOMPLETE",
        message: "Your profile must be complete to generate legal documents. Your name and address will appear on official documents.",
        missingFields,
        requiresProfileCompletion: true
      }, { status: 400 });
    }

    // Verify case ownership
    const dispute = await prisma.dispute.findFirst({
      where: { id: caseId, userId },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const data = quickSubmitSchema.parse(body);
    
    // ========================================================================
    // INFER DISPUTE TYPE IF NOT PROVIDED
    // ========================================================================
    
    const inferredDisputeType = data.disputeType || inferDisputeType(data.incidentDescription);
    const counterpartyType = inferCounterpartyType(inferredDisputeType);
    
    console.log(`[Quick Submit] Inferred dispute type: ${inferredDisputeType}, counterparty: ${counterpartyType}`);

    // ========================================================================
    // BUILD CASESUMMARY IN CORRECT FORMAT FOR SYSTEM 3
    // ========================================================================
    
    const caseSummary = {
      // Core fields expected by System 3
      disputeType: inferredDisputeType,
      parties: {
        counterparty: data.opponentName,
        counterpartyType: counterpartyType,
        counterpartyAddress: data.opponentAddress || null,
        counterpartyEmail: data.opponentEmail || null,
        counterpartyPhone: data.opponentPhone || null,
      },
      financialAmount: data.amountClaimed ? parseFloat(data.amountClaimed) : null,
      timeline: {
        issueDate: data.incidentDate || new Date().toISOString().split('T')[0],
        keyEvents: [
          data.incidentDescription.substring(0, 500),
        ],
      },
      // keyFacts in the format System 3 expects
      keyFacts: [
        `The other party is: ${data.opponentName}`,
        data.opponentAddress ? `Their address is: ${data.opponentAddress}` : null,
        `What happened: ${data.incidentDescription.substring(0, 300)}`,
        data.amountClaimed ? `The amount in dispute is: £${data.amountClaimed}` : null,
        data.incidentDate ? `This occurred on: ${data.incidentDate}` : null,
        data.incidentLocation ? `Location: ${data.incidentLocation}` : null,
        `I am seeking: ${data.desiredOutcome}`,
      ].filter(Boolean) as string[],
      desiredOutcome: data.desiredOutcome,
      chosenForum: null, // Let System 2 decide
      // Readiness indicators
      readinessScore: 85,
      recommendedState: "READY_FOR_GENERATION",
      // Keep quickLetterData for reference
      quickLetterData: {
        opponent: {
          name: data.opponentName,
          address: data.opponentAddress,
          email: data.opponentEmail,
          phone: data.opponentPhone,
        },
        incident: {
          date: data.incidentDate,
          location: data.incidentLocation,
          description: data.incidentDescription,
        },
        resolution: {
          desiredOutcome: data.desiredOutcome,
          amountClaimed: data.amountClaimed,
          responseDeadline: data.deadline || "14",
        },
      },
    };

    // Determine dispute type title
    const typeTitle = data.disputeType 
      ? data.disputeType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      : 'Quick Letter';

    // Calculate response deadline
    const deadlineDays = parseInt(data.deadline || "14", 10);
    const waitingUntil = new Date(Date.now() + deadlineDays * 24 * 60 * 60 * 1000);

    // Update dispute with summary and auto-confirm
    const updatedDispute = await prisma.dispute.update({
      where: { id: caseId },
      data: {
        title: `${typeTitle} - ${data.opponentName}`,
        description: data.incidentDescription.substring(0, 500),
        type: data.disputeType || "other",
        caseSummary: caseSummary,
        summaryConfirmed: true,
        summaryConfirmedAt: new Date(),
        chatState: "DOCUMENTS_PREPARING",
        phase: "GENERATING",
        status: "SUBMITTED",
        // Set lifecycle to awaiting response with deadline
        lifecycleStatus: "AWAITING_RESPONSE",
        waitingUntil: waitingUntil,
      },
    });

    console.log(`[Quick Submit] Case ${caseId} ready for document generation`);

    return NextResponse.json({
      success: true,
      dispute: {
        id: updatedDispute.id,
        title: updatedDispute.title,
        status: updatedDispute.status,
        summaryConfirmed: updatedDispute.summaryConfirmed,
      },
      message: "Quick letter submitted. Ready for document generation.",
    });

  } catch (error) {
    console.error("[Quick Submit] Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to submit quick letter" },
      { status: 500 }
    );
  }
}
