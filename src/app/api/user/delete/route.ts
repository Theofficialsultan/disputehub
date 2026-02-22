import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete user and all related data (cascades via Prisma relations)
    // The schema has onDelete: Cascade for disputes, which cascades to:
    // - caseMessages
    // - caseStrategy
    // - documentPlan -> documents
    // - generatedDocuments
    // - caseEvents
    // - evidenceItems
    // - payments
    // - notifications

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Account and all associated data have been deleted" 
    });
  } catch (error) {
    console.error("[USER_DELETE_ERROR]", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
