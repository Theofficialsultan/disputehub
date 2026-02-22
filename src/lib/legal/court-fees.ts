/**
 * Feature 4: Court Fee Calculator
 * Auto-calculate UK court fees based on claim value
 * 
 * Based on UK Government court fees (2024)
 * Source: https://www.gov.uk/court-fees-what-they-are
 */

export interface CourtFee {
  claimValue: { min: number; max: number | null };
  paperFee: number;
  onlineFee: number;
}

export interface FeeCalculationResult {
  claimAmount: number;
  paperFee: number;
  onlineFee: number;
  savings: number;
  hearingFee: number | null;
  totalEstimatedCostPaper: number;
  totalEstimatedCostOnline: number;
  notes: string[];
  lastUpdated: string;
}

// UK Money Claims Court Fees (as of April 2024)
// These are the fees for issuing a claim in the County Court
const MONEY_CLAIM_FEES: CourtFee[] = [
  { claimValue: { min: 0.01, max: 300 }, paperFee: 35, onlineFee: 35 },
  { claimValue: { min: 300.01, max: 500 }, paperFee: 50, onlineFee: 50 },
  { claimValue: { min: 500.01, max: 1000 }, paperFee: 70, onlineFee: 70 },
  { claimValue: { min: 1000.01, max: 1500 }, paperFee: 80, onlineFee: 80 },
  { claimValue: { min: 1500.01, max: 3000 }, paperFee: 115, onlineFee: 115 },
  { claimValue: { min: 3000.01, max: 5000 }, paperFee: 205, onlineFee: 205 },
  { claimValue: { min: 5000.01, max: 10000 }, paperFee: 455, onlineFee: 455 },
  { claimValue: { min: 10000.01, max: 100000 }, paperFee: 0, onlineFee: 0 }, // 5% of claim
  { claimValue: { min: 100000.01, max: 200000 }, paperFee: 0, onlineFee: 0 }, // 5% capped
  { claimValue: { min: 200000.01, max: null }, paperFee: 10000, onlineFee: 10000 }, // Fixed max
];

// Hearing fees (allocation stage)
const SMALL_CLAIMS_HEARING_FEE = 0; // Small claims track (up to £10,000 - no hearing fee for claimant)
const FAST_TRACK_HEARING_FEE = 545; // Fast track (£10,000 - £25,000)
const MULTI_TRACK_HEARING_FEE = 1090; // Multi-track (over £25,000)

// Employment Tribunal fees (currently suspended but may return)
const EMPLOYMENT_TRIBUNAL_FEES = {
  type_a: { issue: 0, hearing: 0 }, // Unpaid wages, redundancy pay
  type_b: { issue: 0, hearing: 0 }, // Unfair dismissal, discrimination
};

/**
 * Calculate court fees for a money claim
 */
export function calculateCourtFees(claimAmount: number): FeeCalculationResult {
  if (claimAmount <= 0) {
    return {
      claimAmount: 0,
      paperFee: 0,
      onlineFee: 0,
      savings: 0,
      hearingFee: null,
      totalEstimatedCostPaper: 0,
      totalEstimatedCostOnline: 0,
      notes: ["Please enter a valid claim amount greater than £0"],
      lastUpdated: "April 2024",
    };
  }

  let paperFee = 0;
  let onlineFee = 0;
  const notes: string[] = [];

  // Find the applicable fee band
  for (const feeBand of MONEY_CLAIM_FEES) {
    const { min, max } = feeBand.claimValue;
    if (claimAmount >= min && (max === null || claimAmount <= max)) {
      if (feeBand.paperFee === 0 && claimAmount <= 200000) {
        // 5% of claim value for claims between £10,000 and £200,000
        paperFee = Math.round(claimAmount * 0.05);
        onlineFee = Math.round(claimAmount * 0.05);
        notes.push("Fee is 5% of the claim value");
      } else {
        paperFee = feeBand.paperFee;
        onlineFee = feeBand.onlineFee;
      }
      break;
    }
  }

  // Calculate hearing fee based on track allocation
  let hearingFee: number | null = null;
  if (claimAmount <= 10000) {
    hearingFee = SMALL_CLAIMS_HEARING_FEE;
    notes.push("Small claims track - no hearing fee for claimant");
  } else if (claimAmount <= 25000) {
    hearingFee = FAST_TRACK_HEARING_FEE;
    notes.push("Fast track - hearing fee applies if case proceeds to trial");
  } else {
    hearingFee = MULTI_TRACK_HEARING_FEE;
    notes.push("Multi-track - hearing fee applies if case proceeds to trial");
  }

  // Add helpful notes
  if (claimAmount <= 10000) {
    notes.push("Small claims track is designed for simpler cases");
    notes.push("You can represent yourself without a solicitor");
    notes.push("Limited costs recovery if you win");
  }

  if (claimAmount > 10000) {
    notes.push("Consider getting legal advice for larger claims");
    notes.push("Costs may be recoverable from the losing party");
  }

  // Calculate savings from online submission
  const savings = paperFee - onlineFee;

  return {
    claimAmount,
    paperFee,
    onlineFee,
    savings,
    hearingFee,
    totalEstimatedCostPaper: paperFee + (hearingFee || 0),
    totalEstimatedCostOnline: onlineFee + (hearingFee || 0),
    notes,
    lastUpdated: "April 2024",
  };
}

/**
 * Calculate Employment Tribunal fees
 * Note: ET fees are currently suspended but this function is ready for when they return
 */
export function calculateEmploymentTribunalFees(claimType: "type_a" | "type_b"): {
  issueFee: number;
  hearingFee: number;
  total: number;
  notes: string[];
} {
  const fees = EMPLOYMENT_TRIBUNAL_FEES[claimType];
  
  return {
    issueFee: fees.issue,
    hearingFee: fees.hearing,
    total: fees.issue + fees.hearing,
    notes: [
      "Employment Tribunal fees are currently suspended",
      "Claims can be submitted without fee",
      "This may change in the future",
    ],
  };
}

/**
 * Check eligibility for fee remission (Help with Fees)
 */
export function checkFeeRemissionEligibility(params: {
  grossMonthlyIncome: number;
  hasPartner: boolean;
  partnerIncome?: number;
  savings: number;
  children: number;
  receivingBenefits: boolean;
  benefitType?: string;
}): {
  eligible: boolean;
  remissionLevel: "full" | "partial" | "none";
  estimatedRemission: number;
  notes: string[];
} {
  const { grossMonthlyIncome, hasPartner, partnerIncome = 0, savings, children, receivingBenefits, benefitType } = params;

  const notes: string[] = [];
  let eligible = false;
  let remissionLevel: "full" | "partial" | "none" = "none";
  let estimatedRemission = 0;

  // Full remission for those on qualifying benefits
  const qualifyingBenefits = [
    "Universal Credit",
    "Income Support",
    "Income-based JSA",
    "Income-related ESA",
    "Guarantee Credit (Pension Credit)",
  ];

  if (receivingBenefits && benefitType && qualifyingBenefits.includes(benefitType)) {
    eligible = true;
    remissionLevel = "full";
    estimatedRemission = 100;
    notes.push(`Receiving ${benefitType} - likely eligible for full remission`);
  }

  // Savings threshold
  const savingsThreshold = hasPartner ? 3000 : 3000;
  if (savings > savingsThreshold + 16000) {
    eligible = false;
    remissionLevel = "none";
    notes.push("Savings exceed the upper limit for fee remission");
  } else if (savings > savingsThreshold) {
    notes.push("Savings may affect remission level - partial remission possible");
  }

  // Income-based assessment
  const totalIncome = grossMonthlyIncome + (hasPartner ? partnerIncome : 0);
  const incomeThreshold = hasPartner ? 1085 : 1085; // Basic threshold, increases with children

  if (!receivingBenefits) {
    if (totalIncome <= incomeThreshold) {
      eligible = true;
      remissionLevel = "full";
      estimatedRemission = 100;
      notes.push("Income within threshold - likely eligible for full remission");
    } else if (totalIncome <= incomeThreshold + 500) {
      eligible = true;
      remissionLevel = "partial";
      estimatedRemission = 50;
      notes.push("Income slightly above threshold - partial remission possible");
    }
  }

  // Children allowance
  if (children > 0) {
    notes.push(`Child dependant allowance increases your threshold by £245 per child`);
  }

  if (!eligible) {
    notes.push("Based on the information provided, you may not qualify for fee remission");
    notes.push("You can still apply - the court will make the final decision");
  }

  return {
    eligible,
    remissionLevel,
    estimatedRemission,
    notes,
  };
}

/**
 * Format fee as currency
 */
export function formatFee(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}

/**
 * Get fee breakdown for display
 */
export function getFeeBreakdown(claimAmount: number): {
  rows: Array<{ label: string; amount: string; highlight?: boolean }>;
  total: string;
} {
  const result = calculateCourtFees(claimAmount);
  
  const rows = [
    { label: "Issue fee (online)", amount: formatFee(result.onlineFee), highlight: true },
    { label: "Issue fee (paper)", amount: formatFee(result.paperFee) },
  ];

  if (result.hearingFee !== null && result.hearingFee > 0) {
    rows.push({
      label: "Hearing fee (if case goes to trial)",
      amount: formatFee(result.hearingFee),
    });
  }

  if (result.savings > 0) {
    rows.push({
      label: "Savings from online submission",
      amount: `- ${formatFee(result.savings)}`,
      highlight: true,
    });
  }

  return {
    rows,
    total: formatFee(result.totalEstimatedCostOnline),
  };
}
