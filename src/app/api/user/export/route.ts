import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch all disputes with related data
    const disputes = await prisma.dispute.findMany({
      where: { userId },
      include: {
        caseMessages: {
          select: {
            id: true,
            role: true,
            content: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
        caseStrategy: {
          select: {
            id: true,
            classification: true,
            strategy: true,
            createdAt: true,
          },
        },
        documentPlan: {
          include: {
            documents: {
              select: {
                id: true,
                type: true,
                status: true,
                generatedAt: true,
              },
            },
          },
        },
        generatedDocuments: {
          select: {
            id: true,
            type: true,
            filename: true,
            content: true,
            generatedAt: true,
          },
        },
        caseEvents: {
          select: {
            id: true,
            type: true,
            description: true,
            occurredAt: true,
          },
          orderBy: { occurredAt: "desc" },
        },
        evidenceItems: {
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
            url: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Format the export data
    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      disputes: disputes.map((dispute) => ({
        id: dispute.id,
        title: dispute.title,
        description: dispute.description,
        type: dispute.type,
        status: dispute.status,
        mode: dispute.mode,
        phase: dispute.phase,
        chatState: dispute.chatState,
        lifecycleStatus: dispute.lifecycleStatus,
        caseSummary: dispute.caseSummary,
        createdAt: dispute.createdAt.toISOString(),
        updatedAt: dispute.updatedAt.toISOString(),
        messages: dispute.caseMessages.map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
        })),
        strategy: dispute.caseStrategy
          ? {
              ...dispute.caseStrategy,
              createdAt: dispute.caseStrategy.createdAt.toISOString(),
            }
          : null,
        documentPlan: dispute.documentPlan
          ? {
              id: dispute.documentPlan.id,
              documents: dispute.documentPlan.documents.map((d) => ({
                ...d,
                generatedAt: d.generatedAt?.toISOString() || null,
              })),
            }
          : null,
        generatedDocuments: dispute.generatedDocuments.map((d) => ({
          ...d,
          generatedAt: d.generatedAt?.toISOString() || null,
        })),
        events: dispute.caseEvents.map((e) => ({
          ...e,
          occurredAt: e.occurredAt.toISOString(),
        })),
        evidence: dispute.evidenceItems.map((e) => ({
          ...e,
          createdAt: e.createdAt.toISOString(),
        })),
      })),
      summary: {
        totalDisputes: disputes.length,
        totalMessages: disputes.reduce((sum, d) => sum + d.caseMessages.length, 0),
        totalDocuments: disputes.reduce((sum, d) => sum + d.generatedDocuments.length, 0),
        totalEvents: disputes.reduce((sum, d) => sum + d.caseEvents.length, 0),
      },
    };

    return NextResponse.json(exportData);
  } catch (error) {
    console.error("[USER_EXPORT_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}
