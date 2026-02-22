"use client";

import { useState } from "react";
import { Download, FileArchive, Loader2, Check, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ExportBundleButtonProps {
  caseId: string;
  caseTitle: string;
}

interface BundleOptions {
  includeEvidence: boolean;
  includeCoverPage: boolean;
  includeTableOfContents: boolean;
  includeTimeline: boolean;
  includeStrategy: boolean;
}

interface BundleEstimate {
  documentCount: number;
  evidenceCount: number;
  estimatedPages: number;
  estimatedSizeMb: number;
}

export function ExportBundleButton({ caseId, caseTitle }: ExportBundleButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [estimate, setEstimate] = useState<BundleEstimate | null>(null);
  const [options, setOptions] = useState<BundleOptions>({
    includeEvidence: true,
    includeCoverPage: true,
    includeTableOfContents: true,
    includeTimeline: true,
    includeStrategy: true,
  });

  const fetchEstimate = async () => {
    try {
      const response = await fetch(`/api/disputes/${caseId}/bundle?estimate=true`);
      const data = await response.json();
      setEstimate(data.estimate);
    } catch (error) {
      console.error("Error fetching estimate:", error);
    }
  };

  const handleOpenOptions = async () => {
    setShowOptions(true);
    if (!estimate) {
      await fetchEstimate();
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(options).forEach(([key, value]) => {
        params.set(key, value.toString());
      });

      const response = await fetch(`/api/disputes/${caseId}/bundle?${params}`);
      
      if (!response.ok) {
        throw new Error("Failed to generate bundle");
      }

      // Get the blob
      const blob = await response.blob();
      const pageCount = response.headers.get("X-Page-Count");

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      // Get filename from Content-Disposition header or create one
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `DisputeHub_Bundle_${caseId}.pdf`;
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(
        `Bundle downloaded successfully! ${pageCount ? `(${pageCount} pages)` : ""}`
      );
      setShowOptions(false);
    } catch (error) {
      console.error("Error exporting bundle:", error);
      toast.error("Failed to generate case bundle");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleOpenOptions}
        variant="outline"
        className="border-indigo-500/30 text-white hover:bg-indigo-500/20"
      >
        <FileArchive className="mr-2 h-4 w-4" />
        Export Bundle
      </Button>

      {/* Options Modal */}
      {showOptions && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => !loading && setShowOptions(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl glass-strong border border-indigo-500/20 p-6 animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
                <FileArchive className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Export Case Bundle</h3>
                <p className="text-sm text-slate-400">{caseTitle}</p>
              </div>
            </div>

            {/* Estimate */}
            {estimate && (
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400">Documents</p>
                    <p className="text-white font-medium">{estimate.documentCount}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Evidence Items</p>
                    <p className="text-white font-medium">{estimate.evidenceCount}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Est. Pages</p>
                    <p className="text-white font-medium">~{estimate.estimatedPages}</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Est. Size</p>
                    <p className="text-white font-medium">~{estimate.estimatedSizeMb} MB</p>
                  </div>
                </div>
              </div>
            )}

            {/* Options */}
            <div className="space-y-3 mb-6">
              <p className="text-sm text-slate-400 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Bundle Options
              </p>
              
              {Object.entries(options).map(([key, value]) => (
                <label
                  key={key}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <span className="text-sm text-white">
                    {key === "includeEvidence" && "Include Evidence Index"}
                    {key === "includeCoverPage" && "Include Cover Page"}
                    {key === "includeTableOfContents" && "Include Table of Contents"}
                    {key === "includeTimeline" && "Include Case Timeline"}
                    {key === "includeStrategy" && "Include Strategy Summary"}
                  </span>
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) =>
                      setOptions((prev) => ({ ...prev, [key]: e.target.checked }))
                    }
                    className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                  />
                </label>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={() => setShowOptions(false)}
                disabled={loading}
                className="flex-1 text-slate-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleExport}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
