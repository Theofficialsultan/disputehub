"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isPast,
  isFuture,
  addMonths,
  subMonths,
} from "date-fns";

interface Deadline {
  id: string;
  date: Date;
  title: string;
  type: "lba_response" | "court_deadline" | "follow_up" | "custom";
  caseId: string;
  caseTitle: string;
  completed?: boolean;
}

interface DeadlineCalendarProps {
  deadlines: Deadline[];
  onDeadlineClick?: (deadline: Deadline) => void;
}

const DEADLINE_COLORS = {
  lba_response: "bg-amber-500",
  court_deadline: "bg-red-500",
  follow_up: "bg-blue-500",
  custom: "bg-purple-500",
};

const DEADLINE_LABELS = {
  lba_response: "LBA Response Due",
  court_deadline: "Court Deadline",
  follow_up: "Follow Up",
  custom: "Custom Deadline",
};

export function DeadlineCalendar({ deadlines, onDeadlineClick }: DeadlineCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get deadlines for each day
  const deadlinesByDay = useMemo(() => {
    const map = new Map<string, Deadline[]>();
    deadlines.forEach((d) => {
      const key = format(d.date, "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    });
    return map;
  }, [deadlines]);

  // Get upcoming deadlines
  const upcomingDeadlines = useMemo(() => {
    return deadlines
      .filter((d) => isFuture(d.date) || isToday(d.date))
      .filter((d) => !d.completed)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5);
  }, [deadlines]);

  const getDayClasses = (day: Date) => {
    const dayDeadlines = deadlinesByDay.get(format(day, "yyyy-MM-dd")) || [];
    const hasDeadline = dayDeadlines.length > 0;
    const hasOverdue = dayDeadlines.some((d) => isPast(d.date) && !d.completed);
    const isCurrentDay = isToday(day);

    return `
      relative h-10 w-10 rounded-lg flex items-center justify-center text-sm
      transition-colors cursor-pointer
      ${!isSameMonth(day, currentMonth) ? "text-muted-foreground/30" : ""}
      ${isCurrentDay ? "bg-primary text-primary-foreground font-bold" : "hover:bg-muted"}
      ${hasDeadline && !isCurrentDay ? "font-semibold" : ""}
      ${hasOverdue ? "text-red-500" : ""}
    `;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Deadline Calendar</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[120px] text-center">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="space-y-2">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div key={day} className="h-8 flex items-center justify-center">
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Padding for first week */}
          {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
            <div key={`pad-${i}`} className="h-10 w-10" />
          ))}

          {days.map((day) => {
            const dayKey = format(day, "yyyy-MM-dd");
            const dayDeadlines = deadlinesByDay.get(dayKey) || [];

            return (
              <div key={dayKey} className="relative">
                <div className={getDayClasses(day)}>
                  {format(day, "d")}
                </div>
                {/* Deadline indicators */}
                {dayDeadlines.length > 0 && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {dayDeadlines.slice(0, 3).map((d, i) => (
                      <div
                        key={i}
                        className={`h-1.5 w-1.5 rounded-full ${DEADLINE_COLORS[d.type]}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
        {Object.entries(DEADLINE_LABELS).map(([type, label]) => (
          <div key={type} className="flex items-center gap-2 text-xs">
            <div className={`h-2 w-2 rounded-full ${DEADLINE_COLORS[type as keyof typeof DEADLINE_COLORS]}`} />
            <span className="text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Upcoming deadlines list */}
      {upcomingDeadlines.length > 0 && (
        <div className="mt-6 pt-4 border-t">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Upcoming Deadlines
          </h4>
          <div className="space-y-2">
            {upcomingDeadlines.map((deadline) => {
              const daysUntil = Math.ceil(
                (deadline.date.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
              );
              const isUrgent = daysUntil <= 3;

              return (
                <div
                  key={deadline.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${
                    isUrgent ? "border-red-500/50 bg-red-500/5" : ""
                  }`}
                  onClick={() => onDeadlineClick?.(deadline)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-3 w-3 rounded-full ${DEADLINE_COLORS[deadline.type]}`}
                    />
                    <div>
                      <p className="text-sm font-medium">{deadline.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {deadline.caseTitle}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isUrgent && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    <span
                      className={`text-sm ${
                        isUrgent ? "text-red-500 font-medium" : "text-muted-foreground"
                      }`}
                    >
                      {daysUntil === 0
                        ? "Today"
                        : daysUntil === 1
                        ? "Tomorrow"
                        : `${daysUntil} days`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
