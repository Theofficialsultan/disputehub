import { Suspense } from "react";
import { getCurrentUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DocumentsClient from "./components/DocumentsClient";

async function DocumentsData() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/login");
  }

  // Get all disputes with their document plans and generated documents
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
    },
    orderBy: { updatedAt: "desc" },
  });

  return <DocumentsClient disputes={disputes as any} />;
}

export default function DocumentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
            <p className="text-sm text-slate-500">Loading documents...</p>
          </div>
        </div>
      }
    >
      <DocumentsData />
    </Suspense>
  );
}
