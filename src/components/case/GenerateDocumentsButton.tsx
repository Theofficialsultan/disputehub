"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface GenerateDocumentsButtonProps {
  caseId: string;
  isLocked: boolean;
  onGenerationStarted?: () => void;
}

export function GenerateDocumentsButton({
  caseId,
  isLocked,
  onGenerationStarted,
}: GenerateDocumentsButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    toast.loading("Starting document generation...");

    try {
      const response = await fetch("/api/admin/trigger-gate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ caseId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate documents");
      }

      toast.dismiss();
      toast.success("Document generation started!");
      onGenerationStarted?.();
    } catch (error) {
      toast.dismiss();
      toast.error(error instanceof Error ? error.message : "Failed to generate documents");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLocked) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
        <CheckCircle className="h-4 w-4 text-emerald-400" />
        <span className="text-sm text-emerald-300 font-medium">Documents Generated</span>
      </div>
    );
  }

  return (
    <Button
      onClick={handleGenerate}
      disabled={isGenerating}
      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold shadow-lg shadow-purple-500/50 transition-all hover:scale-105"
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <FileText className="mr-2 h-4 w-4" />
          Generate Documents
        </>
      )}
    </Button>
  );
}
