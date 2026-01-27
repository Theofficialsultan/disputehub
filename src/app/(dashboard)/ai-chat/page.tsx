import { Suspense } from "react";
import { getCurrentUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AIChatClient from "./components/AIChatClient";

async function AIChatData() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/login");
  }

  // Get user's active cases and deadlines
  const disputes = await prisma.dispute.findMany({
    where: { 
      userId,
      lifecycleStatus: {
        in: ["DRAFT", "AWAITING_RESPONSE", "DOCUMENT_SENT", "DEADLINE_MISSED"]
      }
    },
    select: {
      id: true,
      title: true,
      type: true,
      lifecycleStatus: true,
      waitingUntil: true,
      strategyLocked: true,
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
    take: 5,
  });

  // Get user profile from Clerk
  const userName = "there"; // You can enhance this later with Clerk user data

  return <AIChatClient disputes={disputes} userName={userName} />;
}

export default function AIChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent" />
            <p className="text-sm text-slate-400">Loading AI Assistant...</p>
          </div>
        </div>
      }
    >
      <AIChatData />
    </Suspense>
  );
}
