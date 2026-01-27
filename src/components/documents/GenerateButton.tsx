"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface GenerateButtonProps {
  caseId: string;
  onGenerated?: () => void;
}

export function GenerateButton({ caseId, onGenerated }: GenerateButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    toast.loading("Generating documents...");

    try {
      const response = await fetch(`/api/disputes/${caseId}/documents/generate`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate documents");
      }

      const data = await response.json();
      toast.dismiss();
      toast.success(`Generated ${data.stats.success} documents!`);
      onGenerated?.();
    } catch (error) {
      toast.dismiss();
      toast.error(error instanceof Error ? error.message : "Failed to generate documents");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleGenerate}
      disabled={isGenerating}
      size="sm"
      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold shadow-lg"
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <FileText className="mr-2 h-4 w-4" />
          Generate Docs
        </>
      )}
    </Button>
  );
}
