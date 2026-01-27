"use client";

import Link from "next/link";
import {
  Sparkles,
  FileText,
  MessageSquare,
  Upload,
  Brain,
  Zap,
  TrendingUp,
  CheckCircle,
  Clock,
  BarChart3,
  Activity,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardData {
  stats: {
    totalCases: number;
    activeCases: number;
    completedDocuments: number;
    upcomingDeadlines: number;
  };
}

function AIAssistantCard({
  title,
  description,
  icon: Icon,
  href,
  gradient,
  iconBg,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  gradient: string;
  iconBg: string;
}) {
  return (
    <Link
      href={href}
      className={`group relative overflow-hidden rounded-3xl p-6 glass-strong hover:glow-purple transition-all duration-500 border border-indigo-500/20 cursor-pointer`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      
      <div className="relative z-10 space-y-4">
        <div className={`p-4 rounded-2xl bg-gradient-to-br ${iconBg} w-fit`}>
          <Icon className="h-8 w-8 text-white" />
        </div>
        
        <div>
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            {description}
          </p>
        </div>
        
        <div className="flex items-center text-indigo-400 group-hover:text-indigo-300 transition-colors">
          <span className="text-sm font-medium">Get Started</span>
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}

export default function DashboardClient({ stats }: DashboardData) {
  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="text-4xl">👋</div>
          <div>
            <p className="text-slate-400 text-lg">Hello, Charles!</p>
            <h1 className="text-5xl font-bold text-white bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              How can I assist you today?
            </h1>
          </div>
        </div>
      </div>

      {/* AI Assistant Options */}
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Brain className="h-6 w-6 text-indigo-400" />
          <h2 className="text-2xl font-bold text-white">AI Case Worker</h2>
          <Sparkles className="h-5 w-5 text-purple-400" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <AIAssistantCard
            title="New Dispute Case"
            description="Start a new dispute case with AI-guided assistance. Get help documenting your issue and generating legal documents."
            icon={FileText}
            href="/disputes/start"
            gradient="from-indigo-600/10 to-purple-600/10"
            iconBg="from-indigo-500 to-purple-600"
          />
          
          <AIAssistantCard
            title="Chat with AI"
            description="Have a conversation with our AI assistant about your legal dispute. Get instant answers and guidance."
            icon={MessageSquare}
            href="/ai-chat"
            gradient="from-purple-600/10 to-pink-600/10"
            iconBg="from-purple-500 to-pink-600"
          />
          
          <AIAssistantCard
            title="Upload Evidence"
            description="Upload documents, photos, or other evidence for your case. AI will analyze and organize them for you."
            icon={Upload}
            href="/upload-evidence"
            gradient="from-cyan-600/10 to-blue-600/10"
            iconBg="from-cyan-500 to-blue-600"
          />
        </div>
      </div>

      {/* Stats Overview */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Overview</h2>
        
        {/* Large Stats Grid - 3 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Total Cases with Insights */}
          <div className="group relative overflow-hidden rounded-3xl p-8 glass-strong hover:glow-purple transition-all duration-500 border border-indigo-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-purple-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 glow-purple">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-400 font-medium">Total Cases</p>
                  <p className="text-4xl font-bold text-white">{stats.totalCases}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                    <span className="text-sm text-slate-300">Consumer Rights</span>
                  </div>
                  <span className="text-sm font-semibold text-white">45%</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                    <span className="text-sm text-slate-300">Employment</span>
                  </div>
                  <span className="text-sm font-semibold text-white">30%</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                    <span className="text-sm text-slate-300">Other</span>
                  </div>
                  <span className="text-sm font-semibold text-white">25%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Deadlines Calendar */}
          <div className="group relative overflow-hidden rounded-3xl p-8 glass-strong hover:glow-purple transition-all duration-500 border border-indigo-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 via-red-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-400 font-medium">Deadlines</p>
                  <p className="text-4xl font-bold text-white">{stats.upcomingDeadlines}</p>
                </div>
              </div>
              
              {/* Mini Calendar */}
              <div className="space-y-3">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                    <div key={i} className="text-center text-xs text-slate-500 font-medium">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 35 }, (_, i) => {
                    const day = i - 5;
                    const isToday = day === 15;
                    const hasDeadline = [18, 22, 28].includes(day);
                    const isPast = day < 15;
                    
                    return (
                      <div
                        key={i}
                        className={`aspect-square flex items-center justify-center text-xs rounded-lg transition-all ${
                          day < 1 || day > 31
                            ? 'text-transparent'
                            : isToday
                            ? 'bg-indigo-500 text-white font-bold'
                            : hasDeadline
                            ? 'bg-orange-500/20 text-orange-300 font-semibold border border-orange-500/30'
                            : isPast
                            ? 'text-slate-600'
                            : 'text-slate-400 hover:bg-slate-700/30'
                        }`}
                      >
                        {day > 0 && day <= 31 ? day : ''}
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 pt-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded bg-indigo-500"></div>
                    <span className="text-slate-400">Today</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded bg-orange-500"></div>
                    <span className="text-slate-400">Deadline</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lawyer Updates */}
          <div className="group relative overflow-hidden rounded-3xl p-8 glass-strong hover:glow-purple transition-all duration-500 border border-indigo-500/20">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 via-teal-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-400 font-medium">Lawyer Updates</p>
                  <p className="text-4xl font-bold text-white">2</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center text-white text-xs font-bold">
                      JD
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white mb-1">John Davis</p>
                      <p className="text-xs text-slate-400 mb-2">Reviewed Case #1234</p>
                      <p className="text-xs text-slate-300">Your case has strong merit. Proceeding to next phase.</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold">
                      SM
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white mb-1">Sarah Miller</p>
                      <p className="text-xs text-slate-400 mb-2">Documents Ready</p>
                      <p className="text-xs text-slate-300">All documents signed and ready for submission.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-3xl p-8 glass-strong border border-indigo-500/20 text-center">
        <Zap className="h-12 w-12 text-indigo-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">Ready to get started?</h3>
        <p className="text-slate-400 mb-6">
          View all your cases or create a new dispute with AI assistance
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-2xl border-indigo-500/30 text-white hover:bg-indigo-500/10"
          >
            <Link href="/cases">
              View All Cases
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-indigo-500/25 rounded-2xl"
          >
            <Link href="/disputes/start">
              <FileText className="mr-2 h-5 w-5" />
              New Dispute
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
