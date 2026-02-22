import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { syncAllUserInboxes } from "@/lib/email/inbox-sync";
import { analyzeEmail } from "@/lib/email/ai-analyzer";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Sync all inboxes
    const syncResults = await syncAllUserInboxes(userId);

    // Analyze any new inbound messages that don't have analysis yet
    const accounts = await prisma.emailAccount.findMany({
      where: { userId, isActive: true },
      select: { id: true },
    });

    const accountIds = accounts.map((a) => a.id);

    const unanalyzed = await prisma.emailMessage.findMany({
      where: {
        emailAccountId: { in: accountIds },
        direction: "INBOUND",
        aiAnalysis: { equals: null as any },
        disputeId: { not: null },
      },
      select: { id: true },
      take: 10, // Limit to 10 per sync to avoid timeout
    });

    const analysisResults = [];
    for (const msg of unanalyzed) {
      try {
        const analysis = await analyzeEmail(msg.id);
        analysisResults.push({ messageId: msg.id, analysis });
      } catch (err: any) {
        analysisResults.push({ messageId: msg.id, error: err.message });
      }
    }

    return NextResponse.json({
      sync: syncResults,
      analyzed: analysisResults.length,
    });
  } catch (error: any) {
    console.error("Inbox sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
