"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface GenerateButtonProps {
  caseId: string;
  onGenerated?: () => void;
}

export function GenerateButton({ caseId, onGenerated }: GenerateButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    toast.loading("Resetting case...");

    try {
      const response = await fetch(`/api/disputes/${caseId}/reset`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to reset case");
      }

      toast.dismiss();
      toast.success("Case reset! You can now generate documents again.");
      onGenerated?.();
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to reset case");
    } finally {
      setIsResetting(false);
    }
  };

  const handleGenerate = async () => {
    console.log("[GenerateButton] Generate clicked for case:", caseId);
    setIsGenerating(true);
    toast.loading("Generating documents...");

    try {
      console.log("[GenerateButton] Calling POST /api/disputes/${caseId}/documents/generate");
      const response = await fetch(`/api/disputes/${caseId}/documents/generate`, {
        method: "POST",
      });

      console.log("[GenerateButton] Response status:", response.status);

      if (!response.ok) {
        const data = await response.json();
        console.error("[GenerateButton] Generation failed:", data);
        throw new Error(data.error || "Failed to generate documents");
      }

      const data = await response.json();
      console.log("[GenerateButton] Generation success:", data);
      toast.dismiss();
      toast.success(`Generated ${data.stats.success} documents!`);
      onGenerated?.();
    } catch (error) {
      console.error("[GenerateButton] Error:", error);
      toast.dismiss();
      toast.error(error instanceof Error ? error.message : "Failed to generate documents");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleReset}
        disabled={isResetting}
        size="sm"
        variant="outline"
        className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
      >
        {isResetting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Resetting...
          </>
        ) : (
          <>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </>
        )}
      </Button>
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
    </div>
  );
}
