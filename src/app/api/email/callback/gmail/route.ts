import { NextRequest, NextResponse } from "next/server";
import { handleGmailCallback } from "@/lib/email/oauth-gmail";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // userId
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        new URL(`/settings?email_error=${encodeURIComponent(error)}`, process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/settings?email_error=Missing+authorization+code", process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    const result = await handleGmailCallback(code, state);

    return NextResponse.redirect(
      new URL(
        `/settings?email_connected=${encodeURIComponent(result.email)}&provider=gmail`,
        process.env.NEXT_PUBLIC_APP_URL!
      )
    );
  } catch (error: any) {
    console.error("Gmail callback error:", error);
    return NextResponse.redirect(
      new URL(
        `/settings?email_error=${encodeURIComponent(error.message)}`,
        process.env.NEXT_PUBLIC_APP_URL!
      )
    );
  }
}
