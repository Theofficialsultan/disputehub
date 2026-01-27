import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";

/**
 * Phase 8.4 - Notification Service
 * System-only notification creation
 * NO AI, NO USER CONTROL, NO DECISIONS
 */

interface CreateNotificationParams {
  userId: string;
  caseId: string;
  type: NotificationType;
  message: string;
}

/**
 * Create a notification (system-only)
 * Deduplicates based on caseId + type + recent time window (1 hour)
 */
export async function createNotification(params: CreateNotificationParams) {
  const { userId, caseId, type, message } = params;

  // Deduplication: Check if similar notification exists within last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const existing = await prisma.notification.findFirst({
    where: {
      caseId,
      type,
      createdAt: {
        gte: oneHourAgo,
      },
    },
  });

  if (existing) {
    // Duplicate detected, skip creation
    return existing;
  }

  // Create notification
  const notification = await prisma.notification.create({
    data: {
      userId,
      caseId,
      type,
      message,
    },
  });

  return notification;
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string, userId: string) {
  return prisma.notification.update({
    where: {
      id: notificationId,
      userId, // Ensure user owns the notification
    },
    data: {
      read: true,
    },
  });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: {
      userId,
      read: false,
    },
    data: {
      read: true,
    },
  });
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: {
      userId,
      read: false,
    },
  });
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(userId: string, limit = 50) {
  return prisma.notification.findMany({
    where: {
      userId,
    },
    include: {
      case: {
        select: {
          id: true,
          title: true,
          type: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
}
