"use client";

import { Clock, AlertTriangle, CheckCircle } from "lucide-react";

interface DeadlineCountdownProps {
  waitingUntil: string | null;
  daysRemaining: number | null;
  lifecycleStatus: string;
}

export function DeadlineCountdown({
  waitingUntil,
  daysRemaining,
  lifecycleStatus,
}: DeadlineCountdownProps) {
  // Only show for relevant states
  if (!waitingUntil || lifecycleStatus === "DRAFT" || lifecycleStatus === "CLOSED") {
    return null;
  }

  const getUrgencyConfig = () => {
    if (daysRemaining === null) {
      return {
        icon: Clock,
        color: "text-gray-600",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
        label: "Deadline",
      };
    }

    if (daysRemaining < 0) {
      // Overdue
      return {
        icon: AlertTriangle,
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        label: "Overdue",
      };
    }

    if (daysRemaining <= 3) {
      // Close to deadline
      return {
        icon: AlertTriangle,
        color: "text-amber-600",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        label: "Urgent",
      };
    }

    // Normal waiting
    return {
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      label: "Waiting",
    };
  };

  const config = getUrgencyConfig();
  const Icon = config.icon;

  const getDeadlineText = () => {
    if (daysRemaining === null) {
      return "Deadline set";
    }

    if (daysRemaining < 0) {
      const overdueDays = Math.abs(daysRemaining);
      return `Deadline missed ${overdueDays} day${overdueDays !== 1 ? "s" : ""} ago`;
    }

    if (daysRemaining === 0) {
      return "Deadline is today";
    }

    return `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} remaining to respond`;
  };

  return (
    <div
      className={`rounded-lg border ${config.borderColor} ${config.bgColor} p-4`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`h-5 w-5 flex-shrink-0 ${config.color}`} />
        <div className="flex-1">
          <p className={`text-xs font-medium uppercase tracking-wide ${config.color}`}>
            {config.label}
          </p>
          <p className={`mt-1 text-sm font-semibold ${config.color}`}>
            {getDeadlineText()}
          </p>
        </div>
      </div>
    </div>
  );
}
