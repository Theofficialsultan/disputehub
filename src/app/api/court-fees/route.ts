/**
 * API Route: Court Fee Calculator
 */

import { NextRequest, NextResponse } from "next/server";
import { calculateCourtFees, getFeeBreakdown, checkFeeRemissionEligibility } from "@/lib/legal/court-fees";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const claimAmount = parseFloat(searchParams.get("amount") || "0");

  if (isNaN(claimAmount) || claimAmount < 0) {
    return NextResponse.json(
      { error: "Invalid claim amount" },
      { status: 400 }
    );
  }

  const fees = calculateCourtFees(claimAmount);
  const breakdown = getFeeBreakdown(claimAmount);

  return NextResponse.json({
    fees,
    breakdown,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (type === "remission") {
      const eligibility = checkFeeRemissionEligibility({
        grossMonthlyIncome: data.grossMonthlyIncome || 0,
        hasPartner: data.hasPartner || false,
        partnerIncome: data.partnerIncome || 0,
        savings: data.savings || 0,
        children: data.children || 0,
        receivingBenefits: data.receivingBenefits || false,
        benefitType: data.benefitType,
      });

      return NextResponse.json({ eligibility });
    }

    return NextResponse.json(
      { error: "Unknown request type" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
