"use client";

import { useState } from "react";
import {
  Share2,
  Link,
  Copy,
  Check,
  Users,
  Loader2,
  Trash2,
  ExternalLink,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareLink {
  id: string;
  token: string;
  role: "VIEWER" | "EDITOR" | "ADMIN";
  expiresAt: string | null;
  maxUses: number | null;
  useCount: number;
  createdAt: string;
}

interface ShareCaseButtonProps {
  caseId: string;
  caseTitle: string;
}

export function ShareCaseButton({ caseId, caseTitle }: ShareCaseButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Options for new share link
  const [newLinkRole, setNewLinkRole] = useState<"VIEWER" | "EDITOR">("VIEWER");
  const [newLinkExpiry, setNewLinkExpiry] = useState<"7" | "30" | "never">("7");

  const fetchShareLinks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/disputes/${caseId}/share`);
      if (response.ok) {
        const data = await response.json();
        setShareLinks(data.links || []);
      }
    } catch (error) {
      console.error("Error fetching share links:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = async () => {
    setShowModal(true);
    await fetchShareLinks();
  };

  const createShareLink = async () => {
    setCreating(true);
    try {
      const response = await fetch(`/api/disputes/${caseId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: newLinkRole,
          expiresInDays: newLinkExpiry === "never" ? null : parseInt(newLinkExpiry),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setShareLinks((prev) => [data.link, ...prev]);
        toast.success("Share link created!");
      } else {
        throw new Error("Failed to create link");
      }
    } catch (error) {
      toast.error("Failed to create share link");
    } finally {
      setCreating(false);
    }
  };

  const deleteShareLink = async (linkId: string) => {
    try {
      const response = await fetch(`/api/disputes/${caseId}/share/${linkId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setShareLinks((prev) => prev.filter((l) => l.id !== linkId));
        toast.success("Share link deleted");
      }
    } catch (error) {
      toast.error("Failed to delete share link");
    }
  };

  const copyLink = async (token: string) => {
    const url = `${window.location.origin}/share/${token}`;
    await navigator.clipboard.writeText(url);
    setCopied(token);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(null), 2000);
  };

  const formatExpiry = (expiresAt: string | null) => {
    if (!expiresAt) return "Never expires";
    const date = new Date(expiresAt);
    if (date < new Date()) return "Expired";
    return `Expires ${date.toLocaleDateString("en-GB")}`;
  };

  return (
    <>
      <Button
        onClick={handleOpenModal}
        variant="outline"
        className="border-indigo-500/30 text-white hover:bg-indigo-500/20"
      >
        <Share2 className="mr-2 h-4 w-4" />
        Share Case
      </Button>

      {/* Share Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl glass-strong border border-indigo-500/20 p-6 animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Share Case</h3>
                <p className="text-sm text-slate-400">{caseTitle}</p>
              </div>
            </div>

            {/* Create New Link Section */}
            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 mb-4">
              <h4 className="text-sm font-medium text-white mb-3">
                Create Share Link
              </h4>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">
                    Permission
                  </label>
                  <select
                    value={newLinkRole}
                    onChange={(e) =>
                      setNewLinkRole(e.target.value as "VIEWER" | "EDITOR")
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="VIEWER">View Only</option>
                    <option value="EDITOR">Can Edit</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">
                    Expires
                  </label>
                  <select
                    value={newLinkExpiry}
                    onChange={(e) =>
                      setNewLinkExpiry(e.target.value as "7" | "30" | "never")
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                  >
                    <option value="7">7 days</option>
                    <option value="30">30 days</option>
                    <option value="never">Never</option>
                  </select>
                </div>
              </div>

              <Button
                onClick={createShareLink}
                disabled={creating}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Link className="mr-2 h-4 w-4" />
                    Create Link
                  </>
                )}
              </Button>
            </div>

            {/* Existing Links */}
            <div>
              <h4 className="text-sm font-medium text-slate-400 mb-3">
                Active Share Links
              </h4>

              {loading ? (
                <div className="py-8 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-400 mx-auto" />
                </div>
              ) : shareLinks.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  <Link className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No share links yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {shareLinks.map((link) => {
                    const isExpired =
                      link.expiresAt && new Date(link.expiresAt) < new Date();
                    return (
                      <div
                        key={link.id}
                        className={`p-3 rounded-xl border ${
                          isExpired
                            ? "bg-slate-800/30 border-slate-700/50 opacity-50"
                            : "bg-slate-800/50 border-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${
                                link.role === "EDITOR"
                                  ? "bg-orange-500/20 text-orange-400"
                                  : "bg-blue-500/20 text-blue-400"
                              }`}
                            >
                              {link.role === "EDITOR" ? "Editor" : "Viewer"}
                            </span>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatExpiry(link.expiresAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => copyLink(link.token)}
                              disabled={isExpired}
                              className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
                            >
                              {copied === link.token ? (
                                <Check className="h-4 w-4 text-green-400" />
                              ) : (
                                <Copy className="h-4 w-4 text-slate-400" />
                              )}
                            </button>
                            <button
                              onClick={() => deleteShareLink(link.id)}
                              className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                            >
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </button>
                          </div>
                        </div>
                        <div className="text-xs text-slate-500">
                          Used {link.useCount}
                          {link.maxUses ? ` / ${link.maxUses}` : ""} times
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              onClick={() => setShowModal(false)}
              className="w-full mt-4 text-slate-400 hover:text-white"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
