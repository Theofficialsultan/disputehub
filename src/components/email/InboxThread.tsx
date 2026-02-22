"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Mail,
  MailOpen,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  Reply,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmailDraftPreview } from "./EmailDraftPreview";
import { EmailComposer } from "./EmailComposer";
import { toast } from "sonner";

interface ThreadMessage {
  id: string;
  externalMessageId: string | null;
  threadId: string | null;
  direction: string;
  senderEmail: string;
  senderName: string | null;
  recipientEmail: string;
  recipientName: string | null;
  subject: string;
  bodyText: string | null;
  bodyHtml: string | null;
  snippet: string | null;
  receivedAt: string;
  isRead: boolean;
  hasAttachments: boolean;
  aiAnalysis: any;
  emailAccount?: {
    email: string;
    provider: string;
  };
  dispute?: {
    id: string;
    title: string;
    type: string;
  } | null;
}

interface ThreadDraft {
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
  emailAccount?: {
    email: string;
    provider: string;
  } | null;
}

const URGENCY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-800 border-red-200",
  high: "bg-amber-100 text-amber-800 border-amber-200",
  medium: "bg-blue-100 text-blue-800 border-blue-200",
  low: "bg-slate-100 text-slate-600 border-slate-200",
};

const INTENT_LABELS: Record<string, string> = {
  acceptance: "Acceptance",
  rejection: "Rejection",
  counter_offer: "Counter Offer",
  request_info: "Info Request",
  acknowledgement: "Acknowledgement",
  threat: "Threat",
  settlement: "Settlement",
  compliance: "Compliance",
  delay_tactic: "Delay Tactic",
  irrelevant: "Not Related",
};

export function InboxThread({ disputeId }: { disputeId: string }) {
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [drafts, setDrafts] = useState<ThreadDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());

  const fetchThread = useCallback(async () => {
    try {
      const res = await fetch(`/api/email/threads?disputeId=${disputeId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setDrafts(data.drafts || []);
      }
    } catch {
      console.error("Failed to fetch thread");
    } finally {
      setIsLoading(false);
    }
  }, [disputeId]);

  useEffect(() => {
    fetchThread();
  }, [fetchThread]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await fetch("/api/email/inbox/sync", { method: "POST" });
      await fetchThread();
      toast.success("Inbox synced");
    } catch {
      toast.error("Sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSendDraft = async (draftId: string) => {
    const res = await fetch("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draftId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    await fetchThread();
  };

  const toggleMessage = (id: string) => {
    setExpandedMessages((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalMessages = messages.length + drafts.filter((d) => d.status !== "SENT").length;

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <Loader2 className="h-5 w-5 animate-spin text-blue-600 mx-auto" />
        <p className="text-xs text-slate-400 mt-2">Loading emails...</p>
      </div>
    );
  }

  if (totalMessages === 0 && !showComposer) {
    return (
      <div className="p-6">
        <div className="text-center p-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
          <Mail className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-600">No emails yet</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Emails related to this case will appear here
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSync}
              disabled={isSyncing}
              className="text-xs border-slate-200"
            >
              {isSyncing ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
              Sync Inbox
            </Button>
            <Button
              size="sm"
              onClick={() => setShowComposer(true)}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white border-0"
            >
              <Mail className="h-3 w-3 mr-1" /> Compose
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-slate-900">
            Case Emails ({messages.length})
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSync}
            disabled={isSyncing}
            className="text-xs border-slate-200 h-7"
          >
            {isSyncing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          </Button>
          <Button
            size="sm"
            onClick={() => setShowComposer(true)}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white border-0 h-7"
          >
            <Mail className="h-3 w-3 mr-1" /> Compose
          </Button>
        </div>
      </div>

      {/* Composer */}
      {showComposer && (
        <EmailComposer
          disputeId={disputeId}
          onClose={() => setShowComposer(false)}
          onDraftCreated={fetchThread}
        />
      )}

      {/* Pending Drafts */}
      {drafts.filter((d) => d.status === "DRAFT").length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending Drafts</p>
          {drafts
            .filter((d) => d.status === "DRAFT")
            .map((draft) => (
              <EmailDraftPreview
                key={draft.id}
                draft={draft as any}
                onSend={handleSendDraft}
              />
            ))}
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-2">
        {messages.map((msg) => {
          const isExpanded = expandedMessages.has(msg.id);
          const isInbound = msg.direction === "INBOUND";
          const analysis = msg.aiAnalysis as any;

          return (
            <div
              key={msg.id}
              className={`rounded-xl border transition-all ${
                isInbound
                  ? "border-slate-200 bg-white"
                  : "border-blue-100 bg-blue-50/30"
              }`}
            >
              <div
                className="p-3 cursor-pointer flex items-start gap-3"
                onClick={() => toggleMessage(msg.id)}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isInbound ? "bg-slate-100" : "bg-blue-100"
                }`}>
                  {isInbound ? (
                    <ArrowDownLeft className="h-3.5 w-3.5 text-slate-600" />
                  ) : (
                    <ArrowUpRight className="h-3.5 w-3.5 text-blue-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {isInbound ? msg.senderName || msg.senderEmail : `To: ${msg.recipientEmail}`}
                    </p>
                    {!msg.isRead && isInbound && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-700 font-medium truncate">{msg.subject}</p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {msg.snippet || msg.bodyText?.substring(0, 100)}
                  </p>

                  {/* AI Analysis Badge */}
                  {analysis && isInbound && (
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {analysis.intent && analysis.intent !== "unknown" && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                          {INTENT_LABELS[analysis.intent] || analysis.intent}
                        </span>
                      )}
                      {analysis.urgency && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${
                          URGENCY_COLORS[analysis.urgency] || URGENCY_COLORS.low
                        }`}>
                          {analysis.urgency}
                        </span>
                      )}
                      {analysis.suggestedAction && analysis.suggestedAction !== "no_action" && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium flex items-center gap-0.5">
                          <Sparkles className="h-2.5 w-2.5" />
                          {analysis.suggestedAction.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="text-[10px] text-slate-400 whitespace-nowrap">
                    {new Date(msg.receivedAt).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-slate-400" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-slate-200/60 px-4 py-3">
                  <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {msg.bodyText || msg.snippet}
                  </div>

                  {/* AI Analysis Detail */}
                  {analysis && isInbound && (
                    <div className="mt-4 p-3 rounded-xl bg-purple-50/50 border border-purple-100">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                        <p className="text-xs font-semibold text-purple-900">AI Analysis</p>
                      </div>
                      {analysis.keyPoints && (
                        <ul className="space-y-1 mb-2">
                          {analysis.keyPoints.map((point: string, i: number) => (
                            <li key={i} className="text-xs text-purple-800 flex items-start gap-1.5">
                              <span className="text-purple-400 mt-0.5">•</span>
                              {point}
                            </li>
                          ))}
                        </ul>
                      )}
                      {analysis.suggestedResponseSummary && (
                        <div className="mt-2 p-2 rounded-lg bg-white/80 border border-purple-200">
                          <p className="text-[10px] text-purple-600 font-medium mb-0.5">Suggested Response</p>
                          <p className="text-xs text-purple-900">{analysis.suggestedResponseSummary}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reply Action */}
                  {isInbound && (
                    <div className="mt-3 flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowComposer(true);
                        }}
                        className="text-xs border-slate-200"
                      >
                        <Reply className="h-3 w-3 mr-1" /> Reply
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
