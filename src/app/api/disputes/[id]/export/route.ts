/**
 * Case Export API
 * Export entire case as JSON bundle
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: caseId } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "json";

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get full case data
    const dispute = await prisma.dispute.findFirst({
      where: { id: caseId, userId: user.id },
      include: {
        caseStrategy: true,
        documentPlan: true,
        generatedDocuments: {
          include: {
            versions: true,
            feedback: true,
          },
        },
        caseEvents: {
          orderBy: { occurredAt: "asc" },
        },
        caseMessages: {
          orderBy: { createdAt: "asc" },
        },
        evidenceItems: true,
        notifications: true,
      },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Build export bundle
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      case: {
        id: dispute.id,
        title: dispute.title,
        type: dispute.type,
        description: dispute.description,
        status: dispute.status,
        lifecycleStatus: dispute.lifecycleStatus,
        documentTier: dispute.documentTier,
        createdAt: dispute.createdAt,
        updatedAt: dispute.updatedAt,
      },
      strategy: dispute.caseStrategy ? {
        disputeType: dispute.caseStrategy.disputeType,
        keyFacts: dispute.caseStrategy.keyFacts,
        evidenceMentioned: dispute.caseStrategy.evidenceMentioned,
        desiredOutcome: dispute.caseStrategy.desiredOutcome,
      } : null,
      summary: dispute.caseSummary,
      documents: dispute.generatedDocuments.map((doc) => ({
        id: doc.id,
        type: doc.type,
        title: doc.title,
        status: doc.status,
        fileUrl: doc.fileUrl,
        createdAt: doc.createdAt,
        versionCount: doc.versions.length,
        feedback: doc.feedback.length > 0 ? {
          averageRating: doc.feedback.reduce((sum, f) => sum + f.rating, 0) / doc.feedback.length,
          count: doc.feedback.length,
        } : null,
      })),
      timeline: dispute.caseEvents.map((event) => ({
        type: event.type,
        description: event.description,
        occurredAt: event.occurredAt,
      })),
      conversation: dispute.caseMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        intent: msg.intent,
        createdAt: msg.createdAt,
      })),
      evidence: dispute.evidenceItems.map((item) => ({
        index: item.evidenceIndex,
        title: item.title,
        description: item.description,
        fileName: item.fileName,
        fileUrl: item.fileUrl,
        uploadedAt: item.uploadedAt,
      })),
    };

    if (format === "json") {
      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="case-${caseId}-export.json"`,
        },
      });
    }

    // CSV format for basic data
    if (format === "csv") {
      const csvRows = [
        ["Field", "Value"],
        ["Case ID", dispute.id],
        ["Title", dispute.title],
        ["Type", dispute.type],
        ["Status", dispute.status],
        ["Created", dispute.createdAt.toISOString()],
        ["Documents", dispute.generatedDocuments.length.toString()],
        ["Messages", dispute.caseMessages.length.toString()],
        ["Evidence Items", dispute.evidenceItems.length.toString()],
      ];

      const csv = csvRows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="case-${caseId}-export.csv"`,
        },
      });
    }

    return NextResponse.json(exportData);
  } catch (error) {
    console.error("[Export] Error:", error);
    return NextResponse.json(
      { error: "Failed to export case" },
      { status: 500 }
    );
  }
}
