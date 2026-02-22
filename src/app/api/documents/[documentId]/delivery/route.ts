/**
 * Document Delivery Tracking API
 * 
 * GET  - Get delivery status and history for a document
 * POST - Mark document as sent (create delivery record)
 * PUT  - Update delivery status (e.g., confirm delivery)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { z } from "zod";

// Validation schemas
const markAsSentSchema = z.object({
  method: z.enum([
    'EMAIL_APP',
    'EMAIL_MANUAL', 
    'POST_RECORDED',
    'POST_STANDARD',
    'HAND_DELIVERED',
    'FAX',
    'OTHER'
  ]),
  recipientEmail: z.string().email().optional(),
  recipientName: z.string().optional(),
  recipientAddress: z.string().optional(),
  trackingNumber: z.string().optional(),
  notes: z.string().optional(),
  sentAt: z.string().datetime().optional(), // Allow backdating
});

const updateDeliverySchema = z.object({
  deliveryId: z.string(),
  status: z.enum(['DELIVERED', 'FAILED', 'RETURNED']),
  notes: z.string().optional(),
  proofUrl: z.string().url().optional(),
});

// ============================================================================
// GET - Get delivery status and history
// ============================================================================

export async function GET(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const documentId = params.documentId;

    // Get document with ownership check
    const document = await prisma.generatedDocument.findUnique({
      where: { id: documentId },
      include: {
        case: {
          select: { userId: true, title: true, waitingUntil: true, lifecycleStatus: true }
        },
        deliveries: {
          orderBy: { sentAt: 'desc' }
        }
      }
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Check ownership
    if (document.case?.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Calculate analytics
    const analytics = {
      generated: document.createdAt,
      firstViewed: document.viewedAt,
      viewCount: document.viewCount,
      firstDownloaded: document.downloadedAt,
      downloadCount: document.downloadCount,
      sendCount: document.sendCount,
      lastSent: document.lastSentAt,
      lastDelivered: document.lastDeliveredAt,
    };

    // Calculate funnel progress
    const funnelStage = document.deliveryStatus === 'DELIVERED' ? 'delivered'
      : document.deliveryStatus === 'SENT' ? 'sent'
      : document.downloadCount > 0 ? 'downloaded'
      : document.viewCount > 0 ? 'viewed'
      : 'generated';

    return NextResponse.json({
      documentId: document.id,
      title: document.title,
      type: document.type,
      status: document.status,
      deliveryStatus: document.deliveryStatus,
      deliveries: document.deliveries,
      analytics,
      funnelStage,
      case: {
        title: document.case?.title,
        lifecycleStatus: document.case?.lifecycleStatus,
        responseDeadline: document.case?.waitingUntil,
      }
    });

  } catch (error) {
    console.error("[Document Delivery GET] Error:", error);
    return NextResponse.json({ error: "Failed to get delivery status" }, { status: 500 });
  }
}

// ============================================================================
// POST - Mark document as sent
// ============================================================================

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
    const body = await request.json();
    const data = markAsSentSchema.parse(body);

    // Get document with ownership check
    const document = await prisma.generatedDocument.findUnique({
      where: { id: documentId },
      include: {
        case: { select: { userId: true, id: true } }
      }
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (document.case?.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const sentAt = data.sentAt ? new Date(data.sentAt) : new Date();

    // Create delivery record and update document in transaction
    const [delivery, updatedDoc] = await prisma.$transaction([
      // Create delivery record
      prisma.documentDelivery.create({
        data: {
          documentId,
          method: data.method as any,
          status: 'SENT',
          recipientEmail: data.recipientEmail,
          recipientName: data.recipientName,
          recipientAddress: data.recipientAddress,
          trackingNumber: data.trackingNumber,
          notes: data.notes,
          sentAt,
        }
      }),
      // Update document status
      prisma.generatedDocument.update({
        where: { id: documentId },
        data: {
          deliveryStatus: 'SENT',
          lastSentAt: sentAt,
          sendCount: { increment: 1 },
        }
      }),
    ]);

    // Update case lifecycle if this is the first send
    if (document.case?.id) {
      await prisma.dispute.update({
        where: { id: document.case.id },
        data: {
          lifecycleStatus: 'DOCUMENT_SENT',
        }
      });

      // Log case event
      await prisma.caseEvent.create({
        data: {
          caseId: document.case.id,
          type: 'DOCUMENT_SENT',
          description: `Document "${document.title}" marked as sent via ${data.method.replace('_', ' ').toLowerCase()}`,
          relatedDocumentId: documentId,
          occurredAt: sentAt,
        }
      });
    }

    return NextResponse.json({
      success: true,
      delivery,
      document: updatedDoc,
      message: "Document marked as sent",
    });

  } catch (error) {
    console.error("[Document Delivery POST] Error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.issues }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Failed to mark as sent" }, { status: 500 });
  }
}

// ============================================================================
// PUT - Update delivery status (confirm delivery, mark failed, etc.)
// ============================================================================

export async function PUT(
  request: Request,
  { params }: { params: { documentId: string } }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const documentId = params.documentId;
    const body = await request.json();
    const data = updateDeliverySchema.parse(body);

    // Get delivery with ownership check
    const delivery = await prisma.documentDelivery.findUnique({
      where: { id: data.deliveryId },
      include: {
        document: {
          include: {
            case: { select: { userId: true, id: true } }
          }
        }
      }
    });

    if (!delivery || delivery.documentId !== documentId) {
      return NextResponse.json({ error: "Delivery not found" }, { status: 404 });
    }

    if (delivery.document.case?.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const now = new Date();

    // Update delivery record
    const updatedDelivery = await prisma.documentDelivery.update({
      where: { id: data.deliveryId },
      data: {
        status: data.status as any,
        notes: data.notes,
        proofUrl: data.proofUrl,
        deliveredAt: data.status === 'DELIVERED' ? now : undefined,
        failedAt: data.status === 'FAILED' || data.status === 'RETURNED' ? now : undefined,
      }
    });

    // Update document if delivery confirmed
    if (data.status === 'DELIVERED') {
      await prisma.generatedDocument.update({
        where: { id: documentId },
        data: {
          deliveryStatus: 'DELIVERED',
          lastDeliveredAt: now,
        }
      });

      // Log case event
      if (delivery.document.case?.id) {
        await prisma.caseEvent.create({
          data: {
            caseId: delivery.document.case.id,
            type: 'RESPONSE_RECEIVED', // Using existing event type
            description: `Delivery of "${delivery.document.title}" confirmed`,
            relatedDocumentId: documentId,
            occurredAt: now,
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      delivery: updatedDelivery,
      message: `Delivery status updated to ${data.status}`,
    });

  } catch (error) {
    console.error("[Document Delivery PUT] Error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.issues }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Failed to update delivery" }, { status: 500 });
  }
}
