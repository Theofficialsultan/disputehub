"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  Send,
  MessageCircle,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  Filter,
  Calendar,
  Search,
  Upload,
  Paperclip,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CaseEventType } from "@prisma/client";

interface TimelineEvent {
  id: string;
  type: CaseEventType;
  description: string;
  occurredAt: Date;
  disputeTitle: string;
  disputeType: string;
  disputeId: string;
  relatedDocument: {
    id: string;
    type: string;
    status: string;
  } | null;
}

interface TimelineData {
  events: TimelineEvent[];
  disputes: Array<{
    id: string;
    title: string;
    type: string;
  }>;
}

const EVENT_CONFIG: Record<
  CaseEventType,
  { icon: React.ElementType; color: string; gradient: string; label: string }
> = {
  DOCUMENT_GENERATED: {
    icon: FileText,
    color: "indigo",
    gradient: "from-indigo-500 to-purple-500",
    label: "Document Generated",
  },
  DOCUMENT_SENT: {
    icon: Send,
    color: "blue",
    gradient: "from-blue-500 to-cyan-500",
    label: "Document Sent",
  },
  RESPONSE_RECEIVED: {
    icon: MessageCircle,
    color: "green",
    gradient: "from-green-500 to-emerald-500",
    label: "Response Received",
  },
  DEADLINE_SET: {
    icon: Clock,
    color: "yellow",
    gradient: "from-yellow-500 to-orange-500",
    label: "Deadline Set",
  },
  DEADLINE_MISSED: {
    icon: AlertCircle,
    color: "red",
    gradient: "from-red-500 to-rose-500",
    label: "Deadline Missed",
  },
  FOLLOW_UP_GENERATED: {
    icon: Zap,
    color: "purple",
    gradient: "from-purple-500 to-pink-500",
    label: "Follow-up Generated",
  },
  ESCALATION_TRIGGERED: {
    icon: AlertCircle,
    color: "orange",
    gradient: "from-orange-500 to-red-500",
    label: "Escalation Triggered",
  },
  CASE_CLOSED: {
    icon: CheckCircle,
    color: "emerald",
    gradient: "from-emerald-500 to-teal-500",
    label: "Case Closed",
  },
  STRATEGY_FINALISED: {
    icon: CheckCircle,
    color: "indigo",
    gradient: "from-indigo-500 to-purple-500",
    label: "Strategy Finalized",
  },
  DOCUMENT_PLAN_CREATED: {
    icon: FileText,
    color: "cyan",
    gradient: "from-cyan-500 to-blue-500",
    label: "Document Plan Created",
  },
  DOCUMENTS_GENERATING: {
    icon: Zap,
    color: "yellow",
    gradient: "from-yellow-500 to-amber-500",
    label: "Documents Generating",
  },
  EVIDENCE_UPLOADED: {
    icon: Upload,
    color: "cyan",
    gradient: "from-cyan-500 to-blue-500",
    label: "Evidence Uploaded",
  },
  EVIDENCE_ATTACHED_TO_DOCUMENT: {
    icon: Paperclip,
    color: "teal",
    gradient: "from-teal-500 to-emerald-500",
    label: "Evidence Attached",
  },
};

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function TimelineEventCard({ event }: { event: TimelineEvent }) {
  const config = EVENT_CONFIG[event.type];
  const Icon = config.icon;

  return (
    <div className="relative group">
      {/* Timeline dot */}
      <div className="absolute left-0 top-6 w-4 h-4 rounded-full bg-blue-600 border-4 border-white z-10 group-hover:scale-125 transition-transform shadow" />
      
      {/* Event card */}
      <div className="ml-8 rounded-3xl p-6 card-elevated border border-slate-200 hover:border-slate-300 transition-all duration-300">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`p-3 rounded-2xl bg-gradient-to-br ${config.gradient} shrink-0`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          
          {/* Content */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h3 className="text-slate-900 font-semibold">{config.label}</h3>
                <p className="text-sm text-slate-500">{event.description}</p>
              </div>
              <span className="text-xs text-slate-500 shrink-0">
                {formatRelativeTime(event.occurredAt)}
              </span>
            </div>
            
            {/* Case info */}
            <Link
              href={`/disputes/${event.disputeId}/case`}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-700 hover:text-blue-800 hover:bg-blue-100 transition-colors"
            >
              <FileText className="h-3 w-3" />
              {event.disputeTitle}
            </Link>
            
            {/* Document info */}
            {event.relatedDocument && (
              <span className="ml-2 text-xs text-slate-500">
                • {event.relatedDocument.type.replace(/_/g, " ")}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyTimeline() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="relative mb-8">
        <div className="relative p-8 rounded-3xl card-elevated border border-slate-200">
          <Clock className="h-16 w-16 text-blue-600" />
        </div>
      </div>
      <h3 className="text-3xl font-bold text-slate-900 mb-3">No events yet</h3>
      <p className="text-slate-500 text-center max-w-md mb-8 text-lg">
        Start a dispute case to see events and activity in your timeline
      </p>
    </div>
  );
}

export default function TimelineClient({ events, disputes }: TimelineData) {
  const [searchQuery, setSearchQuery] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [caseFilter, setCaseFilter] = useState<string>("all");

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.disputeTitle.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType =
        eventTypeFilter === "all" || event.type === eventTypeFilter;

      const matchesCase =
        caseFilter === "all" || event.disputeId === caseFilter;

      return matchesSearch && matchesType && matchesCase;
    });
  }, [events, searchQuery, eventTypeFilter, caseFilter]);

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: Record<string, TimelineEvent[]> = {};
    
    filteredEvents.forEach((event) => {
      const date = new Date(event.occurredAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(event);
    });
    
    return groups;
  }, [filteredEvents]);

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-5xl font-bold text-blue-600 mb-3">
          Activity Timeline
        </h1>
        <p className="text-slate-500 text-lg">
          Complete history of all your case events and activities
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 rounded-2xl card-elevated border-slate-200 text-slate-900 placeholder:text-slate-500 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-slate-500 shrink-0" />
          <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
            <SelectTrigger className="h-14 rounded-2xl card-elevated border-slate-200 text-slate-900">
              <SelectValue placeholder="All Events" />
            </SelectTrigger>
            <SelectContent className="card-elevated border-slate-200 rounded-2xl">
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="DOCUMENT_GENERATED">Documents</SelectItem>
              <SelectItem value="DEADLINE_SET">Deadlines</SelectItem>
              <SelectItem value="FOLLOW_UP_GENERATED">Follow-ups</SelectItem>
              <SelectItem value="STRATEGY_FINALISED">Strategy</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-slate-500 shrink-0" />
          <Select value={caseFilter} onValueChange={setCaseFilter}>
            <SelectTrigger className="h-14 rounded-2xl card-elevated border-slate-200 text-slate-900">
              <SelectValue placeholder="All Cases" />
            </SelectTrigger>
            <SelectContent className="card-elevated border-slate-200 rounded-2xl">
              <SelectItem value="all">All Cases</SelectItem>
              {disputes.map((dispute) => (
                <SelectItem key={dispute.id} value={dispute.id}>
                  {dispute.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl card-elevated border border-slate-200">
          <p className="text-sm text-slate-500 mb-1">Total Events</p>
          <p className="text-3xl font-bold text-slate-900">{events.length}</p>
        </div>
        <div className="p-4 rounded-2xl card-elevated border border-slate-200">
          <p className="text-sm text-slate-500 mb-1">This Week</p>
          <p className="text-3xl font-bold text-slate-900">
            {events.filter((e) => {
              const diffDays = Math.floor(
                (new Date().getTime() - new Date(e.occurredAt).getTime()) / 86400000
              );
              return diffDays <= 7;
            }).length}
          </p>
        </div>
        <div className="p-4 rounded-2xl card-elevated border border-slate-200">
          <p className="text-sm text-slate-500 mb-1">Documents</p>
          <p className="text-3xl font-bold text-slate-900">
            {events.filter((e) => e.type === "DOCUMENT_GENERATED").length}
          </p>
        </div>
        <div className="p-4 rounded-2xl card-elevated border border-slate-200">
          <p className="text-sm text-slate-500 mb-1">Active Cases</p>
          <p className="text-3xl font-bold text-slate-900">{disputes.length}</p>
        </div>
      </div>

      {/* Timeline */}
      {Object.keys(groupedEvents).length === 0 ? (
        <EmptyTimeline />
      ) : (
        <div className="space-y-12">
          {Object.entries(groupedEvents).map(([date, dateEvents]) => (
            <div key={date} className="relative">
              {/* Date header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl card-elevated border border-slate-200">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-semibold text-slate-900">{date}</span>
                </div>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Timeline line */}
              <div className="absolute left-2 top-16 bottom-0 w-0.5 bg-slate-200" />

              {/* Events for this date */}
              <div className="space-y-6">
                {dateEvents.map((event) => (
                  <TimelineEventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
