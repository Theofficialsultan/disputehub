"use client";

import { CaseEventType } from "@prisma/client";
import {
  FileText,
  Send,
  Calendar,
  AlertTriangle,
  RotateCw,
  TrendingUp,
  XCircle,
  CheckCircle,
  Lock,
  FolderPlus,
  Zap,
} from "lucide-react";

interface TimelineEvent {
  id: string;
  type: CaseEventType;
  description: string;
  occurredAt: string;
  relatedDocumentId?: string | null;
}

interface EmbeddedTimelineProps {
  events: TimelineEvent[];
}

export function EmbeddedTimeline({ events }: EmbeddedTimelineProps) {
  const getEventConfig = (type: CaseEventType) => {
    switch (type) {
      case "DOCUMENT_GENERATED":
        return {
          icon: FileText,
          color: "text-green-600",
          bgColor: "bg-green-100",
        };
      case "DOCUMENT_SENT":
        return {
          icon: Send,
          color: "text-blue-600",
          bgColor: "bg-blue-100",
        };
      case "DEADLINE_SET":
        return {
          icon: Calendar,
          color: "text-purple-600",
          bgColor: "bg-purple-100",
        };
      case "DEADLINE_MISSED":
        return {
          icon: AlertTriangle,
          color: "text-red-600",
          bgColor: "bg-red-100",
        };
      case "FOLLOW_UP_GENERATED":
        return {
          icon: RotateCw,
          color: "text-amber-600",
          bgColor: "bg-amber-100",
        };
      case "ESCALATION_TRIGGERED":
        return {
          icon: TrendingUp,
          color: "text-orange-600",
          bgColor: "bg-orange-100",
        };
      case "RESPONSE_RECEIVED":
        return {
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-100",
        };
      case "CASE_CLOSED":
        return {
          icon: XCircle,
          color: "text-gray-600",
          bgColor: "bg-gray-100",
        };
      case "STRATEGY_FINALISED":
        return {
          icon: Lock,
          color: "text-indigo-600",
          bgColor: "bg-indigo-100",
        };
      case "DOCUMENT_PLAN_CREATED":
        return {
          icon: FolderPlus,
          color: "text-cyan-600",
          bgColor: "bg-cyan-100",
        };
      case "DOCUMENTS_GENERATING":
        return {
          icon: Zap,
          color: "text-yellow-600",
          bgColor: "bg-yellow-100",
        };
      default:
        return {
          icon: FileText,
          color: "text-gray-600",
          bgColor: "bg-gray-100",
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  };

  if (events.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-4 text-sm text-gray-600">No events yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event, index) => {
        const config = getEventConfig(event.type);
        const Icon = config.icon;
        const isLast = index === events.length - 1;

        return (
          <div key={event.id} className="relative flex gap-4">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-[19px] top-10 h-[calc(100%+0.5rem)] w-0.5 bg-gray-200" />
            )}

            {/* Icon */}
            <div className={`relative z-10 flex-shrink-0 rounded-full ${config.bgColor} p-2`}>
              <Icon className={`h-5 w-5 ${config.color}`} />
            </div>

            {/* Content */}
            <div className="flex-1 pb-6">
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm font-medium text-gray-900">
                  {event.description}
                </p>
                <span className="flex-shrink-0 text-xs text-gray-500">
                  {formatDate(event.occurredAt)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
