"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, RotateCw, FileText, Loader2, Send } from "lucide-react";
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
          <Badge className="bg-green-500 hover:bg-green-600">
            🟢 Completed
          </Badge>
        );
      case "GENERATING":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">
            🔵 Generating
          </Badge>
        );
      case "FAILED":
        return (
          <Badge className="bg-red-500 hover:bg-red-600">
            🔴 Failed
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">
            🟡 Pending
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
      <div className="flex min-h-screen flex-col">
        {/* Header */}
        <div className="border-b bg-white px-4 py-4 md:px-6">
          <div className="mx-auto max-w-4xl">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/disputes/${dispute.id}/case`)}
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Case
            </Button>
            <h1 className="text-2xl font-bold">Documents</h1>
            <p className="text-sm text-muted-foreground">
              {dispute.title}
            </p>
          </div>
        </div>

        {/* Loading State */}
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              Loading documents...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        {/* Header */}
        <div className="border-b bg-white px-4 py-4 md:px-6">
          <div className="mx-auto max-w-4xl">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/disputes/${dispute.id}/case`)}
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Case
            </Button>
            <h1 className="text-2xl font-bold">Documents</h1>
          </div>
        </div>

        {/* Error State */}
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-red-600">{error}</p>
            <Button onClick={loadDocuments} className="mt-4" size="sm">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!plan || documents.length === 0) {
    return (
      <div className="flex min-h-screen flex-col">
        {/* Header */}
        <div className="border-b bg-white px-4 py-4 md:px-6">
          <div className="mx-auto max-w-4xl">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/disputes/${dispute.id}/case`)}
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Case
            </Button>
            <h1 className="text-2xl font-bold">Documents</h1>
            <p className="text-sm text-muted-foreground">
              {dispute.title}
            </p>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              No documents have been generated yet.
            </p>
            <Button
              onClick={() => router.push(`/disputes/${dispute.id}/case`)}
              className="mt-4"
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
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white px-4 py-4 md:px-6">
        <div className="mx-auto max-w-4xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/disputes/${dispute.id}/case`)}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Case
          </Button>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-sm text-muted-foreground">
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
              className="rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Document Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{doc.title}</h3>
                    {doc.isFollowUp && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        System Follow-Up
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {doc.description}
                  </p>
                  {doc.isFollowUp && (
                    <p className="mt-1 text-xs text-amber-700">
                      ⚡ Automatically generated due to missed deadline
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Type: {doc.type}
                  </p>
                </div>
                <div>{getStatusBadge(doc.status)}</div>
              </div>

              {/* Error Message */}
              {doc.status === "FAILED" && doc.lastError && (
                <div className="mt-3 rounded-md bg-red-50 p-3">
                  <p className="text-xs text-red-800">
                    <strong>Error:</strong> {doc.lastError}
                  </p>
                  {doc.retryCount > 0 && (
                    <p className="mt-1 text-xs text-red-600">
                      Retry attempts: {doc.retryCount} / 3
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 flex flex-wrap gap-2">
                {doc.status === "COMPLETED" && doc.fileUrl && (
                  <>
                    <Button
                      onClick={() => handleDownload(doc.fileUrl!, doc.title)}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>
                    <Button
                      onClick={() => handleMarkAsSent(doc.id)}
                      size="sm"
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
                  <Button size="sm" variant="outline" disabled>
                    Waiting...
                  </Button>
                )}

                {doc.status === "GENERATING" && (
                  <Button size="sm" variant="outline" disabled>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
