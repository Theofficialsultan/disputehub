/**
 * Phase 8.4 - Email Notification Service
 * Sends system-generated email notifications
 * NO MARKETING, NO AI TONE, FACTUAL ONLY
 */

interface EmailNotificationParams {
  to: string;
  caseId: string;
  caseTitle: string;
  type: "DOCUMENT_READY" | "DOCUMENT_SENT" | "DEADLINE_APPROACHING" | "DEADLINE_MISSED" | "FOLLOW_UP_GENERATED" | "CASE_CLOSED";
  additionalData?: Record<string, any>;
}

const EMAIL_TEMPLATES = {
  DOCUMENT_READY: {
    subject: "Your DisputeHub documents are ready",
    body: (caseTitle: string, caseId: string) => `
Your documents for "${caseTitle}" are ready.

View case: ${process.env.NEXT_PUBLIC_APP_URL}/disputes/${caseId}/case

---
DisputeHub
    `.trim(),
  },
  DOCUMENT_SENT: {
    subject: "Document marked as sent",
    body: (caseTitle: string, caseId: string) => `
Your document for "${caseTitle}" has been marked as sent.

View case: ${process.env.NEXT_PUBLIC_APP_URL}/disputes/${caseId}/case

---
DisputeHub
    `.trim(),
  },
  DEADLINE_APPROACHING: {
    subject: "Deadline approaching for your case",
    body: (caseTitle: string, caseId: string, daysRemaining?: number) => `
You have ${daysRemaining || 3} days left to receive a response for "${caseTitle}".

View case: ${process.env.NEXT_PUBLIC_APP_URL}/disputes/${caseId}/case

---
DisputeHub
    `.trim(),
  },
  DEADLINE_MISSED: {
    subject: "Response deadline missed",
    body: (caseTitle: string, caseId: string) => `
No response was received within the deadline for "${caseTitle}".

View case: ${process.env.NEXT_PUBLIC_APP_URL}/disputes/${caseId}/case

---
DisputeHub
    `.trim(),
  },
  FOLLOW_UP_GENERATED: {
    subject: "Follow-up letter generated",
    body: (caseTitle: string, caseId: string) => `
A follow-up letter has been generated automatically for "${caseTitle}".

View case: ${process.env.NEXT_PUBLIC_APP_URL}/disputes/${caseId}/case

---
DisputeHub
    `.trim(),
  },
  CASE_CLOSED: {
    subject: "Case closed",
    body: (caseTitle: string, caseId: string) => `
Your case "${caseTitle}" has been closed.

View case: ${process.env.NEXT_PUBLIC_APP_URL}/disputes/${caseId}/case

---
DisputeHub
    `.trim(),
  },
};

/**
 * Send email notification
 * Currently logs to console (implement with actual email service like Resend/SendGrid)
 */
export async function sendEmailNotification(params: EmailNotificationParams) {
  const { to, caseId, caseTitle, type, additionalData } = params;

  const template = EMAIL_TEMPLATES[type];
  if (!template) {
    console.error(`Unknown email template type: ${type}`);
    return;
  }

  const subject = template.subject;
  const body = template.body(caseTitle, caseId, additionalData?.daysRemaining);

  // TODO: Implement actual email sending (Resend, SendGrid, etc.)
  // For now, log to console
  console.log("=== EMAIL NOTIFICATION ===");
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body:`);
  console.log(body);
  console.log("========================");

  // Example implementation with Resend:
  // import { Resend } from 'resend';
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: 'DisputeHub <noreply@disputehub.com>',
  //   to,
  //   subject,
  //   text: body,
  // });

  return { subject, body };
}
