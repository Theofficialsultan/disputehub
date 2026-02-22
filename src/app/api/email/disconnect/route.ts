import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accountId } = await request.json();

    if (!accountId) {
      return NextResponse.json({ error: "Account ID required" }, { status: 400 });
    }

    // Verify ownership
    const account = await prisma.emailAccount.findUnique({
      where: { id: accountId },
    });

    if (!account || account.userId !== userId) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Soft delete - mark as inactive
    await prisma.emailAccount.update({
      where: { id: accountId },
      data: {
        isActive: false,
        disconnectedAt: new Date(),
        accessTokenEnc: "DISCONNECTED",
        refreshTokenEnc: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Disconnect error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
