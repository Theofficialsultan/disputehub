"use client";

import { useState } from "react";
import { toast } from "sonner";
import { formatPrice, PRICING } from "@/lib/pricing";
import { Button } from "@/components/ui/button";

interface UnlockButtonProps {
  disputeId: string;
}

export function UnlockButton({ disputeId }: UnlockButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleUnlock = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/disputes/${disputeId}/checkout`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create checkout session");
      }

      const { url } = await response.json();

      if (!url) {
        throw new Error("No checkout URL returned");
      }

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to start checkout"
      );
      setIsLoading(false);
    }
  };

  const price = formatPrice(
    PRICING.DISPUTE_UNLOCK.amount,
    PRICING.DISPUTE_UNLOCK.currency
  );

  return (
    <Button
      onClick={handleUnlock}
      disabled={isLoading}
      loading={isLoading}
      size="xl"
      className="w-full md:w-auto"
    >
      {isLoading ? "Processing..." : `Unlock Full Analysis - ${price}`}
    </Button>
  );
}
