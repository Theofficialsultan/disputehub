import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    const result = await prisma.user.updateMany({
      where: email ? { email: { contains: email, mode: "insensitive" } } : {},
      data: { onboardingCompleted: false }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Reset onboarding for ${result.count} users` 
    });
  } catch (error) {
    console.error("Error resetting onboarding:", error);
    return NextResponse.json({ error: "Failed to reset" }, { status: 500 });
  }
}
