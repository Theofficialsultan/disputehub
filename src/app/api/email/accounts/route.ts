import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accounts = await prisma.emailAccount.findMany({
      where: { userId, isActive: true },
      select: {
        id: true,
        provider: true,
        email: true,
        lastSyncAt: true,
        createdAt: true,
        _count: {
          select: {
            emailMessages: true,
            emailDrafts: true,
          },
        },
      },
    });

    return NextResponse.json({ accounts });
  } catch (error: any) {
    console.error("Fetch accounts error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
