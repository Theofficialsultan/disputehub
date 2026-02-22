import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { TimelineClient } from "./components/TimelineClient";

interface PageProps {
  params: { id: string };
}

export default async function TimelinePage({ params }: PageProps) {
  const userId = await getCurrentUserId();

  if (!userId) {
    return notFound();
  }

  // Verify dispute exists and belongs to user
  const dispute = await prisma.dispute.findFirst({
    where: {
      id: params.id,
      userId,
    },
  });

  if (!dispute) {
    return notFound();
  }

  return <TimelineClient dispute={dispute} />;
}
