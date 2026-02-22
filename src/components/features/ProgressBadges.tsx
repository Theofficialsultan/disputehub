"use client";

import { useState, useEffect } from "react";
import {
  Trophy,
  Star,
  Award,
  Crown,
  Flame,
  Rocket,
  FileText,
  Camera,
  Calendar,
  Bird,
  Lock,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  points: number;
}

interface UserBadge {
  badge: Badge;
  earnedAt: Date;
  progress: number;
  isEarned: boolean;
}

interface BadgeData {
  badges: UserBadge[];
  points: number;
  rank: {
    title: string;
    nextRank: string;
    pointsToNext: number;
  };
  earnedCount: number;
  totalCount: number;
  completionPercent: number;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Trophy,
  Star,
  Award,
  Crown,
  Flame,
  Rocket,
  FileText,
  Camera,
  Calendar,
  Bird,
  Files: FileText,
  Scroll: FileText,
  Search: Camera,
  CalendarCheck: Calendar,
};

const RARITY_COLORS = {
  common: {
    bg: "from-slate-500/20 to-slate-600/20",
    border: "border-slate-500/30",
    text: "text-slate-400",
    glow: "",
  },
  uncommon: {
    bg: "from-green-500/20 to-emerald-500/20",
    border: "border-green-500/30",
    text: "text-green-400",
    glow: "",
  },
  rare: {
    bg: "from-blue-500/20 to-cyan-500/20",
    border: "border-blue-500/30",
    text: "text-blue-400",
    glow: "shadow-blue-500/20",
  },
  epic: {
    bg: "from-purple-500/20 to-indigo-500/20",
    border: "border-purple-500/30",
    text: "text-purple-400",
    glow: "shadow-purple-500/20",
  },
  legendary: {
    bg: "from-amber-500/20 to-orange-500/20",
    border: "border-amber-500/30",
    text: "text-amber-400",
    glow: "shadow-amber-500/30 animate-glow",
  },
};

export function ProgressBadges() {
  const [data, setData] = useState<BadgeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "earned" | "locked">("all");

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      const response = await fetch("/api/badges");
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching badges:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBadges = data?.badges.filter((b) => {
    if (filter === "earned") return b.isEarned;
    if (filter === "locked") return !b.isEarned;
    return true;
  });

  if (loading) {
    return (
      <div className="rounded-2xl glass-strong border border-indigo-500/20 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-800 rounded w-1/3" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-slate-800 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="rounded-2xl glass-strong border border-indigo-500/20 p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{data.rank.title}</h2>
            <p className="text-sm text-slate-400">
              {data.points} points • {data.earnedCount}/{data.totalCount} badges
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Progress to {data.rank.nextRank}</span>
            <span className="text-indigo-400">
              {data.rank.pointsToNext > 0
                ? `${data.rank.pointsToNext} points needed`
                : "Max rank!"}
            </span>
          </div>
          <Progress value={data.completionPercent} className="h-2" />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["all", "earned", "locked"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === f
                ? "bg-indigo-500 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            {f === "all" && "All Badges"}
            {f === "earned" && `Earned (${data.earnedCount})`}
            {f === "locked" && `Locked (${data.totalCount - data.earnedCount})`}
          </button>
        ))}
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBadges?.map((userBadge) => {
          const { badge, progress, isEarned, earnedAt } = userBadge;
          const IconComponent = ICON_MAP[badge.icon] || Award;
          const colors = RARITY_COLORS[badge.rarity];

          return (
            <div
              key={badge.id}
              className={`relative rounded-xl border ${colors.border} bg-gradient-to-br ${colors.bg} p-4 transition-all duration-300 hover:scale-[1.02] ${
                isEarned ? `shadow-lg ${colors.glow}` : "opacity-75"
              }`}
            >
              {/* Locked overlay */}
              {!isEarned && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30 rounded-xl backdrop-blur-[1px]">
                  <Lock className="h-6 w-6 text-slate-500" />
                </div>
              )}

              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    isEarned
                      ? `bg-gradient-to-br ${colors.bg.replace("/20", "/40")}`
                      : "bg-slate-800"
                  }`}
                >
                  <IconComponent
                    className={`h-6 w-6 ${isEarned ? colors.text : "text-slate-500"}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold ${isEarned ? "text-white" : "text-slate-400"}`}>
                    {badge.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                    {badge.description}
                  </p>
                </div>
              </div>

              {/* Progress bar for locked badges */}
              {!isEarned && progress > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">Progress</span>
                    <span className={colors.text}>{progress}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${colors.bg.replace("/20", "")}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Points badge */}
              <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/30 text-xs">
                <Star className="h-3 w-3 text-amber-400" />
                <span className="text-amber-400">{badge.points}</span>
              </div>

              {/* Earned date */}
              {isEarned && earnedAt && (
                <p className="text-xs text-slate-500 mt-3">
                  Earned {new Date(earnedAt).toLocaleDateString("en-GB")}
                </p>
              )}

              {/* Rarity indicator */}
              <div
                className={`absolute bottom-2 right-2 text-xs uppercase tracking-wide ${colors.text}`}
              >
                {badge.rarity}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Mini badge display for dashboard
 */
export function BadgeShowcase({ limit = 3 }: { limit?: number }) {
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentBadges();
  }, []);

  const fetchRecentBadges = async () => {
    try {
      const response = await fetch("/api/badges");
      const data = await response.json();
      // Get most recent earned badges
      const earned = data.badges
        .filter((b: UserBadge) => b.isEarned)
        .sort(
          (a: UserBadge, b: UserBadge) =>
            new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime()
        )
        .slice(0, limit);
      setBadges(earned);
    } catch (error) {
      console.error("Error fetching badges:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || badges.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {badges.map((userBadge) => {
        const IconComponent = ICON_MAP[userBadge.badge.icon] || Award;
        const colors = RARITY_COLORS[userBadge.badge.rarity];
        return (
          <div
            key={userBadge.badge.id}
            title={userBadge.badge.name}
            className={`p-1.5 rounded-lg bg-gradient-to-br ${colors.bg} border ${colors.border}`}
          >
            <IconComponent className={`h-4 w-4 ${colors.text}`} />
          </div>
        );
      })}
    </div>
  );
}
