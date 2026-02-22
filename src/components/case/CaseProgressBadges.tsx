"use client";

import { useMemo } from "react";
import {
  FileText,
  MessageSquare,
  Upload,
  CheckCircle,
  Clock,
  Send,
  Award,
  Shield,
  Zap,
  Target,
  Star,
  Trophy,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CaseData {
  status: string;
  lifecycleStatus: string;
  summaryConfirmed: boolean;
  documentsCount: number;
  messagesCount: number;
  evidenceCount: number;
  documentsSent: boolean;
  responseReceived: boolean;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  earned: boolean;
}

interface CaseProgressBadgesProps {
  caseData: CaseData;
  compact?: boolean;
}

export function CaseProgressBadges({ caseData, compact = false }: CaseProgressBadgesProps) {
  const badges = useMemo<Badge[]>(() => [
    {
      id: "started",
      name: "Getting Started",
      description: "Started your first case",
      icon: Zap,
      color: "text-blue-500 bg-blue-500/10",
      earned: true, // Always earned if viewing a case
    },
    {
      id: "storyteller",
      name: "Storyteller",
      description: "Provided detailed case information",
      icon: MessageSquare,
      color: "text-purple-500 bg-purple-500/10",
      earned: caseData.messagesCount >= 5,
    },
    {
      id: "evidence_collector",
      name: "Evidence Collector",
      description: "Uploaded supporting evidence",
      icon: Upload,
      color: "text-amber-500 bg-amber-500/10",
      earned: caseData.evidenceCount >= 1,
    },
    {
      id: "evidence_master",
      name: "Evidence Master",
      description: "Uploaded 5+ pieces of evidence",
      icon: Shield,
      color: "text-amber-600 bg-amber-600/10",
      earned: caseData.evidenceCount >= 5,
    },
    {
      id: "summary_approved",
      name: "Case Confirmed",
      description: "Confirmed your case summary",
      icon: CheckCircle,
      color: "text-green-500 bg-green-500/10",
      earned: caseData.summaryConfirmed,
    },
    {
      id: "documents_ready",
      name: "Documents Ready",
      description: "Generated your legal documents",
      icon: FileText,
      color: "text-cyan-500 bg-cyan-500/10",
      earned: caseData.documentsCount >= 1,
    },
    {
      id: "full_docket",
      name: "Full Docket",
      description: "Generated 3+ documents",
      icon: Target,
      color: "text-cyan-600 bg-cyan-600/10",
      earned: caseData.documentsCount >= 3,
    },
    {
      id: "letter_sent",
      name: "Action Taker",
      description: "Sent your first document",
      icon: Send,
      color: "text-indigo-500 bg-indigo-500/10",
      earned: caseData.documentsSent,
    },
    {
      id: "response_received",
      name: "Progress Made",
      description: "Received a response",
      icon: Clock,
      color: "text-orange-500 bg-orange-500/10",
      earned: caseData.responseReceived,
    },
    {
      id: "case_closed",
      name: "Victory",
      description: "Successfully resolved your case",
      icon: Trophy,
      color: "text-yellow-500 bg-yellow-500/10",
      earned: caseData.lifecycleStatus === "CLOSED",
    },
  ], [caseData]);

  const earnedBadges = badges.filter((b) => b.earned);
  const nextBadge = badges.find((b) => !b.earned);
  const progressPercentage = Math.round((earnedBadges.length / badges.length) * 100);

  if (compact) {
    return (
      <TooltipProvider>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {earnedBadges.slice(0, 5).map((badge) => (
              <Tooltip key={badge.id}>
                <TooltipTrigger asChild>
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center border-2 border-background ${badge.color}`}
                  >
                    <badge.icon className="h-4 w-4" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{badge.name}</p>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
            {earnedBadges.length > 5 && (
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border-2 border-background text-xs font-medium">
                +{earnedBadges.length - 5}
              </div>
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            {earnedBadges.length}/{badges.length}
          </span>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Case Progress</span>
          <span className="text-muted-foreground">{progressPercentage}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Next badge to earn */}
      {nextBadge && (
        <div className="p-3 rounded-lg border border-dashed bg-muted/30">
          <p className="text-xs text-muted-foreground mb-2">Next badge:</p>
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center opacity-50 ${nextBadge.color}`}>
              <nextBadge.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-sm">{nextBadge.name}</p>
              <p className="text-xs text-muted-foreground">{nextBadge.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Badge grid */}
      <TooltipProvider>
        <div className="grid grid-cols-5 gap-2">
          {badges.map((badge) => (
            <Tooltip key={badge.id}>
              <TooltipTrigger asChild>
                <div
                  className={`aspect-square rounded-lg flex items-center justify-center transition-all ${
                    badge.earned
                      ? `${badge.color} border-2 border-current/20`
                      : "bg-muted/50 opacity-30"
                  }`}
                >
                  <badge.icon className={`h-5 w-5 ${badge.earned ? "" : "text-muted-foreground"}`} />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <div className="text-center">
                  <p className="font-medium">{badge.name}</p>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                  {!badge.earned && (
                    <p className="text-xs text-amber-500 mt-1">Not earned yet</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>

      {/* Achievements summary */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            {earnedBadges.length} badges earned
          </span>
        </div>
        {progressPercentage === 100 && (
          <div className="flex items-center gap-1 text-sm text-yellow-500">
            <Star className="h-4 w-4 fill-current" />
            Complete!
          </div>
        )}
      </div>
    </div>
  );
}
