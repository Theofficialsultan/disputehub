"use client";

import { useState, useCallback } from "react";
import {
  Upload,
  FileText,
  Image,
  File,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface EvidenceUploadBulkProps {
  caseId: string;
  onUploadComplete: () => void;
}

interface FileWithPreview {
  file: File;
  id: string;
  preview?: string;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

export function EvidenceUploadBulk({ caseId, onUploadComplete }: EvidenceUploadBulkProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFilesAdded(droppedFiles);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFilesAdded(Array.from(selectedFiles));
    }
  };

  const handleFilesAdded = (newFiles: File[]) => {
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    const validExtensions = ["jpg", "jpeg", "png", "pdf"];

    const processedFiles: FileWithPreview[] = newFiles
      .filter((file) => {
        const fileExtension = file.name.split(".").pop()?.toLowerCase();
        const isValidType = validTypes.includes(file.type) || validExtensions.includes(fileExtension || "");
        
        if (!isValidType) {
          toast.error(`${file.name}: Invalid file type`);
          return false;
        }

        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name}: File too large (max 10MB)`);
          return false;
        }

        return true;
      })
      .map((file) => {
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;

        return {
          file,
          id,
          preview,
          status: "pending" as const,
        };
      });

    setFiles((prev) => [...prev, ...processedFiles]);
    
    // Auto-upload immediately after files are added
    if (processedFiles.length > 0) {
      setTimeout(() => {
        uploadFilesDirectly(processedFiles);
      }, 100);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const uploadFilesDirectly = async (filesToUpload: FileWithPreview[]) => {
    setIsUploading(true);

    let successCount = 0;
    let errorCount = 0;

    // Upload files sequentially to avoid overwhelming the server
    for (const fileItem of filesToUpload) {
      // Update status to uploading
      setFiles((prev) =>
        prev.map((f) => (f.id === fileItem.id ? { ...f, status: "uploading" as const } : f))
      );

      try {
        const formData = new FormData();
        formData.append("file", fileItem.file);
        formData.append("caseId", caseId);
        
        // Use filename as title (AI will improve it)
        const nameWithoutExt = fileItem.file.name.split(".").slice(0, -1).join(".");
        formData.append("title", nameWithoutExt);

        const response = await fetch("/api/evidence/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Upload failed");
        }

        // Update status to success
        setFiles((prev) =>
          prev.map((f) => (f.id === fileItem.id ? { ...f, status: "success" as const } : f))
        );

        successCount++;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Upload failed";

        // Update status to error
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id ? { ...f, status: "error" as const, error: errorMessage } : f
          )
        );

        errorCount++;
      }
    }

    setIsUploading(false);

    // Show summary
    if (successCount > 0) {
      toast.success(`${successCount} file${successCount > 1 ? "s" : ""} uploaded successfully!`);
      onUploadComplete();
    }

    if (errorCount > 0) {
      toast.error(`${errorCount} file${errorCount > 1 ? "s" : ""} failed to upload`);
    }

    // Clear successful uploads after a delay
    if (successCount > 0) {
      setTimeout(() => {
        setFiles((prev) => prev.filter((f) => f.status !== "success"));
      }, 2000);
    }
  };

  const uploadAllFiles = async () => {
    if (files.length === 0) {
      toast.error("Please select files to upload");
      return;
    }

    const pendingFiles = files.filter((f) => f.status === "pending");
    if (pendingFiles.length === 0) {
      toast.info("All files already uploaded");
      return;
    }

    await uploadFilesDirectly(pendingFiles);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return Image;
    if (file.type === "application/pdf") return FileText;
    return File;
  };

  const getStatusIcon = (status: FileWithPreview["status"]) => {
    switch (status) {
      case "uploading":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return null;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 ${
          isDragging
            ? "border-indigo-500 bg-indigo-500/10"
            : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
        }`}
      >
        <input
          type="file"
          id="evidence-files-bulk"
          multiple
          accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
          onChange={handleFileInputChange}
          className="sr-only"
        />
        <label
          htmlFor="evidence-files-bulk"
          className="flex cursor-pointer flex-col items-center justify-center px-6 py-12"
        >
          <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 p-4 shadow-lg shadow-indigo-500/50">
            <Upload className="h-8 w-8 text-white" />
          </div>
          <p className="mt-4 text-base font-medium text-white">
            Drop files here or click to browse
          </p>
          <p className="mt-2 text-sm text-slate-400">
            JPG, PNG, or PDF • Max 10MB per file • Auto-uploads when selected
          </p>
        </label>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-300">
              {isUploading ? "Uploading..." : `${files.filter(f => f.status === "success").length} of ${files.length} uploaded`}
            </p>
          </div>

          <div className="space-y-2">
            {files.map((fileItem) => {
              const FileIcon = getFileIcon(fileItem.file);

              return (
                <div
                  key={fileItem.id}
                  className="flex items-center gap-3 rounded-xl bg-slate-800/50 p-3 backdrop-blur-sm border border-slate-700/50"
                >
                  {/* Preview or Icon */}
                  {fileItem.preview ? (
                    <img
                      src={fileItem.preview}
                      alt={fileItem.file.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-700">
                      <FileIcon className="h-6 w-6 text-slate-300" />
                    </div>
                  )}

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {fileItem.file.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatFileSize(fileItem.file.size)}
                    </p>
                    {fileItem.error && (
                      <p className="text-xs text-red-400 mt-1">{fileItem.error}</p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2">
                    {getStatusIcon(fileItem.status)}
                    {fileItem.status === "pending" && !isUploading && (
                      <button
                        onClick={() => removeFile(fileItem.id)}
                        className="rounded-lg p-1 hover:bg-slate-700 transition-colors"
                      >
                        <X className="h-4 w-4 text-slate-400" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Info Message */}
      <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <Upload className="h-5 w-5 text-blue-400" />
          </div>
          <div className="text-sm text-blue-200">
            <p className="font-medium mb-1">Auto Upload</p>
            <p className="text-blue-300/80">
              Files upload automatically when you select them. AI will analyze images, generate professional titles, and acknowledge your evidence in the chat.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
