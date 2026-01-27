import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { CaseChatClient } from "./components/CaseChatClient";

export default async function CaseChatPage({
  params,
}: {
  params: { id: string };
}) {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/login");
  }

  // Fetch dispute and verify access
  const dispute = await prisma.dispute.findFirst({
    where: {
      id: params.id,
      userId,
    },
    select: {
      id: true,
      title: true,
      mode: true,
      conversationStatus: true,
      restricted: true,
      lifecycleStatus: true,
      strategyLocked: true, // Phase 8.2.5
      phase: true, // Phase 8.5-8.7
      chatLocked: true, // Phase 8.5-8.7
      lockReason: true, // Phase 8.5-8.7
    },
  });

  if (!dispute) {
    redirect("/disputes");
  }

  // Verify this is a GUIDED mode case
  if (dispute.mode !== "GUIDED") {
    redirect(`/disputes/${dispute.id}/wizard`);
  }

  // Check if case is restricted
  if (dispute.restricted) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-6">
          <h2 className="mb-2 text-lg font-semibold text-destructive">
            Case Restricted
          </h2>
          <p className="text-sm text-muted-foreground">
            This case has been restricted. AI assistance is disabled. Please
            contact support for lawyer escalation options.
          </p>
        </div>
      </div>
    );
  }

  return <CaseChatClient dispute={dispute} />;
}
