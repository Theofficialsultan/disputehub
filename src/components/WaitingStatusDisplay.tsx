"use client";

import { useState, useEffect } from "react";
import { Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WaitingStatusDisplayProps {
  disputeId: string;
}

type LifecycleStatus =
  | "DRAFT"
  | "DOCUMENT_SENT"
  | "AWAITING_RESPONSE"
  | "RESPONSE_RECEIVED"
  | "DEADLINE_MISSED"
  | "CLOSED";

interface WaitingStatus {
  lifecycleStatus: LifecycleStatus;
  waitingUntil: string | null;
  daysRemaining: number | null;
}

export function WaitingStatusDisplay({ disputeId }: WaitingStatusDisplayProps) {
  const [status, setStatus] = useState<WaitingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStatus();
  }, [disputeId]);

  const loadStatus = async () => {
    try {
      setIsLoading(true);

      const response = await fetch(`/api/disputes/${disputeId}/waiting-status`);

      if (!response.ok) {
        throw new Error("Failed to load status");
      }

      const data = await response.json();
      setStatus(data);
    } catch (err) {
      console.error("Error loading waiting status:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !status) {
    return null;
  }

  // Only show for relevant states
  if (
    status.lifecycleStatus === "DRAFT" ||
    status.lifecycleStatus === "DOCUMENT_SENT"
  ) {
    return null;
  }

  if (status.lifecycleStatus === "AWAITING_RESPONSE") {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 flex-shrink-0 text-blue-600" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-500">Awaiting Response</Badge>
            </div>
            <p className="mt-2 text-sm text-blue-800">
              Waiting for response from the other party.
            </p>
            {status.daysRemaining !== null && (
              <p className="mt-1 text-xs text-blue-600">
                {status.daysRemaining > 0 ? (
                  <>
                    <strong>{status.daysRemaining}</strong> day
                    {status.daysRemaining !== 1 ? "s" : ""} remaining
                  </>
                ) : (
                  <>Deadline is today</>
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (status.lifecycleStatus === "DEADLINE_MISSED") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-600" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-red-500">Deadline Missed</Badge>
            </div>
            <p className="mt-2 text-sm text-red-800">
              Response deadline has passed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status.lifecycleStatus === "RESPONSE_RECEIVED") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500">Response Received</Badge>
            </div>
            <p className="mt-2 text-sm text-green-800">
              Response has been received.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
