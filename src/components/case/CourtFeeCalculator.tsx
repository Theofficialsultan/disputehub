"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Calculator, 
  PoundSterling, 
  Scale,
  HelpCircle,
  ExternalLink,
  Info
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FeeResult {
  claimValue: number;
  issueFee: number;
  allocationFee: number;
  totalFees: number;
  track: string;
  trackDescription: string;
  costsRecovery: string;
  helpWithFees: {
    url: string;
    description: string;
  };
}

interface CourtFeeCalculatorProps {
  initialAmount?: number;
  onFeeCalculated?: (result: FeeResult) => void;
  compact?: boolean;
}

export function CourtFeeCalculator({
  initialAmount,
  onFeeCalculated,
  compact = false,
}: CourtFeeCalculatorProps) {
  const [amount, setAmount] = useState<string>(initialAmount?.toString() || "");
  const [result, setResult] = useState<FeeResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialAmount) {
      calculateFees(initialAmount);
    }
  }, [initialAmount]);

  const calculateFees = async (value?: number) => {
    const claimValue = value || parseFloat(amount);
    if (isNaN(claimValue) || claimValue <= 0) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/court-fees?amount=${claimValue}`);
      if (response.ok) {
        const data = await response.json();
        setResult(data);
        onFeeCalculated?.(data);
      }
    } catch (error) {
      console.error("Failed to calculate fees:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTrackColor = (track: string) => {
    switch (track) {
      case "small claims":
        return "text-green-500 bg-green-500/10 border-green-500/30";
      case "fast track":
        return "text-amber-500 bg-amber-500/10 border-amber-500/30";
      case "multi track":
        return "text-red-500 bg-red-500/10 border-red-500/30";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  if (compact && result) {
    return (
      <div className="flex items-center gap-4 p-3 rounded-lg border bg-card">
        <div className="flex items-center gap-2">
          <PoundSterling className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">Court fees:</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-semibold">£{result.totalFees.toLocaleString()}</span>
          <span className={`text-xs px-2 py-1 rounded-full border ${getTrackColor(result.track)}`}>
            {result.track}
          </span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">{result.costsRecovery}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Court Fee Calculator</h3>
      </div>

      <div className="space-y-4">
        {/* Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              placeholder="Enter claim amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && calculateFees()}
              className="pl-9"
            />
          </div>
          <Button onClick={() => calculateFees()} disabled={isLoading}>
            Calculate
          </Button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Track indicator */}
            <div className={`p-3 rounded-lg border ${getTrackColor(result.track)}`}>
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4" />
                <span className="font-medium capitalize">{result.track}</span>
              </div>
              <p className="text-sm mt-1 opacity-80">{result.trackDescription}</p>
            </div>

            {/* Fee breakdown */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Issue fee</span>
                <span>£{result.issueFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  Allocation fee
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3 w-3" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Paid when your case is allocated to a track</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </span>
                <span>£{result.allocationFee.toLocaleString()}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total court fees</span>
                <span className="text-primary">£{result.totalFees.toLocaleString()}</span>
              </div>
            </div>

            {/* Costs recovery note */}
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <p className="text-muted-foreground">{result.costsRecovery}</p>
            </div>

            {/* Help with fees */}
            <a
              href={result.helpWithFees.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <HelpCircle className="h-4 w-4" />
              Can't afford the fee? Check if you qualify for Help with Fees
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>
    </Card>
  );
}
