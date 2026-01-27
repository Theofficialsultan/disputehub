"use client";

import { CaseLifecycleStatus } from "@prisma/client";
import { Info } from "lucide-react";

interface SystemExplanationPanelProps {
  lifecycleStatus: CaseLifecycleStatus;
  hasFollowUp?: boolean;
}

export function SystemExplanationPanel({
  lifecycleStatus,
  hasFollowUp,
}: SystemExplanationPanelProps) {
  const getExplanation = () => {
    switch (lifecycleStatus) {
      case "DRAFT":
        return {
          title: "Your case is being prepared",
          points: [
            "Our AI is gathering information from your conversation",
            "Once complete, we'll generate the necessary documents",
          ],
        };
      case "DOCUMENT_SENT":
      case "AWAITING_RESPONSE":
        return {
          title: "What happens now?",
          points: [
            "Deadlines are tracked automatically so you don't have to",
            "We'll notify you if the other party responds",
            hasFollowUp
              ? "We automatically sent a follow-up because the deadline passed"
              : "If the deadline passes, we'll take the next step automatically",
          ],
        };
      case "DEADLINE_MISSED":
        return {
          title: "Deadline passed",
          points: [
            "We automatically sent a follow-up because the deadline passed",
            "A new 14-day response deadline has been set",
            "You don't need to do anything — the system is managing this for you",
          ],
        };
      case "RESPONSE_RECEIVED":
        return {
          title: "Response received",
          points: [
            "The other party has responded to your case",
            "Review their response and decide on next steps",
          ],
        };
      case "CLOSED":
        return {
          title: "Case closed",
          points: [
            "This case has been closed",
            "All documents and timeline events are preserved for your records",
          ],
        };
      default:
        return {
          title: "System-managed case",
          points: [
            "This case will update automatically as events occur",
            "You'll be notified of important changes",
          ],
        };
    }
  };

  const explanation = getExplanation();

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div className="flex items-start gap-3">
        <Info className="h-5 w-5 flex-shrink-0 text-blue-600" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-blue-900">
            {explanation.title}
          </h3>
          <ul className="mt-2 space-y-1">
            {explanation.points.map((point, index) => (
              <li key={index} className="text-xs text-blue-800">
                • {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
