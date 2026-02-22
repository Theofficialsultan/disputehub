/**
 * Email Notification Service
 * Send transactional emails for case updates
 * 
 * Uses Resend or similar email service
 * For now, this is a template - integrate with your email provider
 */

import { prisma } from "@/lib/prisma";

// Email templates
const EMAIL_TEMPLATES = {
  DOCUMENT_READY: {
    subject: "📄 Your documents are ready - {caseTitle}",
    body: `Hi {userName},

Great news! Your documents for "{caseTitle}" are ready to download.

What's included:
{documentList}

Next steps:
1. Review the documents carefully
2. Download and save copies
3. Follow the instructions in each document

View your case: {caseUrl}

If you have any questions, just reply to this email.

Best regards,
The DisputeHub Team`,
  },

  DEADLINE_REMINDER: {
    subject: "⏰ Deadline reminder - {caseTitle}",
    body: `Hi {userName},

This is a friendly reminder about an upcoming deadline for your case "{caseTitle}".

Deadline: {deadline}
Days remaining: {daysRemaining}

What you need to do:
{actionRequired}

View your timeline: {timelineUrl}

Don't miss this deadline - it could affect your case.

Best regards,
The DisputeHub Team`,
  },

  CASE_UPDATE: {
    subject: "📢 Case update - {caseTitle}",
    body: `Hi {userName},

There's been an update to your case "{caseTitle}".

{updateDetails}

View your case: {caseUrl}

Best regards,
The DisputeHub Team`,
  },

  WEEKLY_DIGEST: {
    subject: "📊 Your weekly DisputeHub summary",
    body: `Hi {userName},

Here's your weekly summary:

Active cases: {activeCases}
Documents ready: {documentsReady}
Upcoming deadlines: {upcomingDeadlines}

{casesSummary}

View your dashboard: {dashboardUrl}

Best regards,
The DisputeHub Team`,
  },
};

interface EmailParams {
  to: string;
  template: keyof typeof EMAIL_TEMPLATES;
  variables: Record<string, string>;
}

/**
 * Send an email using the configured provider
 */
async function sendEmail(params: EmailParams): Promise<boolean> {
  const { to, template, variables } = params;
  const emailTemplate = EMAIL_TEMPLATES[template];

  // Replace variables in subject and body
  let subject = emailTemplate.subject;
  let body = emailTemplate.body;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    subject = subject.replace(new RegExp(placeholder, "g"), value);
    body = body.replace(new RegExp(placeholder, "g"), value);
  }

  // Check for Resend API key
  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "DisputeHub <notifications@disputehub.ai>",
          to: [to],
          subject,
          text: body,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("[Email] Resend error:", error);
        return false;
      }

      console.log(`[Email] Sent ${template} to ${to}`);
      return true;
    } catch (error) {
      console.error("[Email] Send error:", error);
      return false;
    }
  }

  // Fallback: Log email (for development)
  console.log(`[Email] Would send to ${to}:`);
  console.log(`  Subject: ${subject}`);
  console.log(`  Template: ${template}`);
  return true;
}

/**
 * Check user's email preferences before sending
 */
async function shouldSendEmail(
  userId: string,
  type: "documentReady" | "deadlineReminders" | "caseUpdates" | "weeklyDigest"
): Promise<boolean> {
  const prefs = await prisma.emailPreferences.findUnique({
    where: { userId },
  });

  if (!prefs) {
    // Default to true if no preferences set
    return true;
  }

  return prefs[type] ?? true;
}

/**
 * Send document ready notification
 */
export async function sendDocumentReadyEmail(
  userId: string,
  caseId: string,
  documents: { title: string; type: string }[]
): Promise<void> {
  if (!(await shouldSendEmail(userId, "documentReady"))) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, firstName: true },
  });

  const dispute = await prisma.dispute.findUnique({
    where: { id: caseId },
    select: { title: true },
  });

  if (!user || !dispute) return;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://disputehub.ai";

  await sendEmail({
    to: user.email,
    template: "DOCUMENT_READY",
    variables: {
      userName: user.firstName || "there",
      caseTitle: dispute.title,
      documentList: documents.map((d) => `• ${d.title}`).join("\n"),
      caseUrl: `${baseUrl}/disputes/${caseId}/documents`,
    },
  });
}

/**
 * Send deadline reminder
 */
export async function sendDeadlineReminderEmail(
  userId: string,
  caseId: string,
  deadline: Date,
  actionRequired: string
): Promise<void> {
  if (!(await shouldSendEmail(userId, "deadlineReminders"))) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, firstName: true },
  });

  const dispute = await prisma.dispute.findUnique({
    where: { id: caseId },
    select: { title: true },
  });

  if (!user || !dispute) return;

  const daysRemaining = Math.ceil(
    (deadline.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
  );

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://disputehub.ai";

  await sendEmail({
    to: user.email,
    template: "DEADLINE_REMINDER",
    variables: {
      userName: user.firstName || "there",
      caseTitle: dispute.title,
      deadline: deadline.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      daysRemaining: daysRemaining.toString(),
      actionRequired,
      timelineUrl: `${baseUrl}/disputes/${caseId}/timeline`,
    },
  });
}

/**
 * Send weekly digest (call from cron)
 */
export async function sendWeeklyDigests(): Promise<void> {
  const usersWithDigest = await prisma.emailPreferences.findMany({
    where: { weeklyDigest: true },
    include: { user: true },
  });

  for (const prefs of usersWithDigest) {
    try {
      const [activeCases, documentsReady, upcomingDeadlines] = await Promise.all([
        prisma.dispute.count({
          where: {
            userId: prefs.userId,
            lifecycleStatus: { in: ["AWAITING_RESPONSE", "DOCUMENT_SENT"] },
          },
        }),
        prisma.generatedDocument.count({
          where: {
            case: { userId: prefs.userId },
            status: "COMPLETED",
          },
        }),
        prisma.dispute.count({
          where: {
            userId: prefs.userId,
            waitingUntil: {
              gte: new Date(),
              lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://disputehub.ai";

      await sendEmail({
        to: prefs.user.email,
        template: "WEEKLY_DIGEST",
        variables: {
          userName: prefs.user.firstName || "there",
          activeCases: activeCases.toString(),
          documentsReady: documentsReady.toString(),
          upcomingDeadlines: upcomingDeadlines.toString(),
          casesSummary: activeCases > 0
            ? "Check your dashboard for details on each case."
            : "No active cases this week.",
          dashboardUrl: `${baseUrl}/disputes`,
        },
      });
    } catch (error) {
      console.error(`[Email] Failed to send digest to ${prefs.user.email}:`, error);
    }
  }
}
