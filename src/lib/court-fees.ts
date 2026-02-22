/**
 * UK Court Fee Calculator
 * Based on EX50 Civil and Family Court Fees (2024)
 * https://www.gov.uk/government/publications/fees-in-the-civil-and-family-courts-main-fees-ex50
 */

export interface CourtFeeResult {
  fee: number;
  track: "small_claims" | "fast_track" | "multi_track";
  description: string;
  feeReduction?: {
    eligible: boolean;
    reducedFee?: number;
    note: string;
  };
}

/**
 * Calculate County Court claim issue fee
 * Based on claim value
 */
export function calculateCourtFee(claimValue: number): CourtFeeResult {
  let fee: number;
  let track: CourtFeeResult["track"];
  let description: string;

  // Fee bands (as of 2024)
  if (claimValue <= 300) {
    fee = 35;
    track = "small_claims";
    description = "Claims up to £300";
  } else if (claimValue <= 500) {
    fee = 50;
    track = "small_claims";
    description = "Claims £300.01 to £500";
  } else if (claimValue <= 1000) {
    fee = 70;
    track = "small_claims";
    description = "Claims £500.01 to £1,000";
  } else if (claimValue <= 1500) {
    fee = 80;
    track = "small_claims";
    description = "Claims £1,000.01 to £1,500";
  } else if (claimValue <= 3000) {
    fee = 115;
    track = "small_claims";
    description = "Claims £1,500.01 to £3,000";
  } else if (claimValue <= 5000) {
    fee = 205;
    track = "small_claims";
    description = "Claims £3,000.01 to £5,000";
  } else if (claimValue <= 10000) {
    fee = 455;
    track = "small_claims";
    description = "Claims £5,000.01 to £10,000";
  } else if (claimValue <= 25000) {
    fee = 455; // Same for fast track up to £10k boundary, then percentage
    track = "fast_track";
    // Above £10,000: 5% of claim value
    fee = Math.round(claimValue * 0.05);
    description = "Claims £10,000.01 to £25,000 (5% of claim)";
  } else if (claimValue <= 50000) {
    fee = Math.round(claimValue * 0.05);
    track = "fast_track";
    description = "Claims £25,000.01 to £50,000 (5% of claim)";
  } else if (claimValue <= 100000) {
    fee = Math.round(claimValue * 0.05);
    track = "multi_track";
    description = "Claims £50,000.01 to £100,000 (5% of claim)";
  } else if (claimValue <= 200000) {
    fee = 5000 + Math.round((claimValue - 100000) * 0.045);
    track = "multi_track";
    description = "Claims £100,000.01 to £200,000";
  } else {
    fee = 10000; // Maximum fee
    track = "multi_track";
    description = "Claims over £200,000 (maximum fee £10,000)";
  }

  return {
    fee,
    track,
    description,
    feeReduction: {
      eligible: true,
      note: "You may be eligible for Help with Fees if you're on a low income or benefits. Apply at: https://www.gov.uk/get-help-with-court-fees",
    },
  };
}

/**
 * Calculate Employment Tribunal fee
 * Currently £0 (fees were abolished in 2017)
 */
export function calculateEmploymentTribunalFee(): CourtFeeResult {
  return {
    fee: 0,
    track: "small_claims", // Not applicable but using default
    description: "Employment Tribunal fees were abolished in 2017",
  };
}

/**
 * Calculate First-tier Tribunal (Social Security) fee
 */
export function calculateSSCSFee(): CourtFeeResult {
  return {
    fee: 0,
    track: "small_claims",
    description: "Appeals to the First-tier Tribunal (Social Security and Child Support) are free",
  };
}

/**
 * Calculate allocation (hearing) fee
 * Paid when case is allocated to a track
 */
export function calculateAllocationFee(claimValue: number): number {
  if (claimValue <= 3000) return 0; // No allocation fee for small claims under £3k
  if (claimValue <= 10000) return 170; // Small claims
  if (claimValue <= 25000) return 335; // Fast track
  return 545; // Multi-track
}

/**
 * Calculate total expected court costs
 */
export function calculateTotalCourtCosts(claimValue: number): {
  issueFee: number;
  allocationFee: number;
  total: number;
  track: string;
  note: string;
} {
  const issueFeeResult = calculateCourtFee(claimValue);
  const allocationFee = calculateAllocationFee(claimValue);

  return {
    issueFee: issueFeeResult.fee,
    allocationFee,
    total: issueFeeResult.fee + allocationFee,
    track: issueFeeResult.track.replace("_", " "),
    note: issueFeeResult.track === "small_claims"
      ? "Small claims track: You generally cannot recover legal costs, only court fees and limited expenses."
      : "You may be able to recover reasonable legal costs if you win.",
  };
}

/**
 * API endpoint data structure
 */
export interface CourtFeeAPIResponse {
  claimValue: number;
  issueFee: number;
  allocationFee: number;
  totalFees: number;
  track: string;
  trackDescription: string;
  feeBreakdown: {
    name: string;
    amount: number;
    when: string;
  }[];
  helpWithFees: {
    url: string;
    description: string;
  };
  costsRecovery: string;
}

export function getCourtFeeAPIResponse(claimValue: number): CourtFeeAPIResponse {
  const costs = calculateTotalCourtCosts(claimValue);
  const issueFeeResult = calculateCourtFee(claimValue);

  return {
    claimValue,
    issueFee: costs.issueFee,
    allocationFee: costs.allocationFee,
    totalFees: costs.total,
    track: costs.track,
    trackDescription: issueFeeResult.description,
    feeBreakdown: [
      {
        name: "Issue fee",
        amount: costs.issueFee,
        when: "When filing the claim",
      },
      {
        name: "Allocation fee",
        amount: costs.allocationFee,
        when: "When case is allocated to a track",
      },
    ],
    helpWithFees: {
      url: "https://www.gov.uk/get-help-with-court-fees",
      description: "You may be eligible for fee remission if you're on a low income or receiving certain benefits.",
    },
    costsRecovery: costs.note,
  };
}
