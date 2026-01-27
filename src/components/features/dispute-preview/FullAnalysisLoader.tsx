"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface FullAnalysisLoaderProps {
  disputeId: string;
  hasFullAnalysis: boolean;
  isUnlocked: boolean;
  bypassEnabled: boolean;
}

export function FullAnalysisLoader({
  disputeId,
  hasFullAnalysis,
  isUnlocked,
  bypassEnabled,
}: FullAnalysisLoaderProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [hasTriedGeneration, setHasTriedGeneration] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only generate once, if unlocked and not already generated
    const shouldGenerate =
      (isUnlocked || bypassEnabled) && 
      !hasFullAnalysis && 
      !isGenerating && 
      !hasTriedGeneration;

    if (shouldGenerate) {
      setHasTriedGeneration(true);
      generateFullAnalysis();
    }
  }, [isUnlocked, bypassEnabled, hasFullAnalysis, isGenerating, hasTriedGeneration]);

  const generateFullAnalysis = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/disputes/${disputeId}/generate-full`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate full analysis");
      }

      // Mark as completed
      setIsGenerating(false);
      setJustCompleted(true);
      
      // Wait a moment before refreshing to avoid rate limits
      setTimeout(() => {
        router.refresh();
      }, 1000);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setJustCompleted(false);
      }, 3000);
    } catch (err) {
      console.error("Error generating full analysis:", err);
      setError("Failed to generate full analysis. Please refresh the page.");
      setIsGenerating(false);
    }
  };

  // Show success message briefly after completion
  if (justCompleted && hasFullAnalysis) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
        <div className="flex items-center gap-2">
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
            <path d="M20 6 9 17l-5-5" />
          </svg>
          <span className="font-medium">
            Full analysis generated successfully!
          </span>
        </div>
      </div>
    );
  }

  // Don't show loader if content already exists
  if (hasFullAnalysis) {
    return null;
  }

  // Show loading state
  if (isGenerating) {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <div>
            <h3 className="font-semibold text-blue-900">
              Generating your full dispute letter...
            </h3>
            <p className="text-sm text-blue-700">
              This may take 10-15 seconds. Please wait.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if generation failed
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        <div className="flex items-center gap-2">
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
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="font-medium">{error}</span>
        </div>
      </div>
    );
  }

  return null;
}
