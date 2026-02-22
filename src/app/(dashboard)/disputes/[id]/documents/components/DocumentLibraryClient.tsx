"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, RotateCw, FileText, Loader2, Send, Eye, X, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Dispute } from "@prisma/client";

interface DocumentLibraryClientProps {
  dispute: Dispute;
}

type DocumentStatus = "PENDING" | "GENERATING" | "COMPLETED" | "FAILED";

interface Document {
  id: string;
  type: string;
  title: string;
  description: string;
  order: number;
  required: boolean;
  status: DocumentStatus;
  fileUrl: string | null;
  content: string | null;
  pdfData: boolean; // Whether PDF binary data exists (we don't send actual bytes to client)
  pdfFilename: string | null;
  retryCount: number;
  lastError: string | null;
  isFollowUp: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DocumentPlan {
  id: string;
  complexity: string;
  complexityScore: number;
  documentType: string;
  createdAt: string;
}

export function DocumentLibraryClient({ dispute }: DocumentLibraryClientProps) {
  const router = useRouter();
  const [plan, setPlan] = useState<DocumentPlan | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryingDocId, setRetryingDocId] = useState<string | null>(null);
  const [sendingDocId, setSendingDocId] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<Document | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/disputes/${dispute.id}/documents`);

      if (!response.ok) {
        throw new Error("Failed to load documents");
      }

      const data = await response.json();
      setPlan(data.plan);
      setDocuments(data.documents || []);
    } catch (err) {
      console.error("Error loading documents:", err);
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = async (documentId: string) => {
    try {
      setRetryingDocId(documentId);

      const response = await fetch(`/api/documents/${documentId}/retry`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to retry");
      }

      // Reload documents to get updated status
      await loadDocuments();
    } catch (err) {
      console.error("Error retrying document:", err);
      alert(err instanceof Error ? err.message : "Failed to retry document");
    } finally {
      setRetryingDocId(null);
    }
  };

  const handleDownload = (fileUrl: string, title: string) => {
    // Open PDF in new tab
    window.open(fileUrl, "_blank");
  };

  // Download document via API (handles PDF and text)
  const handleDownloadViaApi = async (documentId: string, title: string, isPdf: boolean) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Download failed");
      }
      
      // Get the blob from response
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement("a");
      a.href = url;
      
      // Set filename based on content type
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = isPdf ? `${title}.pdf` : `${title}.txt`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }
      
      a.download = filename.replace(/[^a-z0-9._-]/gi, "_");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      alert(err instanceof Error ? err.message : "Failed to download document");
    }
  };

  const handleDownloadText = (content: string, title: string) => {
    // Download content as .txt file
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyContent = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Format content as professional legal document HTML
  const formatAsLegalDocument = (content: string, title: string): string => {
    let html = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Convert section headers (═══...═══ style)
    html = html.replace(
      /═+\n([^\n═]+)\n═+/g,
      '<h2 class="legal-section">$1</h2>'
    );
    
    // Convert sub-section headers (───...─── style)  
    html = html.replace(
      /─+\n([^\n─]+)\n─+/g,
      '<h3 class="legal-subsection">$1</h3>'
    );
    
    // Convert numbered list items
    html = html.replace(
      /^(\d+)\.\s+(.+)$/gm,
      '<p class="legal-numbered"><span class="num">$1.</span> $2</p>'
    );
    
    // Convert bullet points
    html = html.replace(
      /^[•☐☒]\s+(.+)$/gm,
      '<p class="legal-bullet">$1</p>'
    );
    
    // Convert paragraphs
    html = html.replace(/\n\n+/g, '</p><p class="legal-para">');
    html = html.replace(/\n/g, '<br/>');
    html = '<p class="legal-para">' + html + '</p>';
    html = html.replace(/<p class="legal-para">\s*<\/p>/g, '');

    return `
      <style>
        .legal-document {
          font-family: 'Times New Roman', Times, Georgia, serif;
          font-size: 12pt;
          line-height: 1.6;
          color: #000;
        }
        .legal-document h2.legal-section {
          font-size: 14pt;
          font-weight: bold;
          text-transform: uppercase;
          text-align: center;
          margin: 24pt 0 16pt 0;
          padding: 8pt 0;
          border-top: 2px solid #000;
          border-bottom: 2px solid #000;
        }
        .legal-document h3.legal-subsection {
          font-size: 12pt;
          font-weight: bold;
          margin: 18pt 0 10pt 0;
          text-decoration: underline;
        }
        .legal-document p.legal-para {
          margin: 0 0 10pt 0;
          text-align: justify;
        }
        .legal-document p.legal-numbered {
          margin: 6pt 0;
          padding-left: 36pt;
          text-indent: -36pt;
        }
        .legal-document p.legal-numbered .num {
          display: inline-block;
          width: 30pt;
          font-weight: bold;
        }
        .legal-document p.legal-bullet {
          margin: 4pt 0 4pt 24pt;
          padding-left: 12pt;
          border-left: 2px solid #333;
        }
      </style>
      <div class="legal-document">
        <div style="text-align: center; margin-bottom: 24pt; padding-bottom: 16pt; border-bottom: 2px solid #000;">
          <h1 style="font-size: 16pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8pt 0;">${title}</h1>
        </div>
        ${html}
      </div>
    `;
  };

  const handleMarkAsSent = async (documentId: string) => {
    try {
      setSendingDocId(documentId);

      const response = await fetch(`/api/documents/${documentId}/sent`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to mark as sent");
      }

      alert("Document marked as sent! Case is now awaiting response.");
      
      // Reload documents to reflect any changes
      await loadDocuments();
    } catch (err) {
      console.error("Error marking document as sent:", err);
      alert(err instanceof Error ? err.message : "Failed to mark document as sent");
    } finally {
      setSendingDocId(null);
    }
  };

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">
            Completed
          </Badge>
        );
      case "GENERATING":
        return (
          <Badge className="bg-blue-50 text-blue-700 border border-blue-200">
            Generating
          </Badge>
        );
      case "FAILED":
        return (
          <Badge className="bg-red-50 text-red-700 border border-red-200">
            Failed
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-amber-50 text-amber-700 border border-amber-200">
            Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const canRetry = (doc: Document) => {
    return doc.status === "FAILED" && doc.retryCount < 3;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#f8faff] via-[#eef2ff] to-[#e0e7ff]">
        {/* Header */}
        <div className="border-b border-slate-200/60 bg-white/90 backdrop-blur-xl px-4 py-4 md:px-6">
          <div className="mx-auto max-w-4xl">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/disputes/${dispute.id}/case`)}
              className="mb-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Case
            </Button>
            <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
            <p className="text-sm text-slate-500">
              {dispute.title}
            </p>
          </div>
        </div>

        {/* Loading State */}
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500" />
            <p className="mt-2 text-sm text-slate-500">
              Loading documents...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#f8faff] via-[#eef2ff] to-[#e0e7ff]">
        {/* Header */}
        <div className="border-b border-slate-200/60 bg-white/90 backdrop-blur-xl px-4 py-4 md:px-6">
          <div className="mx-auto max-w-4xl">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/disputes/${dispute.id}/case`)}
              className="mb-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Case
            </Button>
            <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
          </div>
        </div>

        {/* Error State */}
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-red-600">{error}</p>
            <Button onClick={loadDocuments} className="mt-4 bg-blue-600 hover:bg-blue-700" size="sm">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!plan || documents.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#f8faff] via-[#eef2ff] to-[#e0e7ff]">
        {/* Header */}
        <div className="border-b border-slate-200/60 bg-white/90 backdrop-blur-xl px-4 py-4 md:px-6">
          <div className="mx-auto max-w-4xl">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/disputes/${dispute.id}/case`)}
              className="mb-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Case
            </Button>
            <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
            <p className="text-sm text-slate-500">
              {dispute.title}
            </p>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <FileText className="h-7 w-7 text-blue-600" />
            </div>
            <p className="text-sm text-slate-500">
              No documents have been generated yet.
            </p>
            <Button
              onClick={() => router.push(`/disputes/${dispute.id}/case`)}
              className="mt-4 bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              Go to Case
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#f8faff] via-[#eef2ff] to-[#e0e7ff]">
      {/* Header */}
      <div className="border-b border-slate-200/60 bg-white/90 backdrop-blur-xl px-4 py-4 md:px-6">
        <div className="mx-auto max-w-4xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/disputes/${dispute.id}/case`)}
            className="mb-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Case
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
          <p className="text-sm text-slate-500">
            {dispute.title}
          </p>
        </div>
      </div>

      {/* Document List */}
      <div className="flex-1 px-4 py-6 md:px-6">
        <div className="mx-auto max-w-4xl space-y-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="card-elevated p-6"
            >
              {/* Document Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900 text-base">{doc.title}</h3>
                    {doc.isFollowUp && (
                      <Badge className="bg-amber-50 text-amber-700 border border-amber-200 text-xs">
                        Follow-Up
                      </Badge>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {doc.description}
                  </p>
                  {doc.isFollowUp && (
                    <p className="mt-1 text-xs text-amber-600">
                      Automatically generated due to missed deadline
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">
                    Type: {doc.type}
                  </p>
                </div>
                <div>{getStatusBadge(doc.status)}</div>
              </div>

              {/* Error Message */}
              {doc.status === "FAILED" && doc.lastError && (
                <div className="mt-3 rounded-xl bg-red-50 border border-red-100 p-3">
                  <p className="text-xs text-red-700">
                    <strong>Error:</strong> {doc.lastError}
                  </p>
                  {doc.retryCount > 0 && (
                    <p className="mt-1 text-xs text-red-500">
                      Retry attempts: {doc.retryCount} / 3
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 flex flex-wrap gap-2">
                {/* PDF from external URL (Supabase) */}
                {doc.status === "COMPLETED" && doc.fileUrl && (
                  <>
                    <Button
                      onClick={() => handleDownload(doc.fileUrl!, doc.title)}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-sm"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                    <Button
                      onClick={() => handleMarkAsSent(doc.id)}
                      size="sm"
                      className="border-slate-200 text-slate-700 hover:bg-slate-50"
                      variant="outline"
                      disabled={sendingDocId === doc.id}
                    >
                      {sendingDocId === doc.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Marking as Sent...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Mark as Sent
                        </>
                      )}
                    </Button>
                  </>
                )}

                {/* PDF from database (auto-filled forms) */}
                {doc.status === "COMPLETED" && doc.pdfData && !doc.fileUrl && (
                  <>
                    <Button
                      onClick={() => handleDownloadViaApi(doc.id, doc.title, true)}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-sm"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                    <Button
                      onClick={() => handleMarkAsSent(doc.id)}
                      size="sm"
                      className="border-slate-200 text-slate-700 hover:bg-slate-50"
                      variant="outline"
                      disabled={sendingDocId === doc.id}
                    >
                      {sendingDocId === doc.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Marking as Sent...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Mark as Sent
                        </>
                      )}
                    </Button>
                  </>
                )}

                {/* Text document (AI-generated) */}
                {doc.status === "COMPLETED" && doc.content && !doc.fileUrl && !doc.pdfData && (
                  <>
                    <Button
                      onClick={() => setViewingDoc(doc)}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-sm"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Document
                    </Button>
                    <Button
                      onClick={() => handleDownloadText(doc.content!, doc.title)}
                      size="sm"
                      className="border-slate-200 text-slate-700 hover:bg-slate-50"
                      variant="outline"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Button
                      onClick={() => handleMarkAsSent(doc.id)}
                      size="sm"
                      className="border-slate-200 text-slate-700 hover:bg-slate-50"
                      variant="outline"
                      disabled={sendingDocId === doc.id}
                    >
                      {sendingDocId === doc.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Marking as Sent...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Mark as Sent
                        </>
                      )}
                    </Button>
                  </>
                )}

                {doc.status === "FAILED" && canRetry(doc) && (
                  <Button
                    onClick={() => handleRetry(doc.id)}
                    size="sm"
                    className="border-amber-200 text-amber-700 hover:bg-amber-50"
                    variant="outline"
                    disabled={retryingDocId === doc.id}
                  >
                    {retryingDocId === doc.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RotateCw className="mr-2 h-4 w-4" />
                        Retry Generation
                      </>
                    )}
                  </Button>
                )}

                {doc.status === "FAILED" && !canRetry(doc) && (
                  <p className="text-xs text-red-600">
                    Maximum retry attempts reached. Please contact support.
                  </p>
                )}

                {doc.status === "PENDING" && (
                  <Button size="sm" className="border-slate-200 text-slate-400" variant="outline" disabled>
                    Waiting...
                  </Button>
                )}

                {doc.status === "GENERATING" && (
                  <Button size="sm" className="border-blue-200 text-blue-600" variant="outline" disabled>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </Button>
                )}
              </div>
            </div>
          ))}
          
          {/* Legal Disclaimer */}
          <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-100">
            <p className="text-xs text-amber-700 text-center leading-relaxed">
              <strong>Disclaimer:</strong> These documents are generated by AI for informational purposes only. 
              DisputeHub does not provide legal advice. Please review all documents carefully before sending 
              and consider consulting a qualified solicitor for complex legal matters.
            </p>
          </div>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {viewingDoc && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setViewingDoc(null)}
        >
          <div 
            className="relative flex h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b bg-slate-50 px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{viewingDoc.title}</h2>
                <p className="text-sm text-slate-500">{viewingDoc.type}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleCopyContent(viewingDoc.content!)}
                  size="sm"
                  variant="outline"
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy All
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => handleDownloadText(viewingDoc.content!, viewingDoc.title)}
                  size="sm"
                  variant="outline"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button
                  onClick={() => setViewingDoc(null)}
                  size="sm"
                  variant="default"
                >
                  <X className="h-4 w-4 mr-1" />
                  Close
                </Button>
              </div>
            </div>
            
            {/* Floating Close Button - Always Visible */}
            <button
              onClick={() => setViewingDoc(null)}
              className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center shadow-lg border-2 border-white z-10"
            >
              <X className="h-5 w-5" />
            </button>
            
            {/* Modal Content - Legal Document Style */}
            <div className="flex-1 overflow-y-auto bg-slate-100 p-8">
              <div className="mx-auto max-w-[210mm] bg-white shadow-lg rounded-sm">
                <div 
                  className="legal-document p-12"
                  dangerouslySetInnerHTML={{ __html: formatAsLegalDocument(viewingDoc.content!, viewingDoc.title) }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
