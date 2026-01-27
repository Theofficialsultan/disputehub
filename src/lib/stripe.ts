import Stripe from "stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!stripeKey || stripeKey === "sk_test_your_key_here") {
  throw new Error(
    "STRIPE_SECRET_KEY is not configured. Please add your Stripe test key from https://dashboard.stripe.com/test/apikeys to .env"
  );
}

export const stripe = new Stripe(stripeKey, {
  apiVersion: "2024-12-18.acacia",
  typescript: true,
});
