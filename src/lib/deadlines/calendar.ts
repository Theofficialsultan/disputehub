/**
 * Feature 5: Deadline Calendar
 * Visual calendar showing LBA deadlines, response dates
 */

import { prisma } from "@/lib/prisma";
import { addDays, addWeeks, startOfDay, endOfDay, isAfter, isBefore } from "date-fns";

export type DeadlineType = 
  | "LBA_RESPONSE" 
  | "COURT_RESPONSE" 
  | "APPEAL_DEADLINE"
  | "SAR_RESPONSE"
  | "COMPLAINT_RESPONSE"
  | "TRIBUNAL_DEADLINE"
  | "CUSTOM";

export type DeadlineStatus = "UPCOMING" | "DUE_SOON" | "OVERDUE" | "COMPLETED";

export interface CaseDeadline {
  id: string;
  caseId: string;
  caseTitle: string;
  type: DeadlineType;
  title: string;
  description: string;
  dueDate: Date;
  status: DeadlineStatus;
  daysRemaining: number;
  isWorkingDays: boolean;
  notificationSent: boolean;
  completedAt: Date | null;
  createdAt: Date;
}

export interface CalendarDay {
  date: Date;
  isToday: boolean;
  isCurrentMonth: boolean;
  deadlines: CaseDeadline[];
}

export interface CalendarMonth {
  year: number;
  month: number; // 0-indexed
  days: CalendarDay[];
}

// Standard response periods for UK legal documents
const RESPONSE_PERIODS: Record<string, { days: number; workingDays: boolean; description: string }> = {
  LBA_RESPONSE: {
    days: 14,
    workingDays: false,
    description: "Standard LBA response period",
  },
  COURT_RESPONSE: {
    days: 14,
    workingDays: true,
    description: "Defendant response to court claim (14 working days)",
  },
  SAR_RESPONSE: {
    days: 30,
    workingDays: false,
    description: "GDPR Subject Access Request response period",
  },
  COMPLAINT_RESPONSE: {
    days: 56,
    workingDays: false,
    description: "Maximum FCA complaint response period (8 weeks)",
  },
  EMPLOYMENT_TRIBUNAL: {
    days: 28,
    workingDays: false,
    description: "ET response period",
  },
  FOS_REFERRAL: {
    days: 180,
    workingDays: false,
    description: "FOS referral deadline (6 months from final response)",
  },
  APPEAL_DEADLINE: {
    days: 21,
    workingDays: false,
    description: "Standard appeal deadline",
  },
};

/**
 * Calculate deadline status based on due date
 */
function getDeadlineStatus(dueDate: Date, completedAt: Date | null): DeadlineStatus {
  if (completedAt) return "COMPLETED";
  
  const now = new Date();
  const daysRemaining = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysRemaining < 0) return "OVERDUE";
  if (daysRemaining <= 3) return "DUE_SOON";
  return "UPCOMING";
}

/**
 * Calculate days remaining
 */
function getDaysRemaining(dueDate: Date): number {
  const now = new Date();
  return Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Create a deadline for a case
 */
export async function createDeadline(params: {
  caseId: string;
  type: DeadlineType;
  title: string;
  description?: string;
  dueDate: Date;
  isWorkingDays?: boolean;
}): Promise<CaseDeadline> {
  const { caseId, type, title, description, dueDate, isWorkingDays = false } = params;

  const deadline = await prisma.caseDeadline.create({
    data: {
      caseId,
      type,
      title,
      description: description || "",
      dueDate,
      isWorkingDays,
      notificationSent: false,
    },
    include: {
      case: {
        select: { title: true },
      },
    },
  });

  return {
    id: deadline.id,
    caseId: deadline.caseId,
    caseTitle: deadline.case.title,
    type: deadline.type as DeadlineType,
    title: deadline.title,
    description: deadline.description,
    dueDate: deadline.dueDate,
    status: getDeadlineStatus(deadline.dueDate, deadline.completedAt),
    daysRemaining: getDaysRemaining(deadline.dueDate),
    isWorkingDays: deadline.isWorkingDays,
    notificationSent: deadline.notificationSent,
    completedAt: deadline.completedAt,
    createdAt: deadline.createdAt,
  };
}

/**
 * Auto-create deadline based on document type
 */
export async function createDeadlineForDocument(params: {
  caseId: string;
  documentType: string;
  sentDate: Date;
}): Promise<CaseDeadline | null> {
  const { caseId, documentType, sentDate } = params;

  // Map document types to deadline types
  const documentDeadlineMap: Record<string, keyof typeof RESPONSE_PERIODS> = {
    "UK-LBA-GENERAL": "LBA_RESPONSE",
    "UK-LBC-PRE-ACTION-PROTOCOL": "LBA_RESPONSE",
    "UK-SAR-GDPR-REQUEST": "SAR_RESPONSE",
    "UK-COMPLAINT-LETTER-GENERAL": "COMPLAINT_RESPONSE",
    "UK-ET1-EMPLOYMENT-TRIBUNAL": "EMPLOYMENT_TRIBUNAL",
  };

  const deadlineType = documentDeadlineMap[documentType];
  if (!deadlineType) return null;

  const config = RESPONSE_PERIODS[deadlineType];
  const dueDate = addDays(sentDate, config.days);

  return createDeadline({
    caseId,
    type: deadlineType as DeadlineType,
    title: `Response deadline: ${config.description}`,
    description: `Expecting response by ${dueDate.toLocaleDateString("en-GB")}`,
    dueDate,
    isWorkingDays: config.workingDays,
  });
}

/**
 * Get all deadlines for a user
 */
export async function getUserDeadlines(userId: string): Promise<CaseDeadline[]> {
  const deadlines = await prisma.caseDeadline.findMany({
    where: {
      case: { userId },
    },
    include: {
      case: {
        select: { title: true },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  return deadlines.map((d) => ({
    id: d.id,
    caseId: d.caseId,
    caseTitle: d.case.title,
    type: d.type as DeadlineType,
    title: d.title,
    description: d.description,
    dueDate: d.dueDate,
    status: getDeadlineStatus(d.dueDate, d.completedAt),
    daysRemaining: getDaysRemaining(d.dueDate),
    isWorkingDays: d.isWorkingDays,
    notificationSent: d.notificationSent,
    completedAt: d.completedAt,
    createdAt: d.createdAt,
  }));
}

/**
 * Get deadlines for a specific month
 */
export async function getDeadlinesForMonth(
  userId: string,
  year: number,
  month: number
): Promise<CaseDeadline[]> {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59);

  const deadlines = await prisma.caseDeadline.findMany({
    where: {
      case: { userId },
      dueDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      case: {
        select: { title: true },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  return deadlines.map((d) => ({
    id: d.id,
    caseId: d.caseId,
    caseTitle: d.case.title,
    type: d.type as DeadlineType,
    title: d.title,
    description: d.description,
    dueDate: d.dueDate,
    status: getDeadlineStatus(d.dueDate, d.completedAt),
    daysRemaining: getDaysRemaining(d.dueDate),
    isWorkingDays: d.isWorkingDays,
    notificationSent: d.notificationSent,
    completedAt: d.completedAt,
    createdAt: d.createdAt,
  }));
}

/**
 * Generate calendar data for a month
 */
export async function generateCalendarMonth(
  userId: string,
  year: number,
  month: number
): Promise<CalendarMonth> {
  const deadlines = await getDeadlinesForMonth(userId, year, month);
  const deadlinesByDate = new Map<string, CaseDeadline[]>();

  deadlines.forEach((d) => {
    const dateKey = d.dueDate.toISOString().split("T")[0];
    if (!deadlinesByDate.has(dateKey)) {
      deadlinesByDate.set(dateKey, []);
    }
    deadlinesByDate.get(dateKey)!.push(d);
  });

  const today = new Date();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Get the day of week for the first day (0 = Sunday, adjust for Monday start)
  let startDayOfWeek = firstDay.getDay();
  startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  const days: CalendarDay[] = [];

  // Add days from previous month
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthLastDay - i);
    days.push({
      date,
      isToday: false,
      isCurrentMonth: false,
      deadlines: deadlinesByDate.get(date.toISOString().split("T")[0]) || [],
    });
  }

  // Add days of current month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day);
    const dateKey = date.toISOString().split("T")[0];
    const isToday = date.toDateString() === today.toDateString();

    days.push({
      date,
      isToday,
      isCurrentMonth: true,
      deadlines: deadlinesByDate.get(dateKey) || [],
    });
  }

  // Add days from next month to complete the grid (6 rows × 7 days = 42)
  const remainingDays = 42 - days.length;
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month + 1, day);
    days.push({
      date,
      isToday: false,
      isCurrentMonth: false,
      deadlines: deadlinesByDate.get(date.toISOString().split("T")[0]) || [],
    });
  }

  return {
    year,
    month,
    days,
  };
}

/**
 * Get upcoming deadlines (next 7 days)
 */
export async function getUpcomingDeadlines(userId: string): Promise<CaseDeadline[]> {
  const now = new Date();
  const weekFromNow = addDays(now, 7);

  const deadlines = await prisma.caseDeadline.findMany({
    where: {
      case: { userId },
      dueDate: {
        gte: startOfDay(now),
        lte: endOfDay(weekFromNow),
      },
      completedAt: null,
    },
    include: {
      case: {
        select: { title: true },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  return deadlines.map((d) => ({
    id: d.id,
    caseId: d.caseId,
    caseTitle: d.case.title,
    type: d.type as DeadlineType,
    title: d.title,
    description: d.description,
    dueDate: d.dueDate,
    status: getDeadlineStatus(d.dueDate, d.completedAt),
    daysRemaining: getDaysRemaining(d.dueDate),
    isWorkingDays: d.isWorkingDays,
    notificationSent: d.notificationSent,
    completedAt: d.completedAt,
    createdAt: d.createdAt,
  }));
}

/**
 * Mark deadline as completed
 */
export async function completeDeadline(deadlineId: string): Promise<void> {
  await prisma.caseDeadline.update({
    where: { id: deadlineId },
    data: { completedAt: new Date() },
  });
}

/**
 * Get overdue deadlines
 */
export async function getOverdueDeadlines(userId: string): Promise<CaseDeadline[]> {
  const now = new Date();

  const deadlines = await prisma.caseDeadline.findMany({
    where: {
      case: { userId },
      dueDate: { lt: now },
      completedAt: null,
    },
    include: {
      case: {
        select: { title: true },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  return deadlines.map((d) => ({
    id: d.id,
    caseId: d.caseId,
    caseTitle: d.case.title,
    type: d.type as DeadlineType,
    title: d.title,
    description: d.description,
    dueDate: d.dueDate,
    status: "OVERDUE" as DeadlineStatus,
    daysRemaining: getDaysRemaining(d.dueDate),
    isWorkingDays: d.isWorkingDays,
    notificationSent: d.notificationSent,
    completedAt: d.completedAt,
    createdAt: d.createdAt,
  }));
}
