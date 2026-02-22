/**
 * Document Feedback API
 * Collect user ratings and feedback on generated documents
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Get feedback for a document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { documentId } = await params;

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const feedback = await prisma.documentFeedback.findUnique({
      where: {
        documentId_userId: {
          documentId,
          userId: user.id,
        },
      },
    });

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("[Feedback] Get error:", error);
    return NextResponse.json(
      { error: "Failed to get feedback" },
      { status: 500 }
    );
  }
}

// Submit feedback
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { documentId } = await params;

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify document exists and user has access
    const document = await prisma.generatedDocument.findUnique({
      where: { id: documentId },
      include: {
        case: {
          select: { userId: true },
        },
      },
    });

    if (!document || document.case?.userId !== user.id) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const body = await request.json();
    const { rating, comment, hasErrors, errorTypes } = body;

    // Validate rating (1-5)
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Upsert feedback
    const feedback = await prisma.documentFeedback.upsert({
      where: {
        documentId_userId: {
          documentId,
          userId: user.id,
        },
      },
      update: {
        rating,
        comment: comment || null,
        hasErrors: hasErrors || false,
        errorTypes: errorTypes || [],
      },
      create: {
        documentId,
        userId: user.id,
        rating,
        comment: comment || null,
        hasErrors: hasErrors || false,
        errorTypes: errorTypes || [],
      },
    });

    return NextResponse.json({
      success: true,
      feedback,
    });
  } catch (error) {
    console.error("[Feedback] Submit error:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}
