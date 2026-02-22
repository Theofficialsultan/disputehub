import { Suspense } from "react";
import { getCurrentUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import UploadEvidenceClient from "./components/UploadEvidenceClient";

async function UploadEvidenceData() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/login");
  }

  // Get all user's cases that can accept evidence
  const disputes = await prisma.dispute.findMany({
    where: { 
      userId,
      lifecycleStatus: {
        notIn: ["CLOSED"]
      }
    },
    select: {
      id: true,
      title: true,
      type: true,
      lifecycleStatus: true,
      strategyLocked: true,
      createdAt: true,
      caseStrategy: {
        select: {
          disputeType: true,
          evidenceMentioned: true,
        },
      },
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
    orderBy: { updatedAt: "desc" },
  });

  return <UploadEvidenceClient disputes={disputes as any} />;
}

export default function UploadEvidencePage() {
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
      <UploadEvidenceData />
    </Suspense>
  );
}
