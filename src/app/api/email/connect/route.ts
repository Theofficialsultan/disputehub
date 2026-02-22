import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { getGmailAuthUrl } from "@/lib/email/oauth-gmail";
import { getOutlookAuthUrl } from "@/lib/email/oauth-outlook";

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { provider } = await request.json();

    if (provider === "gmail") {
      const authUrl = getGmailAuthUrl(userId);
      return NextResponse.json({ authUrl });
    } else if (provider === "outlook") {
      const authUrl = getOutlookAuthUrl(userId);
      return NextResponse.json({ authUrl });
    } else {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Email connect error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
