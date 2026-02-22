"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Send,
  Sparkles,
  Scale,
  Gavel,
  Clock,
  Shield,
  FileText,
  MessageSquare,
  ChevronRight,
} from "lucide-react";

type PathOption = {
  id: string;
  mode: "QUICK" | "GUIDED";
  tier: "TIER_1_SIMPLE" | "TIER_2_ADR" | "TIER_3_COURT";
  redirect: "wizard" | "case";
};

const PATHS: Record<string, PathOption> = {
  quick_letter: { id: "quick_letter", mode: "QUICK", tier: "TIER_1_SIMPLE", redirect: "wizard" },
  ai_guided: { id: "ai_guided", mode: "GUIDED", tier: "TIER_1_SIMPLE", redirect: "case" },
  escalate: { id: "escalate", mode: "GUIDED", tier: "TIER_2_ADR", redirect: "case" },
  court: { id: "court", mode: "GUIDED", tier: "TIER_3_COURT", redirect: "case" },
};

export default function StartDisputePage() {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleSelect = async (pathId: string) => {
    const path = PATHS[pathId];
    if (!path || loadingId) return;

    setLoadingId(pathId);

    try {
      const res = await fetch("/api/disputes/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: path.mode, tier: path.tier }),
      });

      if (!res.ok) throw new Error("Failed to start");

      const data = await res.json();
      router.push(`/disputes/${data.id}/${path.redirect}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
      setLoadingId(null);
    }
  };

  return (
    <div className="sm:-mx-6 lg:-mx-8 lg:-my-8 min-h-screen flex flex-col">

      {/* Top section — header with gradient that fills the width */}
      <div className="bg-gradient-to-b from-blue-600 to-blue-700 px-4 pb-20 pt-12 sm:px-6 sm:pt-16 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            What do you need?
          </h1>
          <p className="mt-2 text-base text-blue-200">
            Pick the option that fits — you can always change later.
          </p>
        </div>
      </div>

      {/* Cards section — pulls up into the blue */}
      <div className="flex-1 bg-[#f5f5f5] px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto -mt-14 max-w-2xl space-y-3">

          {/* Quick Letter — primary CTA */}
          <button
            onClick={() => handleSelect("quick_letter")}
            disabled={!!loadingId}
            className="group relative w-full overflow-hidden rounded-2xl bg-white p-5 text-left shadow-lg ring-1 ring-black/[0.04] transition-all hover:shadow-xl hover:ring-blue-200 disabled:opacity-60"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-md shadow-blue-600/25">
                <Send className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-base font-bold text-slate-900">Quick Letter</h2>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                    Fastest
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-slate-500">
                  Complaint, refund, or demand letter — done in minutes
                </p>
              </div>
              <div className="hidden items-center gap-3 sm:flex">
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span>~5 min</span>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-500" />
              </div>
            </div>
            {loadingId === "quick_letter" && <LoadingOverlay />}
          </button>

          {/* AI Case Worker */}
          <button
            onClick={() => handleSelect("ai_guided")}
            disabled={!!loadingId}
            className="group relative w-full overflow-hidden rounded-2xl bg-white p-5 text-left shadow-lg ring-1 ring-black/[0.04] transition-all hover:shadow-xl hover:ring-violet-200 disabled:opacity-60"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-slate-900">AI Case Worker</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Describe your issue — AI picks the best path, docs, and strategy
                </p>
              </div>
              <div className="hidden items-center gap-3 sm:flex">
                <div className="flex flex-col items-end gap-0.5">
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Chat
                  </div>
                  <span className="text-xs text-slate-400">~15 min</span>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-violet-500" />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["Analyses your rights", "Picks the right docs", "Builds your case"].map((t) => (
                <span key={t} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
                  {t}
                </span>
              ))}
            </div>
            {loadingId === "ai_guided" && <LoadingOverlay />}
          </button>

          {/* Escalate */}
          <button
            onClick={() => handleSelect("escalate")}
            disabled={!!loadingId}
            className="group relative w-full overflow-hidden rounded-2xl bg-white p-5 text-left shadow-lg ring-1 ring-black/[0.04] transition-all hover:shadow-xl hover:ring-amber-200 disabled:opacity-60"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <Scale className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-slate-900">Escalate to Ombudsman</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Already complained? Send an LBA, ombudsman complaint, or formal dispute
                </p>
              </div>
              <div className="hidden items-center gap-3 sm:flex">
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-xs text-slate-400">4–12 weeks</span>
                  <span className="text-xs text-slate-400">Usually free</span>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-amber-500" />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["Letter Before Action", "Financial Ombudsman", "Subject Access Request"].map((t) => (
                <span key={t} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
                  {t}
                </span>
              ))}
            </div>
            {loadingId === "escalate" && <LoadingOverlay />}
          </button>

          {/* Court / Tribunal */}
          <button
            onClick={() => handleSelect("court")}
            disabled={!!loadingId}
            className="group relative w-full overflow-hidden rounded-2xl bg-white p-5 text-left shadow-lg ring-1 ring-black/[0.04] transition-all hover:shadow-xl hover:ring-red-200 disabled:opacity-60"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <Gavel className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-slate-900">Court or Tribunal</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  File a formal claim — small claims, employment tribunal, or county court
                </p>
              </div>
              <div className="hidden items-center gap-3 sm:flex">
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-xs text-slate-400">3–18 months</span>
                  <span className="text-xs text-slate-400">£35–£10k+</span>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-red-500" />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["County Court (N1)", "Employment Tribunal (ET1)", "Small Claims"].map((t) => (
                <span key={t} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
                  {t}
                </span>
              ))}
            </div>
            {loadingId === "court" && <LoadingOverlay />}
          </button>

          {/* Bottom hint */}
          <div className="flex items-center justify-center gap-2 pt-4 text-sm text-slate-400">
            <FileText className="h-4 w-4" />
            <span>
              Not sure?{" "}
              <button onClick={() => handleSelect("ai_guided")} className="font-medium text-blue-600 hover:underline">
                AI Case Worker
              </button>{" "}
              will figure it out for you.
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}

function LoadingOverlay() {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-white/80 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500/30 border-t-blue-600" />
        Starting...
      </div>
    </div>
  );
}
