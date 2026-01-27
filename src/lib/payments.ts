import { prisma } from "@/lib/prisma";

/**
 * Check if a dispute is unlocked (has a completed payment)
 * This is the SINGLE SOURCE OF TRUTH for unlock status
 * 
 * DEV ONLY: Set BYPASS_PAYWALL=true in .env to bypass payment check
 */
export async function isDisputeUnlocked(disputeId: string): Promise<boolean> {
  // DEV ONLY: Bypass paywall for testing
  if (process.env.BYPASS_PAYWALL === "true") {
    console.log("⚠️  PAYWALL BYPASSED (dev mode) for dispute:", disputeId);
    return true;
  }

  // Production: Check for completed payment
  const payment = await prisma.payment.findFirst({
    where: {
      disputeId,
      status: "COMPLETED",
    },
  });

  return !!payment;
}

/**
 * Get the completed payment for a dispute (if exists)
 */
export async function getDisputePayment(disputeId: string) {
  return await prisma.payment.findFirst({
    where: {
      disputeId,
      status: "COMPLETED",
    },
  });
}

/**
 * Check if there's a pending payment for this dispute
 */
export async function hasPendingPayment(disputeId: string): Promise<boolean> {
  const payment = await prisma.payment.findFirst({
    where: {
      disputeId,
      status: "PENDING",
    },
  });

  return !!payment;
}

/**
 * Get or create a pending payment
 * Returns existing pending payment if found, otherwise null
 */
export async function getPendingPayment(disputeId: string) {
  return await prisma.payment.findFirst({
    where: {
      disputeId,
      status: "PENDING",
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
