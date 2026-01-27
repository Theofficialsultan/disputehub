"use client";

import { useState, useEffect } from "react";
import { FileText, CheckCircle, Clock, AlertCircle, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { GenerateButton } from "./GenerateButton";

interface Document {
  id: string;
  type: string;
  title: string;
  content: string;
  status: "PENDING" | "GENERATING" | "COMPLETED" | "FAILED";
  createdAt: string;
  retryCount?: number;
  lastError?: string | null;
}

interface DocumentPlan {
  id: string;
  complexity: string;
  complexityScore: number;
  documentType: string;
  routingStatus?: string;
  routingConfidence?: number;
  jurisdiction?: string;
  forum?: string;
  blockType?: string | null;
  nextAction?: string | null;
}

interface DocumentStatusProps {
  caseId: string;
}

export function DocumentStatus({ caseId }: DocumentStatusProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [plan, setPlan] = useState<DocumentPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);

  // Load documents
  const loadDocuments = async () => {
    try {
      const response = await fetch(`/api/disputes/${caseId}/documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
        setPlan(data.plan || null);
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

  // Auto-poll for updates
  useEffect(() => {
    const interval = setInterval(() => {
      loadDocuments();
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [caseId]);

  // Calculate progress
  const totalDocs = documents.length;
  const completedDocs = documents.filter(d => d.status === "COMPLETED").length;
  const failedDocs = documents.filter(d => d.status === "FAILED").length;
  const generatingDocs = documents.filter(d => d.status === "GENERATING" || d.status === "PENDING").length;
  const progressPercent = totalDocs > 0 ? (completedDocs / totalDocs) * 100 : 0;

  const handleDownload = async (doc: Document) => {
    try {
      // Convert content to HTML with embedded images
      let htmlContent = convertToHTML(doc);
      
      // If it's an evidence bundle, fetch and embed images
      if (doc.type === 'evidence_bundle') {
        htmlContent = await embedImagesInHTML(doc.content, caseId);
      }
      
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc.title.replace(/\s+/g, "_")}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${doc.title}`);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download document");
    }
  };

  // Convert plain text content to formatted HTML
  const convertToHTML = (doc: Document) => {
    const content = doc.content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br/>');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${doc.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      color: #1a1a1a;
      background: #ffffff;
    }
    h1 {
      color: #2563eb;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 10px;
      margin-bottom: 30px;
    }
    p {
      margin: 1em 0;
    }
    .evidence-image {
      max-width: 100%;
      height: auto;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      margin: 20px 0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .evidence-ref {
      font-weight: bold;
      color: #7c3aed;
      margin-top: 30px;
      padding: 10px;
      background: #f3f4f6;
      border-left: 4px solid #7c3aed;
    }
    @media print {
      body { padding: 20px; }
      .evidence-image { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>${doc.title}</h1>
  <p>${content}</p>
  <footer style="margin-top: 60px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #6b7280; font-size: 0.875rem;">
    <p>Generated: ${new Date(doc.createdAt).toLocaleDateString('en-GB', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}</p>
    <p>DisputeHub - Legal Document Generation</p>
  </footer>
</body>
</html>`;
  };

  // Embed images for evidence bundles
  const embedImagesInHTML = async (content: string, caseId: string) => {
    try {
      // Fetch evidence items to get image URLs
      const response = await fetch(`/api/disputes/${caseId}/evidence`);
      if (!response.ok) return convertToHTML({ ...documents[0], content });
      
      const { evidence } = await response.json();
      const images = evidence.filter((e: any) => e.fileType?.startsWith('image/'));
      
      if (images.length === 0) return convertToHTML({ ...documents[0], content });
      
      // Replace [IMAGE REFERENCE: url] with actual embedded images
      let htmlContent = content;
      
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const imageHTML = `
        <div class="evidence-ref">
          <strong>EXHIBIT E${evidence.indexOf(img) + 1}: ${img.fileName}</strong>
        </div>
        <img src="${img.fileUrl}" alt="${img.fileName}" class="evidence-image" />
        <p style="font-size: 0.875rem; color: #6b7280; font-style: italic;">
          ${img.description || 'Evidence photograph'}
        </p>`;
        
        // Replace the reference marker with the actual image
        const marker = `[IMAGE REFERENCE: ${img.fileUrl}]`;
        htmlContent = htmlContent.replace(marker, imageHTML);
      }
      
      return convertToHTML({ 
        id: documents[0].id,
        type: 'evidence_bundle',
        title: 'Evidence Bundle',
        content: htmlContent,
        status: 'COMPLETED',
        createdAt: documents[0].createdAt
      });
      
    } catch (error) {
      console.error("Failed to embed images:", error);
      return convertToHTML({ ...documents[0], content });
    }
  };

  const handleRetry = async (docId: string) => {
    setRetrying(docId);
    toast.loading("Retrying document generation...");
    
    try {
      const response = await fetch(`/api/documents/${docId}/retry`, {
        method: "POST",
      });

      if (response.ok) {
        toast.dismiss();
        toast.success("Retry started! Document will regenerate shortly.");
        await loadDocuments();
      } else {
        throw new Error("Retry failed");
      }
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to retry. Please try again.");
    } finally {
      setRetrying(null);
    }
  };

  // Phase 8.5-8.7: Routing status indicators
  const routingStatusColors = {
    PENDING: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    APPROVED: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    BLOCKED: "text-red-400 bg-red-500/10 border-red-500/30",
    REQUIRES_CLARIFICATION: "text-orange-400 bg-orange-500/10 border-orange-500/30",
  };

  const isBlocked = plan?.routingStatus === "BLOCKED";

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10">
            <FileText className="h-5 w-5 text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-white">Documents</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {loading ? (
                "Loading..."
              ) : totalDocs === 0 ? (
                "Your case documents will appear here"
              ) : generatingDocs > 0 ? (
                `Generating ${generatingDocs} of ${totalDocs}...`
              ) : (
                `${completedDocs} of ${totalDocs} ready`
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Generate Button (DEV/TEST) */}
            <GenerateButton 
              caseId={caseId}
              onGenerated={loadDocuments}
            />
            
            {plan && (
              <div className="text-right">
                <div className="text-xs font-medium text-purple-400">
                  {plan.complexity}
                </div>
                <div className="text-xs text-slate-500">
                  Score: {plan.complexityScore}/100
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Phase 8.5-8.7: Routing Status */}
        {plan?.routingStatus && (
          <div className="mt-4">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${routingStatusColors[plan.routingStatus as keyof typeof routingStatusColors] || "text-slate-400 bg-slate-500/10 border-slate-500/30"}`}>
              <span className="font-semibold">Route:</span>
              {plan.routingStatus}
              {plan.routingConfidence && ` (${Math.round(plan.routingConfidence * 100)}%)`}
            </div>
            {plan.jurisdiction && plan.forum && (
              <p className="text-xs text-slate-400 mt-2">
                {plan.jurisdiction} → {plan.forum}
              </p>
            )}
          </div>
        )}

        {/* Phase 8.5-8.7: BLOCKED State Warning */}
        {isBlocked && (
          <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-red-300 mb-1">
                  Document Generation Blocked
                </h4>
                <p className="text-xs text-red-200/80 mb-2">
                  {plan.blockType === "MISSING_PREREQUISITE" && "Missing required prerequisites"}
                  {plan.blockType === "TIME_LIMIT_EXPIRED" && "Time limit has expired"}
                  {plan.blockType === "INSUFFICIENT_INFORMATION" && "More information needed"}
                  {plan.blockType === "INVALID_ROUTE" && "Invalid legal route"}
                  {!plan.blockType && "Unable to proceed with document generation"}
                </p>
                {plan.nextAction && (
                  <p className="text-xs text-red-300 font-medium">
                    Next Step: {plan.nextAction}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {totalDocs > 0 && generatingDocs > 0 && (
          <div className="mt-4">
            <Progress value={progressPercent} className="h-2" />
            <p className="text-xs text-slate-400 mt-2">
              {completedDocs} completed • {generatingDocs} generating • {failedDocs} failed
            </p>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="text-center py-8">
            <Clock className="h-8 w-8 text-slate-500 mx-auto mb-2 animate-spin" />
            <p className="text-sm text-slate-400">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-slate-600 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium text-slate-300 mb-1">No Documents Yet</p>
            <p className="text-xs text-slate-500">
              Continue chatting with the AI to build your case
            </p>
          </div>
        ) : (
          <div className="space-y-2">
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
                  {(doc.status === "GENERATING" || doc.status === "PENDING") && (
                    <Clock className="h-5 w-5 text-blue-400 animate-spin" />
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
                    {doc.status === "COMPLETED" && `${doc.content.length} characters • Ready`}
                    {doc.status === "GENERATING" && "Generating content..."}
                    {doc.status === "PENDING" && "Waiting to generate..."}
                    {doc.status === "FAILED" && (
                      <>
                        Failed{doc.retryCount ? ` (${doc.retryCount} retries)` : ""}
                        {doc.lastError && (
                          <span className="block text-xs text-red-400 mt-1 truncate">
                            {doc.lastError}
                          </span>
                        )}
                      </>
                    )}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex gap-2">
                  {doc.status === "COMPLETED" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownload(doc)}
                      className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                  {doc.status === "FAILED" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRetry(doc.id)}
                      disabled={retrying === doc.id}
                      className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
                    >
                      <RefreshCw className={`h-4 w-4 ${retrying === doc.id ? "animate-spin" : ""}`} />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
