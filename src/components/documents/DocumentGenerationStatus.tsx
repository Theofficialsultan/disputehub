"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  Download,
  AlertCircle,
  Sparkles,
  FileStack,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Document {
  id: string;
  type: string;
  status: string;
  fileUrl: string | null;
  isFollowUp: boolean;
  order: number;
}

interface DocumentPlan {
  id: string;
  complexity: string;
  complexityScore: number;
  documentType: string;
  documents: Document[];
}

interface DocumentGenerationStatusProps {
  caseId: string;
  documentPlan: DocumentPlan | null;
  isGenerating: boolean;
  onGenerationComplete?: () => void;
}

const STATUS_CONFIG = {
  PENDING: {
    label: "Waiting",
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
    animate: "animate-spin",
  },
  COMPLETED: {
    label: "Ready",
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

function DocumentItem({ document }: { document: Document }) {
  const status = STATUS_CONFIG[document.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING;
  const StatusIcon = status.icon;

  return (
    <div className="flex items-center justify-between p-4 rounded-xl glass-strong border border-indigo-500/10 hover:border-indigo-500/20 transition-all">
      <div className="flex items-center gap-3 flex-1">
        <div className={`p-2 rounded-lg ${status.bg} border ${status.border}`}>
          <StatusIcon className={`h-4 w-4 ${status.color} ${status.animate || ""}`} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-white">
            {humanizeDocumentType(document.type)}
          </p>
          <p className={`text-xs ${status.color}`}>{status.label}</p>
        </div>
      </div>
      
      {document.status === "COMPLETED" && document.fileUrl && (
        <Button
          size="sm"
          onClick={() => window.open(document.fileUrl!, "_blank")}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0"
        >
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Download
        </Button>
      )}
    </div>
  );
}

export function DocumentGenerationStatus({
  caseId,
  documentPlan,
  isGenerating,
  onGenerationComplete,
}: DocumentGenerationStatusProps) {
  const [localPlan, setLocalPlan] = useState<DocumentPlan | null>(documentPlan);

  // Sync with parent prop changes
  useEffect(() => {
    if (documentPlan) {
      setLocalPlan(documentPlan);
    }
  }, [documentPlan]);

  // Poll for updates continuously
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/disputes/${caseId}/documents`);
        if (response.ok) {
          const data = await response.json();
          
          // Update local plan if it exists (API returns 'plan' not 'documentPlan')
          if (data.plan && data.documents) {
            const updatedPlan = {
              ...data.plan,
              documents: data.documents,
            };
            setLocalPlan(updatedPlan);

            // Check if all documents are complete or failed
            const allDone = data.documents.every(
              (doc: Document) => doc.status === "COMPLETED" || doc.status === "FAILED"
            );
            
            // Check if any are generating
            const anyGenerating = data.documents.some(
              (doc: Document) => doc.status === "GENERATING"
            );
            
            if (allDone && !anyGenerating) {
              onGenerationComplete?.();
            }
          }
        }
      } catch (error) {
        console.error("Failed to poll documents:", error);
      }
    }, 3000); // Poll every 3 seconds

    return () => {
      clearInterval(pollInterval);
    };
  }, [caseId, onGenerationComplete]);

  if (!localPlan) {
    return (
      <div className="rounded-3xl glass-strong border border-indigo-500/20 overflow-hidden" suppressHydrationWarning>
        {/* Header */}
        <div className="p-6 border-b border-indigo-500/20">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
              <FileStack className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-1">
                Documents
              </h2>
              <p className="text-sm text-slate-400">
                Your case documents will appear here once ready
              </p>
            </div>
          </div>

          {/* Progress Bar - Empty State */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Awaiting Strategy Completion</span>
              <span>0%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 w-0 transition-all duration-500" />
            </div>
          </div>
        </div>

        {/* Empty State Content */}
        <div className="p-8 text-center">
          <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Documents Yet</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Continue chatting with the AI to build your case strategy. Documents will automatically generate when your case is ready.
          </p>
        </div>
      </div>
    );
  }

  const isSimpleLetter = localPlan.documentType === "SIMPLE_LETTER";
  const totalDocs = localPlan.documents.length;
  const completedDocs = localPlan.documents.filter((d) => d.status === "COMPLETED").length;
  const failedDocs = localPlan.documents.filter((d) => d.status === "FAILED").length;
  const generatingDocs = localPlan.documents.filter((d) => d.status === "GENERATING").length;

  return (
    <div className="rounded-3xl glass-strong border border-indigo-500/20 overflow-hidden" suppressHydrationWarning>
      {/* Header */}
      <div className="p-6 border-b border-indigo-500/20">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${
              isSimpleLetter 
                ? "bg-gradient-to-br from-blue-500 to-cyan-500" 
                : "bg-gradient-to-br from-purple-500 to-pink-500"
            }`}>
              {isSimpleLetter ? (
                <FileText className="h-6 w-6 text-white" />
              ) : (
                <FileStack className="h-6 w-6 text-white" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-1">
                {isSimpleLetter ? "Simple Letter" : "Full Document Docket"}
              </h2>
              <p className="text-sm text-slate-400">
                {isSimpleLetter 
                  ? "Single dispute letter for straightforward cases"
                  : `${totalDocs} documents for complex case (${localPlan.complexity.toLowerCase()} complexity)`
                }
              </p>
            </div>
          </div>

          {/* Progress Stats */}
          <div className="flex items-center gap-4">
            {completedDocs > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">{completedDocs}</div>
                <div className="text-xs text-slate-400">Ready</div>
              </div>
            )}
            {generatingDocs > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{generatingDocs}</div>
                <div className="text-xs text-slate-400">Generating</div>
              </div>
            )}
            {failedDocs > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{failedDocs}</div>
                <div className="text-xs text-slate-400">Failed</div>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {totalDocs > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span>Generation Progress</span>
              <span>{Math.round((completedDocs / totalDocs) * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                style={{ width: `${(completedDocs / totalDocs) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Document List */}
      <div className="p-6">
        {isSimpleLetter ? (
          // Simple Letter View
          <div className="space-y-3">
            {localPlan.documents.map((doc) => (
              <DocumentItem key={doc.id} document={doc} />
            ))}
          </div>
        ) : (
          // Complex Docket View
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <FileStack className="h-5 w-5 text-indigo-400" />
              <h3 className="text-lg font-semibold text-white">Document Bundle</h3>
            </div>
            <div className="space-y-3">
              {localPlan.documents
                .sort((a, b) => a.order - b.order)
                .map((doc) => (
                  <DocumentItem key={doc.id} document={doc} />
                ))}
            </div>
          </div>
        )}

        {/* Generation Active Message */}
        {generatingDocs > 0 && (
          <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-start gap-3">
            <Loader2 className="h-5 w-5 text-blue-400 shrink-0 mt-0.5 animate-spin" />
            <div>
              <p className="text-sm font-medium text-blue-300">
                Generating documents in real-time
              </p>
              <p className="text-xs text-blue-400/70 mt-1">
                This may take 1-2 minutes per document. You can leave this page and return later.
              </p>
            </div>
          </div>
        )}

        {/* All Complete Message */}
        {completedDocs === totalDocs && totalDocs > 0 && (
          <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-emerald-300">
                All documents ready!
              </p>
              <p className="text-xs text-emerald-400/70 mt-1">
                {isSimpleLetter 
                  ? "Your dispute letter is ready to download."
                  : "Your complete document bundle is ready. Download each document above."
                }
              </p>
            </div>
          </div>
        )}

        {/* Failure Message */}
        {failedDocs > 0 && completedDocs + failedDocs === totalDocs && (
          <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-300">
                {failedDocs} document{failedDocs > 1 ? "s" : ""} failed to generate
              </p>
              <p className="text-xs text-red-400/70 mt-1">
                The system will automatically retry. You can also manually retry from the Documents page.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
