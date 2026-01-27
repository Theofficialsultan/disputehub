import { Suspense } from "react";
import { getCurrentUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import LawyerClient from "./components/LawyerClient";

async function LawyerData() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/login");
  }

  // Get user's disputes for lawyer assignment
  const disputes = await prisma.dispute.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      type: true,
      lifecycleStatus: true,
      createdAt: true,
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
    orderBy: { createdAt: "desc" },
  });

  return <LawyerClient disputes={disputes} />;
}

export default function LawyerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent" />
            <p className="text-sm text-slate-400">Loading...</p>
          </div>
        </div>
      }
    >
      <LawyerData />
    </Suspense>
  );
}
