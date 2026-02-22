"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  History,
  RotateCcw,
  Clock,
  User,
  FileText,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface DocumentVersion {
  versionNumber: number;
  createdAt: string;
  changeReason?: string;
  changedBy?: string;
  hasContent: boolean;
  hasFile: boolean;
}

interface DocumentVersionHistoryProps {
  documentId: string;
  documentTitle: string;
  onVersionRestored?: () => void;
}

export function DocumentVersionHistory({
  documentId,
  documentTitle,
  onVersionRestored,
}: DocumentVersionHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadVersions();
    }
  }, [isOpen]);

  const loadVersions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/documents/${documentId}/versions`);
      if (response.ok) {
        const data = await response.json();
        setVersions(data.versions || []);
        setCurrentVersion(data.currentVersion || 1);
      }
    } catch (error) {
      console.error("Failed to load versions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const restoreVersion = async (versionNumber: number) => {
    setIsRestoring(versionNumber);
    try {
      const response = await fetch(`/api/documents/${documentId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "restore",
          versionNumber,
        }),
      });

      if (!response.ok) throw new Error("Failed to restore version");

      toast.success(`Restored to version ${versionNumber}`);
      loadVersions();
      onVersionRestored?.();
    } catch (error) {
      toast.error("Failed to restore version");
    } finally {
      setIsRestoring(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <History className="h-4 w-4" />
          Version History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Version History
          </DialogTitle>
          <DialogDescription>
            View and restore previous versions of "{documentTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current version indicator */}
          <div className="flex items-center justify-between p-3 rounded-lg border-2 border-primary bg-primary/5">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <FileText className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <p className="font-medium">Version {currentVersion}</p>
                <p className="text-xs text-muted-foreground">Current version</p>
              </div>
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
              Active
            </span>
          </div>

          {/* Version list */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : versions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No previous versions available
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {versions.map((version) => (
                <div
                  key={version.versionNumber}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {version.versionNumber}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Version {version.versionNumber}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(version.createdAt), {
                          addSuffix: true,
                        })}
                        {version.changedBy && (
                          <>
                            <span>•</span>
                            <User className="h-3 w-3" />
                            {version.changedBy === "system" ? "Auto-save" : "Manual"}
                          </>
                        )}
                      </div>
                      {version.changeReason && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {version.changeReason}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => restoreVersion(version.versionNumber)}
                    disabled={isRestoring !== null}
                    className="gap-1"
                  >
                    {isRestoring === version.versionNumber ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <RotateCcw className="h-4 w-4" />
                        Restore
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Help text */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm">
            <ChevronRight className="h-4 w-4 text-muted-foreground mt-0.5" />
            <p className="text-muted-foreground">
              Restoring a version creates a backup of the current content first.
              You can always restore to any previous state.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
