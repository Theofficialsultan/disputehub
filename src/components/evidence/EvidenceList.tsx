"use client";

import { useState } from "react";
import {
  FileText,
  Image,
  Calendar,
  Eye,
  Download,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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

interface EvidenceListProps {
  evidence: EvidenceItem[];
  caseId: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function EvidenceCard({ item }: { item: EvidenceItem }) {
  const [showPreview, setShowPreview] = useState(false);
  const isImage = item.fileType === "IMAGE";
  const FileIcon = isImage ? Image : FileText;

  return (
    <div className="rounded-2xl p-6 glass-strong border border-indigo-500/20 hover:border-indigo-500/40 transition-all">
      <div className="flex items-start gap-4">
        {/* Evidence Index */}
        <div className="shrink-0">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex flex-col items-center justify-center text-white shadow-lg">
            <Hash className="h-4 w-4 mb-1" />
            <span className="text-2xl font-bold">{item.evidenceIndex}</span>
          </div>
        </div>

        {/* Evidence Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-lg mb-1 truncate">
                {item.title}
              </h3>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  <FileIcon className="h-4 w-4" />
                  {item.fileType}
                </span>
                <span>{formatFileSize(item.fileSize)}</span>
              </div>
            </div>
          </div>

          {item.description && (
            <p className="text-sm text-slate-300 mb-3">{item.description}</p>
          )}

          <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
            {item.evidenceDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Evidence date: {new Date(item.evidenceDate).toLocaleDateString("en-GB")}
              </span>
            )}
            <span>
              Uploaded: {new Date(item.uploadedAt).toLocaleDateString("en-GB")}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isImage && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                className="border-indigo-500/30 text-white hover:bg-indigo-500/10"
              >
                <Eye className="mr-1.5 h-3.5 w-3.5" />
                {showPreview ? "Hide" : "Preview"}
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => window.open(item.fileUrl, "_blank")}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0"
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Download
            </Button>
          </div>

          {/* Image Preview */}
          {showPreview && isImage && (
            <div className="mt-4 p-4 rounded-xl bg-slate-950/50 border border-indigo-500/20">
              <img
                src={item.fileUrl}
                alt={item.title}
                className="max-w-full h-auto rounded-lg"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function EvidenceList({ evidence, caseId }: EvidenceListProps) {
  if (evidence.length === 0) {
    return (
      <div className="text-center py-12 px-4 rounded-2xl glass-strong border border-indigo-500/20">
        <div className="p-4 rounded-xl bg-indigo-500/20 border border-indigo-500/30 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <FileText className="h-8 w-8 text-indigo-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">No evidence uploaded yet</h3>
        <p className="text-sm text-slate-400">
          Upload documents, images, or PDFs to strengthen your case
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-semibold text-white">
          Evidence Items ({evidence.length})
        </h3>
        <p className="text-sm text-slate-400">
          Permanent index numbers for court reference
        </p>
      </div>
      
      {evidence.map((item) => (
        <EvidenceCard key={item.id} item={item} />
      ))}
    </div>
  );
}
