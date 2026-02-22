import { google } from "googleapis";
import { encryptToken, decryptToken } from "./encryption";
import { prisma } from "@/lib/prisma";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/userinfo.email",
];

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/email/callback/gmail`
  );
}

/**
 * Generate Gmail OAuth authorization URL
 */
export function getGmailAuthUrl(userId: string): string {
  const client = getOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
    state: userId,
  });
}

/**
 * Exchange authorization code for tokens and store them
 */
export async function handleGmailCallback(code: string, userId: string) {
  const client = getOAuth2Client();
  const { tokens } = await client.getToken(code);

  if (!tokens.access_token) {
    throw new Error("No access token received from Google");
  }

  // Get user email
  client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const { data: userInfo } = await oauth2.userinfo.get();
  const email = userInfo.email;

  if (!email) {
    throw new Error("Could not retrieve email from Google account");
  }

  // Encrypt tokens
  const accessTokenEnc = encryptToken(tokens.access_token);
  const refreshTokenEnc = tokens.refresh_token ? encryptToken(tokens.refresh_token) : null;

  // Upsert email account
  await prisma.emailAccount.upsert({
    where: { userId_provider: { userId, provider: "GMAIL" } },
    create: {
      userId,
      provider: "GMAIL",
      email,
      accessTokenEnc,
      refreshTokenEnc,
      tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      scopes: SCOPES,
      isActive: true,
    },
    update: {
      email,
      accessTokenEnc,
      refreshTokenEnc: refreshTokenEnc || undefined,
      tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      scopes: SCOPES,
      isActive: true,
      disconnectedAt: null,
    },
  });

  return { email, provider: "GMAIL" as const };
}

/**
 * Get authenticated Gmail client with auto token refresh
 */
export async function getGmailClient(emailAccountId: string) {
  const account = await prisma.emailAccount.findUnique({
    where: { id: emailAccountId },
  });

  if (!account || account.provider !== "GMAIL") {
    throw new Error("Gmail account not found");
  }

  const client = getOAuth2Client();
  const accessToken = decryptToken(account.accessTokenEnc);
  const refreshToken = account.refreshTokenEnc ? decryptToken(account.refreshTokenEnc) : undefined;

  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: account.tokenExpiresAt?.getTime(),
  });

  // Auto-refresh listener
  client.on("tokens", async (tokens) => {
    const updates: any = {};
    if (tokens.access_token) {
      updates.accessTokenEnc = encryptToken(tokens.access_token);
    }
    if (tokens.refresh_token) {
      updates.refreshTokenEnc = encryptToken(tokens.refresh_token);
    }
    if (tokens.expiry_date) {
      updates.tokenExpiresAt = new Date(tokens.expiry_date);
    }
    if (Object.keys(updates).length > 0) {
      await prisma.emailAccount.update({
        where: { id: emailAccountId },
        data: updates,
      });
    }
  });

  return { client, gmail: google.gmail({ version: "v1", auth: client }), account };
}

/**
 * Send an email via Gmail
 */
export async function sendGmailEmail(
  emailAccountId: string,
  to: string,
  subject: string,
  bodyHtml: string,
  inReplyTo?: string
) {
  const { gmail, account } = await getGmailClient(emailAccountId);

  // Build RFC 2822 message
  const headers = [
    `From: ${account.email}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=utf-8`,
  ];

  if (inReplyTo) {
    headers.push(`In-Reply-To: ${inReplyTo}`);
    headers.push(`References: ${inReplyTo}`);
  }

  const message = headers.join("\r\n") + "\r\n\r\n" + bodyHtml;
  const encoded = Buffer.from(message).toString("base64url");

  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encoded },
  });

  return {
    messageId: res.data.id,
    threadId: res.data.threadId,
  };
}

/**
 * Fetch recent emails from Gmail inbox
 */
export async function fetchGmailInbox(
  emailAccountId: string,
  options: { maxResults?: number; query?: string; pageToken?: string } = {}
) {
  const { gmail } = await getGmailClient(emailAccountId);
  const { maxResults = 20, query, pageToken } = options;

  const listRes = await gmail.users.messages.list({
    userId: "me",
    maxResults,
    q: query,
    pageToken,
  });

  if (!listRes.data.messages) return { messages: [], nextPageToken: null };

  const messages = await Promise.all(
    listRes.data.messages.map(async (msg) => {
      const full = await gmail.users.messages.get({
        userId: "me",
        id: msg.id!,
        format: "full",
      });

      const headers = full.data.payload?.headers || [];
      const getHeader = (name: string) => headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

      // Extract body
      let bodyText = "";
      let bodyHtml = "";
      const parts = full.data.payload?.parts || [];

      if (full.data.payload?.body?.data) {
        bodyText = Buffer.from(full.data.payload.body.data, "base64url").toString("utf8");
      }

      for (const part of parts) {
        if (part.mimeType === "text/plain" && part.body?.data) {
          bodyText = Buffer.from(part.body.data, "base64url").toString("utf8");
        }
        if (part.mimeType === "text/html" && part.body?.data) {
          bodyHtml = Buffer.from(part.body.data, "base64url").toString("utf8");
        }
      }

      return {
        externalMessageId: full.data.id,
        threadId: full.data.threadId,
        subject: getHeader("Subject"),
        senderEmail: getHeader("From").replace(/.*<(.+)>.*/, "$1"),
        senderName: getHeader("From").replace(/<.*>/, "").trim().replace(/"/g, ""),
        recipientEmail: getHeader("To").replace(/.*<(.+)>.*/, "$1"),
        recipientName: getHeader("To").replace(/<.*>/, "").trim().replace(/"/g, ""),
        snippet: full.data.snippet || "",
        bodyText,
        bodyHtml,
        receivedAt: new Date(parseInt(full.data.internalDate || "0")),
        isRead: !full.data.labelIds?.includes("UNREAD"),
        hasAttachments: parts.some((p) => p.filename && p.filename.length > 0),
      };
    })
  );

  return {
    messages,
    nextPageToken: listRes.data.nextPageToken || null,
  };
}
