"use client";

import { useState, useEffect } from "react";
import { FileText, CheckCircle, Clock, AlertCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Document {
  id: string;
  type: string;
  title: string;
  content: string;
  status: "PENDING" | "GENERATING" | "COMPLETED" | "FAILED";
  createdAt: string;
}

interface DocumentStatusProps {
  caseId: string;
  isLocked: boolean;
}

export function DocumentStatus({ caseId, isLocked }: DocumentStatusProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  // Load documents
  const loadDocuments = async () => {
    try {
      const response = await fetch(`/api/disputes/${caseId}/documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error("Failed to load documents:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadDocuments();
  }, [caseId]);

  // Poll for updates when locked (generating)
  useEffect(() => {
    if (!isLocked) return;

    const interval = setInterval(() => {
      loadDocuments();
    }, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, [isLocked, caseId]);

  const handleDownload = (doc: Document) => {
    const blob = new Blob([doc.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.title.replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-700 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-purple-500/10">
          <FileText className="h-5 w-5 text-purple-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-white">Documents</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {isLocked
              ? `${documents.length} document${documents.length !== 1 ? "s" : ""} ready`
              : "Your case documents will appear here"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-6 text-center">
          <Clock className="h-8 w-8 text-slate-500 mx-auto mb-2 animate-spin" />
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="p-6 text-center">
          <FileText className="h-12 w-12 text-slate-600 mx-auto mb-3 opacity-50" />
          <p className="text-sm font-medium text-slate-300 mb-1">No Documents Yet</p>
          <p className="text-xs text-slate-500">
            Continue chatting with the AI to build your case strategy
          </p>
        </div>
      ) : (
        <div className="p-4 space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-colors"
            >
              {/* Status Icon */}
              <div className="flex-shrink-0">
                {doc.status === "COMPLETED" && (
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                )}
                {doc.status === "GENERATING" && (
                  <Clock className="h-5 w-5 text-blue-400 animate-spin" />
                )}
                {doc.status === "PENDING" && (
                  <Clock className="h-5 w-5 text-slate-400" />
                )}
                {doc.status === "FAILED" && (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                )}
              </div>

              {/* Document Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {doc.title}
                </p>
                <p className="text-xs text-slate-400">
                  {doc.status === "COMPLETED" && "Ready to download"}
                  {doc.status === "GENERATING" && "Generating..."}
                  {doc.status === "PENDING" && "Waiting..."}
                  {doc.status === "FAILED" && "Generation failed"}
                </p>
              </div>

              {/* Download Button */}
              {doc.status === "COMPLETED" && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDownload(doc)}
                  className="flex-shrink-0 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
