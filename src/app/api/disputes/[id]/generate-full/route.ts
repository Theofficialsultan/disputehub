import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { isDisputeUnlocked } from "@/lib/payments";
import { generateFullAnalysis } from "@/lib/ai";
import { currentUser } from "@clerk/nextjs/server";

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

    // Get dispute with preview
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

    // Check authorization: payment completed OR bypass enabled
    const isUnlocked = await isDisputeUnlocked(id);
    const bypassEnabled = process.env.BYPASS_PAYWALL === "true";

    if (!isUnlocked && !bypassEnabled) {
      return NextResponse.json(
        { error: "Payment required to generate full analysis" },
        { status: 403 }
      );
    }

    // Check if full analysis already exists (caching)
    if (dispute.aiFullAnalysis) {
      console.log("Returning cached full analysis for dispute:", id);
      return NextResponse.json(dispute);
    }

    // Verify preview exists
    if (!dispute.aiPreview) {
      return NextResponse.json(
        { error: "Preview must be generated first" },
        { status: 400 }
      );
    }

    // Get user name from Clerk
    const user = await currentUser();
    const userName = user?.firstName
      ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
      : undefined;

    // Generate full AI analysis
    const evidenceFiles = (dispute.evidenceFiles as any[]) || [];
    const preview = dispute.aiPreview as any;

    const fullAnalysis = await generateFullAnalysis(
      dispute.type,
      dispute.description,
      evidenceFiles,
      preview,
      userName
    );

    // Update dispute with full analysis
    const updatedDispute = await prisma.dispute.update({
      where: { id },
      data: {
        aiFullAnalysis: fullAnalysis,
      },
    });

    return NextResponse.json(updatedDispute);
  } catch (error) {
    console.error("Error generating full analysis:", error);
    return NextResponse.json(
      { error: "Failed to generate full analysis" },
      { status: 500 }
    );
  }
}
