import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { createDisputeSchema } from "@/lib/validations/dispute";

export async function GET() {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const disputes = await prisma.dispute.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(disputes);
  } catch (error: any) {
    console.error("Error fetching disputes:", error?.message || error);
    console.error("Full error:", JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: "Failed to fetch disputes", details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createDisputeSchema.parse(body);

    const dispute = await prisma.dispute.create({
      data: {
        userId,
        type: validatedData.type,
        title: validatedData.title,
        description: validatedData.description,
        evidenceFiles: validatedData.evidenceFiles || [],
        status: "DRAFT",
      },
    });

    return NextResponse.json(dispute);
  } catch (error) {
    console.error("Error creating dispute:", error);
    return NextResponse.json(
      { error: "Failed to create dispute" },
      { status: 500 }
    );
  }
}
