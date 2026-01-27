import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { createDisputeSchema } from "@/lib/validations/dispute";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const disputeId = params.id;

    // Verify dispute exists and belongs to user
    const existingDispute = await prisma.dispute.findFirst({
      where: {
        id: disputeId,
        userId,
      },
    });

    if (!existingDispute) {
      return NextResponse.json(
        { error: "Dispute not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = createDisputeSchema.parse(body);

    // Update the dispute
    const dispute = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        type: validatedData.type,
        title: validatedData.title,
        description: validatedData.description,
        evidenceFiles: validatedData.evidenceFiles || [],
      },
    });

    return NextResponse.json(dispute);
  } catch (error) {
    console.error("Error updating dispute:", error);
    return NextResponse.json(
      { error: "Failed to update dispute" },
      { status: 500 }
    );
  }
}
