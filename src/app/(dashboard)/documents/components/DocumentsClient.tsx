"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Filter,
  Search,
  FolderOpen,
  File,
  AlertCircle,
  RefreshCw,
  Calendar,
  TrendingUp,
  FileCheck,
  FilePlus,
  Archive,
  ExternalLink,
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
import type { CaseLifecycleStatus, DisputeType } from "@prisma/client";

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
  type: DisputeType;
  lifecycleStatus: CaseLifecycleStatus;
  createdAt: Date;
  documentPlan: DocumentPlan | null;
}

interface DocumentsClientProps {
  disputes: Dispute[];
}

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

function DocumentCard({ document, caseTitle }: { document: Document; caseTitle: string }) {
  const [isRetrying, setIsRetrying] = useState(false);
  const status = STATUS_CONFIG[document.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING;
  const StatusIcon = status.icon;

  const handleDownload = () => {
    if (document.fileUrl) {
      window.open(document.fileUrl, "_blank");
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      const response = await fetch(`/api/documents/${document.id}/retry`, {
        method: "POST",
      });
      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Retry failed:", error);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl glass-strong border border-indigo-500/20 hover:border-indigo-500/40 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div className={`p-3 rounded-xl ${status.bg} border ${status.border}`}>
            <File className={`h-5 w-5 ${status.color}`} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white mb-1 group-hover:text-indigo-300 transition-colors">
              {humanizeDocumentType(document.type)}
            </h3>
            <p className="text-xs text-slate-400 mb-2">{caseTitle}</p>
            {document.isFollowUp && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-500/20 border border-purple-500/30 text-xs text-purple-300">
                <RefreshCw className="h-3 w-3" />
                Follow-up
              </span>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${status.bg} border ${status.border}`}>
          <StatusIcon className={`h-4 w-4 ${status.color} ${document.status === "GENERATING" ? "animate-spin" : ""}`} />
          <span className={`text-sm font-medium ${status.color}`}>{status.label}</span>
        </div>
      </div>

      {/* Error Message */}
      {document.status === "FAILED" && document.lastError && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
            <p className="text-xs text-red-300">{document.lastError}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(document.createdAt).toLocaleDateString()}
          </span>
          {document.retryCount > 0 && (
            <span className="flex items-center gap-1">
              <RefreshCw className="h-3 w-3" />
              Retries: {document.retryCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {document.status === "COMPLETED" && document.fileUrl && (
            <Button
              size="sm"
              onClick={handleDownload}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0"
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Download PDF
            </Button>
          )}
          {document.status === "FAILED" && document.retryCount < 3 && (
            <Button
              size="sm"
              onClick={handleRetry}
              disabled={isRetrying}
              variant="outline"
              className="border-indigo-500/30 text-white hover:bg-indigo-500/10"
            >
              {isRetrying ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  Retry
                </>
              )}
            </Button>
          )}
          {document.status === "PENDING" && (
            <span className="text-xs text-slate-500">Waiting to generate...</span>
          )}
          {document.status === "GENERATING" && (
            <span className="text-xs text-blue-400 flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Generating...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function CaseDocumentsSection({ dispute }: { dispute: Dispute }) {
  const plan = dispute.documentPlan;
  const completedDocs = plan?.documents.filter((d) => d.status === "COMPLETED").length || 0;
  const totalDocs = plan?.documents.length || 0;

  return (
    <div className="rounded-3xl glass-strong border border-indigo-500/20 overflow-hidden">
      {/* Case Header */}
      <div className="p-6 border-b border-indigo-500/20">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <Link
              href={`/disputes/${dispute.id}/case`}
              className="text-xl font-bold text-white hover:text-indigo-300 transition-colors flex items-center gap-2 group"
            >
              {dispute.title}
              <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <p className="text-sm text-slate-400 capitalize mt-1">
              {dispute.type.toLowerCase().replace(/_/g, " ")}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              {completedDocs}/{totalDocs}
            </div>
            <p className="text-xs text-slate-400">Documents Ready</p>
          </div>
        </div>

        {plan && (
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-xs text-indigo-300 capitalize">
              {plan.complexity} Complexity
            </span>
            <span className="px-3 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30 text-xs text-purple-300">
              {plan.documentType.replace(/_/g, " ")}
            </span>
            <span className="text-xs text-slate-500">
              Score: {plan.complexityScore}
            </span>
          </div>
        )}
      </div>

      {/* Documents */}
      <div className="p-6">
        {!plan || plan.documents.length === 0 ? (
          <div className="text-center py-8">
            <FolderOpen className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No documents generated yet</p>
            <p className="text-sm text-slate-500 mt-1">Complete the case to generate documents</p>
          </div>
        ) : (
          <div className="space-y-3">
            {plan.documents.map((doc) => (
              <DocumentCard key={doc.id} document={doc} caseTitle={dispute.title} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatsCard({
  icon: Icon,
  label,
  value,
  subtitle,
  gradient,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtitle?: string;
  gradient: string;
}) {
  return (
    <div className="p-6 rounded-2xl glass-strong border border-indigo-500/20 hover:glow-purple transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-slate-400">{label}</div>
      {subtitle && <div className="text-xs text-slate-500 mt-1">{subtitle}</div>}
    </div>
  );
}

export default function DocumentsClient({ disputes }: DocumentsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Calculate stats
  const stats = useMemo(() => {
    const allDocuments = disputes.flatMap((d) => d.documentPlan?.documents || []);
    return {
      total: allDocuments.length,
      completed: allDocuments.filter((d) => d.status === "COMPLETED").length,
      pending: allDocuments.filter((d) => d.status === "PENDING").length,
      failed: allDocuments.filter((d) => d.status === "FAILED").length,
      generating: allDocuments.filter((d) => d.status === "GENERATING").length,
    };
  }, [disputes]);

  // Filter disputes
  const filteredDisputes = useMemo(() => {
    return disputes.filter((dispute) => {
      // Search filter
      if (searchQuery && !dispute.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all") {
        const hasMatchingStatus = dispute.documentPlan?.documents.some(
          (d) => d.status === statusFilter
        );
        if (!hasMatchingStatus) return false;
      }

      // Type filter
      if (typeFilter !== "all") {
        if (dispute.type !== typeFilter) return false;
      }

      return true;
    });
  }, [disputes, searchQuery, statusFilter, typeFilter]);

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-5xl font-bold text-white mb-3 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Document Library
        </h1>
        <p className="text-slate-400 text-lg">
          Manage and download all your generated legal documents
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={FileText}
          label="Total Documents"
          value={stats.total}
          subtitle="All time"
          gradient="from-indigo-500 to-purple-500"
        />
        <StatsCard
          icon={FileCheck}
          label="Completed"
          value={stats.completed}
          subtitle="Ready to download"
          gradient="from-emerald-500 to-teal-500"
        />
        <StatsCard
          icon={Clock}
          label="Pending"
          value={stats.pending + stats.generating}
          subtitle="Being generated"
          gradient="from-yellow-500 to-orange-500"
        />
        <StatsCard
          icon={AlertCircle}
          label="Failed"
          value={stats.failed}
          subtitle="Requires attention"
          gradient="from-red-500 to-pink-500"
        />
      </div>

      {/* Filters */}
      <div className="rounded-2xl p-6 glass-strong border border-indigo-500/20">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search cases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 glass-strong border-indigo-500/20 text-white placeholder:text-slate-500"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48 glass-strong border-indigo-500/20 text-white">
              <Filter className="mr-2 h-4 w-4 text-slate-400" />
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

          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-48 glass-strong border-indigo-500/20 text-white">
              <FileText className="mr-2 h-4 w-4 text-slate-400" />
              <SelectValue placeholder="Case Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="CONSUMER_RIGHTS">Consumer Rights</SelectItem>
              <SelectItem value="EMPLOYMENT">Employment</SelectItem>
              <SelectItem value="LANDLORD_TENANT">Landlord-Tenant</SelectItem>
              <SelectItem value="DEBT">Debt</SelectItem>
              <SelectItem value="CONTRACT">Contract</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Documents by Case */}
      {filteredDisputes.length === 0 ? (
        <div className="text-center py-16">
          <Archive className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No documents found</h3>
          <p className="text-slate-400 mb-6">
            {searchQuery || statusFilter !== "all" || typeFilter !== "all"
              ? "Try adjusting your filters"
              : "Start a new case to generate documents"}
          </p>
          {(searchQuery || statusFilter !== "all" || typeFilter !== "all") && (
            <Button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setTypeFilter("all");
              }}
              variant="outline"
              className="border-indigo-500/30 text-white hover:bg-indigo-500/10"
            >
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredDisputes.map((dispute) => (
            <CaseDocumentsSection key={dispute.id} dispute={dispute} />
          ))}
        </div>
      )}
    </div>
  );
}
