import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import CasesClient from "./components/CasesClient";

async function CasesData() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/login");
  }

  const disputes = await prisma.dispute.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      caseStrategy: {
        select: {
          disputeType: true,
          keyFacts: true,
          evidenceMentioned: true,
          desiredOutcome: true,
        },
      },
      documentPlan: {
        select: {
          id: true,
          complexity: true,
          complexityScore: true,
          documentType: true,
          documents: {
            select: {
              id: true,
              type: true,
              status: true,
              fileUrl: true,
              isFollowUp: true,
              createdAt: true,
              order: true,
            },
            orderBy: { order: "asc" },
          },
        },
      },
      caseEvents: {
        select: {
          id: true,
          type: true,
          description: true,
          occurredAt: true,
        },
        orderBy: { occurredAt: "desc" },
        take: 3,
      },
    },
  });

  return <CasesClient disputes={disputes as any} />;
}

export default function CasesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
            <p className="text-sm text-slate-500">Loading cases...</p>
          </div>
        </div>
      }
    >
      <CasesData />
    </Suspense>
  );
}
