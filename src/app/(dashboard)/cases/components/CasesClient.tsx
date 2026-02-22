"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Search,
  Plus,
  Sparkles,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  TrendingUp,
  MessageSquare,
  ArrowUpRight,
  Scale,
  Gavel,
  ChevronRight,
  ArrowRight,
  Ban,
  UserCheck,
  Zap,
  Eye,
  Download,
  BookOpen,
  ShieldAlert,
  MoreHorizontal,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Dispute, CaseLifecycleStatus } from "@prisma/client";
import { toast } from "sonner";

interface Document {
  id: string;
  type: string;
  status: string;
  fileUrl: string | null;
  isFollowUp: boolean;
  createdAt: Date;
  order: number;
}

interface CasesData {
  disputes: Array<
    Dispute & {
      caseStrategy: {
        disputeType: string | null;
        keyFacts: string[];
        evidenceMentioned: string[];
        desiredOutcome: string | null;
      } | null;
      documentPlan: {
        id: string;
        complexity: string;
        complexityScore: number;
        documentType: string;
        documents: Document[];
      } | null;
      caseEvents: Array<{
        id: string;
        type: string;
        description: string;
        occurredAt: Date;
      }>;
    }
  >;
}

const LIFECYCLE_STATUS_CONFIG: Record<
  CaseLifecycleStatus,
  { label: string; color: string; bg: string; border: string; dot: string; description: string }
> = {
  DRAFT: { label: "Draft", color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200", dot: "bg-slate-400", description: "Case created, gathering information" },
  DOCUMENT_SENT: { label: "Documents Sent", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500", description: "Legal documents have been sent" },
  AWAITING_RESPONSE: { label: "Awaiting Response", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500", description: "Waiting for the other party to respond" },
  RESPONSE_RECEIVED: { label: "Response Received", color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200", dot: "bg-purple-500", description: "The other party has responded" },
  DEADLINE_MISSED: { label: "Overdue", color: "text-red-700", bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500", description: "Response deadline has passed" },
  CLOSED: { label: "Resolved", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500", description: "Case has been closed" },
};

function humanizeType(type: string): string {
  return type.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

function buildSummary(dispute: CasesData["disputes"][0]): string {
  const parts: string[] = [];

  // Use description if available
  if (dispute.description && dispute.description.length > 10) {
    return dispute.description.length > 200 ? dispute.description.slice(0, 200) + "..." : dispute.description;
  }

  // Fallback: build from strategy
  if (dispute.caseStrategy) {
    if (dispute.caseStrategy.keyFacts.length > 0) {
      parts.push(dispute.caseStrategy.keyFacts.slice(0, 3).join(". "));
    }
    if (dispute.caseStrategy.desiredOutcome) {
      parts.push("Goal: " + dispute.caseStrategy.desiredOutcome);
    }
  }

  if (parts.length === 0) return "No case details available yet. Continue the AI chat to build your case.";
  const text = parts.join(". ");
  return text.length > 250 ? text.slice(0, 250) + "..." : text;
}

function DisputeCard({ dispute }: { dispute: CasesData["disputes"][0] }) {
  const router = useRouter();
  const [isClosing, setIsClosing] = useState(false);
  const statusConfig = LIFECYCLE_STATUS_CONFIG[dispute.lifecycleStatus];
  const completedDocs = dispute.documentPlan?.documents.filter((d) => d.status === "COMPLETED").length || 0;
  const totalDocs = dispute.documentPlan?.documents.length || 0;
  const progress = totalDocs > 0 ? (completedDocs / totalDocs) * 100 : 0;
  const daysAgo = Math.floor((Date.now() - new Date(dispute.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
  const summary = buildSummary(dispute);

  const handleClose = async () => {
    if (!confirm("Close this case? It will be marked as resolved.")) return;
    setIsClosing(true);
    try {
      const res = await fetch("/api/disputes/" + dispute.id + "/close", { method: "POST" });
      if (res.ok) { toast.success("Case closed"); window.location.reload(); }
      else toast.error("Failed to close");
    } catch { toast.error("Failed to close"); } finally { setIsClosing(false); }
  };

  return (
    <div className="bg-white sm:rounded-2xl sm:border sm:border-slate-200/80 overflow-hidden hover:border-blue-200 sm:hover:shadow-lg sm:hover:shadow-blue-50/50 transition-all duration-300 border-b border-slate-100 sm:border-b-0">
      {/* Header bar */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Scale className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] sm:text-[17px] font-bold text-slate-900 leading-tight mb-1 truncate">{dispute.title}</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] sm:text-[12px] text-slate-400 capitalize">{humanizeType(dispute.type)}</span>
                <span className="text-slate-200 hidden sm:inline">|</span>
                <span className="text-[11px] sm:text-[12px] text-slate-400 items-center gap-1 hidden sm:flex">
                  <Calendar className="h-3 w-3" />
                  {daysAgo === 0 ? "Updated today" : daysAgo === 1 ? "Updated yesterday" : daysAgo + " days ago"}
                </span>
              </div>
            </div>
          </div>

          {/* Status badge */}
          <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-[11px] font-semibold ${statusConfig.bg} ${statusConfig.color} border ${statusConfig.border} flex-shrink-0`}>
            <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${statusConfig.dot}`} />
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Summary / Description */}
      <div className="px-4 sm:px-6 pb-3 sm:pb-4">
        <p className="text-[12px] sm:text-[13px] text-slate-500 leading-relaxed line-clamp-3">{summary}</p>
      </div>

      {/* Key Facts chips */}
      {dispute.caseStrategy && dispute.caseStrategy.keyFacts.length > 0 && (
        <div className="px-4 sm:px-6 pb-3 sm:pb-4">
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">Key Facts</p>
          <div className="flex flex-wrap gap-1.5">
            {dispute.caseStrategy.keyFacts.slice(0, 4).map((fact, i) => (
              <span key={i} className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-600 leading-snug max-w-[200px] truncate">
                {fact}
              </span>
            ))}
            {dispute.caseStrategy.keyFacts.length > 4 && (
              <span className="text-[11px] px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 font-medium">
                +{dispute.caseStrategy.keyFacts.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Desired outcome */}
      {dispute.caseStrategy?.desiredOutcome && (
        <div className="px-4 sm:px-6 pb-3 sm:pb-4">
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-blue-50/50 border border-blue-100/60">
            <Zap className="h-3.5 w-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-blue-500 font-semibold uppercase tracking-wider mb-0.5">Desired Outcome</p>
              <p className="text-[12px] text-blue-700 leading-relaxed">{dispute.caseStrategy.desiredOutcome}</p>
            </div>
          </div>
        </div>
      )}

      {/* Progress & docs */}
      {totalDocs > 0 && (
        <div className="px-4 sm:px-6 pb-3 sm:pb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-slate-400 font-medium">Document Progress</span>
            <span className="text-[12px] text-slate-700 font-bold">{completedDocs}/{totalDocs} completed</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full transition-all duration-700" style={{ width: progress + "%" }} />
          </div>
        </div>
      )}

      {/* Deadline warning */}
      {dispute.waitingUntil && (
        <div className="mx-4 sm:mx-6 mb-3 sm:mb-4">
          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl ${new Date(dispute.waitingUntil) < new Date() ? "bg-red-50 border border-red-100" : "bg-amber-50 border border-amber-100"}`}>
            <Clock className={`h-3.5 w-3.5 ${new Date(dispute.waitingUntil) < new Date() ? "text-red-600" : "text-amber-600"}`} />
            <span className={`text-[12px] font-medium ${new Date(dispute.waitingUntil) < new Date() ? "text-red-700" : "text-amber-700"}`}>
              {new Date(dispute.waitingUntil) < new Date()
                ? "Deadline passed \u2014 " + new Date(dispute.waitingUntil).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                : "Due " + new Date(dispute.waitingUntil).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
            </span>
          </div>
        </div>
      )}

      {/* Recent activity */}
      {dispute.caseEvents && dispute.caseEvents.length > 0 && (
        <div className="px-4 sm:px-6 pb-3 sm:pb-4">
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">Recent Activity</p>
          <div className="space-y-1.5">
            {dispute.caseEvents.slice(0, 2).map((event) => (
              <div key={event.id} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-slate-600 leading-snug truncate">{event.description}</p>
                  <p className="text-[10px] text-slate-400">
                    {new Date(event.occurredAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badges row */}
      <div className="px-4 sm:px-6 pb-3 sm:pb-4 flex items-center gap-1.5 sm:gap-2 flex-wrap">
        {dispute.strategyLocked && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Sparkles className="h-3 w-3" /> AI Ready
          </span>
        )}
        {dispute.documentPlan && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-blue-50 text-blue-600 border border-blue-100 capitalize">
            {dispute.documentPlan.complexity} complexity
          </span>
        )}
        {totalDocs > 0 && completedDocs === totalDocs && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle className="h-3 w-3" /> All docs ready
          </span>
        )}
        {dispute.lifecycleStatus === "DEADLINE_MISSED" && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-red-50 text-red-600 border border-red-100">
            <ShieldAlert className="h-3 w-3" /> Urgent
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-slate-100 bg-slate-50/40">
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2">
          {/* Continue / AI Chat */}
          <button
            onClick={() => router.push("/disputes/" + dispute.id + "/case")}
            className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all group"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="text-[11px] font-semibold">Continue</span>
          </button>

          {/* Ask AI */}
          <button
            onClick={() => router.push("/ai-chat")}
            className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-600 transition-all group"
          >
            <Sparkles className="h-4 w-4" />
            <span className="text-[11px] font-semibold">Ask AI</span>
          </button>

          {/* Find Lawyer */}
          <button
            onClick={() => router.push("/lawyer")}
            className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-purple-200 hover:bg-purple-50/50 hover:text-purple-600 transition-all group"
          >
            <UserCheck className="h-4 w-4" />
            <span className="text-[11px] font-semibold">Lawyer</span>
          </button>

          {/* View Documents */}
          <button
            onClick={() => router.push("/disputes/" + dispute.id + "/documents")}
            className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/50 hover:text-emerald-600 transition-all group"
          >
            <FileText className="h-4 w-4" />
            <span className="text-[11px] font-semibold">Documents</span>
          </button>

          {/* Close */}
          {dispute.lifecycleStatus !== "CLOSED" ? (
            <button
              onClick={handleClose}
              disabled={isClosing}
              className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-red-200 hover:bg-red-50/50 hover:text-red-600 transition-all group"
            >
              <Ban className="h-4 w-4" />
              <span className="text-[11px] font-semibold">{isClosing ? "Closing..." : "Close"}</span>
            </button>
          ) : (
            <button
              onClick={() => router.push("/cases/" + dispute.id)}
              className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all group"
            >
              <Eye className="h-4 w-4" />
              <span className="text-[11px] font-semibold">Details</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CasesClient({ disputes }: CasesData) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");

  const caseStats = useMemo(() => {
    const active = disputes.filter((d) => ["AWAITING_RESPONSE", "DOCUMENT_SENT", "RESPONSE_RECEIVED"].includes(d.lifecycleStatus)).length;
    const draft = disputes.filter((d) => d.lifecycleStatus === "DRAFT").length;
    const closed = disputes.filter((d) => d.lifecycleStatus === "CLOSED").length;
    const overdue = disputes.filter((d) => d.lifecycleStatus === "DEADLINE_MISSED").length;
    return { total: disputes.length, active, draft, closed, overdue };
  }, [disputes]);

  const filteredDisputes = useMemo(() => {
    let result = disputes.filter((dispute) => {
      const matchesSearch = dispute.title.toLowerCase().includes(searchQuery.toLowerCase()) || dispute.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && ["AWAITING_RESPONSE", "DOCUMENT_SENT", "RESPONSE_RECEIVED"].includes(dispute.lifecycleStatus)) ||
        (statusFilter === "draft" && dispute.lifecycleStatus === "DRAFT") ||
        (statusFilter === "completed" && dispute.lifecycleStatus === "CLOSED") ||
        (statusFilter === "overdue" && dispute.lifecycleStatus === "DEADLINE_MISSED");
      return matchesSearch && matchesStatus;
    });

    if (sortBy === "oldest") result = [...result].reverse();
    if (sortBy === "name") result = [...result].sort((a, b) => a.title.localeCompare(b.title));

    return result;
  }, [disputes, searchQuery, statusFilter, sortBy]);

  return (
    <div className="space-y-0 sm:space-y-5 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 px-5 sm:px-0 pt-5 sm:pt-0">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight">Cases</h1>
          <p className="text-slate-400 text-sm mt-1 hidden sm:block">Track, manage, and resolve all your dispute cases.</p>
        </div>
        <Link href="/disputes/start" className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all self-start sm:self-auto">
          <Plus className="h-4 w-4" /> New Dispute
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 px-5 sm:px-0 pt-3 sm:pt-0">
        <div className="bg-blue-600 rounded-2xl p-5 sm:p-5 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500 rounded-full -translate-y-4 translate-x-4 opacity-30" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <p className="text-[12px] sm:text-[13px] font-medium text-blue-100">Total Cases</p>
            </div>
            <p className="text-3xl sm:text-[42px] font-bold leading-none">{caseStats.total}</p>
            <span className="text-[11px] text-blue-200 mt-3 block">All time</span>
          </div>
        </div>
        <div className="bg-slate-50 sm:bg-white rounded-2xl sm:border sm:border-slate-200/80 p-5 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-500">Active</p>
          </div>
          <p className="text-4xl sm:text-[42px] font-bold text-slate-900 leading-none">{caseStats.active}</p>
          <span className="text-xs text-slate-400 mt-3 block">In progress</span>
        </div>
        <div className="bg-slate-50 sm:bg-white rounded-2xl sm:border sm:border-slate-200/80 p-5 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-500">Drafts</p>
          </div>
          <p className="text-4xl sm:text-[42px] font-bold text-slate-900 leading-none">{caseStats.draft}</p>
          <span className="text-xs text-slate-400 mt-3 block">Not submitted</span>
        </div>
        <div className="bg-slate-50 sm:bg-white rounded-2xl sm:border sm:border-slate-200/80 p-5 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-500">Resolved</p>
          </div>
          <p className="text-4xl sm:text-[42px] font-bold text-slate-900 leading-none">{caseStats.closed}</p>
          <span className="text-xs text-slate-400 mt-3 block">Closed</span>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-white sm:rounded-2xl sm:border sm:border-slate-200/80 p-4 px-4 sm:px-4 border-b border-slate-100 sm:border-b-0">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              placeholder="Search by case name or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 h-10 rounded-xl border-slate-200 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cases</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="completed">Resolved</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-40 h-10 rounded-xl border-slate-200 text-sm">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cases List - single column for larger cards */}
      {filteredDisputes.length === 0 ? (
        searchQuery || statusFilter !== "all" ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 text-center py-16">
            <p className="text-slate-400 text-sm mb-2">No cases match your filters</p>
            <button onClick={() => { setSearchQuery(""); setStatusFilter("all"); }} className="text-sm text-blue-600 font-semibold hover:text-blue-700">Clear Filters</button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 flex flex-col items-center justify-center py-20 px-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-5">
              <Gavel className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No cases yet</h3>
            <p className="text-slate-400 text-center max-w-md mb-6 text-sm">Start your first dispute to resolve conflicts with AI-powered legal assistance</p>
            <Link href="/disputes/start" className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all">
              <Plus className="h-5 w-5" /> Create Your First Case
            </Link>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-0 sm:gap-5">
          {filteredDisputes.map((dispute) => (
            <DisputeCard key={dispute.id} dispute={dispute} />
          ))}
        </div>
      )}
    </div>
  );
}
