import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Extract metadata
        const { userId, disputeId } = session.metadata || {};

        if (!userId || !disputeId) {
          console.error("Missing metadata in checkout session:", session.id);
          return NextResponse.json(
            { error: "Missing metadata" },
            { status: 400 }
          );
        }

        // Find the pending payment
        const payment = await prisma.payment.findUnique({
          where: { stripeSessionId: session.id },
        });

        if (!payment) {
          console.error("Payment not found for session:", session.id);
          return NextResponse.json(
            { error: "Payment not found" },
            { status: 404 }
          );
        }

        // Idempotency check - don't process if already completed
        if (payment.status === "COMPLETED") {
          console.log("Payment already completed:", payment.id);
          return NextResponse.json({ received: true });
        }

        // Update payment to COMPLETED
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "COMPLETED",
            stripePaymentId: session.payment_intent as string,
          },
        });

        console.log("Payment completed:", payment.id, "for dispute:", disputeId);
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Mark payment as FAILED if session expired
        const payment = await prisma.payment.findUnique({
          where: { stripeSessionId: session.id },
        });

        if (payment && payment.status === "PENDING") {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: "FAILED" },
          });

          console.log("Payment marked as failed (expired):", payment.id);
        }
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
