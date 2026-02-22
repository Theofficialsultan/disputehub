import { Client } from "@microsoft/microsoft-graph-client";
import { encryptToken, decryptToken } from "./encryption";
import { prisma } from "@/lib/prisma";

const SCOPES = [
  "openid",
  "profile",
  "email",
  "Mail.Send",
  "Mail.Read",
  "Mail.ReadWrite",
  "offline_access",
];

const AUTHORITY = "https://login.microsoftonline.com/common";
const TOKEN_ENDPOINT = `${AUTHORITY}/oauth2/v2.0/token`;
const AUTH_ENDPOINT = `${AUTHORITY}/oauth2/v2.0/authorize`;

/**
 * Generate Outlook OAuth authorization URL
 */
export function getOutlookAuthUrl(userId: string): string {
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    response_type: "code",
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/email/callback/outlook`,
    scope: SCOPES.join(" "),
    state: userId,
    response_mode: "query",
    prompt: "consent",
  });
  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function handleOutlookCallback(code: string, userId: string) {
  const body = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
    code,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/email/callback/outlook`,
    grant_type: "authorization_code",
    scope: SCOPES.join(" "),
  });

  const tokenRes = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Outlook token exchange failed: ${err}`);
  }

  const tokens = await tokenRes.json();

  // Get user email via Graph API
  const graphClient = Client.init({
    authProvider: (done) => done(null, tokens.access_token),
  });

  const me = await graphClient.api("/me").select("mail,userPrincipalName").get();
  const email = me.mail || me.userPrincipalName;

  if (!email) {
    throw new Error("Could not retrieve email from Microsoft account");
  }

  // Encrypt tokens
  const accessTokenEnc = encryptToken(tokens.access_token);
  const refreshTokenEnc = tokens.refresh_token ? encryptToken(tokens.refresh_token) : null;
  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000)
    : null;

  // Upsert email account
  await prisma.emailAccount.upsert({
    where: { userId_provider: { userId, provider: "OUTLOOK" } },
    create: {
      userId,
      provider: "OUTLOOK",
      email,
      accessTokenEnc,
      refreshTokenEnc,
      tokenExpiresAt: expiresAt,
      scopes: SCOPES,
      isActive: true,
    },
    update: {
      email,
      accessTokenEnc,
      refreshTokenEnc: refreshTokenEnc || undefined,
      tokenExpiresAt: expiresAt,
      scopes: SCOPES,
      isActive: true,
      disconnectedAt: null,
    },
  });

  return { email, provider: "OUTLOOK" as const };
}

/**
 * Refresh Outlook access token
 */
async function refreshOutlookToken(emailAccountId: string) {
  const account = await prisma.emailAccount.findUnique({
    where: { id: emailAccountId },
  });

  if (!account || !account.refreshTokenEnc) {
    throw new Error("No refresh token available for Outlook account");
  }

  const refreshToken = decryptToken(account.refreshTokenEnc);

  const body = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
    scope: SCOPES.join(" "),
  });

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error("Outlook token refresh failed");
  }

  const tokens = await res.json();

  await prisma.emailAccount.update({
    where: { id: emailAccountId },
    data: {
      accessTokenEnc: encryptToken(tokens.access_token),
      refreshTokenEnc: tokens.refresh_token ? encryptToken(tokens.refresh_token) : undefined,
      tokenExpiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : undefined,
    },
  });

  return tokens.access_token;
}

/**
 * Get authenticated Graph client with auto-refresh
 */
export async function getOutlookClient(emailAccountId: string) {
  const account = await prisma.emailAccount.findUnique({
    where: { id: emailAccountId },
  });

  if (!account || account.provider !== "OUTLOOK") {
    throw new Error("Outlook account not found");
  }

  let accessToken = decryptToken(account.accessTokenEnc);

  // Refresh if expired or about to expire (5 min buffer)
  if (account.tokenExpiresAt && account.tokenExpiresAt.getTime() < Date.now() + 300000) {
    accessToken = await refreshOutlookToken(emailAccountId);
  }

  const graphClient = Client.init({
    authProvider: (done) => done(null, accessToken),
  });

  return { graphClient, account };
}

/**
 * Send email via Outlook (Microsoft Graph)
 */
export async function sendOutlookEmail(
  emailAccountId: string,
  to: string,
  subject: string,
  bodyHtml: string,
  inReplyTo?: string
) {
  const { graphClient } = await getOutlookClient(emailAccountId);

  const message: any = {
    subject,
    body: { contentType: "HTML", content: bodyHtml },
    toRecipients: [{ emailAddress: { address: to } }],
  };

  if (inReplyTo) {
    // Reply to existing message
    await graphClient.api(`/me/messages/${inReplyTo}/reply`).post({
      message: { body: { contentType: "HTML", content: bodyHtml } },
    });
    return { messageId: inReplyTo, threadId: null };
  }

  const res = await graphClient.api("/me/sendMail").post({ message, saveToSentItems: true });
  return { messageId: res?.id || null, threadId: null };
}

/**
 * Fetch recent inbox messages via Microsoft Graph
 */
export async function fetchOutlookInbox(
  emailAccountId: string,
  options: { top?: number; skip?: number } = {}
) {
  const { graphClient } = await getOutlookClient(emailAccountId);
  const { top = 20, skip = 0 } = options;

  const res = await graphClient
    .api("/me/mailFolders/inbox/messages")
    .top(top)
    .skip(skip)
    .select("id,conversationId,subject,from,toRecipients,bodyPreview,body,receivedDateTime,isRead,hasAttachments")
    .orderby("receivedDateTime desc")
    .get();

  const messages = (res.value || []).map((msg: any) => ({
    externalMessageId: msg.id,
    threadId: msg.conversationId,
    subject: msg.subject || "",
    senderEmail: msg.from?.emailAddress?.address || "",
    senderName: msg.from?.emailAddress?.name || "",
    recipientEmail: msg.toRecipients?.[0]?.emailAddress?.address || "",
    recipientName: msg.toRecipients?.[0]?.emailAddress?.name || "",
    snippet: msg.bodyPreview || "",
    bodyText: msg.body?.contentType === "text" ? msg.body.content : "",
    bodyHtml: msg.body?.contentType === "html" ? msg.body.content : "",
    receivedAt: new Date(msg.receivedDateTime),
    isRead: msg.isRead,
    hasAttachments: msg.hasAttachments,
  }));

  return { messages, hasMore: !!res["@odata.nextLink"] };
}
