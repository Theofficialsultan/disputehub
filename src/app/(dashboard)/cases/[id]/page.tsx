import { Suspense } from "react";
import { getCurrentUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CaseDetailsClient from "./components/CaseDetailsClient";

async function CaseDetailsData({ caseId }: { caseId: string }) {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/login");
  }

  // Fetch complete case data
  const caseData = await prisma.dispute.findFirst({
    where: {
      id: caseId,
      userId,
    },
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
          createdAt: true,
          documents: {
            select: {
              id: true,
              type: true,
              status: true,
              fileUrl: true,
              isFollowUp: true,
              retryCount: true,
              lastError: true,
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
          relatedDocumentId: true,
        },
        orderBy: { occurredAt: "desc" },
        take: 20,
      },
    },
  });

  if (!caseData) {
    redirect("/cases");
  }

  // Fetch evidence items
  const evidence = await prisma.evidenceItem.findMany({
    where: { caseId },
    orderBy: { evidenceIndex: "asc" },
    select: {
      id: true,
      evidenceIndex: true,
      title: true,
      description: true,
      fileType: true,
      fileUrl: true,
      fileName: true,
      fileSize: true,
      evidenceDate: true,
      uploadedAt: true,
    },
  });

  return <CaseDetailsClient caseData={caseData} evidence={evidence} />;
}

export default function CaseDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent" />
            <p className="text-sm text-slate-400">Loading case details...</p>
          </div>
        </div>
      }
    >
      <CaseDetailsData caseId={params.id} />
    </Suspense>
  );
}
