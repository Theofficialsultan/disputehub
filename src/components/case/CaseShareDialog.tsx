"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Share2,
  Copy,
  Trash2,
  Link,
  Eye,
  MessageSquare,
  Users,
  Loader2,
  Check,
} from "lucide-react";
import { toast } from "sonner";

interface CaseShare {
  id: string;
  shareToken: string;
  shareUrl?: string;
  email?: string;
  permission: "VIEW_ONLY" | "COMMENT" | "COLLABORATE";
  accessCount: number;
  createdAt: string;
  expiresAt?: string;
}

interface CaseShareDialogProps {
  caseId: string;
  caseTitle: string;
}

const PERMISSION_OPTIONS = [
  { value: "VIEW_ONLY", label: "View only", icon: Eye, description: "Can view case and documents" },
  { value: "COMMENT", label: "Comment", icon: MessageSquare, description: "Can view and add comments" },
  { value: "COLLABORATE", label: "Collaborate", icon: Users, description: "Can view, comment, and upload evidence" },
];

export function CaseShareDialog({ caseId, caseTitle }: CaseShareDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shares, setShares] = useState<CaseShare[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New share form
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<string>("VIEW_ONLY");
  const [expiresInDays, setExpiresInDays] = useState<string>("7");

  useEffect(() => {
    if (isOpen) {
      loadShares();
    }
  }, [isOpen]);

  const loadShares = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/disputes/${caseId}/share`);
      if (response.ok) {
        const data = await response.json();
        setShares(data.shares || []);
      }
    } catch (error) {
      console.error("Failed to load shares:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createShare = async () => {
    setIsCreating(true);
    try {
      const response = await fetch(`/api/disputes/${caseId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email || null,
          permission,
          expiresInDays: expiresInDays ? parseInt(expiresInDays) : null,
        }),
      });

      if (!response.ok) throw new Error("Failed to create share");

      const data = await response.json();
      toast.success("Share link created!");
      
      // Copy to clipboard
      await navigator.clipboard.writeText(data.share.shareUrl);
      toast.success("Link copied to clipboard!");

      setEmail("");
      loadShares();
    } catch (error) {
      toast.error("Failed to create share link");
    } finally {
      setIsCreating(false);
    }
  };

  const revokeShare = async (shareId: string) => {
    try {
      const response = await fetch(`/api/disputes/${caseId}/share?shareId=${shareId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to revoke share");

      toast.success("Share link revoked");
      loadShares();
    } catch (error) {
      toast.error("Failed to revoke share");
    }
  };

  const copyLink = async (share: CaseShare) => {
    const url = share.shareUrl || `${window.location.origin}/shared/${share.shareToken}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(share.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Link copied!");
  };

  const getPermissionIcon = (perm: string) => {
    const option = PERMISSION_OPTIONS.find((o) => o.value === perm);
    return option ? option.icon : Eye;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Case
          </DialogTitle>
          <DialogDescription>
            Create a link to share "{caseTitle}" with others
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create new share */}
          <div className="space-y-4 p-4 rounded-lg border bg-muted/50">
            <h4 className="font-medium">Create share link</h4>
            
            <Input
              placeholder="Email (optional - for tracking)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Permission</label>
                <Select value={permission} onValueChange={setPermission}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERMISSION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <option.icon className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Expires in</label>
                <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={createShare} disabled={isCreating} className="w-full gap-2">
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Link className="h-4 w-4" />
                  Create Link
                </>
              )}
            </Button>
          </div>

          {/* Existing shares */}
          <div className="space-y-3">
            <h4 className="font-medium">Active share links</h4>
            
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : shares.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No active share links
              </p>
            ) : (
              <div className="space-y-2">
                {shares.filter(s => s.isActive !== false).map((share) => {
                  const Icon = getPermissionIcon(share.permission);
                  return (
                    <div
                      key={share.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            {share.email || "Anyone with link"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {share.accessCount} views
                            {share.expiresAt && ` • Expires ${new Date(share.expiresAt).toLocaleDateString()}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyLink(share)}
                        >
                          {copiedId === share.id ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => revokeShare(share.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
