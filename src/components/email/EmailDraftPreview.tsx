"use client";

import { useState } from "react";
import {
  Mail,
  Send,
  Edit3,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock,
  ArrowRight,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface EmailDraft {
  id: string;
  recipientEmail: string;
  recipientName?: string | null;
  subject: string;
  body: string;
  bodyHtml?: string | null;
  emailType: string;
  status: string;
  sentAt?: string | null;
  emailAccount?: {
    email: string;
    provider: string;
  } | null;
  inReplyTo?: {
    subject: string;
    senderEmail: string;
    receivedAt: string;
  } | null;
  createdAt: string;
}

const EMAIL_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  LBA: { label: "Letter Before Action", color: "bg-red-50 text-red-700 border-red-200" },
  FOLLOW_UP: { label: "Follow-up", color: "bg-amber-50 text-amber-700 border-amber-200" },
  RESPONSE: { label: "Response", color: "bg-blue-50 text-blue-700 border-blue-200" },
  TRIBUNAL_SUBMISSION: { label: "Tribunal Submission", color: "bg-purple-50 text-purple-700 border-purple-200" },
  EVIDENCE_REQUEST: { label: "Evidence Request", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  SETTLEMENT_OFFER: { label: "Settlement", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  COMPLAINT: { label: "Complaint", color: "bg-orange-50 text-orange-700 border-orange-200" },
  OTHER: { label: "General", color: "bg-slate-50 text-slate-700 border-slate-200" },
};

export function EmailDraftPreview({ draft, onSend, onEdit }: {
  draft: EmailDraft;
  onSend?: (draftId: string) => Promise<void>;
  onEdit?: (draftId: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const typeInfo = EMAIL_TYPE_LABELS[draft.emailType] || EMAIL_TYPE_LABELS.OTHER;
  const isSent = draft.status === "SENT";
  const isFailed = draft.status === "FAILED";

  const handleSend = async () => {
    if (!onSend) return;
    setIsSending(true);
    try {
      await onSend(draft.id);
      toast.success("Email sent successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${
      isSent
        ? "border-emerald-200 bg-emerald-50/30"
        : isFailed
        ? "border-red-200 bg-red-50/30"
        : "border-blue-200 bg-blue-50/30"
    }`}>
      {/* Header */}
      <div className="p-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isSent ? "bg-emerald-100" : isFailed ? "bg-red-100" : "bg-blue-100"
            }`}>
              {isSent ? (
                <CheckCircle className="h-4 w-4 text-emerald-600" />
              ) : isFailed ? (
                <AlertCircle className="h-4 w-4 text-red-600" />
              ) : (
                <Mail className="h-4 w-4 text-blue-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-slate-900 truncate">{draft.subject}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${typeInfo.color}`}>
                  {typeInfo.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                To: {draft.recipientName ? `${draft.recipientName} <${draft.recipientEmail}>` : draft.recipientEmail}
              </p>
              {draft.emailAccount && (
                <p className="text-[10px] text-slate-400 mt-0.5">
                  From: {draft.emailAccount.email} ({draft.emailAccount.provider})
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isSent && (
              <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                Sent
              </span>
            )}
            {isFailed && (
              <span className="text-[10px] px-2 py-1 rounded-full bg-red-100 text-red-700 font-medium">
                Failed
              </span>
            )}
            <Eye className={`h-4 w-4 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
          </div>
        </div>

        {draft.inReplyTo && (
          <div className="mt-2 ml-12 text-xs text-slate-500 flex items-center gap-1">
            <ArrowRight className="h-3 w-3" />
            Replying to: "{draft.inReplyTo.subject}" from {draft.inReplyTo.senderEmail}
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-slate-200/60">
          <div className="p-4 bg-white/80">
            <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap text-[13px] leading-relaxed">
              {draft.body}
            </div>
          </div>

          {/* Actions */}
          {!isSent && (
            <div className="p-3 bg-slate-50/80 border-t border-slate-200/60 flex items-center justify-end gap-2">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(draft.id)}
                  className="border-slate-200 text-slate-600 hover:bg-white text-xs"
                >
                  <Edit3 className="h-3 w-3 mr-1" /> Edit
                </Button>
              )}
              {onSend && draft.emailAccount && (
                <Button
                  size="sm"
                  onClick={handleSend}
                  disabled={isSending || !draft.emailAccount}
                  className="bg-blue-600 hover:bg-blue-700 text-white border-0 text-xs"
                >
                  {isSending ? (
                    <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Sending...</>
                  ) : (
                    <><Send className="h-3 w-3 mr-1" /> Send Email</>
                  )}
                </Button>
              )}
              {!draft.emailAccount && (
                <p className="text-xs text-amber-600">
                  Connect an email account in Settings to send
                </p>
              )}
            </div>
          )}

          {isSent && draft.sentAt && (
            <div className="p-3 bg-emerald-50/50 border-t border-emerald-200/60 flex items-center gap-2">
              <Clock className="h-3 w-3 text-emerald-600" />
              <p className="text-xs text-emerald-700">
                Sent on {new Date(draft.sentAt).toLocaleString("en-GB")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
