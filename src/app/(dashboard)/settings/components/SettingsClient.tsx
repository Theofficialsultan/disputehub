"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";

interface SettingsData {
  user: {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
    createdAt: Date;
  };
  stats: {
    disputes: number;
    documents: number;
  };
}

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "account", label: "Account", icon: Lock },
];

function ProfileTab({ user }: { user: SettingsData["user"] }) {
  const [isSaving, setIsSaving] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="firstName" className="text-slate-300">
              First Name
            </Label>
            <Input
              id="firstName"
              defaultValue={user.firstName || ""}
              className="mt-2 glass-strong border-indigo-500/20 text-white"
            />
          </div>
          <div>
            <Label htmlFor="lastName" className="text-slate-300">
              Last Name
            </Label>
            <Input
              id="lastName"
              defaultValue={user.lastName || ""}
              className="mt-2 glass-strong border-indigo-500/20 text-white"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="email" className="text-slate-300">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              defaultValue={user.email || ""}
              disabled
              className="mt-2 glass-strong border-indigo-500/20 text-slate-400"
            />
            <p className="text-xs text-slate-500 mt-2">
              Email cannot be changed. Contact support if needed.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-indigo-500/20">
        <p className="text-sm text-slate-400">
          Member since {new Date(user.createdAt).toLocaleDateString()}
        </p>
        <Button
          onClick={() => {
            setIsSaving(true);
            setTimeout(() => setIsSaving(false), 1000);
          }}
          disabled={isSaving}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0"
        >
          {isSaving ? (
            <>Saving...</>
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
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Email Notifications</h3>
        <div className="space-y-4">
          {[
            { label: "Case updates", desc: "Get notified about case progress and changes" },
            { label: "Document generation", desc: "When documents are ready to download" },
            { label: "Deadline reminders", desc: "Reminders before deadlines expire" },
            { label: "Lawyer updates", desc: "Messages from your assigned lawyer" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between p-4 rounded-2xl glass-strong border border-indigo-500/20"
            >
              <div>
                <p className="font-medium text-white">{item.label}</p>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </div>
              <Switch defaultChecked />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Push Notifications</h3>
        <div className="space-y-4">
          {[
            { label: "Browser notifications", desc: "Show notifications in your browser" },
            { label: "Mobile push", desc: "Send notifications to your mobile device" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between p-4 rounded-2xl glass-strong border border-indigo-500/20"
            >
              <div>
                <p className="font-medium text-white">{item.label}</p>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </div>
              <Switch />
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
        <h3 className="text-xl font-semibold text-white mb-4">Password</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="currentPassword" className="text-slate-300">
              Current Password
            </Label>
            <Input
              id="currentPassword"
              type="password"
              className="mt-2 glass-strong border-indigo-500/20 text-white"
            />
          </div>
          <div>
            <Label htmlFor="newPassword" className="text-slate-300">
              New Password
            </Label>
            <Input
              id="newPassword"
              type="password"
              className="mt-2 glass-strong border-indigo-500/20 text-white"
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword" className="text-slate-300">
              Confirm New Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              className="mt-2 glass-strong border-indigo-500/20 text-white"
            />
          </div>
          <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0">
            Update Password
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Two-Factor Authentication</h3>
        <div className="p-6 rounded-2xl glass-strong border border-indigo-500/20">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/20">
              <Check className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-white mb-1">2FA is enabled</p>
              <p className="text-sm text-slate-400 mb-4">
                Your account is protected with two-factor authentication
              </p>
              <Button variant="outline" size="sm" className="border-indigo-500/30 text-white">
                Manage 2FA
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Active Sessions</h3>
        <div className="space-y-3">
          {[
            { device: "Chrome on Windows", location: "London, UK", current: true },
            { device: "Safari on iPhone", location: "London, UK", current: false },
          ].map((session, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 rounded-2xl glass-strong border border-indigo-500/20"
            >
              <div>
                <p className="font-medium text-white">{session.device}</p>
                <p className="text-sm text-slate-400">{session.location}</p>
              </div>
              {session.current ? (
                <span className="text-xs text-emerald-400 font-medium">Current Session</span>
              ) : (
                <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                  Revoke
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BillingTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Current Plan</h3>
        <div className="p-6 rounded-3xl glass-strong border border-indigo-500/20">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-2xl font-bold text-white mb-2">Professional Plan</h4>
              <p className="text-slate-400">Unlimited cases and AI generation</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-white">£29.99</p>
              <p className="text-sm text-slate-400">per month</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-indigo-500/30 text-white hover:bg-indigo-500/10"
            >
              Change Plan
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              Cancel Subscription
            </Button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Payment Method</h3>
        <div className="p-6 rounded-2xl glass-strong border border-indigo-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-medium text-white">•••• •••• •••• 4242</p>
                <p className="text-sm text-slate-400">Expires 12/25</p>
              </div>
            </div>
            <Button variant="ghost" className="text-indigo-400">
              Update
            </Button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Billing History</h3>
        <div className="space-y-3">
          {[
            { date: "Dec 24, 2025", amount: "£29.99", status: "Paid" },
            { date: "Nov 24, 2025", amount: "£29.99", status: "Paid" },
            { date: "Oct 24, 2025", amount: "£29.99", status: "Paid" },
          ].map((invoice, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 rounded-2xl glass-strong border border-indigo-500/20"
            >
              <div className="flex items-center gap-4">
                <Calendar className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="font-medium text-white">{invoice.date}</p>
                  <p className="text-sm text-slate-400">{invoice.amount}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-emerald-400 font-medium">{invoice.status}</span>
                <Button variant="ghost" size="sm" className="text-indigo-400">
                  <FileText className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AccountTab({ stats }: { stats: SettingsData["stats"] }) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Account Statistics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-6 rounded-2xl glass-strong border border-indigo-500/20">
            <FileText className="h-8 w-8 text-indigo-400 mb-2" />
            <p className="text-3xl font-bold text-white">{stats.disputes}</p>
            <p className="text-sm text-slate-400">Total Cases</p>
          </div>
          <div className="p-6 rounded-2xl glass-strong border border-indigo-500/20">
            <FileText className="h-8 w-8 text-purple-400 mb-2" />
            <p className="text-3xl font-bold text-white">{stats.documents}</p>
            <p className="text-sm text-slate-400">Documents Generated</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Data & Privacy</h3>
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start border-indigo-500/30 text-white hover:bg-indigo-500/10 h-auto py-4"
          >
            <FileText className="mr-3 h-5 w-5" />
            <div className="text-left">
              <p className="font-medium">Export Your Data</p>
              <p className="text-xs text-slate-400">Download all your case data</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start border-indigo-500/30 text-white hover:bg-indigo-500/10 h-auto py-4"
          >
            <Shield className="mr-3 h-5 w-5" />
            <div className="text-left">
              <p className="font-medium">Privacy Settings</p>
              <p className="text-xs text-slate-400">Manage data collection preferences</p>
            </div>
          </Button>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Danger Zone</h3>
        <div className="p-6 rounded-2xl glass-strong border border-red-500/30">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-red-400 mt-1" />
            <div className="flex-1">
              <h4 className="font-semibold text-white mb-2">Delete Account</h4>
              <p className="text-sm text-slate-400 mb-4">
                Permanently delete your account and all associated data. This action cannot be
                undone.
              </p>
              <Button
                variant="outline"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-indigo-500/20">
        <Button
          onClick={() => {
            // In a real app, this would call your logout API
            router.push("/");
          }}
          variant="outline"
          className="w-full border-indigo-500/30 text-white hover:bg-indigo-500/10"
        >
          <LogOut className="mr-2 h-5 w-5" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

export default function SettingsClient({ user, stats }: SettingsData) {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-5xl font-bold text-white mb-3 bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-slate-400 text-lg">
          Manage your account, preferences, and security
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-indigo-600/30 to-purple-600/30 text-white border border-indigo-500/40 shadow-lg"
                  : "glass-strong text-slate-400 hover:text-white border border-transparent"
              }`}
            >
              <Icon className="h-5 w-5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="rounded-3xl p-8 glass-strong border border-indigo-500/20">
        {activeTab === "profile" && <ProfileTab user={user} />}
        {activeTab === "notifications" && <NotificationsTab />}
        {activeTab === "security" && <SecurityTab />}
        {activeTab === "billing" && <BillingTab />}
        {activeTab === "account" && <AccountTab stats={stats} />}
      </div>
    </div>
  );
}
