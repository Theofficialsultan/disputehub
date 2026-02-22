import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { z } from "zod";

const startDisputeSchema = z.object({
  mode: z.enum(["QUICK", "GUIDED"]),
  tier: z.enum(["TIER_1_SIMPLE", "TIER_2_ADR", "TIER_3_COURT"]).optional().default("TIER_1_SIMPLE"),
});

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = startDisputeSchema.parse(body);

    // Create dispute with mode and tier
    const dispute = await prisma.dispute.create({
      data: {
        userId,
        mode: validatedData.mode,
        documentTier: validatedData.tier,
        // Set conversationStatus only for GUIDED cases
        conversationStatus: validatedData.mode === "GUIDED" ? "OPEN" : null,
        status: "DRAFT",
        // Placeholder values - to be filled in later
        title: "",
        description: "",
        type: "",
      },
    });

    console.log(`[Start] Created dispute ${dispute.id} with tier: ${dispute.documentTier}, mode: ${dispute.mode}`);

    return NextResponse.json({
      id: dispute.id,
      mode: dispute.mode,
      tier: dispute.documentTier,
    });
  } catch (error) {
    console.error("Error starting dispute:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to start dispute" },
      { status: 500 }
    );
  }
}
