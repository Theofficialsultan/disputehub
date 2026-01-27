"use client";

import { useState } from "react";
import type { EvidenceFile } from "@/lib/validations/dispute";

interface EvidenceUploadProps {
  files: EvidenceFile[];
  onFilesChange: (files: EvidenceFile[]) => void;
}

export function EvidenceUpload({ files, onFilesChange }: EvidenceUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: EvidenceFile[] = Array.from(selectedFiles)
      .slice(0, 5 - files.length) // Max 5 files
      .map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
      }));

    onFilesChange([...files, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleRemove = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Upload evidence (optional)</h2>
        <p className="text-muted-foreground">
          Add documents, photos, or other files to support your case
        </p>
      </div>

      {/* Upload Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        } ${files.length >= 5 ? "opacity-50" : ""}`}
      >
        <div className="mx-auto max-w-sm space-y-3">
          <div className="text-4xl">📎</div>
          <div>
            <p className="font-medium">
              {files.length >= 5
                ? "Maximum files reached"
                : "Drag files here or click to browse"}
            </p>
            <p className="text-sm text-muted-foreground">
              PDF, JPG, PNG up to 10MB each (max 5 files)
            </p>
          </div>
          {files.length < 5 && (
            <label className="inline-block">
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
                disabled={files.length >= 5}
              />
              <span className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                Choose Files
              </span>
            </label>
          )}
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">
            Uploaded Files ({files.length}/5)
          </h3>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border bg-muted/50 p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">
                    {file.type.includes("pdf")
                      ? "📄"
                      : file.type.includes("image")
                        ? "📷"
                        : "📎"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="text-destructive hover:text-destructive/80"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="rounded-lg border bg-muted/50 p-4">
        <h3 className="mb-2 text-sm font-medium">
          📋 What evidence helps your case?
        </h3>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• Photos or videos of the situation</li>
          <li>• Official notices or correspondence</li>
          <li>• Receipts or payment records</li>
          <li>• Witness statements or contact details</li>
        </ul>
      </div>
    </div>
  );
}
