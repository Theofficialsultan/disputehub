import { NextRequest, NextResponse } from "next/server";
import { handleOutlookCallback } from "@/lib/email/oauth-outlook";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // userId
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error) {
      return NextResponse.redirect(
        new URL(
          `/settings?email_error=${encodeURIComponent(errorDescription || error)}`,
          process.env.NEXT_PUBLIC_APP_URL!
        )
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/settings?email_error=Missing+authorization+code", process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    const result = await handleOutlookCallback(code, state);

    return NextResponse.redirect(
      new URL(
        `/settings?email_connected=${encodeURIComponent(result.email)}&provider=outlook`,
        process.env.NEXT_PUBLIC_APP_URL!
      )
    );
  } catch (error: any) {
    console.error("Outlook callback error:", error);
    return NextResponse.redirect(
      new URL(
        `/settings?email_error=${encodeURIComponent(error.message)}`,
        process.env.NEXT_PUBLIC_APP_URL!
      )
    );
  }
}
