"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Send,
  MessageSquare,
  Calendar,
  AlertTriangle,
  TrendingUp,
  XCircle,
  Loader2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Dispute } from "@prisma/client";

interface TimelineClientProps {
  dispute: Dispute;
}

type CaseEventType =
  | "DOCUMENT_GENERATED"
  | "DOCUMENT_SENT"
  | "RESPONSE_RECEIVED"
  | "DEADLINE_SET"
  | "DEADLINE_MISSED"
  | "FOLLOW_UP_GENERATED"
  | "ESCALATION_TRIGGERED"
  | "CASE_CLOSED";

interface TimelineEvent {
  id: string;
  type: CaseEventType;
  description: string;
  relatedDocumentId: string | null;
  occurredAt: string;
  createdAt: string;
}

export function TimelineClient({ dispute }: TimelineClientProps) {
  const router = useRouter();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTimeline();
  }, []);

  const loadTimeline = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/disputes/${dispute.id}/timeline`);

      if (!response.ok) {
        throw new Error("Failed to load timeline");
      }

      const data = await response.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error("Error loading timeline:", err);
      setError(err instanceof Error ? err.message : "Failed to load timeline");
    } finally {
      setIsLoading(false);
    }
  };

  const getEventIcon = (type: CaseEventType) => {
    switch (type) {
      case "DOCUMENT_GENERATED":
        return <FileText className="h-5 w-5" />;
      case "DOCUMENT_SENT":
        return <Send className="h-5 w-5" />;
      case "RESPONSE_RECEIVED":
        return <MessageSquare className="h-5 w-5" />;
      case "DEADLINE_SET":
        return <Calendar className="h-5 w-5" />;
      case "DEADLINE_MISSED":
        return <AlertTriangle className="h-5 w-5" />;
      case "FOLLOW_UP_GENERATED":
        return <FileText className="h-5 w-5" />;
      case "ESCALATION_TRIGGERED":
        return <TrendingUp className="h-5 w-5" />;
      case "CASE_CLOSED":
        return <XCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getEventColor = (type: CaseEventType) => {
    switch (type) {
      case "DOCUMENT_GENERATED":
        return "bg-blue-500";
      case "DOCUMENT_SENT":
        return "bg-green-500";
      case "RESPONSE_RECEIVED":
        return "bg-purple-500";
      case "DEADLINE_SET":
        return "bg-yellow-500";
      case "DEADLINE_MISSED":
        return "bg-red-500";
      case "FOLLOW_UP_GENERATED":
        return "bg-blue-500";
      case "ESCALATION_TRIGGERED":
        return "bg-orange-500";
      case "CASE_CLOSED":
        return "bg-gray-500";
      default:
        return "bg-gray-400";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        {/* Header */}
        <div className="border-b bg-white px-4 py-4 md:px-6">
          <div className="mx-auto max-w-4xl">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/disputes/${dispute.id}/case`)}
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Case
            </Button>
            <h1 className="text-2xl font-bold">Case Timeline</h1>
            <p className="text-sm text-muted-foreground">{dispute.title}</p>
          </div>
        </div>

        {/* Loading State */}
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              Loading timeline...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        {/* Header */}
        <div className="border-b bg-white px-4 py-4 md:px-6">
          <div className="mx-auto max-w-4xl">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/disputes/${dispute.id}/case`)}
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Case
            </Button>
            <h1 className="text-2xl font-bold">Case Timeline</h1>
          </div>
        </div>

        {/* Error State */}
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-red-600">{error}</p>
            <Button onClick={loadTimeline} className="mt-4" size="sm">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex min-h-screen flex-col">
        {/* Header */}
        <div className="border-b bg-white px-4 py-4 md:px-6">
          <div className="mx-auto max-w-4xl">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/disputes/${dispute.id}/case`)}
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Case
            </Button>
            <h1 className="text-2xl font-bold">Case Timeline</h1>
            <p className="text-sm text-muted-foreground">{dispute.title}</p>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              No timeline events yet.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Events will appear here as actions are taken on your case.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white px-4 py-4 md:px-6">
        <div className="mx-auto max-w-4xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/disputes/${dispute.id}/case`)}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Case
          </Button>
          <h1 className="text-2xl font-bold">Case Timeline</h1>
          <p className="text-sm text-muted-foreground">{dispute.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {events.length} event{events.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 px-4 py-6 md:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 h-full w-0.5 bg-gray-200 md:left-8"></div>

            {/* Events */}
            <div className="space-y-6">
              {events.map((event, index) => (
                <div key={event.id} className="relative flex gap-4">
                  {/* Icon */}
                  <div
                    className={`relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${getEventColor(
                      event.type
                    )} text-white shadow-md md:h-16 md:w-16`}
                  >
                    {getEventIcon(event.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 rounded-lg border bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-medium">{event.description}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(event.occurredAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
