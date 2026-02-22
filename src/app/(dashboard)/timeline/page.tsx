import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import TimelineClient from "./components/TimelineClient";

async function TimelineData() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/login");
  }

  // Fetch all disputes with their events
  const disputes = await prisma.dispute.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      type: true,
      caseEvents: {
        orderBy: { occurredAt: "desc" },
        include: {
          relatedDocument: {
            select: {
              id: true,
              type: true,
              status: true,
            },
          },
        },
      },
    },
  });

  // Flatten and sort all events
  const allEvents = disputes
    .flatMap((dispute) =>
      dispute.caseEvents.map((event) => ({
        ...event,
        disputeTitle: dispute.title,
        disputeType: dispute.type,
        disputeId: dispute.id,
      }))
    )
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());

  return <TimelineClient events={allEvents} disputes={disputes as any} />;
}

export default function TimelinePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
            <p className="text-sm text-slate-500">Loading timeline...</p>
          </div>
        </div>
      }
    >
      <TimelineData />
    </Suspense>
  );
}
