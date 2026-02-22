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
    subject: "📄 Your DisputeHub documents are ready",
    body: (caseTitle: string, caseId: string) => `
Your documents for "${caseTitle}" are ready to download.

View your case and download documents:
${process.env.NEXT_PUBLIC_APP_URL || 'https://disputehub.ai'}/disputes/${caseId}/documents

Next steps:
1. Review the documents carefully
2. Download and save copies
3. Send to the relevant party

Need help? Reply to this email.

---
DisputeHub - AI-Powered Legal Resolution
    `.trim(),
  },
  DOCUMENT_SENT: {
    subject: "✅ Document marked as sent",
    body: (caseTitle: string, caseId: string) => `
Great progress! Your document for "${caseTitle}" has been marked as sent.

We'll track the response deadline for you and remind you if needed.

View your case:
${process.env.NEXT_PUBLIC_APP_URL || 'https://disputehub.ai'}/disputes/${caseId}/timeline

---
DisputeHub - AI-Powered Legal Resolution
    `.trim(),
  },
  DEADLINE_APPROACHING: {
    subject: "⏰ Deadline approaching - {daysRemaining} days left",
    body: (caseTitle: string, caseId: string, daysRemaining?: number) => `
Heads up! You have ${daysRemaining || 3} days left to receive a response for "${caseTitle}".

If you don't hear back by the deadline, we'll help you escalate.

View your case:
${process.env.NEXT_PUBLIC_APP_URL || 'https://disputehub.ai'}/disputes/${caseId}/timeline

---
DisputeHub - AI-Powered Legal Resolution
    `.trim(),
  },
  DEADLINE_MISSED: {
    subject: "🚨 Response deadline missed - Time to escalate",
    body: (caseTitle: string, caseId: string) => `
The response deadline for "${caseTitle}" has passed with no response.

Don't worry - this is common. Your next steps:
1. Generate a follow-up letter
2. Consider escalating to an ombudsman

View your case and next steps:
${process.env.NEXT_PUBLIC_APP_URL || 'https://disputehub.ai'}/disputes/${caseId}/case

---
DisputeHub - AI-Powered Legal Resolution
    `.trim(),
  },
  FOLLOW_UP_GENERATED: {
    subject: "📝 Follow-up letter ready",
    body: (caseTitle: string, caseId: string) => `
A follow-up letter has been generated for "${caseTitle}".

This letter escalates your complaint and references your original correspondence.

View and download:
${process.env.NEXT_PUBLIC_APP_URL || 'https://disputehub.ai'}/disputes/${caseId}/documents

---
DisputeHub - AI-Powered Legal Resolution
    `.trim(),
  },
  CASE_CLOSED: {
    subject: "✨ Case closed - {caseTitle}",
    body: (caseTitle: string, caseId: string) => `
Your case "${caseTitle}" has been closed.

We hope DisputeHub helped you resolve your dispute. If you have another issue, we're here to help.

View case summary:
${process.env.NEXT_PUBLIC_APP_URL || 'https://disputehub.ai'}/disputes/${caseId}/case

Start a new case:
${process.env.NEXT_PUBLIC_APP_URL || 'https://disputehub.ai'}/disputes/start

---
DisputeHub - AI-Powered Legal Resolution
    `.trim(),
  },
};

/**
 * Send email notification via Resend (or fallback to console)
 */
export async function sendEmailNotification(params: EmailNotificationParams) {
  const { to, caseId, caseTitle, type, additionalData } = params;

  const template = EMAIL_TEMPLATES[type];
  if (!template) {
    console.error(`[Email] Unknown template type: ${type}`);
    return { success: false, error: 'Unknown template' };
  }

  let subject = template.subject
    .replace('{caseTitle}', caseTitle)
    .replace('{daysRemaining}', String(additionalData?.daysRemaining || 3));
  
  const body = template.body(caseTitle, caseId, additionalData?.daysRemaining);

  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || 'DisputeHub <notifications@disputehub.ai>';

  // If Resend API key is configured, send real email
  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject,
          text: body,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[Email] Resend API error:', error);
        return { success: false, error };
      }

      const result = await response.json();
      console.log(`[Email] ✅ Sent ${type} to ${to} (id: ${result.id})`);
      return { success: true, id: result.id, subject, body };
    } catch (error) {
      console.error('[Email] Send failed:', error);
      return { success: false, error: String(error) };
    }
  }

  // Fallback: Log to console in development
  console.log('=== EMAIL NOTIFICATION (dev mode) ===');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body:\n${body}`);
  console.log('=====================================');

  return { success: true, dev: true, subject, body };
}

/**
 * Send a custom email (for one-off notifications)
 */
export async function sendCustomEmail(params: {
  to: string;
  subject: string;
  body: string;
}) {
  const { to, subject, body } = params;
  
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || 'DisputeHub <notifications@disputehub.ai>';

  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [to],
          subject,
          text: body,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[Email] Resend API error:', error);
        return { success: false, error };
      }

      const result = await response.json();
      console.log(`[Email] ✅ Sent custom email to ${to}`);
      return { success: true, id: result.id };
    } catch (error) {
      console.error('[Email] Send failed:', error);
      return { success: false, error: String(error) };
    }
  }

  console.log('=== CUSTOM EMAIL (dev mode) ===');
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body:\n${body}`);
  console.log('===============================');

  return { success: true, dev: true };
}
