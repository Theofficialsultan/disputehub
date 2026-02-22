/**
 * Feature 6: Progress Gamification
 * Add progress badges and completion percentages
 */

import { prisma } from "@/lib/prisma";

export type BadgeCategory = "MILESTONE" | "SPEED" | "QUALITY" | "STREAK" | "SPECIAL";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  category: BadgeCategory;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  requirement: BadgeRequirement;
  points: number;
}

export interface BadgeRequirement {
  type: "cases_created" | "cases_resolved" | "documents_generated" | "evidence_uploaded" | "streak_days" | "custom";
  value: number;
  customCheck?: string;
}

export interface UserBadge {
  badge: Badge;
  earnedAt: Date;
  progress: number; // 0-100
  isEarned: boolean;
}

export interface CaseProgress {
  caseId: string;
  caseTitle: string;
  overallProgress: number;
  stages: ProgressStage[];
  nextAction: string;
  estimatedCompletion: string;
}

export interface ProgressStage {
  id: string;
  name: string;
  description: string;
  status: "completed" | "current" | "pending";
  progress: number;
  completedAt?: Date;
}

// Badge definitions
const BADGES: Badge[] = [
  // Milestone badges
  {
    id: "first-case",
    name: "First Steps",
    description: "Created your first dispute case",
    icon: "Rocket",
    category: "MILESTONE",
    rarity: "common",
    requirement: { type: "cases_created", value: 1 },
    points: 10,
  },
  {
    id: "case-veteran",
    name: "Case Veteran",
    description: "Created 5 dispute cases",
    icon: "Award",
    category: "MILESTONE",
    rarity: "uncommon",
    requirement: { type: "cases_created", value: 5 },
    points: 50,
  },
  {
    id: "dispute-master",
    name: "Dispute Master",
    description: "Created 25 dispute cases",
    icon: "Crown",
    category: "MILESTONE",
    rarity: "rare",
    requirement: { type: "cases_created", value: 25 },
    points: 250,
  },
  {
    id: "first-win",
    name: "Victory!",
    description: "Successfully resolved your first case",
    icon: "Trophy",
    category: "MILESTONE",
    rarity: "uncommon",
    requirement: { type: "cases_resolved", value: 1 },
    points: 100,
  },
  {
    id: "winning-streak",
    name: "Winning Streak",
    description: "Resolved 5 cases successfully",
    icon: "Flame",
    category: "MILESTONE",
    rarity: "rare",
    requirement: { type: "cases_resolved", value: 5 },
    points: 500,
  },
  
  // Document badges
  {
    id: "first-document",
    name: "Paper Trail",
    description: "Generated your first legal document",
    icon: "FileText",
    category: "MILESTONE",
    rarity: "common",
    requirement: { type: "documents_generated", value: 1 },
    points: 15,
  },
  {
    id: "document-pro",
    name: "Document Pro",
    description: "Generated 10 legal documents",
    icon: "Files",
    category: "MILESTONE",
    rarity: "uncommon",
    requirement: { type: "documents_generated", value: 10 },
    points: 75,
  },
  {
    id: "paper-warrior",
    name: "Paper Warrior",
    description: "Generated 50 legal documents",
    icon: "Scroll",
    category: "MILESTONE",
    rarity: "epic",
    requirement: { type: "documents_generated", value: 50 },
    points: 300,
  },

  // Evidence badges
  {
    id: "evidence-collector",
    name: "Evidence Collector",
    description: "Uploaded your first piece of evidence",
    icon: "Camera",
    category: "MILESTONE",
    rarity: "common",
    requirement: { type: "evidence_uploaded", value: 1 },
    points: 10,
  },
  {
    id: "thorough-investigator",
    name: "Thorough Investigator",
    description: "Uploaded 25 pieces of evidence",
    icon: "Search",
    category: "QUALITY",
    rarity: "rare",
    requirement: { type: "evidence_uploaded", value: 25 },
    points: 150,
  },

  // Streak badges
  {
    id: "consistent-week",
    name: "Consistent Week",
    description: "Logged in 7 days in a row",
    icon: "Calendar",
    category: "STREAK",
    rarity: "uncommon",
    requirement: { type: "streak_days", value: 7 },
    points: 50,
  },
  {
    id: "dedicated-month",
    name: "Dedicated Month",
    description: "Logged in 30 days in a row",
    icon: "CalendarCheck",
    category: "STREAK",
    rarity: "rare",
    requirement: { type: "streak_days", value: 30 },
    points: 200,
  },

  // Special badges
  {
    id: "early-adopter",
    name: "Early Adopter",
    description: "Joined DisputeHub in its early days",
    icon: "Star",
    category: "SPECIAL",
    rarity: "legendary",
    requirement: { type: "custom", value: 0, customCheck: "early_adopter" },
    points: 1000,
  },
  {
    id: "legal-eagle",
    name: "Legal Eagle",
    description: "Completed all case types at least once",
    icon: "Bird",
    category: "SPECIAL",
    rarity: "epic",
    requirement: { type: "custom", value: 0, customCheck: "all_case_types" },
    points: 500,
  },
];

// Case progress stages
const CASE_STAGES: Omit<ProgressStage, "status" | "progress" | "completedAt">[] = [
  {
    id: "created",
    name: "Case Created",
    description: "Your case has been started",
  },
  {
    id: "facts-gathered",
    name: "Facts Gathered",
    description: "All necessary information collected",
  },
  {
    id: "strategy-set",
    name: "Strategy Set",
    description: "Legal strategy has been determined",
  },
  {
    id: "documents-generated",
    name: "Documents Generated",
    description: "Legal documents are ready",
  },
  {
    id: "documents-sent",
    name: "Documents Sent",
    description: "Documents have been sent to the other party",
  },
  {
    id: "awaiting-response",
    name: "Awaiting Response",
    description: "Waiting for the other party to respond",
  },
  {
    id: "case-resolved",
    name: "Case Resolved",
    description: "Your case has been resolved",
  },
];

/**
 * Get all badges with user progress
 */
export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  // Get user stats
  const [casesCreated, casesResolved, documentsGenerated, evidenceUploaded, earnedBadges] = await Promise.all([
    prisma.dispute.count({ where: { userId } }),
    prisma.dispute.count({ where: { userId, lifecycleStatus: "CLOSED" } }),
    prisma.generatedDocument.count({
      where: { case: { userId }, status: "COMPLETED" },
    }),
    prisma.evidenceItem.count({ where: { case: { userId } } }),
    prisma.userBadge.findMany({
      where: { userId },
      select: { badgeId: true, earnedAt: true },
    }),
  ]);

  const earnedBadgeMap = new Map(earnedBadges.map((b) => [b.badgeId, b.earnedAt]));

  return BADGES.map((badge) => {
    const earnedAt = earnedBadgeMap.get(badge.id);
    let progress = 0;

    switch (badge.requirement.type) {
      case "cases_created":
        progress = Math.min(100, (casesCreated / badge.requirement.value) * 100);
        break;
      case "cases_resolved":
        progress = Math.min(100, (casesResolved / badge.requirement.value) * 100);
        break;
      case "documents_generated":
        progress = Math.min(100, (documentsGenerated / badge.requirement.value) * 100);
        break;
      case "evidence_uploaded":
        progress = Math.min(100, (evidenceUploaded / badge.requirement.value) * 100);
        break;
      default:
        progress = earnedAt ? 100 : 0;
    }

    return {
      badge,
      earnedAt: earnedAt || new Date(0),
      progress: Math.round(progress),
      isEarned: !!earnedAt,
    };
  });
}

/**
 * Check and award new badges
 */
export async function checkAndAwardBadges(userId: string): Promise<Badge[]> {
  const userBadges = await getUserBadges(userId);
  const newBadges: Badge[] = [];

  for (const { badge, progress, isEarned } of userBadges) {
    if (!isEarned && progress >= 100) {
      // Award the badge
      await prisma.userBadge.create({
        data: {
          userId,
          badgeId: badge.id,
          earnedAt: new Date(),
        },
      });
      newBadges.push(badge);
    }
  }

  return newBadges;
}

/**
 * Calculate case progress
 */
export async function getCaseProgress(caseId: string): Promise<CaseProgress | null> {
  const caseData = await prisma.dispute.findUnique({
    where: { id: caseId },
    include: {
      caseStrategy: true,
      documentPlan: {
        include: {
          documents: true,
        },
      },
      caseEvents: {
        orderBy: { occurredAt: "asc" },
      },
    },
  });

  if (!caseData) return null;

  // Determine stage completion
  const stages: ProgressStage[] = CASE_STAGES.map((stage) => {
    let status: "completed" | "current" | "pending" = "pending";
    let progress = 0;
    let completedAt: Date | undefined;

    switch (stage.id) {
      case "created":
        status = "completed";
        progress = 100;
        completedAt = caseData.createdAt;
        break;
      case "facts-gathered":
        if (caseData.summaryConfirmed) {
          status = "completed";
          progress = 100;
          completedAt = caseData.summaryConfirmedAt || undefined;
        } else if (caseData.chatState === "GATHERING_FACTS") {
          status = "current";
          progress = 50;
        }
        break;
      case "strategy-set":
        if (caseData.caseStrategy && caseData.strategyLocked) {
          status = "completed";
          progress = 100;
        } else if (caseData.caseStrategy) {
          status = "current";
          progress = 75;
        }
        break;
      case "documents-generated":
        const completedDocs = caseData.documentPlan?.documents.filter(
          (d) => d.status === "COMPLETED"
        ).length || 0;
        const totalDocs = caseData.documentPlan?.documents.length || 1;
        progress = (completedDocs / totalDocs) * 100;
        if (progress >= 100) {
          status = "completed";
        } else if (completedDocs > 0) {
          status = "current";
        }
        break;
      case "documents-sent":
        if (caseData.lifecycleStatus === "DOCUMENT_SENT" || 
            caseData.lifecycleStatus === "AWAITING_RESPONSE") {
          status = "completed";
          progress = 100;
        }
        break;
      case "awaiting-response":
        if (caseData.lifecycleStatus === "AWAITING_RESPONSE") {
          status = "current";
          progress = 50;
        } else if (caseData.lifecycleStatus === "RESPONSE_RECEIVED" ||
                   caseData.lifecycleStatus === "CLOSED") {
          status = "completed";
          progress = 100;
        }
        break;
      case "case-resolved":
        if (caseData.lifecycleStatus === "CLOSED") {
          status = "completed";
          progress = 100;
        }
        break;
    }

    return { ...stage, status, progress, completedAt };
  });

  // Calculate overall progress
  const completedStages = stages.filter((s) => s.status === "completed").length;
  const overallProgress = Math.round((completedStages / stages.length) * 100);

  // Determine next action
  const currentStage = stages.find((s) => s.status === "current");
  const nextPending = stages.find((s) => s.status === "pending");
  const nextAction = currentStage?.description || nextPending?.description || "Case complete!";

  // Estimate completion
  let estimatedCompletion = "Unknown";
  if (overallProgress < 50) {
    estimatedCompletion = "1-2 weeks";
  } else if (overallProgress < 75) {
    estimatedCompletion = "3-7 days";
  } else if (overallProgress < 100) {
    estimatedCompletion = "1-3 days";
  } else {
    estimatedCompletion = "Complete";
  }

  return {
    caseId,
    caseTitle: caseData.title,
    overallProgress,
    stages,
    nextAction,
    estimatedCompletion,
  };
}

/**
 * Get user's total points
 */
export async function getUserPoints(userId: string): Promise<number> {
  const earnedBadges = await prisma.userBadge.findMany({
    where: { userId },
    select: { badgeId: true },
  });

  return earnedBadges.reduce((total, { badgeId }) => {
    const badge = BADGES.find((b) => b.id === badgeId);
    return total + (badge?.points || 0);
  }, 0);
}

/**
 * Get user rank based on points
 */
export function getUserRank(points: number): { title: string; nextRank: string; pointsToNext: number } {
  const ranks = [
    { title: "Novice", minPoints: 0 },
    { title: "Apprentice", minPoints: 100 },
    { title: "Advocate", minPoints: 300 },
    { title: "Expert", minPoints: 750 },
    { title: "Master", minPoints: 1500 },
    { title: "Champion", minPoints: 3000 },
    { title: "Legend", minPoints: 5000 },
  ];

  let currentRank = ranks[0];
  let nextRank = ranks[1];

  for (let i = 0; i < ranks.length; i++) {
    if (points >= ranks[i].minPoints) {
      currentRank = ranks[i];
      nextRank = ranks[i + 1] || ranks[i];
    }
  }

  return {
    title: currentRank.title,
    nextRank: nextRank.title,
    pointsToNext: nextRank.minPoints - points,
  };
}

/**
 * Get badge by ID
 */
export function getBadgeById(badgeId: string): Badge | undefined {
  return BADGES.find((b) => b.id === badgeId);
}

/**
 * Get all badges
 */
export function getAllBadges(): Badge[] {
  return BADGES;
}
