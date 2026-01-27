"use client";

import { useState, useCallback } from "react";
import {
  Upload,
  FileText,
  Image,
  File,
  X,
  Calendar,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface EvidenceUploadProps {
  caseId: string;
  onUploadComplete: () => void;
}

export function EvidenceUpload({ caseId, onUploadComplete }: EvidenceUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form fields
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [evidenceDate, setEvidenceDate] = useState("");

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

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = (file: File) => {
    // Validate file type (check both MIME type and extension)
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    const validExtensions = ["jpg", "jpeg", "png", "pdf"];
    
    const isValidType = validTypes.includes(file.type) || validExtensions.includes(fileExtension || "");
    
    if (!isValidType) {
      setError(`Invalid file type. Only JPG, PNG, and PDF files are allowed. (File type detected: ${file.type || "unknown"})`);
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Auto-populate title from filename if empty
    if (!title) {
      const nameWithoutExt = file.name.split(".").slice(0, -1).join(".");
      setTitle(nameWithoutExt);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedFile) {
      setError("Please select a file");
      return;
    }

    if (!title.trim()) {
      setError("Please provide a title");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("caseId", caseId);
      formData.append("title", title.trim());
      if (description.trim()) {
        formData.append("description", description.trim());
      }
      if (evidenceDate) {
        formData.append("evidenceDate", evidenceDate);
      }

      const response = await fetch("/api/evidence/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      // Reset form
      setSelectedFile(null);
      setTitle("");
      setDescription("");
      setEvidenceDate("");
      setError(null);

      // Notify parent
      onUploadComplete();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      
      // Provide more helpful error messages
      if (errorMessage.includes("fetch failed") || errorMessage.includes("network")) {
        setError("Network error: Unable to connect to storage service. Please check your connection or try again later.");
      } else if (errorMessage.includes("maintenance") || errorMessage.includes("unavailable")) {
        setError("Storage service is temporarily unavailable. Please try again in a few minutes.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = () => {
    if (!selectedFile) return Upload;
    if (selectedFile.type.startsWith("image/")) return Image;
    if (selectedFile.type === "application/pdf") return FileText;
    return File;
  };

  const FileIcon = getFileIcon();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* File Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed transition-all ${
          isDragging
            ? "border-indigo-500 bg-indigo-500/10"
            : "border-indigo-500/30 bg-slate-900/40"
        }`}
      >
        <input
          type="file"
          id="evidence-file"
          accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
          onChange={handleFileInputChange}
          className="sr-only"
        />
        <label
          htmlFor="evidence-file"
          className="flex flex-col items-center justify-center p-12 cursor-pointer"
        >
          <div className={`p-4 rounded-xl bg-gradient-to-br ${
            selectedFile ? "from-emerald-500 to-teal-500" : "from-indigo-500 to-purple-500"
          } mb-4`}>
            <FileIcon className="h-8 w-8 text-white" />
          </div>
          {selectedFile ? (
            <div className="text-center">
              <p className="text-white font-semibold mb-1">{selectedFile.name}</p>
              <p className="text-sm text-slate-400">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedFile(null);
                }}
                className="mt-2 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-white font-semibold mb-1">
                Drop file here or click to browse
              </p>
              <p className="text-sm text-slate-400">
                JPG, PNG, or PDF • Max 10MB
              </p>
            </div>
          )}
        </label>
      </div>

      {/* Evidence Details */}
      {selectedFile && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-white">
              Evidence Title *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Photograph of damaged property"
              required
              className="glass-strong border-indigo-500/20 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide additional context about this evidence..."
              rows={3}
              className="glass-strong border-indigo-500/20 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="evidenceDate" className="text-white flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Evidence Date (Optional)
            </Label>
            <Input
              id="evidenceDate"
              type="date"
              value={evidenceDate}
              onChange={(e) => setEvidenceDate(e.target.value)}
              className="glass-strong border-indigo-500/20 text-white"
            />
            <p className="text-xs text-slate-500">
              When did this evidence originate? (e.g., photo taken on...)
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      {selectedFile && (
        <Button
          type="submit"
          disabled={isUploading || !title.trim()}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Uploading Evidence...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-5 w-5" />
              Upload Evidence
            </>
          )}
        </Button>
      )}
    </form>
  );
}
