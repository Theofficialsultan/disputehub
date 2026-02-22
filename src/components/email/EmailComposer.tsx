"use client";

import { useState, useEffect } from "react";
import {
  Mail,
  Send,
  X,
  Loader2,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface EmailAccount {
  id: string;
  provider: string;
  email: string;
}

interface EmailComposerProps {
  disputeId: string;
  onClose: () => void;
  onDraftCreated?: () => void;
  initialRecipient?: string;
  initialSubject?: string;
  initialBody?: string;
  inReplyToId?: string;
  emailType?: string;
}

export function EmailComposer({
  disputeId,
  onClose,
  onDraftCreated,
  initialRecipient = "",
  initialSubject = "",
  initialBody = "",
  inReplyToId,
  emailType = "OTHER",
}: EmailComposerProps) {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [recipient, setRecipient] = useState(initialRecipient);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/email/accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
        if (data.accounts?.length > 0) {
          setSelectedAccountId(data.accounts[0].id);
        }
      }
    } catch {
      console.error("Failed to fetch accounts");
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const saveDraft = async () => {
    if (!recipient || !subject || !body) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/email/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disputeId,
          emailAccountId: selectedAccountId || null,
          recipientEmail: recipient,
          subject,
          bodyText: body,
          emailType,
          inReplyToId,
        }),
      });

      if (!res.ok) throw new Error("Failed to save draft");

      toast.success("Draft saved");
      onDraftCreated?.();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  };

  const saveAndSend = async () => {
    if (!recipient || !subject || !body) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!selectedAccountId) {
      toast.error("Please connect an email account first (Settings > Email)");
      return;
    }

    setIsSending(true);
    try {
      // First create draft
      const draftRes = await fetch("/api/email/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disputeId,
          emailAccountId: selectedAccountId,
          recipientEmail: recipient,
          subject,
          bodyText: body,
          emailType,
          inReplyToId,
        }),
      });

      if (!draftRes.ok) throw new Error("Failed to create draft");
      const { draft } = await draftRes.json();

      // Then send
      const sendRes = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId: draft.id }),
      });

      if (!sendRes.ok) {
        const err = await sendRes.json();
        throw new Error(err.error || "Failed to send");
      }

      toast.success("Email sent successfully");
      onDraftCreated?.();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="rounded-2xl border border-blue-200 bg-white shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          <span className="text-sm font-semibold">Compose Email</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-blue-700 rounded-lg transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* From Account */}
        {isLoadingAccounts ? (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 className="h-3 w-3 animate-spin" /> Loading accounts...
          </div>
        ) : accounts.length > 0 ? (
          <div>
            <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">From</label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.email} ({a.provider})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-xs text-amber-700">
              No email account connected. Go to Settings &gt; Email to connect Gmail or Outlook.
            </p>
          </div>
        )}

        {/* To */}
        <div>
          <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">To</label>
          <Input
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="recipient@example.com"
            className="mt-1 bg-white border-slate-200 text-sm"
          />
        </div>

        {/* Subject */}
        <div>
          <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Subject</label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject"
            className="mt-1 bg-white border-slate-200 text-sm"
          />
        </div>

        {/* Body */}
        <div>
          <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Body</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your email..."
            rows={8}
            className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 resize-none"
          />
        </div>

        {/* AI Badge */}
        {initialBody && (
          <div className="flex items-center gap-1.5 text-xs text-blue-600">
            <Sparkles className="h-3 w-3" />
            AI-generated draft — review before sending
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          className="border-slate-200 text-slate-600 text-xs"
        >
          Cancel
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={saveDraft}
          disabled={isSaving}
          className="border-slate-200 text-slate-600 text-xs"
        >
          {isSaving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null}
          Save Draft
        </Button>
        <Button
          size="sm"
          onClick={saveAndSend}
          disabled={isSending || !selectedAccountId}
          className="bg-blue-600 hover:bg-blue-700 text-white border-0 text-xs"
        >
          {isSending ? (
            <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Sending...</>
          ) : (
            <><Send className="h-3 w-3 mr-1" /> Send</>
          )}
        </Button>
      </div>
    </div>
  );
}
