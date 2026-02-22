"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
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
  Scale,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ArrowUpRight,
  AlertTriangle,
  Mail,
  Send,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Dispute, CaseLifecycleStatus } from "@prisma/client";
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
        title: string;
        status: string;
        fileUrl: string | null;
        content: string | null;
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
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  DRAFT: { label: "Draft", color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200", dot: "bg-slate-400" },
  DOCUMENT_SENT: { label: "Sent", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500" },
  AWAITING_RESPONSE: { label: "Awaiting Response", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500" },
  RESPONSE_RECEIVED: { label: "Response Received", color: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200", dot: "bg-purple-500" },
  DEADLINE_MISSED: { label: "Overdue", color: "text-red-700", bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500" },
  CLOSED: { label: "Resolved", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500" },
};

const DOC_STATUS = {
  PENDING: { label: "Pending", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500", icon: Clock },
  GENERATING: { label: "Generating", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500", icon: Loader2 },
  COMPLETED: { label: "Completed", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500", icon: CheckCircle },
  FAILED: { label: "Failed", color: "text-red-700", bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500", icon: XCircle },
};

function humanizeDocumentType(type: string): string {
  return type.replace(/^UK-/i, "").split(/[-_]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

function humanizeDisputeType(type: string): string {
  return type.split("_").map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(" ");
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export default function CaseDetailsClient({ caseData, evidence }: CaseDetailsClientProps) {
  const router = useRouter();
  const [isClosing, setIsClosing] = useState(false);

  const status = LIFECYCLE_STATUS_CONFIG[caseData.lifecycleStatus];
  const completedDocs = caseData.documentPlan?.documents.filter((d) => d.status === "COMPLETED").length || 0;
  const totalDocs = caseData.documentPlan?.documents.length || 0;
  const progress = totalDocs > 0 ? (completedDocs / totalDocs) * 100 : 0;

  const handleClose = async () => {
    if (!confirm("Are you sure you want to close this case?")) return;
    setIsClosing(true);
    try {
      const res = await fetch("/api/disputes/" + caseData.id + "/close", { method: "POST" });
      if (!res.ok) throw new Error();
      toast.success("Case closed successfully");
      router.refresh();
    } catch { toast.error("Failed to close case"); } finally { setIsClosing(false); }
  };

  return (
    <div className="space-y-5 pb-8">
      {/* Back + Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
        <div className="flex items-start gap-2 sm:gap-3 min-w-0">
          <button onClick={() => router.push("/cases")} className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-all flex-shrink-0 mt-1">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-[28px] font-bold text-slate-900 tracking-tight truncate">{caseData.title}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${status.bg} ${status.color} border ${status.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
              <span className="text-[12px] text-slate-400 capitalize hidden sm:inline">{humanizeDisputeType(caseData.type)}</span>
              <span className="text-[12px] text-slate-400 hidden sm:inline">Created {new Date(caseData.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => router.push("/disputes/" + caseData.id + "/case")}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs sm:text-sm hover:bg-blue-700 transition-all"
          >
            <MessageSquare className="h-4 w-4" /> Continue Chat
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-all">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border-slate-200 rounded-xl shadow-lg">
              <DropdownMenuItem onClick={() => router.push("/disputes/" + caseData.id + "/documents")}>
                <FileText className="mr-2 h-4 w-4" /> View Documents
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-100" />
              <DropdownMenuItem onClick={handleClose} disabled={isClosing || caseData.lifecycleStatus === "CLOSED"} className="text-red-600">
                <Ban className="mr-2 h-4 w-4" /> {isClosing ? "Closing..." : "Close Case"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-600 rounded-2xl p-4 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-12 h-12 bg-blue-500 rounded-full -translate-y-3 translate-x-3 opacity-30" />
          <p className="text-[12px] text-blue-100 font-medium mb-1">Documents</p>
          <p className="text-3xl font-bold">{totalDocs}</p>
          <span className="text-[11px] text-blue-200">{completedDocs} ready</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
          <p className="text-[12px] text-slate-400 font-medium mb-1">Evidence</p>
          <p className="text-3xl font-bold text-slate-900">{evidence.length}</p>
          <span className="text-[11px] text-slate-400">files uploaded</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
          <p className="text-[12px] text-slate-400 font-medium mb-1">Timeline</p>
          <p className="text-3xl font-bold text-slate-900">{caseData.caseEvents.length}</p>
          <span className="text-[11px] text-slate-400">events logged</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
          <p className="text-[12px] text-slate-400 font-medium mb-1">Progress</p>
          <p className="text-3xl font-bold text-slate-900">{totalDocs > 0 ? Math.round(progress) : 0}%</p>
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden mt-1">
            <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: progress + "%" }} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Strategy + Documents + Evidence */}
        <div className="lg:col-span-2 space-y-5">

          {/* Case Strategy */}
          {caseData.caseStrategy && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
              <h2 className="text-[16px] font-bold text-slate-900 mb-4 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center"><TrendingUp className="h-3.5 w-3.5 text-blue-600" /></div>
                Case Strategy
              </h2>
              <div className="space-y-4">
                {caseData.caseStrategy.disputeType && (
                  <div>
                    <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide mb-1">Dispute Type</p>
                    <p className="text-[13px] text-slate-900 font-medium">{humanizeDisputeType(caseData.caseStrategy.disputeType)}</p>
                  </div>
                )}
                {caseData.caseStrategy.keyFacts.length > 0 && (
                  <div>
                    <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide mb-2">Key Facts</p>
                    <div className="space-y-2">
                      {caseData.caseStrategy.keyFacts.map((fact, i) => (
                        <div key={i} className="flex items-start gap-2 text-[13px] text-slate-600 leading-relaxed">
                          <span className="w-5 h-5 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-[10px] font-bold text-blue-600">{i + 1}</span>
                          </span>
                          {fact}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {caseData.caseStrategy.evidenceMentioned.length > 0 && (
                  <div>
                    <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide mb-2">Evidence Mentioned</p>
                    <div className="flex flex-wrap gap-1.5">
                      {caseData.caseStrategy.evidenceMentioned.map((e, i) => (
                        <span key={i} className="text-[11px] px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 font-medium">{e}</span>
                      ))}
                    </div>
                  </div>
                )}
                {caseData.caseStrategy.desiredOutcome && (
                  <div>
                    <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide mb-1">Desired Outcome</p>
                    <p className="text-[13px] text-slate-900 leading-relaxed">{caseData.caseStrategy.desiredOutcome}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Documents */}
          {caseData.documentPlan && caseData.documentPlan.documents.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[16px] font-bold text-slate-900 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center"><FileText className="h-3.5 w-3.5 text-blue-600" /></div>
                  Documents
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-slate-500">{completedDocs}/{totalDocs} ready</span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 capitalize">{caseData.documentPlan.complexity}</span>
                </div>
              </div>
              <div className="space-y-2">
                {caseData.documentPlan.documents.map((doc) => {
                  const ds = DOC_STATUS[doc.status as keyof typeof DOC_STATUS] || DOC_STATUS.PENDING;
                  const Icon = ds.icon;
                  return (
                    <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all group">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-8 h-8 rounded-lg ${ds.bg} border ${ds.border} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`h-3.5 w-3.5 ${ds.color} ${doc.status === "GENERATING" ? "animate-spin" : ""}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-slate-900 truncate">{doc.title || humanizeDocumentType(doc.type)}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] font-semibold ${ds.color}`}>{ds.label}</span>
                            {doc.isFollowUp && <span className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">Follow-up</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {doc.status === "COMPLETED" && doc.fileUrl && (
                          <button onClick={() => window.open(doc.fileUrl!, "_blank")} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[11px] font-semibold hover:bg-blue-700 transition-all">
                            <Download className="h-3 w-3" /> PDF
                          </button>
                        )}
                        {doc.status === "COMPLETED" && !doc.fileUrl && doc.content && (
                          <button onClick={() => router.push("/disputes/" + caseData.id + "/documents")} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-[11px] font-medium hover:bg-slate-50 transition-all">
                            <Eye className="h-3 w-3" /> View
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <Link href={"/disputes/" + caseData.id + "/documents"} className="flex items-center justify-center gap-1 mt-4 text-[12px] text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                View All Documents <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          {/* Evidence */}
          {evidence.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
              <h2 className="text-[16px] font-bold text-slate-900 mb-4 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center"><Folder className="h-3.5 w-3.5 text-blue-600" /></div>
                Evidence ({evidence.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {evidence.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all group cursor-pointer" onClick={() => window.open(item.fileUrl, "_blank")}>
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-[10px] text-blue-500 font-medium">#{item.evidenceIndex}</span>
                      {item.fileType === "IMAGE" ? <ImageIcon className="h-3.5 w-3.5 text-blue-600" /> : <FileText className="h-3.5 w-3.5 text-blue-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-slate-900 truncate group-hover:text-blue-600 transition-colors">{item.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-slate-400">{formatFileSize(item.fileSize)}</span>
                        {item.evidenceDate && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-0.5">
                            <Calendar className="h-2.5 w-2.5" /> {new Date(item.evidenceDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                          </span>
                        )}
                      </div>
                      {item.description && <p className="text-[11px] text-slate-400 line-clamp-1 mt-1">{item.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Timeline + Quick Actions */}
        <div className="space-y-5">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
            <h2 className="text-[16px] font-bold text-slate-900 mb-3 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center"><Sparkles className="h-3.5 w-3.5 text-blue-600" /></div>
              Quick Actions
            </h2>
            <div className="space-y-2">
              <button onClick={() => router.push("/disputes/" + caseData.id + "/case")} className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all text-left group">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><MessageSquare className="h-3.5 w-3.5 text-blue-600" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-slate-900 group-hover:text-blue-600">AI Chat</p>
                  <p className="text-[11px] text-slate-400">Continue case conversation</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-400" />
              </button>
              <button onClick={() => router.push("/disputes/" + caseData.id + "/documents")} className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all text-left group">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center"><FileText className="h-3.5 w-3.5 text-emerald-600" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-slate-900 group-hover:text-blue-600">Documents</p>
                  <p className="text-[11px] text-slate-400">View & download files</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-400" />
              </button>
              <button onClick={() => router.push("/disputes/" + caseData.id + "/case")} className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all text-left group">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center"><Mail className="h-3.5 w-3.5 text-indigo-600" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-slate-900 group-hover:text-blue-600">Email</p>
                  <p className="text-[11px] text-slate-400">Send & view case emails</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-400" />
              </button>
              {caseData.lifecycleStatus !== "CLOSED" && (
                <button onClick={handleClose} disabled={isClosing} className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-red-200 hover:bg-red-50/30 transition-all text-left group">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center"><Ban className="h-3.5 w-3.5 text-red-600" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-slate-900 group-hover:text-red-600">{isClosing ? "Closing..." : "Close Case"}</p>
                    <p className="text-[11px] text-slate-400">Mark as resolved</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-red-400" />
                </button>
              )}
            </div>
          </div>

          {/* Deadline Alert */}
          {caseData.waitingUntil && (
            <div className={`rounded-2xl p-4 border ${new Date(caseData.waitingUntil) < new Date() ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className={`h-4 w-4 ${new Date(caseData.waitingUntil) < new Date() ? "text-red-600" : "text-amber-600"}`} />
                <p className={`text-[13px] font-bold ${new Date(caseData.waitingUntil) < new Date() ? "text-red-800" : "text-amber-800"}`}>
                  {new Date(caseData.waitingUntil) < new Date() ? "Deadline Passed" : "Upcoming Deadline"}
                </p>
              </div>
              <p className={`text-[12px] ${new Date(caseData.waitingUntil) < new Date() ? "text-red-700" : "text-amber-700"}`}>
                {new Date(caseData.waitingUntil).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
            <h2 className="text-[16px] font-bold text-slate-900 mb-4 flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center"><Clock className="h-3.5 w-3.5 text-blue-600" /></div>
              Timeline
            </h2>
            {caseData.caseEvents.length > 0 ? (
              <div className="space-y-0">
                {caseData.caseEvents.map((event, index) => (
                  <div key={event.id} className="relative flex gap-3 pb-4">
                    {/* Line */}
                    {index !== caseData.caseEvents.length - 1 && (
                      <div className="absolute left-[7px] top-4 bottom-0 w-px bg-slate-200" />
                    )}
                    {/* Dot */}
                    <div className="w-[15px] h-[15px] rounded-full bg-blue-600 border-[3px] border-blue-100 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-slate-900 font-medium leading-snug">{event.description}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(event.occurredAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} at {new Date(event.occurredAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-[13px] text-slate-400">No events recorded yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
