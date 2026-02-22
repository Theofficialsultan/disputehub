import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - fetch inbox messages for a case or all
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const disputeId = request.nextUrl.searchParams.get("disputeId");
    const direction = request.nextUrl.searchParams.get("direction");
    const unreadOnly = request.nextUrl.searchParams.get("unread") === "true";
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20");

    // Get user's email accounts
    const accounts = await prisma.emailAccount.findMany({
      where: { userId, isActive: true },
      select: { id: true },
    });

    const accountIds = accounts.map((a) => a.id);

    const where: any = {
      emailAccountId: { in: accountIds },
    };

    if (disputeId) where.disputeId = disputeId;
    if (direction) where.direction = direction;
    if (unreadOnly) where.isRead = false;

    const [messages, total] = await Promise.all([
      prisma.emailMessage.findMany({
        where,
        orderBy: { receivedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          emailAccount: {
            select: { email: true, provider: true },
          },
          dispute: {
            select: { id: true, title: true, type: true },
          },
        },
      }),
      prisma.emailMessage.count({ where }),
    ]);

    return NextResponse.json({
      messages,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("Fetch inbox error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
