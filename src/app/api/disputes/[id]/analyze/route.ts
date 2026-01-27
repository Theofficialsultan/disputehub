import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { generateAIPreview } from "@/lib/ai";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Get dispute
    const dispute = await prisma.dispute.findUnique({
      where: { id },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    // Verify ownership
    if (dispute.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if preview already exists (caching)
    if (dispute.aiPreview) {
      console.log("Returning cached preview for dispute:", id);
      return NextResponse.json(dispute);
    }

    // Generate real AI preview (only if not cached)
    const evidenceFiles = (dispute.evidenceFiles as any[]) || [];
    const preview = await generateAIPreview(
      dispute.type,
      dispute.description,
      evidenceFiles.length
    );

    // Update dispute with preview
    const updatedDispute = await prisma.dispute.update({
      where: { id },
      data: {
        aiPreview: preview,
        strengthScore: preview.strength,
      },
    });

    return NextResponse.json(updatedDispute);
  } catch (error) {
    console.error("Error generating preview:", error);
    return NextResponse.json(
      { error: "Failed to generate preview" },
      { status: 500 }
    );
  }
}
