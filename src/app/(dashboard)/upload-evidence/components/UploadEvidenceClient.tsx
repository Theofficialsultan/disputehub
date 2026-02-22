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
import type { CaseLifecycleStatus } from "@prisma/client";

interface Dispute {
  id: string;
  title: string;
  type: string;
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
  { label: string; color: string; bg: string; border: string }
> = {
  DRAFT: {
    label: "Draft",
    color: "text-slate-700",
    bg: "bg-slate-50",
    border: "border-slate-200",
  },
  DOCUMENT_SENT: {
    label: "Sent",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  AWAITING_RESPONSE: {
    label: "Awaiting Response",
    color: "text-yellow-700",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
  },
  RESPONSE_RECEIVED: {
    label: "Response Received",
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
  DEADLINE_MISSED: {
    label: "Deadline Missed",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
  },
  CLOSED: {
    label: "Closed",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
};

function CaseCard({ dispute, onSelect }: { dispute: Dispute; onSelect: (id: string) => void }) {
  const statusConfig = LIFECYCLE_STATUS_CONFIG[dispute.lifecycleStatus];
  const evidenceCount = dispute.caseStrategy?.evidenceMentioned?.length || 0;

  return (
    <button
      onClick={() => onSelect(dispute.id)}
      className="group relative overflow-hidden rounded-2xl p-6 card-elevated border border-slate-200 hover:border-slate-300 transition-all duration-300 text-left w-full hover:scale-[1.01]"
    >
      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 text-lg mb-1 group-hover:text-blue-600 transition-colors truncate">
              {dispute.title}
            </h3>
            <p className="text-sm text-slate-500 capitalize truncate">
              {dispute.type.toLowerCase().replace(/_/g, " ")}
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-slate-500 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300 shrink-0 ml-2" />
        </div>

        {/* Status & Info */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold ${statusConfig.bg} ${statusConfig.color} border ${statusConfig.border}`}
          >
            {statusConfig.label}
          </span>
          {dispute.strategyLocked && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
              <Sparkles className="h-3 w-3" />
              AI Ready
            </span>
          )}
          {evidenceCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle className="h-3 w-3" />
              {evidenceCount} evidence items
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(dispute.createdAt).toLocaleDateString()}
          </span>
          <span className="text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
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
        <div className="relative p-8 rounded-3xl card-elevated border border-slate-200">
          <Folder className="h-16 w-16 text-blue-600" />
        </div>
      </div>
      <h3 className="text-3xl font-bold text-slate-900 mb-3">No active cases</h3>
      <p className="text-slate-500 text-center max-w-md mb-8 text-lg">
        You need to create a case first before uploading evidence
      </p>
      <Button
        onClick={() => window.location.href = "/disputes/start"}
        size="lg"
        className="bg-blue-600 hover:bg-blue-700 text-white border-0 px-8 py-6 text-lg rounded-2xl"
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
    <div className="p-4 rounded-xl card-elevated border border-slate-200">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-slate-900 mb-0.5">{title}</h4>
          <p className="text-xs text-slate-500">{description}</p>
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
        <h1 className="text-5xl font-bold text-blue-600 mb-3">
          Upload Evidence
        </h1>
        <p className="text-slate-500 text-lg">
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
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
          <Input
            placeholder="Search cases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 rounded-2xl card-elevated border-slate-200 text-slate-900 placeholder:text-slate-500 focus:border-blue-500 text-lg"
          />
        </div>
      )}

      {/* Cases Grid */}
      {disputes.length === 0 ? (
        <EmptyState />
      ) : filteredDisputes.length === 0 ? (
        <div className="text-center py-20">
          <AlertCircle className="h-16 w-16 text-slate-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No cases found</h3>
          <p className="text-slate-500">Try adjusting your search</p>
          <Button
            onClick={() => setSearchQuery("")}
            variant="outline"
            className="mt-4 border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            Clear search
          </Button>
        </div>
      ) : (
        <>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Select a case</h2>
            <p className="text-slate-500 mb-6">
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
      <div className="rounded-2xl p-6 card-elevated border border-slate-200">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 shrink-0">
            <AlertCircle className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">Evidence Guidelines</h3>
            <ul className="space-y-2 text-sm text-slate-500">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                <span>Upload clear, legible documents and images</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                <span>Include dates, signatures, and relevant details</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                <span>Organize by type (contracts, receipts, correspondence)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                <span>Remove sensitive information like bank details if not needed</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
