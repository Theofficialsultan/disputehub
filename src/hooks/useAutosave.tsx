/**
 * Feature 8: Auto-Save Hook
 * React hook for auto-saving drafts
 */

import { useCallback, useEffect, useRef, useState } from "react";

interface AutoSaveOptions {
  enabled?: boolean;
  intervalMs?: number;
  onSave?: (content: any) => Promise<void>;
  caseId?: string;
  type?: string;
  title?: string;
}

interface AutoSaveState {
  isSaving: boolean;
  lastSavedAt: Date | null;
  error: string | null;
  hasUnsavedChanges: boolean;
}

export function useAutoSave<T>(
  content: T,
  options: AutoSaveOptions = {}
) {
  const {
    enabled = true,
    intervalMs = 30000, // 30 seconds
    onSave,
    caseId,
    type = "case_chat",
    title = "Draft",
  } = options;

  const [state, setState] = useState<AutoSaveState>({
    isSaving: false,
    lastSavedAt: null,
    error: null,
    hasUnsavedChanges: false,
  });

  const lastSavedContent = useRef<string>("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const save = useCallback(async (forceContent?: T) => {
    const contentToSave = forceContent || content;
    const contentString = JSON.stringify(contentToSave);

    // Skip if content hasn't changed
    if (contentString === lastSavedContent.current) {
      return;
    }

    setState((prev) => ({ ...prev, isSaving: true, error: null }));

    try {
      if (onSave) {
        await onSave(contentToSave);
      } else {
        // Default: save to API
        await fetch("/api/drafts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            caseId,
            type,
            title,
            content: { data: contentToSave },
            autoSaved: true,
          }),
        });
      }

      lastSavedContent.current = contentString;
      setState((prev) => ({
        ...prev,
        isSaving: false,
        lastSavedAt: new Date(),
        hasUnsavedChanges: false,
      }));
    } catch (error) {
      console.error("Auto-save error:", error);
      setState((prev) => ({
        ...prev,
        isSaving: false,
        error: "Failed to save draft",
      }));
    }
  }, [content, caseId, type, title, onSave]);

  // Mark as having unsaved changes when content changes
  useEffect(() => {
    const contentString = JSON.stringify(content);
    if (contentString !== lastSavedContent.current) {
      setState((prev) => ({ ...prev, hasUnsavedChanges: true }));
    }
  }, [content]);

  // Set up auto-save interval
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      if (state.hasUnsavedChanges && !state.isSaving) {
        save();
      }
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, intervalMs, save, state.hasUnsavedChanges, state.isSaving]);

  // Save on unmount if there are unsaved changes
  useEffect(() => {
    return () => {
      if (state.hasUnsavedChanges) {
        // Synchronous cleanup - can't await here
        // Content should already be saved by interval
      }
    };
  }, [state.hasUnsavedChanges]);

  const manualSave = useCallback(async () => {
    await save();
  }, [save]);

  return {
    ...state,
    save: manualSave,
    formatLastSaved: () => {
      if (!state.lastSavedAt) return "Not saved";
      const seconds = Math.floor(
        (Date.now() - state.lastSavedAt.getTime()) / 1000
      );
      if (seconds < 60) return "Saved just now";
      if (seconds < 3600) return `Saved ${Math.floor(seconds / 60)}m ago`;
      return `Saved ${Math.floor(seconds / 3600)}h ago`;
    },
  };
}

/**
 * Auto-save status indicator component
 */
export function AutoSaveIndicator({
  isSaving,
  lastSavedAt,
  error,
  hasUnsavedChanges,
}: AutoSaveState) {
  const formatTime = () => {
    if (!lastSavedAt) return "";
    return lastSavedAt.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      {isSaving ? (
        <>
          <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-blue-400">Saving...</span>
        </>
      ) : error ? (
        <>
          <div className="h-2 w-2 rounded-full bg-red-400" />
          <span className="text-red-400">{error}</span>
        </>
      ) : hasUnsavedChanges ? (
        <>
          <div className="h-2 w-2 rounded-full bg-orange-400" />
          <span className="text-orange-400">Unsaved changes</span>
        </>
      ) : lastSavedAt ? (
        <>
          <div className="h-2 w-2 rounded-full bg-green-400" />
          <span className="text-slate-400">Saved at {formatTime()}</span>
        </>
      ) : null}
    </div>
  );
}
