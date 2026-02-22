"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Deadline {
  id: string;
  caseId: string;
  caseTitle: string;
  type: string;
  title: string;
  description: string;
  dueDate: Date;
  status: "UPCOMING" | "DUE_SOON" | "OVERDUE" | "COMPLETED";
  daysRemaining: number;
}

interface CalendarDay {
  date: Date;
  isToday: boolean;
  isCurrentMonth: boolean;
  deadlines: Deadline[];
}

export function DeadlineCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    fetchDeadlines();
  }, [year, month]);

  const fetchDeadlines = async () => {
    setLoading(true);
    try {
      // Note: You'd need to create this API endpoint
      // For now, using placeholder data structure
      const response = await fetch(`/api/deadlines?year=${year}&month=${month}`);
      if (response.ok) {
        const data = await response.json();
        setDeadlines(data.deadlines || []);
      }
    } catch (error) {
      console.error("Error fetching deadlines:", error);
      // Use empty array if API doesn't exist yet
      setDeadlines([]);
    } finally {
      setLoading(false);
    }
  };

  const calendarDays = useMemo(() => {
    const days: CalendarDay[] = [];
    const today = new Date();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get starting day (Monday = 0)
    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;

    // Create deadline lookup
    const deadlinesByDate = new Map<string, Deadline[]>();
    deadlines.forEach((d) => {
      const dateKey = new Date(d.dueDate).toISOString().split("T")[0];
      if (!deadlinesByDate.has(dateKey)) {
        deadlinesByDate.set(dateKey, []);
      }
      deadlinesByDate.get(dateKey)!.push(d);
    });

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      const dateKey = date.toISOString().split("T")[0];
      days.push({
        date,
        isToday: false,
        isCurrentMonth: false,
        deadlines: deadlinesByDate.get(dateKey) || [],
      });
    }

    // Current month days
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateKey = date.toISOString().split("T")[0];
      days.push({
        date,
        isToday: date.toDateString() === today.toDateString(),
        isCurrentMonth: true,
        deadlines: deadlinesByDate.get(dateKey) || [],
      });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      const dateKey = date.toISOString().split("T")[0];
      days.push({
        date,
        isToday: false,
        isCurrentMonth: false,
        deadlines: deadlinesByDate.get(dateKey) || [],
      });
    }

    return days;
  }, [year, month, deadlines]);

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1));
      return newDate;
    });
  };

  const monthName = currentDate.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const getDeadlineStyle = (deadline: Deadline) => {
    switch (deadline.status) {
      case "OVERDUE":
        return "bg-red-500/20 border-red-500/30 text-red-400";
      case "DUE_SOON":
        return "bg-orange-500/20 border-orange-500/30 text-orange-400";
      case "COMPLETED":
        return "bg-green-500/20 border-green-500/30 text-green-400";
      default:
        return "bg-blue-500/20 border-blue-500/30 text-blue-400";
    }
  };

  return (
    <div className="rounded-2xl glass-strong border border-indigo-500/20 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-white">Deadline Calendar</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateMonth("prev")}
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-white font-medium min-w-[150px] text-center">
            {monthName}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateMonth("next")}
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-slate-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          const hasDeadlines = day.deadlines.length > 0;
          const hasOverdue = day.deadlines.some((d) => d.status === "OVERDUE");
          const hasDueSoon = day.deadlines.some((d) => d.status === "DUE_SOON");

          return (
            <button
              key={index}
              onClick={() => hasDeadlines && setSelectedDay(day)}
              disabled={!hasDeadlines}
              className={`
                aspect-square p-1 rounded-lg text-sm transition-all relative
                ${
                  day.isToday
                    ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold"
                    : day.isCurrentMonth
                    ? hasDeadlines
                      ? "bg-slate-800/50 hover:bg-slate-700/50 cursor-pointer"
                      : "text-slate-400"
                    : "text-slate-600"
                }
                ${hasDeadlines && !day.isToday ? "ring-1 ring-inset" : ""}
                ${
                  hasOverdue
                    ? "ring-red-500/50"
                    : hasDueSoon
                    ? "ring-orange-500/50"
                    : hasDeadlines
                    ? "ring-blue-500/30"
                    : ""
                }
              `}
            >
              <span className={day.isToday ? "" : hasDeadlines ? "text-white" : ""}>
                {day.date.getDate()}
              </span>
              {hasDeadlines && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {day.deadlines.slice(0, 3).map((d, i) => (
                    <div
                      key={i}
                      className={`w-1 h-1 rounded-full ${
                        d.status === "OVERDUE"
                          ? "bg-red-400"
                          : d.status === "DUE_SOON"
                          ? "bg-orange-400"
                          : d.status === "COMPLETED"
                          ? "bg-green-400"
                          : "bg-blue-400"
                      }`}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-800">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600" />
          <span className="text-slate-400">Today</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded-md bg-blue-500" />
          <span className="text-slate-400">Upcoming</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded-md bg-orange-500" />
          <span className="text-slate-400">Due Soon</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <div className="w-3 h-3 rounded-md bg-red-500" />
          <span className="text-slate-400">Overdue</span>
        </div>
      </div>

      {/* Selected Day Details Modal */}
      {selectedDay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setSelectedDay(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl glass-strong border border-indigo-500/20 p-6 animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-white">
                {selectedDay.date.toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </h4>
              <span className="text-sm text-slate-400">
                {selectedDay.deadlines.length} deadline
                {selectedDay.deadlines.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="space-y-3">
              {selectedDay.deadlines.map((deadline) => (
                <Link
                  key={deadline.id}
                  href={`/disputes/${deadline.caseId}/case`}
                  className={`block p-4 rounded-xl border transition-all hover:scale-[1.02] ${getDeadlineStyle(
                    deadline
                  )}`}
                >
                  <div className="flex items-start gap-3">
                    {deadline.status === "OVERDUE" ? (
                      <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    ) : deadline.status === "COMPLETED" ? (
                      <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Clock className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h5 className="font-medium text-white truncate">
                        {deadline.title}
                      </h5>
                      <p className="text-sm opacity-80 truncate">
                        {deadline.caseTitle}
                      </p>
                      <p className="text-xs opacity-60 mt-1">
                        {deadline.description}
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 opacity-50" />
                  </div>
                </Link>
              ))}
            </div>

            <Button
              variant="ghost"
              onClick={() => setSelectedDay(null)}
              className="w-full mt-4 text-slate-400 hover:text-white"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact deadline list for sidebar
 */
export function UpcomingDeadlinesList() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpcoming();
  }, []);

  const fetchUpcoming = async () => {
    try {
      const response = await fetch("/api/deadlines?upcoming=true");
      if (response.ok) {
        const data = await response.json();
        setDeadlines(data.deadlines || []);
      }
    } catch (error) {
      console.error("Error fetching deadlines:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 bg-slate-800/50 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (deadlines.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-10 w-10 text-green-400 mx-auto mb-2" />
        <p className="text-sm text-slate-400">No upcoming deadlines</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {deadlines.slice(0, 5).map((deadline) => {
        const isUrgent = deadline.daysRemaining <= 3;
        return (
          <Link
            key={deadline.id}
            href={`/disputes/${deadline.caseId}/case`}
            className={`block p-3 rounded-xl border transition-all hover:scale-[1.01] ${
              deadline.status === "OVERDUE"
                ? "bg-red-500/10 border-red-500/30"
                : isUrgent
                ? "bg-orange-500/10 border-orange-500/30"
                : "bg-slate-800/30 border-slate-700/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  deadline.status === "OVERDUE"
                    ? "bg-red-500/20"
                    : isUrgent
                    ? "bg-orange-500/20"
                    : "bg-slate-700"
                }`}
              >
                <span
                  className={`text-sm font-bold ${
                    deadline.status === "OVERDUE"
                      ? "text-red-400"
                      : isUrgent
                      ? "text-orange-400"
                      : "text-white"
                  }`}
                >
                  {new Date(deadline.dueDate).getDate()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {deadline.caseTitle}
                </p>
                <p
                  className={`text-xs ${
                    deadline.status === "OVERDUE"
                      ? "text-red-400"
                      : isUrgent
                      ? "text-orange-400"
                      : "text-slate-400"
                  }`}
                >
                  {deadline.status === "OVERDUE"
                    ? "Overdue!"
                    : deadline.daysRemaining === 0
                    ? "Due today"
                    : deadline.daysRemaining === 1
                    ? "Due tomorrow"
                    : `${deadline.daysRemaining} days left`}
                </p>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
