"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Gavel, FileText, Image, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CaseStrategy } from "@/types/chat";

type StrategySummaryPanelProps = {
  strategy: CaseStrategy | null;
  isLoading: boolean;
};

// Humanize dispute type values
function humanizeDisputeType(type: string | null): string {
  if (!type) return "Not identified yet";

  const typeMap: Record<string, string> = {
    parking_ticket: "Parking Ticket",
    speeding_ticket: "Speeding Ticket",
    landlord: "Landlord Dispute",
    employment: "Employment Issue",
    consumer: "Consumer Rights",
    flight_delay: "Flight Delay/Cancellation",
    benefits: "Benefits Claim",
    immigration: "Immigration Matter",
    other: "Other Legal Matter",
  };

  return typeMap[type] || type;
}

export function StrategySummaryPanel({
  strategy,
  isLoading,
}: StrategySummaryPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't render if loading and no strategy yet
  if (isLoading && !strategy) {
    return null;
  }

  // If no strategy exists at all, show a minimal message
  if (!strategy) {
    return (
      <div className="mx-auto mb-4 max-w-3xl rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-center text-sm text-slate-500">
          We're learning about your case as we chat. Information will appear here as you share details.
        </p>
      </div>
    );
  }

  const hasAnyData =
    strategy.disputeType ||
    strategy.keyFacts.length > 0 ||
    strategy.evidenceMentioned.length > 0 ||
    strategy.desiredOutcome;

  // If strategy exists but has no data yet
  if (!hasAnyData) {
    return (
      <div className="mx-auto mb-4 max-w-3xl rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-center text-sm text-slate-500">
          We're learning about your case as we chat. Information will appear here as you share details.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto mb-4 max-w-3xl rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header (Always Visible) */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-slate-50"
        aria-expanded={isExpanded}
        aria-controls="strategy-content"
      >
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <h2 className="font-semibold text-slate-900">What we know so far</h2>
          <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-700 border-slate-200">
            {[
              strategy.disputeType ? 1 : 0,
              strategy.keyFacts.length,
              strategy.evidenceMentioned.length,
              strategy.desiredOutcome ? 1 : 0,
            ].reduce((a, b) => a + b, 0)}{" "}
            items
          </Badge>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-slate-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-500" />
        )}
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div
          id="strategy-content"
          className="border-t border-slate-200 px-4 pb-4 pt-3 space-y-4"
        >
          {/* Dispute Type */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Gavel className="h-4 w-4 text-slate-500" />
              <h3 className="text-sm font-medium text-slate-900">Dispute Type</h3>
            </div>
            <p className="text-sm text-slate-600 pl-6">
              {humanizeDisputeType(strategy.disputeType)}
            </p>
          </div>

          {/* Key Facts */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-500" />
              <h3 className="text-sm font-medium text-slate-900">Key Facts</h3>
            </div>
            {strategy.keyFacts.length > 0 ? (
              <ul className="space-y-1 pl-6">
                {strategy.keyFacts.map((fact, index) => (
                  <li
                    key={index}
                    className="text-sm text-slate-600 list-disc"
                  >
                    {fact}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 pl-6 italic">
                No key facts recorded yet
              </p>
            )}
          </div>

          {/* Evidence Mentioned */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Image className="h-4 w-4 text-slate-500" />
              <h3 className="text-sm font-medium text-slate-900">Evidence Mentioned</h3>
            </div>
            {strategy.evidenceMentioned.length > 0 ? (
              <ul className="space-y-1 pl-6">
                {strategy.evidenceMentioned.map((evidence, index) => (
                  <li
                    key={index}
                    className="text-sm text-slate-600 list-disc"
                  >
                    {evidence}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500 pl-6 italic">
                No evidence mentioned yet
              </p>
            )}
          </div>

          {/* Desired Outcome */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Target className="h-4 w-4 text-slate-500" />
              <h3 className="text-sm font-medium text-slate-900">Desired Outcome</h3>
            </div>
            <p
              className={`text-sm pl-6 ${
                strategy.desiredOutcome
                  ? "text-slate-600"
                  : "text-slate-500 italic"
              }`}
            >
              {strategy.desiredOutcome || "Not specified yet"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
