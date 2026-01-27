"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  Image,
  FileVideo,
  File,
  Check,
  ArrowRight,
  Folder,
  Calendar,
  AlertCircle,
  Sparkles,
  CheckCircle,
  Clock,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CaseLifecycleStatus, DisputeType } from "@prisma/client";

interface Dispute {
  id: string;
  title: string;
  type: DisputeType;
  lifecycleStatus: CaseLifecycleStatus;
  strategyLocked: boolean;
  createdAt: Date;
  caseStrategy: {
    disputeType: string | null;
    evidenceMentioned: string[];
  } | null;
  documentPlan: {
    documents: Array<{
      status: string;
    }>;
  } | null;
}

interface UploadEvidenceClientProps {
  disputes: Dispute[];
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

function CaseCard({ dispute, onSelect }: { dispute: Dispute; onSelect: (id: string) => void }) {
  const statusConfig = LIFECYCLE_STATUS_CONFIG[dispute.lifecycleStatus];
  const evidenceCount = dispute.caseStrategy?.evidenceMentioned?.length || 0;

  return (
    <button
      onClick={() => onSelect(dispute.id)}
      className="group relative overflow-hidden rounded-2xl p-6 glass-strong border border-indigo-500/20 hover:border-indigo-500/50 transition-all duration-300 text-left w-full hover:scale-[1.02] hover:glow-purple"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 via-purple-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10 space-y-4">
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
          <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all duration-300 shrink-0 ml-2" />
        </div>

        {/* Status & Info */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-gradient-to-r ${statusConfig.gradient} text-white`}
          >
            {statusConfig.label}
          </span>
          {dispute.strategyLocked && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Sparkles className="h-3 w-3" />
              AI Ready
            </span>
          )}
          {evidenceCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <CheckCircle className="h-3 w-3" />
              {evidenceCount} evidence items
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-indigo-500/10">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(dispute.createdAt).toLocaleDateString()}
          </span>
          <span className="text-indigo-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Select case →
          </span>
        </div>
      </div>
    </button>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-3xl opacity-30 animate-pulse" />
        <div className="relative p-8 rounded-3xl glass-strong border border-indigo-500/20">
          <Folder className="h-16 w-16 text-indigo-400" />
        </div>
      </div>
      <h3 className="text-3xl font-bold text-white mb-3">No active cases</h3>
      <p className="text-slate-400 text-center max-w-md mb-8 text-lg">
        You need to create a case first before uploading evidence
      </p>
      <Button
        onClick={() => window.location.href = "/disputes/start"}
        size="lg"
        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-indigo-500/25 px-8 py-6 text-lg rounded-2xl"
      >
        <FileText className="mr-2 h-6 w-6" />
        Create Your First Case
      </Button>
    </div>
  );
}

function FileTypeCard({
  icon: Icon,
  title,
  description,
  gradient,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className="p-4 rounded-xl glass border border-indigo-500/10">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white mb-0.5">{title}</h4>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function UploadEvidenceClient({ disputes }: UploadEvidenceClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDisputes = disputes.filter((dispute) =>
    dispute.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dispute.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCaseSelect = (caseId: string) => {
    // Navigate to the case page with upload mode
    router.push(`/disputes/${caseId}/case?upload=true`);
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-5xl font-bold text-white mb-3 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Upload Evidence
        </h1>
        <p className="text-slate-400 text-lg">
          Select a case to add supporting documents and evidence
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <FileTypeCard
          icon={FileText}
          title="Documents"
          description="PDFs, contracts, letters"
          gradient="from-indigo-500 to-purple-500"
        />
        <FileTypeCard
          icon={Image}
          title="Images"
          description="Photos, screenshots, scans"
          gradient="from-cyan-500 to-blue-500"
        />
        <FileTypeCard
          icon={FileVideo}
          title="Videos"
          description="Recordings, clips, footage"
          gradient="from-emerald-500 to-teal-500"
        />
        <FileTypeCard
          icon={File}
          title="Other Files"
          description="Any supporting evidence"
          gradient="from-orange-500 to-red-500"
        />
      </div>

      {/* Search */}
      {disputes.length > 0 && (
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search cases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 rounded-2xl glass-strong border-indigo-500/20 text-white placeholder:text-slate-500 focus:border-indigo-500/50 text-lg"
          />
        </div>
      )}

      {/* Cases Grid */}
      {disputes.length === 0 ? (
        <EmptyState />
      ) : filteredDisputes.length === 0 ? (
        <div className="text-center py-20">
          <AlertCircle className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No cases found</h3>
          <p className="text-slate-400">Try adjusting your search</p>
          <Button
            onClick={() => setSearchQuery("")}
            variant="outline"
            className="mt-4 border-indigo-500/30 text-white hover:bg-indigo-500/10"
          >
            Clear search
          </Button>
        </div>
      ) : (
        <>
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Select a case</h2>
            <p className="text-slate-400 mb-6">
              Choose which case you want to add evidence to ({filteredDisputes.length} {filteredDisputes.length === 1 ? 'case' : 'cases'})
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDisputes.map((dispute) => (
              <CaseCard key={dispute.id} dispute={dispute} onSelect={handleCaseSelect} />
            ))}
          </div>
        </>
      )}

      {/* Help Text */}
      <div className="rounded-2xl p-6 glass-strong border border-indigo-500/20">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/20 border border-indigo-500/30 shrink-0">
            <AlertCircle className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white mb-2">Evidence Guidelines</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                <span>Upload clear, legible documents and images</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                <span>Include dates, signatures, and relevant details</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                <span>Organize by type (contracts, receipts, correspondence)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                <span>Remove sensitive information like bank details if not needed</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
