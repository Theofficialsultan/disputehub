import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { markDocumentAsSent } from "@/lib/deadlines/deadline-engine";

/**
 * POST /api/documents/[documentId]/sent
 * 
 * Mark a document as sent
 * 
 * Behavior:
 * 1. Validate ownership
 * 2. Mark document as SENT (do NOT regenerate)
 * 3. Update Dispute:
 *    - lifecycleStatus = AWAITING_RESPONSE
 *    - waitingUntil = now() + 14 days
 * 4. Create DOCUMENT_SENT timeline event
 * 
 * Phase 8.2.2 - Waiting States & Deadline Engine
 */
export async function POST(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const documentId = params.documentId;

    // Mark document as sent (includes all validation and lifecycle updates)
    await markDocumentAsSent(documentId, userId);

    return NextResponse.json(
      {
        message: "Document marked as sent",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error marking document as sent:", error);
    
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
      if (error.message === "Document not found") {
        return NextResponse.json(
          { error: "Document not found" },
          { status: 404 }
        );
      }
      if (error.message === "Only completed documents can be marked as sent") {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: "Failed to mark document as sent" },
      { status: 500 }
    );
  }
}
