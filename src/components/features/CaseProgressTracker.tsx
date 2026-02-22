"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Circle, Loader2, ArrowRight, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ProgressStage {
  id: string;
  name: string;
  description: string;
  status: "completed" | "current" | "pending";
  progress: number;
  completedAt?: Date;
}

interface CaseProgress {
  caseId: string;
  caseTitle: string;
  overallProgress: number;
  stages: ProgressStage[];
  nextAction: string;
  estimatedCompletion: string;
}

interface CaseProgressTrackerProps {
  caseId: string;
  compact?: boolean;
}

export function CaseProgressTracker({ caseId, compact = false }: CaseProgressTrackerProps) {
  const [progress, setProgress] = useState<CaseProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, [caseId]);

  const fetchProgress = async () => {
    try {
      const response = await fetch(`/api/progress/${caseId}`);
      const data = await response.json();
      setProgress(data.progress);
    } catch (error) {
      console.error("Error fetching progress:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl glass-strong border border-indigo-500/20 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
        </div>
      </div>
    );
  }

  if (!progress) return null;

  if (compact) {
    return <CompactProgress progress={progress} />;
  }

  return (
    <div className="rounded-2xl glass-strong border border-indigo-500/20 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white">Case Progress</h3>
          <p className="text-sm text-slate-400">{progress.caseTitle}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-indigo-400">
            {progress.overallProgress}%
          </div>
          <div className="text-xs text-slate-500">Complete</div>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-6">
        <Progress value={progress.overallProgress} className="h-3" />
      </div>

      {/* Stages */}
      <div className="space-y-4">
        {progress.stages.map((stage, index) => (
          <div key={stage.id} className="relative">
            {/* Connector line */}
            {index < progress.stages.length - 1 && (
              <div
                className={`absolute left-4 top-10 w-0.5 h-8 ${
                  stage.status === "completed"
                    ? "bg-green-500"
                    : "bg-slate-700"
                }`}
              />
            )}

            <div className="flex items-start gap-4">
              {/* Status icon */}
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  stage.status === "completed"
                    ? "bg-green-500/20 border-2 border-green-500"
                    : stage.status === "current"
                    ? "bg-indigo-500/20 border-2 border-indigo-500 animate-pulse"
                    : "bg-slate-800 border-2 border-slate-700"
                }`}
              >
                {stage.status === "completed" ? (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                ) : stage.status === "current" ? (
                  <Loader2 className="h-4 w-4 text-indigo-400 animate-spin" />
                ) : (
                  <Circle className="h-4 w-4 text-slate-500" />
                )}
              </div>

              {/* Stage info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4
                    className={`font-medium ${
                      stage.status === "completed"
                        ? "text-green-400"
                        : stage.status === "current"
                        ? "text-white"
                        : "text-slate-500"
                    }`}
                  >
                    {stage.name}
                  </h4>
                  {stage.status === "current" && stage.progress > 0 && (
                    <span className="text-xs text-indigo-400">
                      {stage.progress}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {stage.description}
                </p>
                {stage.completedAt && (
                  <p className="text-xs text-slate-600 mt-1">
                    Completed {new Date(stage.completedAt).toLocaleDateString("en-GB")}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Next Action */}
      <div className="mt-6 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
        <div className="flex items-center gap-3">
          <ArrowRight className="h-5 w-5 text-indigo-400" />
          <div>
            <p className="text-sm font-medium text-white">Next Action</p>
            <p className="text-xs text-slate-400">{progress.nextAction}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
          <Clock className="h-3 w-3" />
          <span>Estimated completion: {progress.estimatedCompletion}</span>
        </div>
      </div>
    </div>
  );
}

function CompactProgress({ progress }: { progress: CaseProgress }) {
  const completedStages = progress.stages.filter(
    (s) => s.status === "completed"
  ).length;
  const totalStages = progress.stages.length;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <Progress value={progress.overallProgress} className="h-2" />
      </div>
      <span className="text-sm font-medium text-indigo-400 whitespace-nowrap">
        {completedStages}/{totalStages} stages
      </span>
    </div>
  );
}

/**
 * Mini progress indicator for case cards
 */
export function MiniProgress({ caseId }: { caseId: string }) {
  const [progress, setProgress] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, [caseId]);

  const fetchProgress = async () => {
    try {
      const response = await fetch(`/api/progress/${caseId}`);
      const data = await response.json();
      setProgress(data.progress?.overallProgress || 0);
    } catch (error) {
      console.error("Error fetching progress:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-xs text-slate-400">{progress}%</span>
    </div>
  );
}
