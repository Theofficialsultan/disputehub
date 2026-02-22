import { prisma } from "@/lib/prisma";

/**
 * Check if a dispute is unlocked (has a completed payment)
 * This is the SINGLE SOURCE OF TRUTH for unlock status
 * 
 * DEV ONLY: Set BYPASS_PAYWALL=true in .env to bypass payment check
 * ADMIN: If user has paymentGatewayEnabled=false, bypass payment
 */
export async function isDisputeUnlocked(disputeId: string): Promise<boolean> {
  console.log("🔍 [isDisputeUnlocked] Checking unlock status for dispute:", disputeId);
  
  // DEV ONLY: Bypass paywall for testing
  if (process.env.BYPASS_PAYWALL === "true") {
    console.log("⚠️  PAYWALL BYPASSED (dev mode) for dispute:", disputeId);
    return true;
  }

  try {
    // Get the dispute with user info
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      select: {
        userId: true,
        user: {
          select: {
            email: true,
            paymentGatewayEnabled: true,
          },
        },
      },
    });

    console.log("📊 [isDisputeUnlocked] Dispute data:", {
      disputeId,
      userId: dispute?.userId,
      userEmail: dispute?.user?.email,
      paymentGatewayEnabled: dispute?.user?.paymentGatewayEnabled,
    });

    // ADMIN BYPASS: If payment gateway is disabled for this user, bypass paywall
    if (dispute?.user?.paymentGatewayEnabled === false) {
      console.log("💳 Payment gateway disabled for user - bypassing paywall");
      console.log("   User:", dispute.user.email);
      console.log("   Dispute:", disputeId);
      return true;
    }

    // Production: Check for completed payment
    const payment = await prisma.payment.findFirst({
      where: {
        disputeId,
        status: "COMPLETED",
      },
    });

    const hasPayment = !!payment;
    console.log("💰 [isDisputeUnlocked] Payment check:", {
      hasPayment,
      paymentId: payment?.id,
    });

    return hasPayment;
  } catch (error) {
    console.error("❌ [isDisputeUnlocked] Error:", error);
    return false;
  }
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
