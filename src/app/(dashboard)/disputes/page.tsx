import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardClient from "./components/DashboardClient";

async function DashboardData() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/login");
  }

  // Fetch user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      firstName: true,
      lastName: true,
    },
  });

  // Fetch disputes with deadlines
  const disputes = await prisma.dispute.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      lifecycleStatus: true,
      waitingUntil: true,
      documentPlan: {
        select: {
          documents: {
            select: {
              status: true,
            },
          },
        },
      },
    },
  });

  // Calculate dashboard stats
  const stats = {
    totalCases: disputes.length,
    activeCases: disputes.filter(
      (d) =>
        d.lifecycleStatus === "AWAITING_RESPONSE" ||
        d.lifecycleStatus === "DEADLINE_MISSED" ||
        d.lifecycleStatus === "DOCUMENT_SENT"
    ).length,
    completedDocuments: disputes.reduce(
      (sum, d) =>
        sum +
        (d.documentPlan?.documents.filter((doc) => doc.status === "COMPLETED")
          .length || 0),
      0
    ),
    upcomingDeadlines: disputes.filter(
      (d) =>
        d.waitingUntil &&
        new Date(d.waitingUntil) > new Date() &&
        d.lifecycleStatus === "AWAITING_RESPONSE"
    ).length,
  };

  // Get deadlines for calendar (next 60 days)
  const deadlines = disputes
    .filter((d) => d.waitingUntil)
    .map((d) => ({
      id: d.id,
      title: d.title,
      date: d.waitingUntil!,
    }));

  return (
    <DashboardClient
      stats={stats}
      user={user || { firstName: null, lastName: null }}
      deadlines={deadlines}
    />
  );
}

export default function DisputesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent" />
            <p className="text-sm text-slate-400">Loading dashboard...</p>
          </div>
        </div>
      }
    >
      <DashboardData />
    </Suspense>
  );
}
