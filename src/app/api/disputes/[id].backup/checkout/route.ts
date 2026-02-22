import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { PRICING } from "@/lib/pricing";
import { isDisputeUnlocked, getPendingPayment } from "@/lib/payments";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: disputeId } = params;

    // 1. Verify dispute exists and user owns it
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
    }

    if (dispute.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 2. Check if already unlocked
    const isUnlocked = await isDisputeUnlocked(disputeId);
    if (isUnlocked) {
      return NextResponse.json(
        { error: "Dispute already unlocked" },
        { status: 400 }
      );
    }

    // 3. Check for existing pending payment
    const existingPendingPayment = await getPendingPayment(disputeId);
    
    // If there's a recent pending payment (< 24 hours), we could reuse it
    // For now, we'll create a new session
    
    // 4. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: PRICING.DISPUTE_UNLOCK.currency,
            unit_amount: PRICING.DISPUTE_UNLOCK.amount,
            product_data: {
              name: "Dispute Analysis Unlock",
              description: `Unlock full analysis for: ${dispute.title}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        disputeId,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/disputes/${disputeId}/preview?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/disputes/${disputeId}/preview?canceled=true`,
    });

    // 5. Create Payment record with PENDING status
    await prisma.payment.create({
      data: {
        userId,
        disputeId,
        stripeSessionId: session.id,
        amount: PRICING.DISPUTE_UNLOCK.amount,
        currency: PRICING.DISPUTE_UNLOCK.currency,
        status: "PENDING",
      },
    });

    // 6. Return checkout URL
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
