"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Search,
  FolderOpen,
  File,
  AlertCircle,
  RefreshCw,
  Archive,
  ArrowUpRight,
  ChevronRight,
  Plus,
  Eye,
  ExternalLink,
  Scale,
  TrendingUp,
  MoreVertical,
  MessageSquare,
} from "lucide-react";
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
import type { CaseLifecycleStatus } from "@prisma/client";

interface Document {
  id: string;
  type: string;
  status: string;
  fileUrl: string | null;
  isFollowUp: boolean;
  retryCount: number;
  lastError: string | null;
  createdAt: Date;
  order: number;
}

interface DocumentPlan {
  id: string;
  complexity: string;
  complexityScore: number;
  documentType: string;
  createdAt: Date;
  documents: Document[];
}

interface Dispute {
  id: string;
  title: string;
  type: string;
  lifecycleStatus: CaseLifecycleStatus;
  createdAt: Date;
  documentPlan: DocumentPlan | null;
}

interface DocumentsClientProps {
  disputes: Dispute[];
}

const STATUS_CONFIG = {
  PENDING: { label: "Pending", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500", icon: Clock },
  GENERATING: { label: "Generating", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500", icon: Loader2 },
  COMPLETED: { label: "Completed", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500", icon: CheckCircle },
  FAILED: { label: "Failed", color: "text-red-700", bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500", icon: XCircle },
};

function humanizeDocumentType(type: string): string {
  return type.split("_").map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ");
}

function DocumentCard({ document, disputeId, caseTitle }: { document: Document; disputeId: string; caseTitle: string }) {
  const [isRetrying, setIsRetrying] = useState(false);
  const status = STATUS_CONFIG[document.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING;
  const router = useRouter();

  const handleClick = () => {
    if (document.status === "COMPLETED" && document.fileUrl) {
      window.open(document.fileUrl, "_blank");
    } else {
      router.push("/disputes/" + disputeId + "/documents");
    }
  };

  const handleRetry = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRetrying(true);
    try {
      const res = await fetch("/api/documents/" + document.id + "/retry", { method: "POST" });
      if (res.ok) window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white sm:rounded-2xl sm:border sm:border-slate-200/80 p-4 cursor-pointer hover:border-blue-200 sm:hover:shadow-md sm:hover:shadow-blue-50 transition-all duration-200 group border-b border-slate-100 sm:border-b-0"
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl ${status.bg} border ${status.border} flex items-center justify-center flex-shrink-0`}>
          <File className={`h-5 w-5 ${status.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                {humanizeDocumentType(document.type)}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">{caseTitle}</p>
            </div>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${status.bg} ${status.color} border ${status.border} flex-shrink-0`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-400">
                {new Date(document.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </span>
              {document.isFollowUp && (
                <span className="text-[10px] font-medium text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full border border-purple-100">Follow-up</span>
              )}
            </div>
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              {document.status === "COMPLETED" && document.fileUrl && (
                <button
                  onClick={() => window.open(document.fileUrl!, "_blank")}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[11px] font-semibold hover:bg-blue-700 transition-all"
                >
                  <Download className="h-3 w-3" /> PDF
                </button>
              )}
              {document.status === "FAILED" && document.retryCount < 3 && (
                <button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-medium hover:bg-slate-50 transition-all"
                >
                  {isRetrying ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />} Retry
                </button>
              )}
              {document.status === "GENERATING" && (
                <span className="text-[11px] text-blue-600 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Generating...</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CaseGroup({ dispute }: { dispute: Dispute }) {
  const plan = dispute.documentPlan;
  const completedDocs = plan?.documents.filter((d) => d.status === "COMPLETED").length || 0;
  const totalDocs = plan?.documents.length || 0;
  const progress = totalDocs > 0 ? (completedDocs / totalDocs) * 100 : 0;
  const router = useRouter();

  return (
    <div className="bg-white sm:rounded-2xl sm:border sm:border-slate-200/80 overflow-hidden border-b border-slate-100 sm:border-b-0">
      <div className="p-3 sm:p-5 flex items-center justify-between border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Scale className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <Link href={"/disputes/" + dispute.id + "/case"} className="text-[13px] sm:text-[14px] font-bold text-slate-900 hover:text-blue-600 transition-colors truncate block">
              {dispute.title}
            </Link>
            <p className="text-[10px] sm:text-[11px] text-slate-400 capitalize truncate">{dispute.type.toLowerCase().replace(/_/g, " ")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {totalDocs > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-[11px] font-semibold text-slate-600">{completedDocs}/{totalDocs}</span>
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border-slate-200 rounded-xl shadow-lg">
              <DropdownMenuItem onClick={() => router.push("/disputes/" + dispute.id + "/case")}>
                <MessageSquare className="mr-2 h-4 w-4" /> Continue Chat
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/disputes/" + dispute.id + "/documents")}>
                <FileText className="mr-2 h-4 w-4" /> All Documents
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/cases/" + dispute.id)}>
                <ExternalLink className="mr-2 h-4 w-4" /> Case Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="p-3 grid grid-cols-1 lg:grid-cols-2 gap-2">
        {plan?.documents.map((doc) => (
          <DocumentCard key={doc.id} document={doc} disputeId={dispute.id} caseTitle={dispute.title} />
        ))}
      </div>
    </div>
  );
}

function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 text-center py-16">
      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
        <Archive className="h-7 w-7 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{hasFilters ? "No documents match" : "No documents yet"}</h3>
      <p className="text-slate-400 text-sm mb-5">{hasFilters ? "Try adjusting your search or filters" : "Start a case to generate legal documents"}</p>
      {hasFilters ? (
        <button onClick={onClear} className="text-sm text-blue-600 font-semibold hover:text-blue-700">Clear Filters</button>
      ) : (
        <Link href="/disputes/start" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all">
          <Plus className="h-4 w-4" /> Start a Case
        </Link>
      )}
    </div>
  );
}

export default function DocumentsClient({ disputes }: DocumentsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"all" | "byCase">("all");

  const stats = useMemo(() => {
    const allDocs = disputes.flatMap((d) => d.documentPlan?.documents || []);
    return {
      total: allDocs.length,
      completed: allDocs.filter((d) => d.status === "COMPLETED").length,
      pending: allDocs.filter((d) => d.status === "PENDING" || d.status === "GENERATING").length,
      failed: allDocs.filter((d) => d.status === "FAILED").length,
    };
  }, [disputes]);

  const allDocuments = useMemo(() => {
    return disputes.flatMap((d) =>
      (d.documentPlan?.documents || []).map((doc) => ({
        ...doc,
        disputeId: d.id,
        caseTitle: d.title,
        caseType: d.type,
      }))
    );
  }, [disputes]);

  const filteredDocuments = useMemo(() => {
    return allDocuments.filter((doc) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!doc.caseTitle.toLowerCase().includes(q) && !humanizeDocumentType(doc.type).toLowerCase().includes(q)) return false;
      }
      if (statusFilter !== "all" && doc.status !== statusFilter) return false;
      return true;
    });
  }, [allDocuments, searchQuery, statusFilter]);

  const filteredDisputes = useMemo(() => {
    return disputes.filter((d) => {
      if (!d.documentPlan || d.documentPlan.documents.length === 0) return false;
      if (searchQuery && !d.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (statusFilter !== "all" && !d.documentPlan.documents.some((doc) => doc.status === statusFilter)) return false;
      return true;
    });
  }, [disputes, searchQuery, statusFilter]);

  const hasFilters = !!(searchQuery || statusFilter !== "all");
  const clearFilters = () => { setSearchQuery(""); setStatusFilter("all"); };

  return (
    <div className="space-y-0 sm:space-y-5 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 px-5 sm:px-0 pt-5 sm:pt-0">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight">Documents</h1>
          <p className="text-slate-400 text-sm mt-1 hidden sm:block">All your generated legal documents in one place.</p>
        </div>
        <Link href="/disputes/start" className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all self-start sm:self-auto">
          <Plus className="h-4 w-4" /> New Case
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 px-5 sm:px-0 pt-3 sm:pt-0">
        <div className="bg-blue-600 rounded-2xl p-5 sm:p-5 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500 rounded-full -translate-y-4 translate-x-4 opacity-30" />
          <div className="relative z-10">
            <p className="text-sm font-medium text-blue-100 mb-2">Total Docs</p>
            <p className="text-4xl sm:text-[42px] font-bold leading-none">{stats.total}</p>
            <span className="text-xs text-blue-200 mt-3 block">All files</span>
          </div>
        </div>
        <div className="bg-slate-50 sm:bg-white rounded-2xl sm:border sm:border-slate-200/80 p-5 sm:p-5">
          <p className="text-sm font-medium text-slate-500 mb-2">Ready</p>
          <p className="text-4xl sm:text-[42px] font-bold text-slate-900 leading-none">{stats.completed}</p>
          <span className="text-xs text-slate-400 mt-3 block">Download</span>
        </div>
        <div className="bg-slate-50 sm:bg-white rounded-2xl sm:border sm:border-slate-200/80 p-5 sm:p-5">
          <p className="text-sm font-medium text-slate-500 mb-2">In Progress</p>
          <p className="text-4xl sm:text-[42px] font-bold text-slate-900 leading-none">{stats.pending}</p>
          <span className="text-xs text-slate-400 mt-3 block">Generating</span>
        </div>
        <div className="bg-slate-50 sm:bg-white rounded-2xl sm:border sm:border-slate-200/80 p-5 sm:p-5">
          <p className="text-sm font-medium text-slate-500 mb-2">Failed</p>
          <p className="text-4xl sm:text-[42px] font-bold text-slate-900 leading-none">{stats.failed}</p>
          <span className="text-xs text-slate-400 mt-3 block">Attention</span>
        </div>
      </div>

      {/* Search + Filters + View Toggle */}
      <div className="bg-white sm:rounded-2xl sm:border sm:border-slate-200/80 p-4 px-4 sm:px-4 border-b border-slate-100 sm:border-b-0 pt-4 sm:pt-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              placeholder="Search documents or cases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-40 h-10 rounded-xl border-slate-200 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="GENERATING">Generating</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode("all")}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${viewMode === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
            >
              All Documents
            </button>
            <button
              onClick={() => setViewMode("byCase")}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all ${viewMode === "byCase" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
            >
              By Case
            </button>
          </div>
        </div>
      </div>

      {/* Documents */}
      {viewMode === "all" ? (
        filteredDocuments.length === 0 ? (
          <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {filteredDocuments.map((doc) => (
              <DocumentCard key={doc.id} document={doc} disputeId={doc.disputeId} caseTitle={doc.caseTitle} />
            ))}
          </div>
        )
      ) : (
        filteredDisputes.length === 0 ? (
          <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
        ) : (
          <div className="space-y-4">
            {filteredDisputes.map((dispute) => (
              <CaseGroup key={dispute.id} dispute={dispute} />
            ))}
          </div>
        )
      )}
    </div>
  );
}
