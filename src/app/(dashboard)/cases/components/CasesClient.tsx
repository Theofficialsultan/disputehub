"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Search,
  Plus,
  MoreVertical,
  ArrowRight,
  Sparkles,
  Clock,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Loader2,
  File,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Calendar,
  TrendingUp,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Dispute, CaseLifecycleStatus } from "@prisma/client";

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
        type: string;
        occurredAt: Date;
      }>;
    }
  >;
}

const LIFECYCLE_STATUS_CONFIG: Record<
  CaseLifecycleStatus,
  { label: string; color: string; gradient: string }
> = {
  DRAFT: {
    label: "Draft",
    color: "text-slate-400",
    gradient: "from-slate-500 to-slate-600",
  },
  DOCUMENT_SENT: {
    label: "Sent",
    color: "text-blue-400",
    gradient: "from-blue-500 to-cyan-500",
  },
  AWAITING_RESPONSE: {
    label: "Awaiting Response",
    color: "text-yellow-400",
    gradient: "from-yellow-500 to-orange-500",
  },
  RESPONSE_RECEIVED: {
    label: "Response Received",
    color: "text-purple-400",
    gradient: "from-purple-500 to-pink-500",
  },
  DEADLINE_MISSED: {
    label: "Deadline Missed",
    color: "text-red-400",
    gradient: "from-red-500 to-rose-500",
  },
  CLOSED: {
    label: "Closed",
    color: "text-emerald-400",
    gradient: "from-emerald-500 to-teal-500",
  },
};

const STATUS_CONFIG = {
  PENDING: {
    label: "Pending",
    color: "text-yellow-400",
    bg: "bg-yellow-500/20",
    border: "border-yellow-500/30",
    icon: Clock,
  },
  GENERATING: {
    label: "Generating",
    color: "text-blue-400",
    bg: "bg-blue-500/20",
    border: "border-blue-500/30",
    icon: Loader2,
  },
  COMPLETED: {
    label: "Completed",
    color: "text-emerald-400",
    bg: "bg-emerald-500/20",
    border: "border-emerald-500/30",
    icon: CheckCircle,
  },
  FAILED: {
    label: "Failed",
    color: "text-red-400",
    bg: "bg-red-500/20",
    border: "border-red-500/30",
    icon: XCircle,
  },
};

function humanizeDocumentType(type: string): string {
  return type
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

function MiniDocumentCard({ document }: { document: Document }) {
  const status = STATUS_CONFIG[document.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING;
  const StatusIcon = status.icon;

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (document.fileUrl) {
      window.open(document.fileUrl, "_blank");
    }
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-xl glass border border-indigo-500/10 hover:border-indigo-500/30 transition-all group">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`p-2 rounded-lg ${status.bg} border ${status.border} shrink-0`}>
          <File className={`h-4 w-4 ${status.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {humanizeDocumentType(document.type)}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs ${status.color} flex items-center gap-1`}>
              <StatusIcon className={`h-3 w-3 ${document.status === "GENERATING" ? "animate-spin" : ""}`} />
              {status.label}
            </span>
            {document.isFollowUp && (
              <span className="text-xs text-purple-400">• Follow-up</span>
            )}
          </div>
        </div>
      </div>
      {document.status === "COMPLETED" && document.fileUrl && (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDownload}
          className="h-8 px-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 shrink-0"
        >
          <Download className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

function CasePreviewSection({ dispute }: { dispute: CasesData["disputes"][0] }) {
  const strategy = dispute.caseStrategy;
  const plan = dispute.documentPlan;

  return (
    <div className="space-y-4 mt-4 p-4 rounded-2xl bg-slate-900/40 border border-indigo-500/10">
      {/* Strategy Preview */}
      {strategy && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-indigo-300 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Case Strategy
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {strategy.disputeType && (
              <div>
                <span className="text-slate-500">Dispute Type:</span>
                <p className="text-white font-medium capitalize mt-1">
                  {strategy.disputeType.toLowerCase().replace(/_/g, " ")}
                </p>
              </div>
            )}
            {strategy.keyFacts && strategy.keyFacts.length > 0 && (
              <div>
                <span className="text-slate-500">Key Facts:</span>
                <p className="text-white font-medium mt-1">{strategy.keyFacts.length} identified</p>
              </div>
            )}
            {strategy.evidenceMentioned && strategy.evidenceMentioned.length > 0 && (
              <div>
                <span className="text-slate-500">Evidence:</span>
                <p className="text-white font-medium mt-1">{strategy.evidenceMentioned.length} items</p>
              </div>
            )}
            {strategy.desiredOutcome && (
              <div className="sm:col-span-2">
                <span className="text-slate-500">Desired Outcome:</span>
                <p className="text-white font-medium mt-1 line-clamp-2">{strategy.desiredOutcome}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Document Plan */}
      {plan && (
        <div className="space-y-3 pt-3 border-t border-indigo-500/10">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-indigo-300 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents ({plan.documents.length})
            </h4>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 capitalize">
                {plan.complexity}
              </span>
              <span className="text-slate-500">Score: {plan.complexityScore}</span>
            </div>
          </div>
          
          {plan.documents.length > 0 ? (
            <div className="space-y-2">
              {plan.documents.slice(0, 3).map((doc) => (
                <MiniDocumentCard key={doc.id} document={doc} />
              ))}
              {plan.documents.length > 3 && (
                <p className="text-xs text-slate-500 text-center py-2">
                  +{plan.documents.length - 3} more documents
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-4">No documents generated yet</p>
          )}
        </div>
      )}

      {/* No Strategy/Documents */}
      {!strategy && !plan && (
        <div className="text-center py-6">
          <AlertCircle className="h-8 w-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500">No preview available yet</p>
          <p className="text-xs text-slate-600 mt-1">Complete the case to see details</p>
        </div>
      )}
    </div>
  );
}

function DisputeCard({ dispute }: { dispute: CasesData["disputes"][0] }) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const statusConfig = LIFECYCLE_STATUS_CONFIG[dispute.lifecycleStatus];
  
  const completedDocs =
    dispute.documentPlan?.documents.filter((d) => d.status === "COMPLETED")
      .length || 0;
  const totalDocs = dispute.documentPlan?.documents.length || 0;
  const progress = totalDocs > 0 ? (completedDocs / totalDocs) * 100 : 0;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this case?")) return;
    try {
      const res = await fetch(`/api/disputes/${dispute.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to delete dispute:", error);
    }
  };

  const handleCardClick = () => {
    router.push(`/cases/${dispute.id}`);
  };

  return (
    <div className="group relative overflow-hidden rounded-3xl glass-strong border border-indigo-500/20 hover:border-indigo-500/40 transition-all duration-500">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 via-purple-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10">
        {/* Main Content - Clickable */}
        <div 
          onClick={handleCardClick}
          className="p-6 cursor-pointer space-y-4"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-lg mb-1 group-hover:text-indigo-300 transition-colors truncate">
                {dispute.title}
              </h3>
              <p className="text-sm text-slate-400 capitalize truncate">
                {dispute.type.toLowerCase().replace(/_/g, " ")}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-slate-400 hover:text-white hover:bg-indigo-500/20 shrink-0"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-strong border-indigo-500/20">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/cases/${dispute.id}`);
                  }}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/disputes/${dispute.id}/case`);
                  }}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Continue Chat
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/disputes/${dispute.id}/documents`);
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Documents
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-red-400">
                  <XCircle className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Status & Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r ${statusConfig.gradient} text-white shadow-lg`}
            >
              {statusConfig.label}
            </span>
            {dispute.strategyLocked && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                <Sparkles className="h-3 w-3" />
                AI Ready
              </span>
            )}
            {dispute.documentPlan && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 capitalize">
                <TrendingUp className="h-3 w-3" />
                {dispute.documentPlan.complexity}
              </span>
            )}
          </div>

          {/* Progress Bar */}
          {totalDocs > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Documents</span>
                <span className="text-white font-semibold">
                  {completedDocs}/{totalDocs}
                </span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 rounded-full transition-all duration-1000 shadow-lg shadow-indigo-500/50"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Deadline Warning */}
          {dispute.waitingUntil && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/30">
              <Clock className="h-4 w-4 text-orange-400" />
              <span className="text-sm text-orange-300">
                {new Date(dispute.waitingUntil) > new Date()
                  ? `Due ${new Date(dispute.waitingUntil).toLocaleDateString()}`
                  : "Deadline passed"}
              </span>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-indigo-500/10">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(dispute.updatedAt).toLocaleDateString()}
            </span>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all duration-300" />
          </div>
        </div>

        {/* Expandable Preview Section */}
        {(dispute.caseStrategy || dispute.documentPlan) && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="w-full px-6 py-3 flex items-center justify-center gap-2 border-t border-indigo-500/10 hover:bg-indigo-500/5 transition-colors text-sm text-indigo-300 font-medium"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Hide Preview
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Show Preview
                </>
              )}
            </button>

            {isExpanded && (
              <div className="px-6 pb-6">
                <CasePreviewSection dispute={dispute} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EmptyCases() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-3xl opacity-30 animate-pulse" />
        <div className="relative p-8 rounded-3xl glass-strong border border-indigo-500/20">
          <FileText className="h-16 w-16 text-indigo-400" />
        </div>
      </div>
      <h3 className="text-3xl font-bold text-white mb-3">No cases yet</h3>
      <p className="text-slate-400 text-center max-w-md mb-8 text-lg">
        Start your first dispute case to resolve conflicts with AI-powered legal
        assistance
      </p>
      <Button
        asChild
        size="lg"
        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-indigo-500/25 px-8 py-6 text-lg rounded-2xl"
      >
        <Link href="/disputes/start">
          <Plus className="mr-2 h-6 w-6" />
          Create Your First Case
        </Link>
      </Button>
    </div>
  );
}

export default function CasesClient({ disputes }: CasesData) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredDisputes = useMemo(() => {
    return disputes.filter((dispute) => {
      const matchesSearch =
        dispute.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dispute.type.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          ["AWAITING_RESPONSE", "DOCUMENT_SENT"].includes(
            dispute.lifecycleStatus
          )) ||
        (statusFilter === "draft" && dispute.lifecycleStatus === "DRAFT") ||
        (statusFilter === "completed" && dispute.lifecycleStatus === "CLOSED");

      return matchesSearch && matchesStatus;
    });
  }, [disputes, searchQuery, statusFilter]);

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-5xl font-bold text-white mb-3 bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            All Cases
          </h1>
          <p className="text-slate-400 text-lg">
            {disputes.length} {disputes.length === 1 ? 'case' : 'cases'} total
          </p>
        </div>
        <Button
          asChild
          size="lg"
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-indigo-500/25 px-8 py-6 rounded-2xl text-lg font-semibold"
        >
          <Link href="/disputes/start">
            <Plus className="mr-2 h-6 w-6" />
            New Dispute
          </Link>
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search cases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 rounded-2xl glass-strong border-indigo-500/20 text-white placeholder:text-slate-500 focus:border-indigo-500/50 text-lg"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-slate-400" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-56 h-14 rounded-2xl glass-strong border-indigo-500/20 text-white text-lg">
              <SelectValue placeholder="All Cases" />
            </SelectTrigger>
            <SelectContent className="glass-strong border-indigo-500/20 rounded-2xl">
              <SelectItem value="all">All Cases</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cases Grid */}
      {filteredDisputes.length === 0 ? (
        searchQuery || statusFilter !== "all" ? (
          <div className="text-center py-20">
            <p className="text-slate-400 text-lg">No cases match your filters</p>
          </div>
        ) : (
          <EmptyCases />
        )
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
          {filteredDisputes.map((dispute) => (
            <DisputeCard key={dispute.id} dispute={dispute} />
          ))}
        </div>
      )}
    </div>
  );
}
