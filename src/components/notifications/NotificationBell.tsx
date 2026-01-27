"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  case: {
    id: string;
    title: string;
    type: string;
  };
}

const NOTIFICATION_ICONS = {
  DOCUMENT_READY: FileText,
  DOCUMENT_SENT: FileText,
  DEADLINE_APPROACHING: Clock,
  DEADLINE_MISSED: AlertCircle,
  FOLLOW_UP_GENERATED: FileText,
  CASE_CLOSED: CheckCircle,
};

const NOTIFICATION_COLORS = {
  DOCUMENT_READY: "text-emerald-400",
  DOCUMENT_SENT: "text-blue-400",
  DEADLINE_APPROACHING: "text-orange-400",
  DEADLINE_MISSED: "text-red-400",
  FOLLOW_UP_GENERATED: "text-purple-400",
  CASE_CLOSED: "text-slate-400",
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
      });
      await fetchNotifications();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      });
      await fetchNotifications();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-slate-400 hover:text-white hover:bg-indigo-500/20"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-96 glass-strong border-indigo-500/20 p-0 rounded-2xl"
      >
        <div className="p-4 border-b border-indigo-500/20 flex items-center justify-between">
          <h3 className="font-semibold text-white">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={markAllAsRead}
              disabled={isLoading}
              className="text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
            >
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-indigo-500/10">
              {notifications.map((notification) => {
                const Icon =
                  NOTIFICATION_ICONS[
                    notification.type as keyof typeof NOTIFICATION_ICONS
                  ] || Bell;
                const iconColor =
                  NOTIFICATION_COLORS[
                    notification.type as keyof typeof NOTIFICATION_COLORS
                  ] || "text-slate-400";

                return (
                  <Link
                    key={notification.id}
                    href={`/disputes/${notification.case.id}/case`}
                    onClick={() => {
                      if (!notification.read) {
                        markAsRead(notification.id);
                      }
                      setIsOpen(false);
                    }}
                    className={`block p-4 hover:bg-indigo-500/5 transition-colors ${
                      !notification.read ? "bg-indigo-500/10" : ""
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className={`shrink-0 ${iconColor}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white mb-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {notification.case.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="shrink-0">
                          <div className="h-2 w-2 rounded-full bg-indigo-500" />
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
