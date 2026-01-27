"use client";

import { useState, useEffect } from "react";
import { Folder, Upload as UploadIcon, ChevronDown, ChevronUp } from "lucide-react";
import { EvidenceUploadBulk } from "./EvidenceUploadBulk";
import { EvidenceList } from "./EvidenceList";

interface EvidenceItem {
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
}

interface EvidenceSectionProps {
  caseId: string;
  initialExpanded?: boolean;
  onEvidenceUploaded?: () => void; // Callback to refresh chat
}

export function EvidenceSection({ caseId, initialExpanded = false, onEvidenceUploaded }: EvidenceSectionProps) {
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  const fetchEvidence = async () => {
    try {
      const response = await fetch(`/api/evidence/${caseId}`);
      if (response.ok) {
        const data = await response.json();
        setEvidence(data.evidence);
      }
    } catch (error) {
      console.error("Failed to fetch evidence:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, [caseId]);

  const handleUploadComplete = async () => {
    // Refresh evidence list
    await fetchEvidence();
    
    // Trigger AI acknowledgment
    try {
      await fetch(`/api/disputes/${caseId}/acknowledge-evidence`, {
        method: "POST",
      });
      
      // Notify parent to refresh chat
      onEvidenceUploaded?.();
    } catch (error) {
      console.error("Failed to trigger AI acknowledgment:", error);
    }
  };

  return (
    <div className="rounded-3xl glass-strong border border-indigo-500/20 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between hover:bg-indigo-500/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30">
            <Folder className="h-5 w-5 text-indigo-400" />
          </div>
          <div className="text-left">
            <h2 className="text-xl font-bold text-white">Evidence</h2>
            <p className="text-sm text-slate-400">
              {isLoading ? "Loading..." : `${evidence.length} item${evidence.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {evidence.length > 0 && (
            <span className="px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm font-medium">
              {evidence.length} evidence
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          )}
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-indigo-500/20 p-6 space-y-6">
          {/* Upload Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <UploadIcon className="h-5 w-5 text-indigo-400" />
              <h3 className="text-lg font-semibold text-white">Upload New Evidence</h3>
            </div>
            <EvidenceUploadBulk caseId={caseId} onUploadComplete={handleUploadComplete} />
          </div>

          {/* Evidence List */}
          <div className="pt-6 border-t border-indigo-500/10">
            <EvidenceList evidence={evidence} caseId={caseId} />
          </div>
        </div>
      )}
    </div>
  );
}
