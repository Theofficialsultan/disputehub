import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/send-email";

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { draftId } = await request.json();

    if (!draftId) {
      return NextResponse.json({ error: "Draft ID required" }, { status: 400 });
    }

    // Verify ownership
    const draft = await prisma.emailDraft.findUnique({
      where: { id: draftId },
    });

    if (!draft || draft.userId !== userId) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    if (draft.status === "SENT") {
      return NextResponse.json({ error: "Draft already sent" }, { status: 400 });
    }

    if (!draft.emailAccountId) {
      return NextResponse.json(
        { error: "No email account selected. Please connect an email first." },
        { status: 400 }
      );
    }

    const result = await sendEmail(draftId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Send email error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
