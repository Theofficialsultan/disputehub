"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  X,
  AlertTriangle,
  Download,
  FileText,
  Image as ImageIcon,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Hash,
  Folder,
  TrendingUp,
  MessageSquare,
  Eye,
  MoreVertical,
  Ban,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Dispute, CaseLifecycleStatus, DisputeType } from "@prisma/client";
import { toast } from "sonner";

interface CaseDetailsClientProps {
  caseData: Dispute & {
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
      createdAt: Date;
      documents: Array<{
        id: string;
        type: string;
        status: string;
        fileUrl: string | null;
        isFollowUp: boolean;
        retryCount: number;
        lastError: string | null;
        createdAt: Date;
        order: number;
      }>;
    } | null;
    caseEvents: Array<{
      id: string;
      type: string;
      description: string;
      occurredAt: Date;
      relatedDocumentId: string | null;
    }>;
  };
  evidence: Array<{
    id: string;
    evidenceIndex: number;
    title: string;
    description: string | null;
    fileType: string;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    evidenceDate: Date | null;
    uploadedAt: Date;
  }>;
}

const LIFECYCLE_STATUS_CONFIG: Record<
  CaseLifecycleStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  DRAFT: {
    label: "Draft",
    color: "text-slate-400",
    bg: "bg-slate-500/20",
    border: "border-slate-500/30",
  },
  DOCUMENT_SENT: {
    label: "Sent",
    color: "text-blue-400",
    bg: "bg-blue-500/20",
    border: "border-blue-500/30",
  },
  AWAITING_RESPONSE: {
    label: "Awaiting Response",
    color: "text-yellow-400",
    bg: "bg-yellow-500/20",
    border: "border-yellow-500/30",
  },
  RESPONSE_RECEIVED: {
    label: "Response Received",
    color: "text-purple-400",
    bg: "bg-purple-500/20",
    border: "border-purple-500/30",
  },
  DEADLINE_MISSED: {
    label: "Deadline Missed",
    color: "text-red-400",
    bg: "bg-red-500/20",
    border: "border-red-500/30",
  },
  CLOSED: {
    label: "Closed",
    color: "text-gray-400",
    bg: "bg-gray-500/20",
    border: "border-gray-500/30",
  },
};

const STATUS_CONFIG = {
  PENDING: {
    label: "Pending",
    color: "text-slate-400",
    bg: "bg-slate-500/20",
    border: "border-slate-500/30",
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

function humanizeDisputeType(type: string): string {
  return type
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CaseDetailsClient({
  caseData,
  evidence,
}: CaseDetailsClientProps) {
  const router = useRouter();
  const [isClosing, setIsClosing] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);

  const status = LIFECYCLE_STATUS_CONFIG[caseData.lifecycleStatus];

  const handleEdit = () => {
    router.push(`/disputes/${caseData.id}/case`);
  };

  const handleClose = async () => {
    if (!confirm("Are you sure you want to close this case?")) return;

    setIsClosing(true);
    try {
      const response = await fetch(`/api/disputes/${caseData.id}/close`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to close case");
      }

      toast.success("Case closed successfully");
      router.refresh();
    } catch (error) {
      toast.error("Failed to close case");
      console.error(error);
    } finally {
      setIsClosing(false);
    }
  };

  const handleEscalate = async () => {
    if (!confirm("Escalate this case to a lawyer?")) return;

    setIsEscalating(true);
    try {
      const response = await fetch(`/api/disputes/${caseData.id}/escalate`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to escalate case");
      }

      toast.success("Case escalated to lawyer");
      router.push("/lawyer");
    } catch (error) {
      toast.error("Failed to escalate case");
      console.error(error);
    } finally {
      setIsEscalating(false);
    }
  };

  const completedDocs = caseData.documentPlan?.documents.filter(
    (d) => d.status === "COMPLETED"
  ).length || 0;
  const totalDocs = caseData.documentPlan?.documents.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/cases")}
              className="text-slate-400 hover:text-white hover:bg-indigo-500/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {caseData.title}
              </h1>
              <div className="flex items-center gap-3">
                <Badge
                  className={`${status.bg} ${status.border} ${status.color} border`}
                >
                  {status.label}
                </Badge>
                {caseData.type && (
                  <span className="text-sm text-slate-400">
                    {humanizeDisputeType(caseData.type)}
                  </span>
                )}
                <span className="text-sm text-slate-500">
                  Created {new Date(caseData.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleEdit}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0"
            >
              <Edit className="mr-2 h-4 w-4" />
              Continue Chat
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-indigo-500/30 text-white hover:bg-indigo-500/20"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="glass-strong border-indigo-500/20"
              >
                <DropdownMenuItem
                  onClick={handleEscalate}
                  disabled={isEscalating}
                  className="text-white hover:bg-indigo-500/20"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  {isEscalating ? "Escalating..." : "Escalate to Lawyer"}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-indigo-500/20" />
                <DropdownMenuItem
                  onClick={handleClose}
                  disabled={isClosing || caseData.lifecycleStatus === "CLOSED"}
                  className="text-red-400 hover:bg-red-500/20"
                >
                  <Ban className="mr-2 h-4 w-4" />
                  {isClosing ? "Closing..." : "Close Case"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN: Case Info + Strategy */}
          <div className="lg:col-span-2 space-y-6">
            {/* Case Strategy */}
            {caseData.caseStrategy && (
              <div className="rounded-3xl glass-strong border border-indigo-500/20 p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-indigo-400" />
                  Case Strategy
                </h2>
                <div className="space-y-4">
                  {caseData.caseStrategy.disputeType && (
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Dispute Type</p>
                      <p className="text-white font-medium">
                        {humanizeDisputeType(caseData.caseStrategy.disputeType)}
                      </p>
                    </div>
                  )}

                  {caseData.caseStrategy.keyFacts.length > 0 && (
                    <div>
                      <p className="text-sm text-slate-400 mb-2">
                        Key Facts ({caseData.caseStrategy.keyFacts.length})
                      </p>
                      <ul className="space-y-2">
                        {caseData.caseStrategy.keyFacts.map((fact, i) => (
                          <li
                            key={i}
                            className="text-sm text-slate-300 flex items-start gap-2"
                          >
                            <span className="text-indigo-400 mt-1">•</span>
                            <span>{fact}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {caseData.caseStrategy.desiredOutcome && (
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Desired Outcome</p>
                      <p className="text-white">{caseData.caseStrategy.desiredOutcome}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Documents */}
            {caseData.documentPlan && (
              <div className="rounded-3xl glass-strong border border-indigo-500/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-400" />
                    Documents ({completedDocs}/{totalDocs})
                  </h2>
                  <Badge className="bg-purple-500/20 border-purple-500/30 text-purple-300 border">
                    {caseData.documentPlan.complexity}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {caseData.documentPlan.documents.map((doc) => {
                    const docStatus =
                      STATUS_CONFIG[doc.status as keyof typeof STATUS_CONFIG] ||
                      STATUS_CONFIG.PENDING;
                    const StatusIcon = docStatus.icon;

                    return (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 rounded-xl glass-strong border border-indigo-500/10"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className={`p-2 rounded-lg ${docStatus.bg} border ${docStatus.border}`}
                          >
                            <StatusIcon
                              className={`h-4 w-4 ${docStatus.color} ${
                                doc.status === "GENERATING" ? "animate-spin" : ""
                              }`}
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">
                              {humanizeDocumentType(doc.type)}
                            </p>
                            <p className={`text-xs ${docStatus.color}`}>
                              {docStatus.label}
                            </p>
                          </div>
                          {doc.isFollowUp && (
                            <Badge className="bg-purple-500/20 border-purple-500/30 text-purple-300 border text-xs">
                              Follow-up
                            </Badge>
                          )}
                        </div>

                        {doc.status === "COMPLETED" && doc.fileUrl && (
                          <Button
                            size="sm"
                            onClick={() => window.open(doc.fileUrl!, "_blank")}
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0"
                          >
                            <Download className="mr-1.5 h-3.5 w-3.5" />
                            Download
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Evidence */}
            {evidence.length > 0 && (
              <div className="rounded-3xl glass-strong border border-indigo-500/20 p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Folder className="h-5 w-5 text-indigo-400" />
                  Evidence ({evidence.length})
                </h2>

                <div className="space-y-3">
                  {evidence.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-4 p-4 rounded-xl glass-strong border border-indigo-500/10"
                    >
                      <div className="shrink-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex flex-col items-center justify-center text-white shadow-lg">
                          <Hash className="h-3 w-3 mb-0.5" />
                          <span className="text-lg font-bold">
                            {item.evidenceIndex}
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white text-sm truncate">
                              {item.title}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                              <span className="flex items-center gap-1">
                                {item.fileType === "IMAGE" ? (
                                  <ImageIcon className="h-3 w-3" />
                                ) : (
                                  <FileText className="h-3 w-3" />
                                )}
                                {item.fileType}
                              </span>
                              <span>{formatFileSize(item.fileSize)}</span>
                            </div>
                          </div>
                        </div>

                        {item.description && (
                          <p className="text-xs text-slate-300 mb-2">
                            {item.description}
                          </p>
                        )}

                        {item.evidenceDate && (
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(item.evidenceDate).toLocaleDateString("en-GB")}
                          </p>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(item.fileUrl, "_blank")}
                          className="mt-2 border-indigo-500/30 text-white hover:bg-indigo-500/20 text-xs h-7"
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Timeline */}
          <div className="space-y-6">
            <div className="rounded-3xl glass-strong border border-indigo-500/20 p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-400" />
                Timeline
              </h2>

              {caseData.caseEvents.length > 0 ? (
                <div className="space-y-4">
                  {caseData.caseEvents.map((event, index) => (
                    <div key={event.id} className="relative">
                      {index !== caseData.caseEvents.length - 1 && (
                        <div className="absolute left-2 top-6 bottom-0 w-px bg-indigo-500/20" />
                      )}
                      <div className="flex gap-3">
                        <div className="shrink-0 w-4 h-4 rounded-full bg-indigo-500 border-2 border-indigo-400/30 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm text-white font-medium">
                            {event.description}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(event.occurredAt).toLocaleString("en-GB")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">No events yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
