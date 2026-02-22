/**
 * Feature 9: Email Notifications
 * Enhanced email templates for case status notifications
 */

export interface EmailTemplate {
  subject: string;
  htmlBody: string;
  textBody: string;
}

export type EmailType =
  | "WELCOME"
  | "CASE_CREATED"
  | "DOCUMENT_READY"
  | "DOCUMENT_SENT"
  | "DEADLINE_REMINDER"
  | "DEADLINE_APPROACHING"
  | "DEADLINE_MISSED"
  | "RESPONSE_RECEIVED"
  | "CASE_UPDATE"
  | "CASE_CLOSED"
  | "BADGE_EARNED"
  | "WEEKLY_SUMMARY";

export interface EmailData {
  userName: string;
  userEmail: string;
  caseId?: string;
  caseTitle?: string;
  documentTitle?: string;
  deadlineDate?: Date;
  daysRemaining?: number;
  badgeName?: string;
  customData?: Record<string, unknown>;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://disputehub.com";
const BRAND_COLOR = "#4F46E5"; // Indigo-600

// Base HTML template
function getBaseTemplate(content: string, preheader: string = ""): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DisputeHub</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .card { background: #ffffff; border-radius: 16px; padding: 32px; margin: 20px 0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { text-align: center; margin-bottom: 24px; }
    .logo { font-size: 24px; font-weight: bold; color: ${BRAND_COLOR}; }
    .content { color: #374151; line-height: 1.6; }
    .button { display: inline-block; background: ${BRAND_COLOR}; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; margin: 16px 0; }
    .button:hover { background: #4338CA; }
    .footer { text-align: center; color: #9CA3AF; font-size: 12px; margin-top: 24px; }
    .highlight { background: #EEF2FF; border-left: 4px solid ${BRAND_COLOR}; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0; }
    .deadline { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0; }
    .urgent { background: #FEE2E2; border-left: 4px solid #EF4444; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0; }
    .success { background: #D1FAE5; border-left: 4px solid #10B981; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0; }
    .preheader { display: none; max-height: 0; overflow: hidden; }
  </style>
</head>
<body>
  <span class="preheader">${preheader}</span>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">⚖️ DisputeHub</div>
      </div>
      <div class="content">
        ${content}
      </div>
    </div>
    <div class="footer">
      <p>DisputeHub - AI-Powered Dispute Resolution</p>
      <p>This is an automated message. Please do not reply directly to this email.</p>
      <p><a href="${APP_URL}/settings" style="color: #9CA3AF;">Manage email preferences</a></p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// Template generators
const TEMPLATES: Record<EmailType, (data: EmailData) => EmailTemplate> = {
  WELCOME: (data) => ({
    subject: "Welcome to DisputeHub! 🎉",
    htmlBody: getBaseTemplate(
      `
      <h2>Welcome, ${data.userName}!</h2>
      <p>You've taken the first step towards resolving your disputes with confidence.</p>
      <div class="highlight">
        <strong>What you can do:</strong>
        <ul>
          <li>Create and manage dispute cases</li>
          <li>Generate professional legal documents</li>
          <li>Track deadlines and responses</li>
          <li>Upload and organize evidence</li>
        </ul>
      </div>
      <p style="text-align: center;">
        <a href="${APP_URL}/disputes/start" class="button">Start Your First Case</a>
      </p>
      <p>If you have any questions, our AI assistant is here to help 24/7.</p>
      `,
      "Welcome to DisputeHub - Start resolving your disputes today"
    ),
    textBody: `
Welcome to DisputeHub, ${data.userName}!

You've taken the first step towards resolving your disputes with confidence.

What you can do:
- Create and manage dispute cases
- Generate professional legal documents
- Track deadlines and responses
- Upload and organize evidence

Start your first case: ${APP_URL}/disputes/start

If you have any questions, our AI assistant is here to help 24/7.

---
DisputeHub - AI-Powered Dispute Resolution
    `.trim(),
  }),

  CASE_CREATED: (data) => ({
    subject: `Case Created: ${data.caseTitle}`,
    htmlBody: getBaseTemplate(
      `
      <h2>Your case has been created</h2>
      <div class="highlight">
        <strong>Case:</strong> ${data.caseTitle}<br>
        <strong>Case ID:</strong> ${data.caseId}
      </div>
      <p>Our AI is ready to help you build your case. Continue the conversation to provide more details and generate your legal documents.</p>
      <p style="text-align: center;">
        <a href="${APP_URL}/disputes/${data.caseId}/case" class="button">Continue Your Case</a>
      </p>
      `,
      `Case created: ${data.caseTitle}`
    ),
    textBody: `
Your case has been created

Case: ${data.caseTitle}
Case ID: ${data.caseId}

Our AI is ready to help you build your case. Continue the conversation to provide more details and generate your legal documents.

Continue: ${APP_URL}/disputes/${data.caseId}/case

---
DisputeHub
    `.trim(),
  }),

  DOCUMENT_READY: (data) => ({
    subject: `Documents Ready: ${data.caseTitle}`,
    htmlBody: getBaseTemplate(
      `
      <h2>Your documents are ready! 📄</h2>
      <div class="success">
        <strong>Case:</strong> ${data.caseTitle}<br>
        <strong>Document:</strong> ${data.documentTitle || "Legal documents"}
      </div>
      <p>Your legal documents have been generated and are ready for review and download.</p>
      <p style="text-align: center;">
        <a href="${APP_URL}/disputes/${data.caseId}/documents" class="button">View Documents</a>
      </p>
      <p><strong>Next steps:</strong></p>
      <ol>
        <li>Review the documents carefully</li>
        <li>Make any necessary edits</li>
        <li>Download and send to the other party</li>
        <li>Mark as sent to start tracking the deadline</li>
      </ol>
      `,
      `Your documents for ${data.caseTitle} are ready to download`
    ),
    textBody: `
Your documents are ready!

Case: ${data.caseTitle}
Document: ${data.documentTitle || "Legal documents"}

Your legal documents have been generated and are ready for review and download.

View Documents: ${APP_URL}/disputes/${data.caseId}/documents

Next steps:
1. Review the documents carefully
2. Make any necessary edits
3. Download and send to the other party
4. Mark as sent to start tracking the deadline

---
DisputeHub
    `.trim(),
  }),

  DOCUMENT_SENT: (data) => ({
    subject: `Document Marked as Sent: ${data.caseTitle}`,
    htmlBody: getBaseTemplate(
      `
      <h2>Document marked as sent ✓</h2>
      <div class="highlight">
        <strong>Case:</strong> ${data.caseTitle}
      </div>
      <p>We're now tracking the response deadline for this case. You'll receive reminders as the deadline approaches.</p>
      ${data.deadlineDate ? `<div class="deadline"><strong>Response expected by:</strong> ${new Date(data.deadlineDate).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>` : ""}
      <p style="text-align: center;">
        <a href="${APP_URL}/disputes/${data.caseId}/case" class="button">View Case</a>
      </p>
      `,
      `Document sent - tracking deadline for ${data.caseTitle}`
    ),
    textBody: `
Document marked as sent

Case: ${data.caseTitle}
${data.deadlineDate ? `Response expected by: ${new Date(data.deadlineDate).toLocaleDateString("en-GB")}` : ""}

We're now tracking the response deadline for this case. You'll receive reminders as the deadline approaches.

View Case: ${APP_URL}/disputes/${data.caseId}/case

---
DisputeHub
    `.trim(),
  }),

  DEADLINE_REMINDER: (data) => ({
    subject: `Deadline in ${data.daysRemaining} days: ${data.caseTitle}`,
    htmlBody: getBaseTemplate(
      `
      <h2>Deadline Reminder ⏰</h2>
      <div class="deadline">
        <strong>Case:</strong> ${data.caseTitle}<br>
        <strong>Days remaining:</strong> ${data.daysRemaining}<br>
        ${data.deadlineDate ? `<strong>Deadline:</strong> ${new Date(data.deadlineDate).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}` : ""}
      </div>
      <p>The response deadline for your case is approaching. If you haven't received a response yet, make sure to check your post and email.</p>
      <p style="text-align: center;">
        <a href="${APP_URL}/disputes/${data.caseId}/case" class="button">Check Case Status</a>
      </p>
      `,
      `${data.daysRemaining} days until deadline for ${data.caseTitle}`
    ),
    textBody: `
Deadline Reminder

Case: ${data.caseTitle}
Days remaining: ${data.daysRemaining}
${data.deadlineDate ? `Deadline: ${new Date(data.deadlineDate).toLocaleDateString("en-GB")}` : ""}

The response deadline for your case is approaching. If you haven't received a response yet, make sure to check your post and email.

Check Case: ${APP_URL}/disputes/${data.caseId}/case

---
DisputeHub
    `.trim(),
  }),

  DEADLINE_APPROACHING: (data) => ({
    subject: `⚠️ Deadline approaching: ${data.caseTitle}`,
    htmlBody: getBaseTemplate(
      `
      <h2>⚠️ Deadline Approaching</h2>
      <div class="urgent">
        <strong>Case:</strong> ${data.caseTitle}<br>
        <strong>Days remaining:</strong> ${data.daysRemaining}<br>
        ${data.deadlineDate ? `<strong>Deadline:</strong> ${new Date(data.deadlineDate).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}` : ""}
      </div>
      <p>The deadline for a response is very close. If you haven't received a response by the deadline, you may be able to escalate your case.</p>
      <p style="text-align: center;">
        <a href="${APP_URL}/disputes/${data.caseId}/case" class="button">View Case</a>
      </p>
      `,
      `Only ${data.daysRemaining} days left for ${data.caseTitle}`
    ),
    textBody: `
⚠️ Deadline Approaching

Case: ${data.caseTitle}
Days remaining: ${data.daysRemaining}
${data.deadlineDate ? `Deadline: ${new Date(data.deadlineDate).toLocaleDateString("en-GB")}` : ""}

The deadline for a response is very close. If you haven't received a response by the deadline, you may be able to escalate your case.

View Case: ${APP_URL}/disputes/${data.caseId}/case

---
DisputeHub
    `.trim(),
  }),

  DEADLINE_MISSED: (data) => ({
    subject: `❗ Deadline missed: ${data.caseTitle}`,
    htmlBody: getBaseTemplate(
      `
      <h2>❗ Response Deadline Missed</h2>
      <div class="urgent">
        <strong>Case:</strong> ${data.caseTitle}<br>
        ${data.deadlineDate ? `<strong>Deadline was:</strong> ${new Date(data.deadlineDate).toLocaleDateString("en-GB")}` : ""}
      </div>
      <p>The other party has not responded within the deadline. You may now be able to:</p>
      <ul>
        <li>Generate a follow-up letter</li>
        <li>Escalate to the next stage (e.g., ombudsman, court)</li>
        <li>Mark the case as resolved if you received a satisfactory response offline</li>
      </ul>
      <p style="text-align: center;">
        <a href="${APP_URL}/disputes/${data.caseId}/case" class="button">View Options</a>
      </p>
      `,
      `No response received for ${data.caseTitle} - see your options`
    ),
    textBody: `
❗ Response Deadline Missed

Case: ${data.caseTitle}
${data.deadlineDate ? `Deadline was: ${new Date(data.deadlineDate).toLocaleDateString("en-GB")}` : ""}

The other party has not responded within the deadline. You may now be able to:
- Generate a follow-up letter
- Escalate to the next stage (e.g., ombudsman, court)
- Mark the case as resolved if you received a satisfactory response offline

View Options: ${APP_URL}/disputes/${data.caseId}/case

---
DisputeHub
    `.trim(),
  }),

  RESPONSE_RECEIVED: (data) => ({
    subject: `Response received: ${data.caseTitle}`,
    htmlBody: getBaseTemplate(
      `
      <h2>Response Received 📬</h2>
      <div class="success">
        <strong>Case:</strong> ${data.caseTitle}
      </div>
      <p>Great news! You've marked that a response has been received for this case. What would you like to do next?</p>
      <ul>
        <li>If satisfied, close the case</li>
        <li>If not satisfied, consider escalation options</li>
        <li>Continue the conversation with our AI for guidance</li>
      </ul>
      <p style="text-align: center;">
        <a href="${APP_URL}/disputes/${data.caseId}/case" class="button">Continue Case</a>
      </p>
      `,
      `Response received for ${data.caseTitle} - next steps available`
    ),
    textBody: `
Response Received

Case: ${data.caseTitle}

Great news! You've marked that a response has been received for this case. What would you like to do next?
- If satisfied, close the case
- If not satisfied, consider escalation options
- Continue the conversation with our AI for guidance

Continue Case: ${APP_URL}/disputes/${data.caseId}/case

---
DisputeHub
    `.trim(),
  }),

  CASE_UPDATE: (data) => ({
    subject: `Case Update: ${data.caseTitle}`,
    htmlBody: getBaseTemplate(
      `
      <h2>Case Update</h2>
      <div class="highlight">
        <strong>Case:</strong> ${data.caseTitle}
      </div>
      <p>There has been an update to your case. Log in to see the details.</p>
      <p style="text-align: center;">
        <a href="${APP_URL}/disputes/${data.caseId}/case" class="button">View Update</a>
      </p>
      `,
      `Update for your case: ${data.caseTitle}`
    ),
    textBody: `
Case Update

Case: ${data.caseTitle}

There has been an update to your case. Log in to see the details.

View Update: ${APP_URL}/disputes/${data.caseId}/case

---
DisputeHub
    `.trim(),
  }),

  CASE_CLOSED: (data) => ({
    subject: `Case Closed: ${data.caseTitle}`,
    htmlBody: getBaseTemplate(
      `
      <h2>Case Closed ✓</h2>
      <div class="success">
        <strong>Case:</strong> ${data.caseTitle}
      </div>
      <p>Your case has been closed. We hope the outcome was satisfactory.</p>
      <p>Your case documents and history remain available in your dashboard if you need to reference them in the future.</p>
      <p style="text-align: center;">
        <a href="${APP_URL}/cases" class="button">View All Cases</a>
      </p>
      `,
      `Case closed: ${data.caseTitle}`
    ),
    textBody: `
Case Closed

Case: ${data.caseTitle}

Your case has been closed. We hope the outcome was satisfactory.

Your case documents and history remain available in your dashboard if you need to reference them in the future.

View All Cases: ${APP_URL}/cases

---
DisputeHub
    `.trim(),
  }),

  BADGE_EARNED: (data) => ({
    subject: `🏆 New Badge Earned: ${data.badgeName}`,
    htmlBody: getBaseTemplate(
      `
      <h2>Congratulations! 🏆</h2>
      <div class="success">
        <strong>You earned a new badge:</strong> ${data.badgeName}
      </div>
      <p>Keep up the great work! Check your profile to see all your achievements.</p>
      <p style="text-align: center;">
        <a href="${APP_URL}/profile" class="button">View Badges</a>
      </p>
      `,
      `You earned the ${data.badgeName} badge!`
    ),
    textBody: `
Congratulations! 🏆

You earned a new badge: ${data.badgeName}

Keep up the great work! Check your profile to see all your achievements.

View Badges: ${APP_URL}/profile

---
DisputeHub
    `.trim(),
  }),

  WEEKLY_SUMMARY: (data) => ({
    subject: "Your Weekly DisputeHub Summary",
    htmlBody: getBaseTemplate(
      `
      <h2>Your Weekly Summary 📊</h2>
      <p>Here's what's happening with your cases this week:</p>
      <div class="highlight">
        ${(data.customData as any)?.summaryContent || "No activity this week."}
      </div>
      <p style="text-align: center;">
        <a href="${APP_URL}/disputes" class="button">View Dashboard</a>
      </p>
      `,
      "Your weekly case summary from DisputeHub"
    ),
    textBody: `
Your Weekly Summary

Here's what's happening with your cases this week:

${(data.customData as any)?.summaryText || "No activity this week."}

View Dashboard: ${APP_URL}/disputes

---
DisputeHub
    `.trim(),
  }),
};

/**
 * Generate email content from template
 */
export function generateEmail(type: EmailType, data: EmailData): EmailTemplate {
  const generator = TEMPLATES[type];
  if (!generator) {
    throw new Error(`Unknown email template type: ${type}`);
  }
  return generator(data);
}

/**
 * Get all available email types
 */
export function getEmailTypes(): EmailType[] {
  return Object.keys(TEMPLATES) as EmailType[];
}
