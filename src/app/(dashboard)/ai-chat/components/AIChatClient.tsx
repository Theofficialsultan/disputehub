"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  FileText,
  Clock,
  Sparkles,
  TrendingUp,
  MessageCircle,
  AlertCircle,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { CaseLifecycleStatus } from "@prisma/client";

interface Dispute {
  id: string;
  title: string;
  type: string;
  lifecycleStatus: CaseLifecycleStatus;
  waitingUntil: Date | null;
  strategyLocked: boolean;
  documentPlan: {
    documents: Array<{
      status: string;
    }>;
  } | null;
}

interface AIChatClientProps {
  disputes: Dispute[];
  userName: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

function AnimatedOrb() {
  return (
    <div className="relative w-64 h-64 mx-auto">
      {/* Outer glow rings */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 animate-pulse blur-3xl" />
      <div className="absolute inset-4 rounded-full bg-gradient-to-br from-cyan-500/30 via-blue-500/30 to-indigo-500/30 animate-pulse blur-2xl" style={{ animationDelay: "0.5s" }} />
      
      {/* Main orb */}
      <div className="absolute inset-8 rounded-full overflow-hidden shadow-2xl shadow-indigo-500/50">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 via-blue-400 to-indigo-400 opacity-80" />
        
        {/* Animated gradient overlays */}
        <div 
          className="absolute inset-0 bg-gradient-to-tr from-purple-400 via-pink-400 to-transparent opacity-60 animate-spin-slow"
          style={{ animationDuration: "8s" }}
        />
        <div 
          className="absolute inset-0 bg-gradient-to-bl from-transparent via-cyan-300 to-blue-400 opacity-50 animate-spin-slow"
          style={{ animationDuration: "12s", animationDirection: "reverse" }}
        />
        
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent animate-shimmer" />
        
        {/* Inner highlight */}
        <div className="absolute top-1/4 left-1/4 w-1/3 h-1/3 bg-white/30 rounded-full blur-2xl" />
        
        {/* Bottom accent */}
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-pink-400 via-purple-400 to-transparent opacity-60" />
      </div>

      {/* Sparkle particles */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-ping" style={{ animationDelay: "0s" }} />
      <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-cyan-300 rounded-full animate-ping" style={{ animationDelay: "1s" }} />
      <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-purple-300 rounded-full animate-ping" style={{ animationDelay: "2s" }} />
    </div>
  );
}

function SuggestionBox({
  icon: Icon,
  title,
  description,
  gradient,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl p-6 bg-white/90 backdrop-blur-xl border border-slate-200/60 hover:border-slate-300 transition-all duration-300 text-left hover:scale-105 shadow-sm hover:shadow-md"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
      
      <div className="relative z-10 space-y-3">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        
        <div>
          <h3 className="font-semibold text-slate-900 text-lg mb-1 group-hover:text-blue-600 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-slate-500 group-hover:text-slate-600 transition-colors">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-2 text-blue-600 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-2">
          <span className="text-sm font-medium">Start conversation</span>
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </button>
  );
}

function ChatMessage({ message }: { message: Message }) {
  return (
    <div className={`flex gap-4 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
      <div className="w-10 h-10 rounded-xl bg-blue-600 shadow-sm flex items-center justify-center text-white font-semibold shrink-0">
        {message.role === "assistant" ? <Sparkles className="h-5 w-5" /> : "You"}
      </div>
      <div className={`flex-1 ${message.role === "user" ? "text-right" : ""}`}>
        <div
          className={`inline-block p-4 max-w-[80%] ${
            message.role === "assistant"
              ? "bg-white text-slate-800 rounded-2xl rounded-tl-md border border-slate-200 shadow-sm"
              : "bg-blue-600 text-white rounded-2xl rounded-tr-md shadow-sm"
          }`}
        >
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

export default function AIChatClient({ disputes, userName }: AIChatClientProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Generate suggestion boxes based on user's cases
  const suggestions = [];

  // Case review suggestion
  if (disputes.length > 0 && !disputes[0].strategyLocked) {
    suggestions.push({
      icon: FileText,
      title: `${userName}, want to review your case?`,
      description: `Let's review "${disputes[0].title}" and discuss your options.`,
      gradient: "from-indigo-500 to-purple-500",
      prompt: `I want to review my case "${disputes[0].title}". Can you help me understand where we are and what the next steps should be?`,
    });
  }

  // Deadline warning suggestion
  const upcomingDeadline = disputes.find(
    (d) => d.waitingUntil && new Date(d.waitingUntil) > new Date() && 
    new Date(d.waitingUntil).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000
  );
  if (upcomingDeadline) {
    const daysRemaining = Math.ceil(
      (new Date(upcomingDeadline.waitingUntil!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    suggestions.push({
      icon: Clock,
      title: "Upcoming deadline nearby!",
      description: `You have ${daysRemaining} days left for "${upcomingDeadline.title}". Let's prepare.`,
      gradient: "from-orange-500 to-red-500",
      prompt: `I have an upcoming deadline in ${daysRemaining} days for "${upcomingDeadline.title}". What should I do to prepare?`,
    });
  }

  // Document status suggestion
  const caseWithPendingDocs = disputes.find(
    (d) => d.documentPlan?.documents.some((doc) => doc.status === "COMPLETED")
  );
  if (caseWithPendingDocs) {
    const completedCount = caseWithPendingDocs.documentPlan?.documents.filter(
      (d) => d.status === "COMPLETED"
    ).length || 0;
    suggestions.push({
      icon: CheckCircle,
      title: "Your documents are ready!",
      description: `${completedCount} documents for "${caseWithPendingDocs.title}" are ready to review.`,
      gradient: "from-emerald-500 to-teal-500",
      prompt: `My documents for "${caseWithPendingDocs.title}" are ready. Can you explain what I should do with them?`,
    });
  }

  // Strategy help suggestion
  if (disputes.some((d) => !d.strategyLocked)) {
    const draftCase = disputes.find((d) => !d.strategyLocked);
    suggestions.push({
      icon: TrendingUp,
      title: "Need help building your case?",
      description: `Let's strengthen your case strategy for "${draftCase?.title}".`,
      gradient: "from-cyan-500 to-blue-500",
      prompt: `I need help building a stronger case for "${draftCase?.title}". What information do you need from me?`,
    });
  }

  // General help suggestion (always show)
  suggestions.push({
    icon: MessageCircle,
    title: "General legal assistance",
    description: "Ask me anything about your cases, legal processes, or next steps.",
    gradient: "from-purple-500 to-pink-500",
    prompt: "I have some questions about my legal situation. Can you help me understand my options?",
  });

  const handleSuggestionClick = (prompt: string) => {
    sendMessage(prompt);
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I'd be happy to help you with that, ${userName}. Let me analyze your case and provide you with detailed guidance. Based on what you've told me, I can see several important considerations we should discuss...`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] lg:min-h-[calc(100vh-8rem)] -mt-16 pt-2 lg:mt-0 lg:pt-0 flex flex-col bg-gradient-to-br from-[#f8faff] via-[#eef2ff] to-[#e0e7ff] px-4 sm:px-0">
      {/* Show suggestions only when no messages */}
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-8 sm:space-y-12 py-6 sm:py-12">
          {/* Animated Orb */}
          <div className="relative scale-75 sm:scale-100">
            <AnimatedOrb />
            <div className="text-center mt-6 sm:mt-8">
              <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-2 sm:mb-3">
                AI Legal Assistant
              </h1>
              <p className="text-slate-500 text-base sm:text-lg">
                How can I help you today, {userName}?
              </p>
            </div>
          </div>

          {/* Suggestion Boxes */}
          <div className="w-full max-w-5xl px-0 sm:px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {suggestions.slice(0, 3).map((suggestion, index) => (
                <SuggestionBox
                  key={index}
                  icon={suggestion.icon}
                  title={suggestion.title}
                  description={suggestion.description}
                  gradient={suggestion.gradient}
                  onClick={() => handleSuggestionClick(suggestion.prompt)}
                />
              ))}
            </div>
            
            {/* Additional suggestions */}
            {suggestions.length > 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 max-w-3xl mx-auto">
                {suggestions.slice(3).map((suggestion, index) => (
                  <SuggestionBox
                    key={index + 3}
                    icon={suggestion.icon}
                    title={suggestion.title}
                    description={suggestion.description}
                    gradient={suggestion.gradient}
                    onClick={() => handleSuggestionClick(suggestion.prompt)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Chat Messages */
        <div className="flex-1 overflow-y-auto py-8 px-4 space-y-6 max-w-4xl mx-auto w-full">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isLoading && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600 shadow-sm flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="inline-block p-4 rounded-2xl rounded-tl-md bg-white border border-slate-200 shadow-sm">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                    <div className="w-2 h-2 bg-blue-300 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                    <div className="w-2 h-2 bg-blue-200 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input Area - Always visible */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-xl border-t border-slate-200/60 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:pb-4 px-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your legal rights..."
              className="bg-white border border-slate-200 text-slate-900 placeholder:text-slate-500 resize-none pr-14 min-h-[52px] sm:min-h-[80px] focus:border-slate-400 rounded-2xl text-base"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              size="icon"
              className="absolute right-3 bottom-3 h-10 w-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white border-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
          <p className="text-xs text-slate-500 text-center mt-2 hidden sm:block">
            Press Enter to send • Shift + Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
