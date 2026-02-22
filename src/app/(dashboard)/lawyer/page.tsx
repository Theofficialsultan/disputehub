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

  const disputes = await prisma.dispute.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      type: true,
      lifecycleStatus: true,
      createdAt: true,
      updatedAt: true,
      description: true,
      caseStrategy: {
        select: {
          disputeType: true,
          desiredOutcome: true,
        },
      },
      documentPlan: {
        select: {
          complexity: true,
          documents: {
            select: {
              status: true,
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return <LawyerClient disputes={disputes as any} />;
}

export default function LawyerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
            <p className="text-sm text-slate-500">Loading...</p>
          </div>
        </div>
      }
    >
      <LawyerData />
    </Suspense>
  );
}
