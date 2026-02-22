import { Suspense } from "react";
import { getCurrentUserId } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EmailPageClient from "./components/EmailPageClient";

async function EmailData() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/login");
  }

  // Fetch connected email accounts
  const accounts = await prisma.emailAccount.findMany({
    where: { userId, isActive: true },
    select: {
      id: true,
      provider: true,
      email: true,
      lastSyncAt: true,
      createdAt: true,
    },
  });

  const accountIds = accounts.map((a) => a.id);

  // Fetch recent emails
  const messages = accountIds.length > 0
    ? await prisma.emailMessage.findMany({
        where: { emailAccountId: { in: accountIds } },
        orderBy: { receivedAt: "desc" },
        take: 50,
        select: {
          id: true,
          direction: true,
          senderEmail: true,
          senderName: true,
          recipientEmail: true,
          recipientName: true,
          subject: true,
          snippet: true,
          receivedAt: true,
          isRead: true,
          hasAttachments: true,
          threadId: true,
          aiAnalysis: true,
          emailAccount: {
            select: { email: true, provider: true },
          },
          dispute: {
            select: { id: true, title: true, type: true },
          },
        },
      })
    : [];

  // Fetch pending drafts
  const drafts = await prisma.emailDraft.findMany({
    where: { userId, status: { in: ["DRAFT", "FAILED"] } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      recipientEmail: true,
      recipientName: true,
      subject: true,
      body: true,
      bodyHtml: true,
      emailType: true,
      status: true,
      sentAt: true,
      createdAt: true,
      lastError: true,
      dispute: {
        select: { id: true, title: true },
      },
      emailAccount: {
        select: { email: true, provider: true },
      },
    },
  });

  // Stats
  const totalSent = accountIds.length > 0
    ? await prisma.emailMessage.count({
        where: { emailAccountId: { in: accountIds }, direction: "OUTBOUND" },
      })
    : 0;

  const totalReceived = accountIds.length > 0
    ? await prisma.emailMessage.count({
        where: { emailAccountId: { in: accountIds }, direction: "INBOUND" },
      })
    : 0;

  const unreadCount = accountIds.length > 0
    ? await prisma.emailMessage.count({
        where: { emailAccountId: { in: accountIds }, direction: "INBOUND", isRead: false },
      })
    : 0;

  // Fetch user's cases for the compose modal
  const cases = await prisma.dispute.findMany({
    where: { userId },
    select: { id: true, title: true, type: true, lifecycleStatus: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <EmailPageClient
      accounts={accounts as any}
      messages={messages as any}
      drafts={drafts as any}
      cases={cases as any}
      stats={{
        totalSent,
        totalReceived,
        unreadCount,
        pendingDrafts: drafts.length,
      }}
    />
  );
}

export default function EmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
            <p className="text-sm text-slate-500">Loading emails...</p>
          </div>
        </div>
      }
    >
      <EmailData />
    </Suspense>
  );
}
