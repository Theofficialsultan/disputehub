"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  Bell,
  FileText,
  Clock,
  MessageSquare,
  Newspaper,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

interface EmailPreferences {
  documentReady: boolean;
  deadlineReminders: boolean;
  caseUpdates: boolean;
  marketingEmails: boolean;
  weeklyDigest: boolean;
  reminderDaysBefore: number;
}

export function EmailPreferencesForm() {
  const [preferences, setPreferences] = useState<EmailPreferences>({
    documentReady: true,
    deadlineReminders: true,
    caseUpdates: true,
    marketingEmails: false,
    weeklyDigest: true,
    reminderDaysBefore: 3,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await fetch("/api/user/email-preferences");
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error("Failed to load preferences:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = (key: keyof EmailPreferences, value: boolean | number) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const savePreferences = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/user/email-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) throw new Error("Failed to save");

      toast.success("Email preferences saved");
      setHasChanges(false);
    } catch (error) {
      toast.error("Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <Mail className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Email Notifications</h3>
      </div>

      <div className="space-y-6">
        {/* Document notifications */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-cyan-500" />
            </div>
            <div>
              <Label htmlFor="documentReady" className="font-medium">
                Document Ready
              </Label>
              <p className="text-sm text-muted-foreground">
                Get notified when your documents are ready to download
              </p>
            </div>
          </div>
          <Switch
            id="documentReady"
            checked={preferences.documentReady}
            onCheckedChange={(checked) => updatePreference("documentReady", checked)}
          />
        </div>

        {/* Deadline reminders */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <Label htmlFor="deadlineReminders" className="font-medium">
                  Deadline Reminders
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive reminders before important deadlines
                </p>
              </div>
            </div>
            <Switch
              id="deadlineReminders"
              checked={preferences.deadlineReminders}
              onCheckedChange={(checked) => updatePreference("deadlineReminders", checked)}
            />
          </div>

          {preferences.deadlineReminders && (
            <div className="ml-13 pl-3 border-l-2 border-muted">
              <Label className="text-sm text-muted-foreground mb-2 block">
                Remind me this many days before:
              </Label>
              <Select
                value={preferences.reminderDaysBefore.toString()}
                onValueChange={(value) => updatePreference("reminderDaysBefore", parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="2">2 days</SelectItem>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="5">5 days</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Case updates */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Bell className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <Label htmlFor="caseUpdates" className="font-medium">
                Case Updates
              </Label>
              <p className="text-sm text-muted-foreground">
                Get notified about important case changes
              </p>
            </div>
          </div>
          <Switch
            id="caseUpdates"
            checked={preferences.caseUpdates}
            onCheckedChange={(checked) => updatePreference("caseUpdates", checked)}
          />
        </div>

        {/* Weekly digest */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Newspaper className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <Label htmlFor="weeklyDigest" className="font-medium">
                Weekly Digest
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive a weekly summary of your cases
              </p>
            </div>
          </div>
          <Switch
            id="weeklyDigest"
            checked={preferences.weeklyDigest}
            onCheckedChange={(checked) => updatePreference("weeklyDigest", checked)}
          />
        </div>

        {/* Marketing emails */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <Label htmlFor="marketingEmails" className="font-medium">
                Marketing & Tips
              </Label>
              <p className="text-sm text-muted-foreground">
                Occasional tips and product updates
              </p>
            </div>
          </div>
          <Switch
            id="marketingEmails"
            checked={preferences.marketingEmails}
            onCheckedChange={(checked) => updatePreference("marketingEmails", checked)}
          />
        </div>

        {/* Save button */}
        {hasChanges && (
          <div className="pt-4 border-t">
            <Button onClick={savePreferences} disabled={isSaving} className="w-full gap-2">
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
