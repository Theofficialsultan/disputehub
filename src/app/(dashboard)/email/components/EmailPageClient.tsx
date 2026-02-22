"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Send,
  Inbox,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  RefreshCw,
  Loader2,
  Plus,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Clock,
  ChevronRight,
  ChevronDown,
  Paperclip,
  Eye,
  Filter,
  Settings,
  FileText,
  X,
  ExternalLink,
  Edit3,
  ArrowRight,
  Zap,
  MailOpen,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmailComposer } from "@/components/email/EmailComposer";
import { toast } from "sonner";

interface EmailAccount {
  id: string;
  provider: string;
  email: string;
  lastSyncAt: string | null;
  createdAt: string;
}

interface EmailMsg {
  id: string;
  direction: string;
  senderEmail: string;
  senderName: string | null;
  recipientEmail: string;
  recipientName: string | null;
  subject: string;
  snippet: string | null;
  receivedAt: string;
  isRead: boolean;
  hasAttachments: boolean;
  threadId: string | null;
  aiAnalysis: any;
  emailAccount: { email: string; provider: string };
  dispute: { id: string; title: string; type: string } | null;
}

interface EmailDraftItem {
  id: string;
  recipientEmail: string;
  recipientName: string | null;
  subject: string;
  body: string;
  bodyHtml: string | null;
  emailType: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
  lastError: string | null;
  dispute: { id: string; title: string } | null;
  emailAccount: { email: string; provider: string } | null;
}

interface CaseItem {
  id: string;
  title: string;
  type: string;
  lifecycleStatus: string;
}

interface EmailPageClientProps {
  accounts: EmailAccount[];
  messages: EmailMsg[];
  drafts: EmailDraftItem[];
  cases: CaseItem[];
  stats: {
    totalSent: number;
    totalReceived: number;
    unreadCount: number;
    pendingDrafts: number;
  };
}

const INTENT_LABELS: Record<string, { label: string; color: string }> = {
  acceptance: { label: "Acceptance", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejection: { label: "Rejection", color: "bg-red-50 text-red-700 border-red-200" },
  counter_offer: { label: "Counter Offer", color: "bg-amber-50 text-amber-700 border-amber-200" },
  request_info: { label: "Info Request", color: "bg-blue-50 text-blue-700 border-blue-200" },
  acknowledgement: { label: "Acknowledged", color: "bg-slate-50 text-slate-600 border-slate-200" },
  threat: { label: "Threat", color: "bg-red-50 text-red-700 border-red-200" },
  settlement: { label: "Settlement", color: "bg-purple-50 text-purple-700 border-purple-200" },
  compliance: { label: "Compliance", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  delay_tactic: { label: "Delay", color: "bg-orange-50 text-orange-700 border-orange-200" },
};

const URGENCY_STYLES: Record<string, string> = {
  critical: "bg-red-600 text-white",
  high: "bg-amber-500 text-white",
  medium: "bg-blue-100 text-blue-700",
  low: "bg-slate-100 text-slate-500",
};

const EMAIL_TYPE_LABELS: Record<string, string> = {
  LBA: "Letter Before Action",
  FOLLOW_UP: "Follow-up",
  RESPONSE: "Response",
  TRIBUNAL_SUBMISSION: "Tribunal",
  EVIDENCE_REQUEST: "Evidence Req.",
  SETTLEMENT_OFFER: "Settlement",
  COMPLAINT: "Complaint",
  OTHER: "General",
};

type TabType = "inbox" | "sent" | "drafts";

export default function EmailPageClient({
  accounts,
  messages,
  drafts,
  cases,
  stats,
}: EmailPageClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("inbox");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [composerCaseId, setComposerCaseId] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const inboxMessages = messages.filter((m) => m.direction === "INBOUND");
  const sentMessages = messages.filter((m) => m.direction === "OUTBOUND");

  const filteredMessages = (activeTab === "inbox" ? inboxMessages : sentMessages).filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.subject.toLowerCase().includes(q) ||
      m.senderEmail.toLowerCase().includes(q) ||
      m.recipientEmail.toLowerCase().includes(q) ||
      m.snippet?.toLowerCase().includes(q) ||
      m.dispute?.title.toLowerCase().includes(q)
    );
  });

  const filteredDrafts = drafts.filter((d) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.subject.toLowerCase().includes(q) ||
      d.recipientEmail.toLowerCase().includes(q) ||
      d.dispute?.title.toLowerCase().includes(q)
    );
  });

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/email/inbox/sync", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        const totalSynced = data.sync?.reduce((sum: number, s: any) => sum + (s.synced || 0), 0) || 0;
        toast.success(`Synced ${totalSynced} new emails`);
        router.refresh();
      } else {
        toast.error("Sync failed");
      }
    } catch {
      toast.error("Failed to sync inbox");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSendDraft = async (draftId: string) => {
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success("Email sent successfully");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to send");
    }
  };

  const handleGenerateDraft = async (caseId: string, emailType: string) => {
    setIsGenerating(caseId);
    try {
      const res = await fetch("/api/email/drafts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disputeId: caseId, emailType }),
      });
      if (!res.ok) throw new Error("Failed to generate");
      toast.success("AI draft generated! Check your drafts tab.");
      setActiveTab("drafts");
      router.refresh();
    } catch {
      toast.error("Failed to generate draft");
    } finally {
      setIsGenerating(null);
    }
  };

  const noAccountsConnected = accounts.length === 0;

  return (
    <div className="space-y-0 sm:space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 px-5 sm:px-0 pt-5 sm:pt-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1">Email</h1>
          <p className="text-slate-500 text-xs sm:text-[15px] hidden sm:block">
            Send legal correspondence and track responses with AI analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing || noAccountsConnected}
            className="border-slate-200 text-slate-600 hover:bg-slate-50 text-xs h-9"
          >
            {isSyncing ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
            Sync
          </Button>
          <Button
            size="sm"
            onClick={() => setShowComposer(true)}
            disabled={noAccountsConnected}
            className="bg-blue-600 hover:bg-blue-700 text-white border-0 text-xs h-9"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Compose
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-blue-600 rounded-2xl p-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Inbox className="h-4 w-4 opacity-80" />
            <span className="text-[11px] font-medium opacity-80">Received</span>
          </div>
          <p className="text-2xl font-bold">{stats.totalReceived}</p>
          {stats.unreadCount > 0 && (
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full mt-1 inline-block">
              {stats.unreadCount} unread
            </span>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Send className="h-4 w-4 text-slate-400" />
            <span className="text-[11px] font-medium text-slate-400">Sent</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.totalSent}</p>
          <span className="text-[10px] text-slate-400">total sent</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Edit3 className="h-4 w-4 text-slate-400" />
            <span className="text-[11px] font-medium text-slate-400">Drafts</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.pendingDrafts}</p>
          <span className="text-[10px] text-slate-400">awaiting approval</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-slate-400" />
            <span className="text-[11px] font-medium text-slate-400">AI Analyzed</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {messages.filter((m) => m.aiAnalysis).length}
          </p>
          <span className="text-[10px] text-slate-400">emails analyzed</span>
        </div>
      </div>

      {/* No Account Banner */}
      {noAccountsConnected && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Mail className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-[15px] font-bold text-slate-900 mb-1">Connect Your Email</h3>
              <p className="text-[13px] text-slate-600 mb-3">
                Connect your Gmail or Outlook account to start sending legal correspondence and tracking replies with AI analysis.
              </p>
              <Link
                href="/settings"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-all"
              >
                <Settings className="h-3.5 w-3.5" /> Go to Settings
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Connected Accounts Bar */}
      {accounts.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs"
            >
              <div className={`w-2 h-2 rounded-full ${acc.provider === "GMAIL" ? "bg-red-500" : "bg-blue-500"}`} />
              <span className="text-slate-700 font-medium">{acc.email}</span>
              <span className="text-slate-400">
                {acc.lastSyncAt
                  ? `synced ${new Date(acc.lastSyncAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`
                  : "not synced"}
              </span>
            </div>
          ))}
          <Link href="/settings" className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5">
            <Plus className="h-3 w-3" /> Add account
          </Link>
        </div>
      )}

      {/* Search + Tabs */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 p-0.5">
          {[
            { id: "inbox" as TabType, label: "Inbox", icon: Inbox, count: inboxMessages.length },
            { id: "sent" as TabType, label: "Sent", icon: Send, count: sentMessages.length },
            { id: "drafts" as TabType, label: "Drafts", icon: Edit3, count: drafts.length },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
                {tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === tab.id ? "bg-white/20" : "bg-slate-100 text-slate-500"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
          />
        </div>
      </div>

      {/* Composer Modal */}
      {showComposer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl">
            <EmailComposer
              disputeId={composerCaseId || cases[0]?.id || ""}
              onClose={() => {
                setShowComposer(false);
                setComposerCaseId("");
              }}
              onDraftCreated={() => {
                router.refresh();
                setActiveTab("drafts");
              }}
            />
          </div>
        </div>
      )}

      {/* AI Draft Generator */}
      {activeTab === "drafts" && cases.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-[14px] font-bold text-slate-900 mb-1">AI Email Generator</h3>
              <p className="text-[12px] text-slate-500 mb-3">
                Select a case and email type — AI will draft professional legal correspondence for you to review.
              </p>
              <div className="flex flex-wrap gap-2">
                {cases.filter((c) => c.lifecycleStatus !== "CLOSED").slice(0, 3).map((c) => (
                  <div key={c.id} className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500 font-medium truncate max-w-[120px]">{c.title}:</span>
                    {["LBA", "FOLLOW_UP", "COMPLAINT"].map((type) => (
                      <button
                        key={type}
                        onClick={() => handleGenerateDraft(c.id, type)}
                        disabled={isGenerating === c.id}
                        className="text-[10px] px-2 py-1 rounded-lg bg-white border border-blue-200 text-blue-700 font-medium hover:bg-blue-50 transition-all disabled:opacity-50"
                      >
                        {isGenerating === c.id ? (
                          <Loader2 className="h-2.5 w-2.5 animate-spin inline" />
                        ) : (
                          EMAIL_TYPE_LABELS[type] || type
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        {activeTab === "drafts" ? (
          /* Drafts Tab */
          filteredDrafts.length === 0 ? (
            <div className="p-12 text-center">
              <Edit3 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-[14px] font-medium text-slate-600 mb-1">No drafts</p>
              <p className="text-[12px] text-slate-400">
                AI-generated email drafts will appear here for your review before sending.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredDrafts.map((draft) => (
                <div key={draft.id} className="hover:bg-slate-50/50 transition-all">
                  <div
                    className="p-4 cursor-pointer flex items-start gap-3"
                    onClick={() => setExpandedId(expandedId === draft.id ? null : draft.id)}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      draft.status === "FAILED" ? "bg-red-50" : "bg-blue-50"
                    }`}>
                      {draft.status === "FAILED" ? (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <Edit3 className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[13px] font-semibold text-slate-900 truncate">{draft.subject}</p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                          {EMAIL_TYPE_LABELS[draft.emailType] || draft.emailType}
                        </span>
                        {draft.status === "FAILED" && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-medium">Failed</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        To: {draft.recipientEmail}
                        {draft.dispute && <> · <span className="text-blue-600">{draft.dispute.title}</span></>}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{draft.body}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <p className="text-[10px] text-slate-400">
                        {new Date(draft.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </p>
                      <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${expandedId === draft.id ? "rotate-180" : ""}`} />
                    </div>
                  </div>

                  {expandedId === draft.id && (
                    <div className="px-4 pb-4 border-t border-slate-100">
                      <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-[12px] text-slate-700 whitespace-pre-wrap leading-relaxed">{draft.body}</p>
                      </div>
                      {draft.lastError && (
                        <div className="mt-2 p-2 rounded-lg bg-red-50 border border-red-100">
                          <p className="text-[11px] text-red-700">Error: {draft.lastError}</p>
                        </div>
                      )}
                      <div className="mt-3 flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setComposerCaseId(draft.dispute?.id || "");
                            setShowComposer(true);
                          }}
                          className="text-xs border-slate-200 h-8"
                        >
                          <Edit3 className="h-3 w-3 mr-1" /> Edit
                        </Button>
                        {draft.emailAccount && (
                          <Button
                            size="sm"
                            onClick={() => handleSendDraft(draft.id)}
                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white border-0 h-8"
                          >
                            <Send className="h-3 w-3 mr-1" /> Approve & Send
                          </Button>
                        )}
                        {!draft.emailAccount && (
                          <p className="text-[11px] text-amber-600">Connect email in Settings to send</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          /* Inbox / Sent Tab */
          filteredMessages.length === 0 ? (
            <div className="p-12 text-center">
              <Mail className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-[14px] font-medium text-slate-600 mb-1">
                {noAccountsConnected ? "No email connected" : `No ${activeTab} emails`}
              </p>
              <p className="text-[12px] text-slate-400 mb-4">
                {noAccountsConnected
                  ? "Connect your email in Settings to get started."
                  : "Sync your inbox to check for new emails."}
              </p>
              {noAccountsConnected ? (
                <Link href="/settings" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700">
                  <Settings className="h-3.5 w-3.5" /> Connect Email
                </Link>
              ) : (
                <Button size="sm" onClick={handleSync} disabled={isSyncing} className="text-xs bg-blue-600 hover:bg-blue-700 text-white border-0">
                  <RefreshCw className="h-3 w-3 mr-1" /> Sync Now
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredMessages.map((msg) => {
                const isInbound = msg.direction === "INBOUND";
                const analysis = msg.aiAnalysis as any;
                const isExpanded = expandedId === msg.id;

                return (
                  <div
                    key={msg.id}
                    className={`hover:bg-slate-50/50 transition-all ${!msg.isRead && isInbound ? "bg-blue-50/30" : ""}`}
                  >
                    <div
                      className="p-4 cursor-pointer flex items-start gap-3"
                      onClick={() => setExpandedId(isExpanded ? null : msg.id)}
                    >
                      {/* Direction Icon */}
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isInbound ? "bg-slate-100" : "bg-blue-50"
                      }`}>
                        {isInbound ? (
                          <ArrowDownLeft className="h-4 w-4 text-slate-600" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-blue-600" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {!msg.isRead && isInbound && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
                          )}
                          <p className={`text-[13px] truncate ${!msg.isRead && isInbound ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}>
                            {isInbound
                              ? msg.senderName || msg.senderEmail
                              : `To: ${msg.recipientName || msg.recipientEmail}`}
                          </p>
                        </div>
                        <p className={`text-[12px] truncate mt-0.5 ${!msg.isRead && isInbound ? "font-semibold text-slate-800" : "text-slate-700"}`}>
                          {msg.subject}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{msg.snippet}</p>

                        {/* Tags row */}
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {msg.dispute && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-medium">
                              {msg.dispute.title}
                            </span>
                          )}
                          {analysis?.intent && analysis.intent !== "unknown" && INTENT_LABELS[analysis.intent] && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${INTENT_LABELS[analysis.intent].color}`}>
                              {INTENT_LABELS[analysis.intent].label}
                            </span>
                          )}
                          {analysis?.urgency && analysis.urgency !== "low" && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${URGENCY_STYLES[analysis.urgency] || ""}`}>
                              {analysis.urgency}
                            </span>
                          )}
                          {msg.hasAttachments && (
                            <Paperclip className="h-3 w-3 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* Right side */}
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <p className="text-[10px] text-slate-400 whitespace-nowrap">
                          {new Date(msg.receivedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(msg.receivedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                        <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform mt-1 ${isExpanded ? "rotate-180" : ""}`} />
                      </div>
                    </div>

                    {/* Expanded Detail */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-slate-100">
                        {/* Full snippet */}
                        <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                          <p className="text-[12px] text-slate-700 whitespace-pre-wrap leading-relaxed">
                            {msg.snippet || "No content available"}
                          </p>
                        </div>

                        {/* AI Analysis */}
                        {analysis && isInbound && (
                          <div className="mt-3 p-4 rounded-xl bg-purple-50/50 border border-purple-100">
                            <div className="flex items-center gap-1.5 mb-2">
                              <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                              <p className="text-[12px] font-bold text-purple-900">AI Analysis</p>
                              {analysis.confidence && (
                                <span className="text-[10px] text-purple-500 ml-auto">{Math.round(analysis.confidence * 100)}% confident</span>
                              )}
                            </div>
                            {analysis.keyPoints && (
                              <ul className="space-y-1 mb-2">
                                {analysis.keyPoints.map((p: string, i: number) => (
                                  <li key={i} className="text-[11px] text-purple-800 flex items-start gap-1.5">
                                    <span className="text-purple-400 mt-0.5">•</span> {p}
                                  </li>
                                ))}
                              </ul>
                            )}
                            {analysis.suggestedResponseSummary && (
                              <div className="p-2.5 rounded-lg bg-white border border-purple-200 mt-2">
                                <p className="text-[10px] text-purple-600 font-medium mb-0.5">Suggested Response</p>
                                <p className="text-[11px] text-purple-900">{analysis.suggestedResponseSummary}</p>
                              </div>
                            )}
                            {analysis.deadlineMentioned && (
                              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-700">
                                <Clock className="h-3 w-3" />
                                Deadline: {analysis.deadlineMentioned}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="mt-3 flex items-center justify-between">
                          {msg.dispute && (
                            <Link
                              href={`/disputes/${msg.dispute.id}/case`}
                              className="text-[11px] text-blue-600 font-medium flex items-center gap-1 hover:text-blue-700"
                            >
                              <FileText className="h-3 w-3" /> View Case
                            </Link>
                          )}
                          <div className="flex items-center gap-2 ml-auto">
                            {isInbound && msg.dispute && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleGenerateDraft(msg.dispute!.id, "RESPONSE");
                                }}
                                disabled={isGenerating === msg.dispute.id}
                                className="text-[11px] border-slate-200 h-7"
                              >
                                {isGenerating === msg.dispute.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                ) : (
                                  <Sparkles className="h-3 w-3 mr-1" />
                                )}
                                AI Reply
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}
