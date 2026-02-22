import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - fetch drafts for a case
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const disputeId = request.nextUrl.searchParams.get("disputeId");
    const status = request.nextUrl.searchParams.get("status");

    const where: any = { userId };
    if (disputeId) where.disputeId = disputeId;
    if (status) where.status = status;

    const drafts = await prisma.emailDraft.findMany({
      where,
      include: {
        emailAccount: {
          select: { email: true, provider: true },
        },
        inReplyTo: {
          select: { subject: true, senderEmail: true, receivedAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ drafts });
  } catch (error: any) {
    console.error("Fetch drafts error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - create a new draft (AI-generated or manual)
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      disputeId,
      emailAccountId,
      recipientEmail,
      recipientName,
      subject,
      bodyText,
      bodyHtml,
      emailType,
      inReplyToId,
    } = body;

    if (!disputeId || !recipientEmail || !subject || !bodyText) {
      return NextResponse.json(
        { error: "Missing required fields: disputeId, recipientEmail, subject, bodyText" },
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

    const draft = await prisma.emailDraft.create({
      data: {
        disputeId,
        userId,
        emailAccountId: emailAccountId || null,
        recipientEmail,
        recipientName: recipientName || null,
        subject,
        body: bodyText,
        bodyHtml: bodyHtml || null,
        emailType: emailType || "OTHER",
        inReplyToId: inReplyToId || null,
      },
    });

    return NextResponse.json({ draft }, { status: 201 });
  } catch (error: any) {
    console.error("Create draft error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - update a draft
export async function PATCH(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { draftId, ...updates } = body;

    if (!draftId) {
      return NextResponse.json({ error: "Draft ID required" }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.emailDraft.findUnique({
      where: { id: draftId },
    });

    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    if (existing.status === "SENT") {
      return NextResponse.json({ error: "Cannot edit a sent draft" }, { status: 400 });
    }

    const allowedFields: Record<string, any> = {};
    if (updates.recipientEmail) allowedFields.recipientEmail = updates.recipientEmail;
    if (updates.recipientName !== undefined) allowedFields.recipientName = updates.recipientName;
    if (updates.subject) allowedFields.subject = updates.subject;
    if (updates.body) allowedFields.body = updates.body;
    if (updates.bodyHtml) allowedFields.bodyHtml = updates.bodyHtml;
    if (updates.emailAccountId) allowedFields.emailAccountId = updates.emailAccountId;
    if (updates.status && ["DRAFT", "CANCELLED"].includes(updates.status)) {
      allowedFields.status = updates.status;
    }

    const draft = await prisma.emailDraft.update({
      where: { id: draftId },
      data: allowedFields,
    });

    return NextResponse.json({ draft });
  } catch (error: any) {
    console.error("Update draft error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
