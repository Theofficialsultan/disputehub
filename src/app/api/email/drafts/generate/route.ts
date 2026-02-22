import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateEmailDraft } from "@/lib/email/ai-draft-generator";

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { disputeId, emailType, recipientEmail, recipientName, inReplyToId, customInstructions } = body;

    if (!disputeId || !emailType) {
      return NextResponse.json(
        { error: "disputeId and emailType are required" },
        { status: 400 }
      );
    }

    // Verify case ownership
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      select: { userId: true },
    });

    if (!dispute || dispute.userId !== userId) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const draft = await generateEmailDraft({
      disputeId,
      userId,
      emailType,
      recipientEmail,
      recipientName,
      inReplyToId,
      customInstructions,
    });

    return NextResponse.json({ draft }, { status: 201 });
  } catch (error: any) {
    console.error("Generate email draft error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
