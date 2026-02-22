"use client";

import { useState, useEffect } from "react";
import { CaseLifecycleStatus, CaseEventType } from "@prisma/client";
import { FileText, Clock } from "lucide-react";
import { CaseStatusHeader } from "./CaseStatusHeader";
import { DeadlineCountdown } from "./DeadlineCountdown";
import { EmbeddedTimeline } from "./EmbeddedTimeline";
import { SystemExplanationPanel } from "./SystemExplanationPanel";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface CaseControlCenterProps {
  disputeId: string;
  lifecycleStatus: CaseLifecycleStatus;
  caseTitle: string;
}

interface WaitingStatus {
  lifecycleStatus: CaseLifecycleStatus;
  waitingUntil: string | null;
  daysRemaining: number | null;
}

interface TimelineEvent {
  id: string;
  type: CaseEventType;
  description: string;
  occurredAt: string;
  relatedDocumentId?: string | null;
}

export function CaseControlCenter({
  disputeId,
  lifecycleStatus,
  caseTitle,
}: CaseControlCenterProps) {
  const [waitingStatus, setWaitingStatus] = useState<WaitingStatus | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(true);

  useEffect(() => {
    loadWaitingStatus();
    loadTimeline();
  }, [disputeId]);

  const loadWaitingStatus = async () => {
    try {
      setIsLoadingStatus(true);
      const response = await fetch(`/api/disputes/${disputeId}/waiting-status`);
      if (response.ok) {
        const data = await response.json();
        setWaitingStatus(data);
      }
    } catch (err) {
      console.error("Error loading waiting status:", err);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const loadTimeline = async () => {
    try {
      setIsLoadingTimeline(true);
      const response = await fetch(`/api/disputes/${disputeId}/timeline`);
      if (response.ok) {
        const data = await response.json();
        setTimelineEvents(data.events || []);
      }
    } catch (err) {
      console.error("Error loading timeline:", err);
    } finally {
      setIsLoadingTimeline(false);
    }
  };

  // Check if there's a follow-up in the timeline
  const hasFollowUp = timelineEvents.some(
    (event) => event.type === "FOLLOW_UP_GENERATED"
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Case Status</h2>
        <p className="mt-1 text-sm text-slate-600">{caseTitle}</p>
      </div>

      {/* Status Header */}
      <CaseStatusHeader lifecycleStatus={lifecycleStatus} />

      {/* Deadline Countdown */}
      {!isLoadingStatus && waitingStatus && (
        <DeadlineCountdown
          waitingUntil={waitingStatus.waitingUntil}
          daysRemaining={waitingStatus.daysRemaining}
          lifecycleStatus={lifecycleStatus}
        />
      )}

      {/* System Explanation */}
      <SystemExplanationPanel
        lifecycleStatus={lifecycleStatus}
        hasFollowUp={hasFollowUp}
      />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link href={`/disputes/${disputeId}/documents`}>
          <Button variant="outline" className="w-full">
            <FileText className="mr-2 h-4 w-4" />
            View Documents
          </Button>
        </Link>
        <Link href={`/disputes/${disputeId}/timeline`}>
          <Button variant="outline" className="w-full">
            <Clock className="mr-2 h-4 w-4" />
            Full Timeline
          </Button>
        </Link>
      </div>

      {/* Embedded Timeline */}
      <div>
        <h3 className="mb-4 text-sm font-semibold text-slate-900">
          Recent Activity
        </h3>
        {isLoadingTimeline ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-600" />
            <p className="mt-4 text-sm text-slate-600">Loading timeline...</p>
          </div>
        ) : (
          <EmbeddedTimeline events={timelineEvents.slice(0, 5)} />
        )}
        {timelineEvents.length > 5 && (
          <div className="mt-4 text-center">
            <Link href={`/disputes/${disputeId}/timeline`}>
              <Button variant="ghost" size="sm">
                View all {timelineEvents.length} events
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
