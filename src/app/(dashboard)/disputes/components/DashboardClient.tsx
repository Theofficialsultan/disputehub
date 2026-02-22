"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  FileText,
  MessageSquare,
  Upload,
  Zap,
  CheckCircle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  Plus,
  Scale,
  Shield,
  Gavel,
  BookOpen,
  ArrowRight,
  AlertTriangle,
  Eye,
  Send,
  Landmark,
  ScrollText,
  BadgeCheck,
  X,
  Megaphone,
  ExternalLink,
} from "lucide-react";

interface Deadline {
  id: string;
  title: string;
  date: Date;
}

interface DashboardData {
  stats: {
    totalCases: number;
    activeCases: number;
    completedDocuments: number;
    upcomingDeadlines: number;
  };
  user: {
    firstName: string | null;
    lastName: string | null;
  };
  deadlines: Deadline[];
}

// ========== ANIMATED COUNTER ==========
function AnimatedNumber({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    let startTime: number;
    const startValue = displayValue;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setDisplayValue(Math.floor(startValue + (value - startValue) * progress));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);
  return <span>{displayValue}</span>;
}

// ========== CASE ACTIVITY CHART - Paired thick rounded bars ==========
function CaseActivityChart() {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const newCases =   [30, 50, 65, 74, 80, 42, 22];
  const resolved =   [20, 35, 42, 58, 52, 30, 15];
  const today = new Date().getDay();

  return (
    <div>
      <div className="flex items-end justify-between gap-1 sm:gap-[10px] h-[140px] sm:h-[180px] px-1 pt-2">
        {days.map((day, i) => {
          const isToday = i === today;
          const n = newCases[i];
          const r = resolved[i];
          return (
            <div key={i} className="flex flex-col items-center gap-1 sm:gap-2 flex-1">
              {n >= 70 && (
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-600">{n}%</span>
              )}
              <div className="flex items-end gap-[2px] sm:gap-[3px] w-full justify-center">
                <div
                  className={`w-2 sm:w-[16px] rounded-t-[4px] sm:rounded-t-[6px] transition-all duration-700 ${isToday ? 'bg-blue-700' : 'bg-blue-600'}`}
                  style={{ height: `${n * 1.2}px` }}
                />
                <div
                  className={`w-2 sm:w-[16px] rounded-t-[4px] sm:rounded-t-[6px] transition-all duration-700 ${isToday ? 'bg-blue-400' : 'bg-blue-300'}`}
                  style={{ height: `${r * 1.2}px` }}
                />
              </div>
              <span className={`text-[10px] sm:text-[11px] font-medium ${isToday ? 'text-blue-600 font-semibold' : 'text-slate-400'}`}>{day}</span>
            </div>
          );
        })}
      </div>
      {/* Chart legend */}
      <div className="flex items-center gap-5 mt-4 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blue-600" />
          <span className="text-[11px] text-slate-500">New Cases</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blue-300" />
          <span className="text-[11px] text-slate-500">Resolved</span>
        </div>
      </div>
    </div>
  );
}

// ========== RESOLUTION RATE - Donut chart ==========
function ResolutionChart({ percentage }: { percentage: number }) {
  const circumference = 2 * Math.PI * 52;
  const resolvedArc = (percentage / 100) * circumference;
  const activeArc = (22 / 100) * circumference;

  return (
    <div className="relative w-[160px] h-[160px] mx-auto">
      <svg className="w-[160px] h-[160px] -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="52" stroke="#f1f5f9" strokeWidth="14" fill="none" />
        <circle cx="60" cy="60" r="52" stroke="#fbbf24" strokeWidth="14" fill="none"
          strokeDasharray={`${((100 - percentage - 22) / 100) * circumference} ${circumference - ((100 - percentage - 22) / 100) * circumference}`}
          strokeDashoffset={-(resolvedArc + activeArc)} />
        <circle cx="60" cy="60" r="52" stroke="#60a5fa" strokeWidth="14" fill="none"
          strokeDasharray={`${activeArc} ${circumference - activeArc}`}
          strokeDashoffset={-resolvedArc} />
        <circle cx="60" cy="60" r="52" stroke="#2563eb" strokeWidth="14" fill="none"
          strokeLinecap="round"
          strokeDasharray={`${resolvedArc} ${circumference - resolvedArc}`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[36px] font-bold text-slate-900 leading-none">{percentage}%</span>
        <span className="text-[11px] text-slate-400 mt-1">Resolved</span>
      </div>
    </div>
  );
}

// ========== CAROUSEL SLIDES ==========
const carouselSlides = [
  {
    title: "AI-Powered Legal Documents",
    desc: "Generate court-ready Particulars of Claim, Witness Statements, and Letters Before Action in minutes.",
    cta: "Start a Case",
    href: "/disputes/start",
    gradient: "from-blue-600 to-indigo-700",
    icon: Scale,
  },
  {
    title: "Know Your Employment Rights",
    desc: "Unpaid wages? Unfair dismissal? Our AI guides you through the exact legal process step by step.",
    cta: "Learn More",
    href: "/ai-chat",
    gradient: "from-indigo-600 to-purple-700",
    icon: Shield,
  },
  {
    title: "Track Every Deadline",
    desc: "Never miss a limitation period or court filing date. Smart reminders keep your case on track.",
    cta: "View Timeline",
    href: "/timeline",
    gradient: "from-blue-700 to-blue-900",
    icon: Clock,
  },
  {
    title: "Upload Evidence Securely",
    desc: "Photos, emails, contracts, payslips -- upload and organise all evidence for your dispute.",
    cta: "Upload Now",
    href: "/upload-evidence",
    gradient: "from-sky-600 to-blue-700",
    icon: Upload,
  },
  {
    title: "Get Professional Legal Help",
    desc: "Connect with qualified UK solicitors for document review, consultations, or full court representation.",
    cta: "Find a Lawyer",
    href: "/lawyer",
    gradient: "from-purple-600 to-indigo-700",
    icon: Gavel,
  },
];

// ========== KNOW YOUR RIGHTS DATA ==========
const rightsAndLaws = [
  {
    category: "Employment",
    icon: BadgeCheck,
    color: "bg-blue-500",
    items: [
      { title: "Employment Rights Act 1996", desc: "Protection against unfair dismissal, right to written statement of terms, redundancy pay entitlements." },
      { title: "National Minimum Wage Act 1998", desc: "Employers must pay at least the minimum wage. Current rate: £11.44/hr (21+)." },
      { title: "Working Time Regulations 1998", desc: "Right to 28 days paid holiday, 48-hour max working week, rest breaks." },
    ],
  },
  {
    category: "Housing",
    icon: Landmark,
    color: "bg-emerald-500",
    items: [
      { title: "Landlord & Tenant Act 1985, s.11", desc: "Landlord must keep structure, exterior, and installations in repair. Cannot charge tenant for structural repairs." },
      { title: "Homes (Fitness for Habitation) Act 2018", desc: "Rental properties must be fit for human habitation throughout the tenancy." },
      { title: "Protection from Eviction Act 1977", desc: "Unlawful eviction is a criminal offence. Landlords must follow proper court procedures." },
    ],
  },
  {
    category: "Consumer",
    icon: Shield,
    color: "bg-purple-500",
    items: [
      { title: "Consumer Rights Act 2015", desc: "Goods must be of satisfactory quality, fit for purpose, and as described. 30-day refund right." },
      { title: "Consumer Contracts Regulations 2013", desc: "14-day cooling-off period for online/distance purchases. Right to full refund." },
      { title: "Equality Act 2010", desc: "Protection from discrimination in services, employment, and housing on protected characteristics." },
    ],
  },
  {
    category: "Upcoming Reforms",
    icon: ScrollText,
    color: "bg-amber-500",
    items: [
      { title: "Renters' Rights Bill 2025", desc: "Abolishes Section 21 'no-fault' evictions. Introduces new grounds for possession and a landlord ombudsman." },
      { title: "Employment Rights Bill 2025", desc: "Day-one unfair dismissal protection, ban on zero-hours contracts, stronger sick pay rights." },
      { title: "Digital Markets Act (UK)", desc: "New competition rules for Big Tech. Stronger consumer protections for digital services and subscriptions." },
    ],
  },
];

export default function DashboardClient({ stats, user, deadlines }: DashboardData) {
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [rightsModal, setRightsModal] = useState<typeof rightsAndLaws[number] | null>(null);

  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % carouselSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const completionPercentage = stats.totalCases > 0
    ? Math.round(((stats.totalCases - stats.activeCases) / stats.totalCases) * 100)
    : 0;

  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    return deadlines
      .filter((d) => new Date(d.date) > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }, [deadlines]);

  const nextDeadline = upcomingDeadlines[0];
  const nextDeadlineDate = nextDeadline ? new Date(nextDeadline.date) : null;

  const dotColors = ['bg-blue-500', 'bg-amber-500', 'bg-emerald-500', 'bg-rose-400', 'bg-purple-500'];

  // Quick actions (the "Team Collaboration" equivalent)
  const quickActions = [
    { icon: Zap, name: "Start New Dispute", desc: "AI-guided case builder", status: "Ready", statusBg: "bg-emerald-50 text-emerald-700", color: "bg-blue-600", href: "/disputes/start" },
    { icon: MessageSquare, name: "AI Legal Assistant", desc: "Ask any legal question", status: "Online", statusBg: "bg-blue-50 text-blue-700", color: "bg-indigo-600", href: "/ai-chat" },
    { icon: Upload, name: "Upload Evidence", desc: "Photos, emails, contracts", status: "Ready", statusBg: "bg-emerald-50 text-emerald-700", color: "bg-sky-600", href: "/upload-evidence" },
    { icon: FileText, name: "Document Library", desc: "View generated documents", status: "Active", statusBg: "bg-amber-50 text-amber-700", color: "bg-violet-600", href: "/documents" },
  ];

  return (
    <div className="space-y-0 sm:space-y-5 pb-8">
      {/* ========== TOP CAROUSEL ========== */}
      <div className="relative overflow-hidden sm:rounded-2xl">
        <div
          ref={carouselRef}
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${carouselIndex * 100}%)` }}
        >
          {carouselSlides.map((slide, i) => {
            const SlideIcon = slide.icon;
            return (
              <div
                key={i}
                className={`w-full flex-shrink-0 bg-gradient-to-r ${slide.gradient} sm:rounded-2xl p-6 sm:p-6 md:p-8 text-white relative overflow-hidden`}
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-12 translate-x-12" />

                <div className="relative z-10">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <SlideIcon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">DisputeHub</span>
                  </div>
                  <h2 className="text-[22px] sm:text-xl md:text-2xl font-bold leading-tight mb-2">{slide.title}</h2>
                  <p className="text-[15px] sm:text-sm text-white/70 leading-relaxed max-w-lg line-clamp-2">{slide.desc}</p>
                  <Link
                    href={slide.href}
                    className="inline-flex items-center gap-2 mt-4 px-6 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white text-[15px] font-semibold transition-all backdrop-blur-sm"
                  >
                    {slide.cta} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Carousel controls */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {carouselSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCarouselIndex(i)}
              className={`rounded-full transition-all ${
                i === carouselIndex ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/40'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => setCarouselIndex((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length)}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center text-white transition-all"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => setCarouselIndex((prev) => (prev + 1) % carouselSlides.length)}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center text-white transition-all"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Mobile inner padding wrapper */}
      <div className="px-5 sm:px-0 space-y-5 sm:space-y-5 pt-5 sm:pt-0">

      {/* ========== HEADER ROW ========== */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight leading-tight">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1 hidden sm:block">
            Manage your disputes, track deadlines, and resolve cases with AI.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/disputes/start"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold text-[15px] hover:bg-blue-700 transition-all"
          >
            <Plus className="h-5 w-5" />
            New Dispute
          </Link>
          <Link
            href="/upload-evidence"
            className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-700 font-semibold text-sm border border-slate-200 hover:bg-slate-50 transition-all"
          >
            Upload Evidence
          </Link>
        </div>
      </div>

      {/* ========== STATS ROW (4 cards) ========== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Cases - Blue filled */}
        <div className="bg-blue-600 rounded-2xl p-5 sm:p-5 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500 rounded-full -translate-y-4 translate-x-4 opacity-30" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-blue-100">Total Cases</p>
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <ArrowUpRight className="h-4 w-4 text-white" />
              </div>
            </div>
            <p className="text-4xl sm:text-[42px] font-bold leading-none tracking-tight">
              <AnimatedNumber value={stats.totalCases} />
            </p>
            <div className="flex items-center gap-1.5 mt-3">
              <TrendingUp className="h-4 w-4 text-blue-200" />
              <span className="text-xs text-blue-200">All time</span>
            </div>
          </div>
        </div>

        {/* Documents Generated */}
        <div className="bg-slate-50 sm:bg-white rounded-2xl sm:border sm:border-slate-200/80 p-5 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-500">Docs</p>
            <div className="w-8 h-8 rounded-lg bg-slate-100 sm:bg-slate-50 sm:border sm:border-slate-100 flex items-center justify-center">
              <ArrowUpRight className="h-4 w-4 text-slate-400" />
            </div>
          </div>
          <p className="text-4xl sm:text-[42px] font-bold text-slate-900 leading-none tracking-tight">
            <AnimatedNumber value={stats.completedDocuments} />
          </p>
          <div className="flex items-center gap-1.5 mt-3">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span className="text-xs text-slate-400">Ready</span>
          </div>
        </div>

        {/* Active Cases */}
        <div className="bg-slate-50 sm:bg-white rounded-2xl sm:border sm:border-slate-200/80 p-5 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-500">Active</p>
            <div className="w-8 h-8 rounded-lg bg-slate-100 sm:bg-slate-50 sm:border sm:border-slate-100 flex items-center justify-center">
              <ArrowUpRight className="h-4 w-4 text-slate-400" />
            </div>
          </div>
          <p className="text-4xl sm:text-[42px] font-bold text-slate-900 leading-none tracking-tight">
            <AnimatedNumber value={stats.activeCases} />
          </p>
          <div className="flex items-center gap-1.5 mt-3">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-slate-400">In progress</span>
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div className="bg-slate-50 sm:bg-white rounded-2xl sm:border sm:border-slate-200/80 p-5 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-500">Deadlines</p>
            <div className="w-8 h-8 rounded-lg bg-slate-100 sm:bg-slate-50 sm:border sm:border-slate-100 flex items-center justify-center">
              <ArrowUpRight className="h-4 w-4 text-slate-400" />
            </div>
          </div>
          <p className="text-4xl sm:text-[42px] font-bold text-slate-900 leading-none tracking-tight">
            <AnimatedNumber value={stats.upcomingDeadlines} />
          </p>
          <span className="text-xs text-slate-400 mt-3 block">Upcoming</span>
        </div>
      </div>

      {/* ========== MIDDLE ROW: Case Activity | Next Deadline | Active Cases ========== */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-0 sm:gap-4">
        {/* Case Activity Chart */}
        <div className="md:col-span-5 bg-white sm:rounded-2xl sm:border sm:border-slate-200/80 p-5 sm:p-6 border-b border-slate-100 sm:border-b-0">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-slate-900">Case Activity</h3>
            <select className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none">
              <option>This Week</option>
              <option>This Month</option>
            </select>
          </div>
          <CaseActivityChart />
        </div>

        {/* Next Deadline */}
        <div className="md:col-span-3 bg-white sm:rounded-2xl sm:border sm:border-slate-200/80 p-5 sm:p-6 flex flex-col border-b border-slate-100 sm:border-b-0">
          <h3 className="text-lg font-bold text-slate-900 mb-5">Next Deadline</h3>
          {nextDeadline ? (
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <h4 className="text-[17px] font-bold text-slate-900 leading-snug">{nextDeadline.title}</h4>
                <p className="text-sm text-slate-400 mt-2">
                  Due : {nextDeadlineDate?.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
                </p>
              </div>
              <Link
                href={`/disputes/${nextDeadline.id}/case`}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 mt-5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all w-full"
              >
                <Eye className="h-4 w-4" />
                View Case
              </Link>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <p className="text-base text-slate-600 font-medium">No deadlines</p>
              <p className="text-sm text-slate-400 mt-1">You&apos;re all caught up</p>
            </div>
          )}
        </div>

        {/* Sponsored Ad */}
        <div className="md:col-span-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 sm:rounded-2xl p-5 sm:p-6 border-b border-slate-100 sm:border-b-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -translate-y-8 translate-x-8" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full translate-y-8 -translate-x-8" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Megaphone className="h-3 w-3" /> Sponsored
              </span>
              <span className="text-[10px] text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full">Ad</span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Scale className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">LegalShield Pro</h3>
                <p className="text-sm text-slate-400">Professional legal cover</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed mb-5">
              Get unlimited legal consultations, document reviews, and court representation from £29.99/month. Trusted by 50,000+ UK users.
            </p>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex -space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 border-2 border-slate-900 flex items-center justify-center text-[9px] text-white font-bold">
                    {['J','S','M','A'][i]}
                  </div>
                ))}
              </div>
              <span className="text-xs text-slate-400">50,000+ members</span>
            </div>
            <a
              href="https://dispute-hub.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-blue-600/20"
            >
              Learn More <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {/* ========== BOTTOM ROW: Quick Actions | Resolution Rate | AI Assistant ========== */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-0 sm:gap-4">
        {/* Quick Actions */}
        <div className="md:col-span-5 bg-white sm:rounded-2xl sm:border sm:border-slate-200/80 p-5 sm:p-6 border-b border-slate-100 sm:border-b-0">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-slate-900">Quick Actions</h3>
            <Link
              href="/disputes/start"
              className="flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-white border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-all"
            >
              <Plus className="h-3 w-3" /> New
            </Link>
          </div>
          <div className="space-y-4">
            {quickActions.map((action, i) => (
              <Link key={i} href={action.href} className="flex items-center gap-4 group">
                <div className={`w-12 h-12 rounded-full ${action.color} flex items-center justify-center flex-shrink-0 ring-2 ring-white shadow-sm`}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{action.name}</p>
                  <p className="text-sm text-slate-400 truncate">{action.desc}</p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${action.statusBg} flex-shrink-0`}>{action.status}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Resolution Rate - Donut */}
        <div className="md:col-span-3 bg-white sm:rounded-2xl sm:border sm:border-slate-200/80 p-5 sm:p-6 border-b border-slate-100 sm:border-b-0">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Resolution Rate</h3>
          <ResolutionChart percentage={completionPercentage || 41} />
          <div className="flex items-center justify-center gap-5 mt-5">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span className="text-xs text-slate-500">Resolved</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              <span className="text-xs text-slate-500">Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-xs text-slate-500">Pending</span>
            </div>
          </div>
        </div>

        {/* AI Legal Assistant - Dark accent card */}
        <div className="md:col-span-4 bg-blue-900 sm:rounded-2xl p-5 sm:p-6 text-white relative overflow-hidden">
          <div className="absolute -bottom-20 -right-20"><div className="w-56 h-56 rounded-full border border-blue-700/30" /></div>
          <div className="absolute -bottom-14 -right-14"><div className="w-44 h-44 rounded-full border border-blue-700/40" /></div>
          <div className="absolute -bottom-8 -right-8"><div className="w-32 h-32 rounded-full border border-blue-700/50" /></div>
          <div className="absolute -bottom-2 -right-2"><div className="w-20 h-20 rounded-full border border-blue-700/60" /></div>

          <div className="relative z-10 h-full flex flex-col min-h-[200px]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-[15px] font-bold text-white/90">AI Legal Assistant</h3>
            </div>
            <p className="text-[12px] text-blue-300 leading-relaxed mb-auto">
              Get instant guidance on employment law, housing disputes, consumer rights, and court procedures.
            </p>

            <div className="flex items-center justify-center gap-4 mt-6">
              <Link
                href="/ai-chat"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all"
              >
                <MessageSquare className="h-4 w-4" /> Ask a Question
              </Link>
            </div>

            <div className="flex items-center justify-center gap-4 mt-3">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] text-slate-400">Online</span>
              </div>
              <span className="text-[11px] text-slate-500">|</span>
              <span className="text-[11px] text-slate-400">24/7 Available</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========== FIND A LAWYER ========== */}
      <div className="bg-white sm:rounded-2xl sm:border sm:border-slate-200/80 overflow-hidden border-b border-t border-slate-100 sm:border-t-0 sm:border-b-0">
        <div className="grid grid-cols-1 md:grid-cols-5">
          {/* Left content */}
          <div className="md:col-span-3 p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <Gavel className="h-4 w-4 text-purple-600" />
              </div>
              <h3 className="text-[15px] font-bold text-slate-900">Need Professional Legal Help?</h3>
            </div>
            <p className="text-[13px] text-slate-500 leading-relaxed mb-5">
              Connect with 500+ qualified UK solicitors for document reviews, legal consultations, or full court representation. All lawyers are SRA regulated and vetted.
            </p>
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="text-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[20px] font-bold text-slate-900">£49</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Doc Review</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-blue-50 border border-blue-100">
                <p className="text-[20px] font-bold text-blue-600">£99</p>
                <p className="text-[10px] text-blue-500 mt-0.5">Consultation</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[20px] font-bold text-slate-900">Custom</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Representation</p>
              </div>
            </div>
            <Link
              href="/lawyer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all"
            >
              <Scale className="h-4 w-4" /> Find a Lawyer <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Right features */}
          <div className="md:col-span-2 bg-slate-50 p-4 sm:p-6 flex flex-col justify-center md:border-l border-t md:border-t-0 border-slate-100">
            <div className="space-y-4">
              {[
                { icon: Shield, label: "SRA Regulated", desc: "All solicitors verified" },
                { icon: Clock, label: "Matched in <24hrs", desc: "Fast lawyer matching" },
                { icon: CheckCircle, label: "89% Success Rate", desc: "Proven track record" },
                { icon: Send, label: "Seamless Handoff", desc: "AI docs shared instantly" },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-slate-900">{item.label}</p>
                      <p className="text-[11px] text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ========== KNOW YOUR RIGHTS ========== */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Know Your Rights</h3>
              <p className="text-xs text-slate-400">UK laws, rights, and upcoming policy reforms</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {rightsAndLaws.map((section, si) => {
            const SectionIcon = section.icon;
            const mobileGradients = [
              "from-blue-500 to-indigo-600",
              "from-emerald-500 to-teal-600",
              "from-purple-500 to-pink-600",
              "from-amber-500 to-orange-600",
            ];
            return (
              <button
                key={si}
                onClick={() => setRightsModal(section)}
                className={`text-left sm:bg-white sm:rounded-2xl sm:border sm:border-slate-200/80 sm:p-5 
                  bg-gradient-to-br ${mobileGradients[si]} sm:bg-none rounded-2xl p-4 sm:p-5
                  transition-all active:scale-[0.98] sm:hover:border-blue-200 sm:hover:shadow-lg`}
              >
                <div className="flex items-center gap-2.5 mb-3 sm:mb-4">
                  <div className={`w-10 h-10 rounded-xl sm:rounded-lg ${section.color} sm:${section.color} bg-white/20 sm:bg-opacity-100 flex items-center justify-center`}>
                    <SectionIcon className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="text-sm font-bold text-white sm:text-slate-900">{section.category}</h4>
                </div>
                <p className="text-xs text-white/80 sm:text-slate-400 line-clamp-2 leading-relaxed">
                  {section.items[0].title}
                </p>
                <div className="flex items-center gap-1 mt-3 text-white/70 sm:text-blue-600">
                  <span className="text-xs font-semibold">Tap to learn more</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
                {/* Desktop: show full items */}
                <div className="hidden sm:block mt-3 space-y-3">
                  {section.items.map((item, ii) => (
                    <div key={ii} className="group">
                      <p className="text-[13px] font-semibold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-400 leading-relaxed mt-0.5">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========== KNOW YOUR RIGHTS MODAL ========== */}
      {rightsModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setRightsModal(null)} />
          <div className="relative z-10 w-full sm:max-w-lg mx-0 sm:mx-4 bg-white rounded-t-3xl sm:rounded-2xl max-h-[85vh] overflow-y-auto animate-slide-up">
            {/* Header */}
            <div className={`sticky top-0 bg-gradient-to-r ${
              rightsModal.category === "Employment" ? "from-blue-500 to-indigo-600" :
              rightsModal.category === "Housing" ? "from-emerald-500 to-teal-600" :
              rightsModal.category === "Consumer" ? "from-purple-500 to-pink-600" :
              "from-amber-500 to-orange-600"
            } p-6 rounded-t-3xl sm:rounded-t-2xl`}>
              <button
                onClick={() => setRightsModal(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <rightsModal.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{rightsModal.category} Rights</h2>
                  <p className="text-sm text-white/70">UK Law Overview</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {rightsModal.items.map((item, i) => (
                <div key={i} className="border-b border-slate-100 pb-5 last:border-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg ${rightsModal.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <span className="text-white text-sm font-bold">{i + 1}</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">{item.title}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed mt-2">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}

              <Link
                href="/ai-chat"
                onClick={() => setRightsModal(null)}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all"
              >
                <MessageSquare className="h-4 w-4" /> Ask AI About This
              </Link>
            </div>
          </div>
        </div>
      )}

      </div>{/* close mobile padding wrapper */}
    </div>
  );
}
