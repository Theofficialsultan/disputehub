import { Suspense } from "react";
import { getCurrentUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SettingsClient from "./components/SettingsClient";

async function SettingsData() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      imageUrl: true,
      createdAt: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  // Get stats
  const disputeCount = await prisma.dispute.count({
    where: { userId },
  });

  const documentCount = await prisma.dispute.findMany({
    where: { userId },
    select: {
      documentPlan: {
        select: {
          documents: {
            select: { id: true },
          },
        },
      },
    },
  });

  const totalDocuments = documentCount.reduce(
    (sum, d) => sum + (d.documentPlan?.documents.length || 0),
    0
  );

  return (
    <SettingsClient
      user={user}
      stats={{
        disputes: disputeCount,
        documents: totalDocuments,
      }}
    />
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent" />
            <p className="text-sm text-slate-400">Loading settings...</p>
          </div>
        </div>
      }
    >
      <SettingsData />
    </Suspense>
  );
}
