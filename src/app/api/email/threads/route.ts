import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - fetch email thread (all messages in a conversation)
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const threadId = request.nextUrl.searchParams.get("threadId");
    const disputeId = request.nextUrl.searchParams.get("disputeId");

    if (!threadId && !disputeId) {
      return NextResponse.json(
        { error: "threadId or disputeId required" },
        { status: 400 }
      );
    }

    // Get user's email accounts
    const accounts = await prisma.emailAccount.findMany({
      where: { userId, isActive: true },
      select: { id: true },
    });

    const accountIds = accounts.map((a) => a.id);

    const where: any = {
      emailAccountId: { in: accountIds },
    };

    if (threadId) {
      where.threadId = threadId;
    } else if (disputeId) {
      where.disputeId = disputeId;
    }

    const messages = await prisma.emailMessage.findMany({
      where,
      orderBy: { receivedAt: "asc" },
      include: {
        emailAccount: {
          select: { email: true, provider: true },
        },
        replies: {
          select: {
            id: true,
            subject: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    // Also get related drafts for this case
    const drafts = disputeId
      ? await prisma.emailDraft.findMany({
          where: { disputeId, userId },
          orderBy: { createdAt: "desc" },
          include: {
            emailAccount: {
              select: { email: true, provider: true },
            },
          },
        })
      : [];

    return NextResponse.json({ messages, drafts });
  } catch (error: any) {
    console.error("Fetch thread error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
