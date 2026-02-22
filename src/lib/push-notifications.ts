/**
 * Push Notification Service
 * Sends Expo push notifications to mobile devices
 */

import { prisma } from "@/lib/prisma";

interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: "default" | null;
  badge?: number;
  channelId?: string;
}

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: "default" | null;
  badge?: number;
  channelId?: string;
}

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

/**
 * Send push notification to a specific user
 */
export async function sendPushNotification(
  userId: string,
  payload: PushNotificationPayload
): Promise<{ success: boolean; sent: number; errors: string[] }> {
  try {
    // Get all active push tokens for this user
    const tokens = await prisma.pushToken.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    if (tokens.length === 0) {
      return { success: true, sent: 0, errors: [] };
    }

    // Build messages
    const messages: ExpoPushMessage[] = tokens.map((t) => ({
      to: t.token,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      sound: payload.sound ?? "default",
      badge: payload.badge,
      channelId: payload.channelId ?? "default",
    }));

    // Send to Expo
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(messages),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Push] Expo API error:", errorText);
      return { success: false, sent: 0, errors: [errorText] };
    }

    const result = await response.json();
    const errors: string[] = [];

    // Check for individual errors and deactivate invalid tokens
    if (result.data) {
      for (let i = 0; i < result.data.length; i++) {
        const ticket = result.data[i];
        if (ticket.status === "error") {
          errors.push(ticket.message);
          
          // Deactivate invalid tokens
          if (
            ticket.details?.error === "DeviceNotRegistered" ||
            ticket.details?.error === "InvalidCredentials"
          ) {
            await prisma.pushToken.update({
              where: { token: tokens[i].token },
              data: { isActive: false },
            });
          }
        }
      }
    }

    return {
      success: errors.length === 0,
      sent: tokens.length - errors.length,
      errors,
    };
  } catch (error) {
    console.error("[Push] Send error:", error);
    return {
      success: false,
      sent: 0,
      errors: [(error as Error).message],
    };
  }
}

/**
 * Send push notification for a case event
 */
export async function notifyCaseEvent(
  caseId: string,
  type: "DOCUMENT_READY" | "DEADLINE_APPROACHING" | "CASE_UPDATE" | "MESSAGE",
  customPayload?: Partial<PushNotificationPayload>
): Promise<void> {
  try {
    const dispute = await prisma.dispute.findUnique({
      where: { id: caseId },
      select: {
        id: true,
        title: true,
        userId: true,
      },
    });

    if (!dispute) return;

    const payloads: Record<string, PushNotificationPayload> = {
      DOCUMENT_READY: {
        title: "📄 Document Ready",
        body: `Your documents for "${dispute.title}" are ready to download.`,
        data: { caseId, screen: "CaseDocuments" },
      },
      DEADLINE_APPROACHING: {
        title: "⏰ Deadline Approaching",
        body: `Deadline approaching for "${dispute.title}". Check your timeline.`,
        data: { caseId, screen: "CaseTimeline" },
      },
      CASE_UPDATE: {
        title: "📢 Case Update",
        body: `There's an update on "${dispute.title}".`,
        data: { caseId, screen: "Case" },
      },
      MESSAGE: {
        title: "💬 New Message",
        body: `New message in "${dispute.title}".`,
        data: { caseId, screen: "CaseChat" },
      },
    };

    const payload = { ...payloads[type], ...customPayload };

    await sendPushNotification(dispute.userId, payload);

    // Also create in-app notification
    await prisma.notification.create({
      data: {
        userId: dispute.userId,
        caseId: dispute.id,
        type: type === "DOCUMENT_READY" ? "DOCUMENT_READY" : "DEADLINE_APPROACHING",
        message: payload.body,
      },
    });
  } catch (error) {
    console.error("[Push] notifyCaseEvent error:", error);
  }
}

/**
 * Send deadline reminder notifications
 * Call this from a cron job
 */
export async function sendDeadlineReminders(): Promise<void> {
  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Find cases with deadlines in the next 3 days
    const casesWithDeadlines = await prisma.dispute.findMany({
      where: {
        waitingUntil: {
          gte: now,
          lte: threeDaysFromNow,
        },
        lifecycleStatus: {
          in: ["AWAITING_RESPONSE", "DOCUMENT_SENT"],
        },
      },
      select: {
        id: true,
        title: true,
        userId: true,
        waitingUntil: true,
      },
    });

    for (const dispute of casesWithDeadlines) {
      const daysUntil = Math.ceil(
        (dispute.waitingUntil!.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      );

      await sendPushNotification(dispute.userId, {
        title: "⏰ Deadline Reminder",
        body: `${daysUntil} day${daysUntil > 1 ? "s" : ""} left for "${dispute.title}".`,
        data: { caseId: dispute.id, screen: "CaseTimeline" },
      });
    }
  } catch (error) {
    console.error("[Push] sendDeadlineReminders error:", error);
  }
}
