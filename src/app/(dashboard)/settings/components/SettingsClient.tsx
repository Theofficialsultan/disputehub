"use client";

import { useState, useEffect, useCallback } from "react";
import {
  User,
  Mail,
  Lock,
  Bell,
  CreditCard,
  Shield,
  Trash2,
  Save,
  LogOut,
  FileText,
  Calendar,
  Check,
  AlertCircle,
  Download,
  Sparkles,
  Crown,
  Loader2,
  RefreshCw,
  Unplug,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useClerk } from "@clerk/nextjs";

interface EmailAccountData {
  id: string;
  provider: string;
  email: string;
  lastSyncAt: string | null;
  createdAt: string;
  _count: {
    emailMessages: number;
    emailDrafts: number;
  };
}

interface SettingsData {
  user: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
    phone: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    postcode: string | null;
    createdAt: Date;
  };
  stats: {
    disputes: number;
    documents: number;
  };
}

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "email", label: "Email", icon: Mail },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "account", label: "Account", icon: Lock },
];

interface ProfileFormData {
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
}

function ProfileTab({ user, onSave }: { user: SettingsData["user"]; onSave: (data: ProfileFormData) => Promise<void> }) {
  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    phone: user.phone || "",
    addressLine1: user.addressLine1 || "",
    addressLine2: user.addressLine2 || "",
    city: user.city || "",
    postcode: user.postcode || "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const updateField = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(formData);
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Personal Information */}
      <div>
        <h3 className="text-xl font-semibold text-slate-900 mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="firstName" className="text-slate-700">
              First Name *
            </Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              className="mt-2 bg-white border border-slate-200 text-slate-900"
            />
          </div>
          <div>
            <Label htmlFor="lastName" className="text-slate-700">
              Last Name *
            </Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              className="mt-2 bg-white border border-slate-200 text-slate-900"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="email" className="text-slate-700">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              defaultValue={user.email || ""}
              disabled
              className="mt-2 bg-white border border-slate-200 text-slate-500"
            />
            <p className="text-xs text-slate-500 mt-2">
              Email is managed by your login provider and cannot be changed here.
            </p>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div>
        <h3 className="text-xl font-semibold text-slate-900 mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Label htmlFor="phone" className="text-slate-700">
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="e.g., 07123 456789"
              className="mt-2 bg-white border border-slate-200 text-slate-900"
            />
            <p className="text-xs text-slate-500 mt-2">
              This will appear on your dispute letters.
            </p>
          </div>
        </div>
      </div>

      {/* Address */}
      <div>
        <h3 className="text-xl font-semibold text-slate-900 mb-4">Address</h3>
        <p className="text-sm text-slate-500 mb-4">
          Your address is used as the sender address on dispute letters.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <Label htmlFor="addressLine1" className="text-slate-700">
              Address Line 1
            </Label>
            <Input
              id="addressLine1"
              value={formData.addressLine1}
              onChange={(e) => updateField("addressLine1", e.target.value)}
              placeholder="e.g., 123 High Street"
              className="mt-2 bg-white border border-slate-200 text-slate-900"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="addressLine2" className="text-slate-700">
              Address Line 2 (Optional)
            </Label>
            <Input
              id="addressLine2"
              value={formData.addressLine2}
              onChange={(e) => updateField("addressLine2", e.target.value)}
              placeholder="e.g., Flat 4B"
              className="mt-2 bg-white border border-slate-200 text-slate-900"
            />
          </div>
          <div>
            <Label htmlFor="city" className="text-slate-700">
              City
            </Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => updateField("city", e.target.value)}
              placeholder="e.g., London"
              className="mt-2 bg-white border border-slate-200 text-slate-900"
            />
          </div>
          <div>
            <Label htmlFor="postcode" className="text-slate-700">
              Postcode
            </Label>
            <Input
              id="postcode"
              value={formData.postcode}
              onChange={(e) => updateField("postcode", e.target.value.toUpperCase())}
              placeholder="e.g., SW1A 1AA"
              className="mt-2 bg-white border border-slate-200 text-slate-900"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <p className="text-sm text-slate-500">
          Member since {new Date(user.createdAt).toLocaleDateString()}
        </p>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white border-0"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function NotificationsTab() {
  const [settings, setSettings] = useState({
    caseUpdates: true,
    documentGeneration: true,
    deadlineReminders: true,
    lawyerUpdates: false,
    browserNotifications: false,
    mobilePush: false,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    toast.success("Notification preference updated");
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-slate-900 mb-4">Email Notifications</h3>
        <div className="space-y-4">
          {[
            { key: "caseUpdates" as const, label: "Case updates", desc: "Get notified about case progress and changes" },
            { key: "documentGeneration" as const, label: "Document generation", desc: "When documents are ready to download" },
            { key: "deadlineReminders" as const, label: "Deadline reminders", desc: "Reminders before deadlines expire" },
            { key: "lawyerUpdates" as const, label: "Lawyer updates", desc: "Messages from your assigned lawyer (coming soon)" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between p-4 rounded-2xl card-elevated border border-slate-200"
            >
              <div>
                <p className="font-medium text-slate-900">{item.label}</p>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </div>
              <Switch 
                checked={settings[item.key]} 
                onCheckedChange={() => handleToggle(item.key)}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-slate-900 mb-4">Push Notifications</h3>
        <div className="space-y-4">
          {[
            { key: "browserNotifications" as const, label: "Browser notifications", desc: "Show notifications in your browser" },
            { key: "mobilePush" as const, label: "Mobile push", desc: "Send notifications to your mobile device" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between p-4 rounded-2xl card-elevated border border-slate-200"
            >
              <div>
                <p className="font-medium text-slate-900">{item.label}</p>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </div>
              <Switch 
                checked={settings[item.key]}
                onCheckedChange={() => handleToggle(item.key)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SecurityTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-slate-900 mb-4">Password Management</h3>
        <div className="p-6 rounded-2xl card-elevated border border-slate-200">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-blue-50">
              <Lock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-900 mb-1">Password managed by login provider</p>
              <p className="text-sm text-slate-500 mb-4">
                Your password is managed through Clerk authentication. To change your password, please use your authentication provider's settings.
              </p>
              <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 hover:bg-slate-50">
                Manage in Clerk
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-slate-900 mb-4">Two-Factor Authentication</h3>
        <div className="p-6 rounded-2xl card-elevated border border-slate-200">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-emerald-50">
              <Check className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-900 mb-1">2FA available through Clerk</p>
              <p className="text-sm text-slate-500 mb-4">
                Enable two-factor authentication through your Clerk account settings for added security.
              </p>
              <Button variant="outline" size="sm" className="border-slate-200 text-slate-700 hover:bg-slate-50">
                Configure 2FA
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-slate-900 mb-4">Session Security</h3>
        <div className="p-6 rounded-2xl card-elevated border border-slate-200">
          <p className="text-sm text-slate-500 mb-4">
            Your sessions are managed securely. Inactive sessions are automatically terminated after 7 days.
          </p>
          <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <div>
              <p className="font-medium text-slate-900">Current Session</p>
              <p className="text-sm text-slate-500">Active now</p>
            </div>
            <span className="text-xs text-emerald-700 font-medium px-2 py-1 bg-emerald-100 rounded-lg border border-emerald-200">
              Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function BillingTab() {
  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div>
        <h3 className="text-xl font-semibold text-slate-900 mb-4">Current Plan</h3>
        <div className="p-6 rounded-3xl card-elevated border border-emerald-200 bg-emerald-50/50">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-2xl font-bold text-slate-900">Free Plan</h4>
                <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-medium">
                  Current
                </span>
              </div>
              <p className="text-slate-500">Basic AI-powered dispute assistance</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-slate-900">£0</p>
              <p className="text-sm text-slate-500">forever free</p>
            </div>
          </div>
          
          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Check className="h-4 w-4 text-emerald-600" />
              Up to 3 active cases
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Check className="h-4 w-4 text-emerald-600" />
              AI-guided document generation
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Check className="h-4 w-4 text-emerald-600" />
              Basic legal templates
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Check className="h-4 w-4 text-emerald-600" />
              Email support
            </div>
          </div>
        </div>
      </div>

      {/* Pro Plan - Coming Soon */}
      <div>
        <h3 className="text-xl font-semibold text-slate-900 mb-4">Upgrade to Pro</h3>
        <div className="p-6 rounded-3xl card-elevated border border-slate-200 relative overflow-hidden">
          <div className="absolute top-4 right-4">
            <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 border border-blue-200">
              <Sparkles className="h-3 w-3 text-blue-600" />
              <span className="text-xs text-blue-700 font-medium">Coming Soon</span>
            </div>
          </div>
          
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-2xl bg-blue-600">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-slate-900 mb-1">Pro Plan</h4>
              <p className="text-slate-500">Full power for serious disputes</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Check className="h-4 w-4 text-blue-600" />
                Unlimited cases
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Check className="h-4 w-4 text-blue-600" />
                Priority AI generation
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Check className="h-4 w-4 text-blue-600" />
                Advanced legal templates
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Check className="h-4 w-4 text-blue-600" />
                Lawyer review option
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Check className="h-4 w-4 text-blue-600" />
                Phone support
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Check className="h-4 w-4 text-blue-600" />
                Case analytics
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div>
              <span className="text-2xl font-bold text-slate-900">£19.99</span>
              <span className="text-slate-500">/month</span>
            </div>
            <Button 
              disabled
              className="bg-slate-200 text-slate-500 border-0 cursor-not-allowed"
            >
              Coming Soon
            </Button>
          </div>
        </div>
      </div>

      {/* No billing history yet */}
      <div>
        <h3 className="text-xl font-semibold text-slate-900 mb-4">Billing History</h3>
        <div className="p-8 rounded-2xl card-elevated border border-slate-200 text-center">
          <CreditCard className="h-10 w-10 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-500">No billing history</p>
          <p className="text-sm text-slate-500 mt-1">
            You're on the free plan - upgrade to Pro to see billing history
          </p>
        </div>
      </div>
    </div>
  );
}

function AccountTab({ stats, userId }: { stats: SettingsData["stats"]; userId: string }) {
  const router = useRouter();
  const { signOut } = useClerk();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/user/export");
      if (!response.ok) throw new Error("Export failed");
      
      const data = await response.json();
      
      // Create and download JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `disputehub-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Data exported successfully");
    } catch {
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/user/delete", { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
      
      toast.success("Account deleted. Redirecting...");
      setTimeout(() => router.push("/"), 2000);
    } catch {
      toast.error("Failed to delete account");
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-slate-900 mb-4">Account Statistics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl card-elevated border border-slate-200">
            <FileText className="h-8 w-8 text-blue-600 mb-2" />
            <p className="text-3xl font-bold text-slate-900">{stats.disputes}</p>
            <p className="text-sm text-slate-500">Total Cases</p>
          </div>
          <div className="p-6 rounded-2xl card-elevated border border-slate-200">
            <FileText className="h-8 w-8 text-purple-600 mb-2" />
            <p className="text-3xl font-bold text-slate-900">{stats.documents}</p>
            <p className="text-sm text-slate-500">Documents Generated</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-slate-900 mb-4">Data & Privacy</h3>
        <div className="space-y-3">
          <Button
            variant="outline"
            onClick={handleExportData}
            disabled={isExporting}
            className="w-full justify-start border-slate-200 text-slate-700 hover:bg-slate-50 h-auto py-4"
          >
            {isExporting ? (
              <Loader2 className="mr-3 h-5 w-5 animate-spin" />
            ) : (
              <Download className="mr-3 h-5 w-5" />
            )}
            <div className="text-left">
              <p className="font-medium">Export Your Data</p>
              <p className="text-xs text-slate-500">Download all your case data as JSON</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start border-slate-200 text-slate-700 hover:bg-slate-50 h-auto py-4"
          >
            <Shield className="mr-3 h-5 w-5" />
            <div className="text-left">
              <p className="font-medium">Privacy Settings</p>
              <p className="text-xs text-slate-500">Manage data collection preferences</p>
            </div>
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-slate-900 mb-4">Danger Zone</h3>
        <div className="p-6 rounded-2xl card-elevated border border-red-200">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-red-600 mt-1" />
            <div className="flex-1">
              <h4 className="font-semibold text-slate-900 mb-2">Delete Account</h4>
              <p className="text-sm text-slate-500 mb-4">
                Permanently delete your account and all associated data. This action cannot be
                undone.
              </p>
              
              {!showDeleteConfirm ? (
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-red-700 font-medium">
                    Are you sure? This will delete all {stats.disputes} cases and {stats.documents} documents.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleDeleteAccount}
                      disabled={isDeleting}
                      className="bg-red-600 hover:bg-red-700 text-white border-0"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Yes, Delete Everything
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-200">
        <Button
          onClick={async () => {
            setIsSigningOut(true);
            await signOut();
            router.push("/");
          }}
          disabled={isSigningOut}
          variant="outline"
          className="w-full border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          {isSigningOut ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Signing out...
            </>
          ) : (
            <>
              <LogOut className="mr-2 h-5 w-5" />
              Sign Out
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function EmailTab() {
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<EmailAccountData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/email/accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch {
      console.error("Failed to fetch email accounts");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Handle OAuth callback params
  useEffect(() => {
    const connected = searchParams.get("email_connected");
    const error = searchParams.get("email_error");

    if (connected) {
      toast.success(`Email connected: ${connected}`);
      fetchAccounts();
      // Clean URL
      window.history.replaceState({}, "", "/settings");
    }
    if (error) {
      toast.error(`Email connection failed: ${error}`);
      window.history.replaceState({}, "", "/settings");
    }
  }, [searchParams, fetchAccounts]);

  const connectEmail = async (provider: string) => {
    setIsConnecting(provider);
    try {
      const res = await fetch("/api/email/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        toast.error("Failed to get authorization URL");
      }
    } catch {
      toast.error("Failed to connect email");
    } finally {
      setIsConnecting(null);
    }
  };

  const disconnectEmail = async (accountId: string) => {
    setIsDisconnecting(accountId);
    try {
      const res = await fetch("/api/email/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });
      if (res.ok) {
        toast.success("Email disconnected");
        fetchAccounts();
      } else {
        toast.error("Failed to disconnect");
      }
    } catch {
      toast.error("Failed to disconnect email");
    } finally {
      setIsDisconnecting(null);
    }
  };

  const syncInbox = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/email/inbox/sync", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        const totalSynced = data.sync?.reduce((sum: number, s: any) => sum + (s.synced || 0), 0) || 0;
        toast.success(`Synced ${totalSynced} new emails, analyzed ${data.analyzed || 0}`);
        fetchAccounts();
      } else {
        toast.error("Sync failed");
      }
    } catch {
      toast.error("Failed to sync inbox");
    } finally {
      setIsSyncing(false);
    }
  };

  const gmailConnected = accounts.find((a) => a.provider === "GMAIL");
  const outlookConnected = accounts.find((a) => a.provider === "OUTLOOK");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">Email Integration</h3>
        <p className="text-sm text-slate-500">
          Connect your email to let AI send legal correspondence on your behalf. You always approve before anything is sent.
        </p>
      </div>

      {/* Connected Accounts */}
      {accounts.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-3">Connected Accounts</h4>
          <div className="space-y-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="p-5 rounded-2xl card-elevated border border-slate-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      account.provider === "GMAIL" ? "bg-red-50" : "bg-blue-50"
                    }`}>
                      <Mail className={`h-5 w-5 ${
                        account.provider === "GMAIL" ? "text-red-600" : "text-blue-600"
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{account.email}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          account.provider === "GMAIL"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}>
                          {account.provider === "GMAIL" ? "Gmail" : "Outlook"}
                        </span>
                        <span className="text-xs text-emerald-600 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Connected
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => disconnectEmail(account.id)}
                    disabled={isDisconnecting === account.id}
                    className="border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200"
                  >
                    {isDisconnecting === account.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Unplug className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-lg font-bold text-slate-900">{account._count.emailMessages}</p>
                    <p className="text-[10px] text-slate-400">Emails Synced</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-lg font-bold text-slate-900">{account._count.emailDrafts}</p>
                    <p className="text-[10px] text-slate-400">AI Drafts</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-[11px] font-medium text-slate-700">
                      {account.lastSyncAt
                        ? new Date(account.lastSyncAt).toLocaleString("en-GB", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Never"}
                    </p>
                    <p className="text-[10px] text-slate-400">Last Sync</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sync Button */}
          <Button
            onClick={syncInbox}
            disabled={isSyncing}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white border-0"
          >
            {isSyncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" /> Sync All Inboxes
              </>
            )}
          </Button>
        </div>
      )}

      {/* Connect New Account */}
      <div>
        <h4 className="text-sm font-medium text-slate-700 mb-3">
          {accounts.length > 0 ? "Add Another Account" : "Connect Your Email"}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Gmail */}
          <div className={`p-5 rounded-2xl border transition-all ${
            gmailConnected
              ? "border-emerald-200 bg-emerald-50/50"
              : "border-slate-200 card-elevated hover:border-red-200"
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"/>
                  <path fill="#34A853" d="M16.04 18.013C14.95 18.717 13.56 19.091 12 19.091c-3.19 0-5.894-2.089-6.862-5.005l-4.04 3.067C3.098 21.219 7.2 24 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"/>
                  <path fill="#4A90D9" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.558-1.17 2.818-2.395 3.558L19.834 21Z"/>
                  <path fill="#FBBC05" d="M5.138 14.086A7.076 7.076 0 0 1 4.909 12c0-.712.098-1.411.229-2.086L1.24 6.65A11.935 11.935 0 0 0 0 12c0 1.934.467 3.76 1.29 5.383l3.848-3.297Z"/>
                </svg>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Gmail</p>
                <p className="text-xs text-slate-500">Google Account</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Send and receive emails via your Gmail account. Supports reading replies and AI analysis.
            </p>
            {gmailConnected ? (
              <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium">
                <CheckCircle className="h-4 w-4" /> Connected as {gmailConnected.email}
              </div>
            ) : (
              <Button
                onClick={() => connectEmail("gmail")}
                disabled={isConnecting === "gmail"}
                className="w-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                {isConnecting === "gmail" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="mr-2 h-4 w-4" />
                )}
                Connect Gmail
              </Button>
            )}
          </div>

          {/* Outlook */}
          <div className={`p-5 rounded-2xl border transition-all ${
            outlookConnected
              ? "border-emerald-200 bg-emerald-50/50"
              : "border-slate-200 card-elevated hover:border-blue-200"
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#0078D4" d="M24 7.387v10.478c0 .23-.08.424-.238.583a.793.793 0 0 1-.582.238h-8.304V6.567h8.304c.23 0 .424.08.582.238A.793.793 0 0 1 24 7.387Z"/>
                  <path fill="#0364B8" d="M14.876 6.567v12.119l-2.813 1.6L0 14.876V7.387c0-.23.08-.424.238-.582A.793.793 0 0 1 .82 6.567h14.056Z"/>
                  <path fill="#0078D4" d="M14.876 6.567H.82a.793.793 0 0 0-.582.238A.793.793 0 0 0 0 7.387v10.478c0 .23.08.424.238.583a.793.793 0 0 0 .582.238h14.056a.793.793 0 0 0 .582-.238.793.793 0 0 0 .238-.583V7.387a.793.793 0 0 0-.238-.582.793.793 0 0 0-.582-.238Z"/>
                  <path fill="#fff" d="M7.438 9.273c.672-.552 1.523-.825 2.527-.825s1.858.273 2.527.825c.667.554 1.003 1.24 1.003 2.06 0 .822-.336 1.51-1.003 2.063-.67.552-1.523.827-2.527.827s-1.855-.275-2.527-.827c-.672-.554-1.003-1.241-1.003-2.063 0-.82.331-1.506 1.003-2.06Zm.985 3.324c.405.373.92.557 1.542.557s1.137-.184 1.542-.557c.405-.373.607-.835.607-1.384 0-.551-.202-1.012-.607-1.384-.405-.373-.92-.557-1.542-.557s-1.137.184-1.542.557c-.406.372-.607.833-.607 1.384 0 .549.201 1.011.607 1.384Z"/>
                </svg>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Outlook</p>
                <p className="text-xs text-slate-500">Microsoft Account</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Send and receive emails via Outlook/Hotmail. Full Microsoft 365 support included.
            </p>
            {outlookConnected ? (
              <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium">
                <CheckCircle className="h-4 w-4" /> Connected as {outlookConnected.email}
              </div>
            ) : (
              <Button
                onClick={() => connectEmail("outlook")}
                disabled={isConnecting === "outlook"}
                className="w-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                {isConnecting === "outlook" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="mr-2 h-4 w-4" />
                )}
                Connect Outlook
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="p-6 rounded-2xl bg-blue-50 border border-blue-100">
        <h4 className="font-semibold text-slate-900 mb-3">How Email Integration Works</h4>
        <div className="space-y-3">
          {[
            { step: "1", title: "Connect your email", desc: "Securely link your Gmail or Outlook via OAuth. Your credentials are never stored." },
            { step: "2", title: "AI drafts correspondence", desc: "When your case needs a letter, follow-up, or response, AI generates the email for you." },
            { step: "3", title: "You review & approve", desc: "Every email shows a preview first. Nothing is sent without your explicit approval." },
            { step: "4", title: "AI reads replies", desc: "Incoming responses are automatically analyzed. AI suggests your next steps." },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {item.step}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Note */}
      <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-slate-900">Your email is secure</p>
            <p className="text-xs text-slate-500">
              OAuth tokens are encrypted with AES-256-GCM at rest. We never store your email password. 
              You can disconnect at any time and all tokens are immediately invalidated.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsClient({ user, stats }: SettingsData) {
  const [activeTab, setActiveTab] = useState("profile");

  const handleProfileSave = async (data: ProfileFormData) => {
    const response = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update");
  };

  return (
    <div className="space-y-0 sm:space-y-8 pb-8">
      {/* Header */}
      <div className="px-5 sm:px-0 pt-5 sm:pt-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1 sm:mb-3">
          Settings
        </h1>
        <p className="text-slate-500 text-sm sm:text-lg hidden sm:block">
          Manage your account, preferences, and security
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 px-5 sm:px-0 scrollbar-hide pt-3 sm:pt-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-base font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white border border-blue-600"
                  : "card-elevated text-slate-600 hover:text-slate-900 border border-slate-200"
              }`}
            >
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="sm:rounded-3xl p-4 sm:p-8 sm:card-elevated sm:border sm:border-slate-200 mt-3 sm:mt-0">
        {activeTab === "profile" && <ProfileTab user={user} onSave={handleProfileSave} />}
        {activeTab === "email" && <EmailTab />}
        {activeTab === "notifications" && <NotificationsTab />}
        {activeTab === "security" && <SecurityTab />}
        {activeTab === "billing" && <BillingTab />}
        {activeTab === "account" && <AccountTab stats={stats} userId={user.id} />}
      </div>
    </div>
  );
}
