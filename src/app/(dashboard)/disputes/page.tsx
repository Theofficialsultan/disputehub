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

  // Fetch minimal stats for dashboard
  const disputes = await prisma.dispute.findMany({
    where: { userId },
    select: {
      id: true,
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
        d.lifecycleStatus === "DOCUMENTS_GENERATING"
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

  return <DashboardClient stats={stats} />;
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
