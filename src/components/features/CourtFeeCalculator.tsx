"use client";

import { useState, useCallback } from "react";
import { Calculator, HelpCircle, Banknote, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeeResult {
  claimAmount: number;
  paperFee: number;
  onlineFee: number;
  savings: number;
  hearingFee: number | null;
  totalEstimatedCostPaper: number;
  totalEstimatedCostOnline: number;
  notes: string[];
}

export function CourtFeeCalculator() {
  const [amount, setAmount] = useState<string>("");
  const [result, setResult] = useState<FeeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const calculateFees = useCallback(async () => {
    const claimValue = parseFloat(amount);
    if (isNaN(claimValue) || claimValue <= 0) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/court-fees?amount=${claimValue}`);
      const data = await response.json();
      setResult(data.fees);
    } catch (error) {
      console.error("Error calculating fees:", error);
    } finally {
      setLoading(false);
    }
  }, [amount]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(value);
  };

  return (
    <div className="rounded-2xl glass-strong border border-indigo-500/20 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
          <Calculator className="h-5 w-5 text-white" />
        </div>
        <h3 className="text-lg font-bold text-white">Court Fee Calculator</h3>
      </div>

      <p className="text-sm text-slate-400 mb-4">
        Calculate UK court fees based on your claim value
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Claim Amount (£)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              £
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter claim amount"
              className="w-full pl-8 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        <Button
          onClick={calculateFees}
          disabled={loading || !amount}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
        >
          {loading ? "Calculating..." : "Calculate Fees"}
        </Button>

        {result && (
          <div className="mt-6 space-y-4 animate-fade-up">
            <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Issue Fee (Online)</span>
                <span className="text-lg font-bold text-green-400">
                  {formatCurrency(result.onlineFee)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Issue Fee (Paper)</span>
                <span className="text-slate-300">
                  {formatCurrency(result.paperFee)}
                </span>
              </div>
              {result.savings > 0 && (
                <div className="mt-2 pt-2 border-t border-green-500/20">
                  <span className="text-xs text-green-400">
                    Save {formatCurrency(result.savings)} by filing online!
                  </span>
                </div>
              )}
            </div>

            {result.hearingFee !== null && result.hearingFee > 0 && (
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Hearing Fee (if case goes to trial)</span>
                  <span className="text-white">{formatCurrency(result.hearingFee)}</span>
                </div>
              </div>
            )}

            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white font-medium">Total Estimated Cost</span>
                <span className="text-xl font-bold text-indigo-400">
                  {formatCurrency(result.totalEstimatedCostOnline)}
                </span>
              </div>
            </div>

            {result.notes.length > 0 && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowHelp(!showHelp)}
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  <HelpCircle className="h-4 w-4" />
                  <span>Important Notes</span>
                  {showHelp ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                {showHelp && (
                  <ul className="space-y-1 text-sm text-slate-400 animate-fade-up">
                    {result.notes.map((note, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-indigo-400 mt-1">•</span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
