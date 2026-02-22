/**
 * GUIDANCE ASSISTANT HOOK
 * Phase 8.6 - Client-side interface for read-only support AI
 * 
 * This hook provides a way to interact with the Guidance Assistant
 * during system-controlled phases.
 */

import { useState } from "react";

interface GuidanceResponse {
  response: string;
  phase: string;
  documentsCount: number;
  readOnly: boolean;
}

interface GuidanceError {
  error: string;
  reason?: string;
}

export function useGuidanceAssistant(disputeId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const askGuidance = async (question: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/disputes/${disputeId}/guidance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: question }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle error response
        const errorData = data as GuidanceError;
        setError(errorData.reason || errorData.error || "Guidance Assistant unavailable");
        return null;
      }

      // Success - return guidance response
      const guidanceData = data as GuidanceResponse;
      return guidanceData.response;
    } catch (err) {
      console.error("Guidance Assistant error:", err);
      setError("Failed to contact Guidance Assistant");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    askGuidance,
    isLoading,
    error,
  };
}
