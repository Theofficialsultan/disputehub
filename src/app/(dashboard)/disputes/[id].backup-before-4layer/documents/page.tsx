import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { DocumentLibraryClient } from "./components/DocumentLibraryClient";

interface PageProps {
  params: { id: string };
}

export default async function DocumentsPage({ params }: PageProps) {
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

  return <DocumentLibraryClient dispute={dispute} />;
}
