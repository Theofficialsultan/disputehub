/**
 * Feature 8: Auto-Save Drafts
 * Save chat progress automatically
 */

import { prisma } from "@/lib/prisma";

export interface DraftData {
  id: string;
  userId: string;
  caseId: string | null;
  type: DraftType;
  title: string;
  content: DraftContent;
  lastSavedAt: Date;
  autoSaved: boolean;
  expiresAt: Date | null;
}

export type DraftType = "case_chat" | "document_edit" | "evidence_notes" | "custom";

export interface DraftContent {
  messages?: ChatMessage[];
  formData?: Record<string, unknown>;
  documentContent?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface AutoSaveConfig {
  enabled: boolean;
  intervalMs: number;
  maxDrafts: number;
  expirationDays: number;
}

// Default configuration
const DEFAULT_CONFIG: AutoSaveConfig = {
  enabled: true,
  intervalMs: 30000, // 30 seconds
  maxDrafts: 50,
  expirationDays: 30,
};

/**
 * Save or update a draft
 */
export async function saveDraft(params: {
  userId: string;
  caseId?: string;
  type: DraftType;
  title: string;
  content: DraftContent;
  autoSaved?: boolean;
}): Promise<DraftData> {
  const { userId, caseId, type, title, content, autoSaved = false } = params;

  const expiresAt = new Date(
    Date.now() + DEFAULT_CONFIG.expirationDays * 24 * 60 * 60 * 1000
  );

  // Check if a draft already exists for this case
  if (caseId) {
    const existingDraft = await prisma.draft.findFirst({
      where: {
        userId,
        caseId,
        type,
      },
    });

    if (existingDraft) {
      // Update existing draft
      const updated = await prisma.draft.update({
        where: { id: existingDraft.id },
        data: {
          title,
          content: content as any,
          lastSavedAt: new Date(),
          autoSaved,
          expiresAt,
        },
      });

      return {
        id: updated.id,
        userId: updated.userId,
        caseId: updated.caseId,
        type: updated.type as DraftType,
        title: updated.title,
        content: updated.content as DraftContent,
        lastSavedAt: updated.lastSavedAt,
        autoSaved: updated.autoSaved,
        expiresAt: updated.expiresAt,
      };
    }
  }

  // Create new draft
  const draft = await prisma.draft.create({
    data: {
      userId,
      caseId,
      type,
      title,
      content: content as any,
      lastSavedAt: new Date(),
      autoSaved,
      expiresAt,
    },
  });

  // Clean up old drafts if over limit
  await cleanupOldDrafts(userId);

  return {
    id: draft.id,
    userId: draft.userId,
    caseId: draft.caseId,
    type: draft.type as DraftType,
    title: draft.title,
    content: draft.content as DraftContent,
    lastSavedAt: draft.lastSavedAt,
    autoSaved: draft.autoSaved,
    expiresAt: draft.expiresAt,
  };
}

/**
 * Get a draft by ID
 */
export async function getDraft(draftId: string, userId: string): Promise<DraftData | null> {
  const draft = await prisma.draft.findFirst({
    where: {
      id: draftId,
      userId,
    },
  });

  if (!draft) return null;

  return {
    id: draft.id,
    userId: draft.userId,
    caseId: draft.caseId,
    type: draft.type as DraftType,
    title: draft.title,
    content: draft.content as DraftContent,
    lastSavedAt: draft.lastSavedAt,
    autoSaved: draft.autoSaved,
    expiresAt: draft.expiresAt,
  };
}

/**
 * Get draft for a specific case
 */
export async function getCaseDraft(
  caseId: string,
  userId: string,
  type?: DraftType
): Promise<DraftData | null> {
  const draft = await prisma.draft.findFirst({
    where: {
      caseId,
      userId,
      ...(type && { type }),
    },
    orderBy: { lastSavedAt: "desc" },
  });

  if (!draft) return null;

  return {
    id: draft.id,
    userId: draft.userId,
    caseId: draft.caseId,
    type: draft.type as DraftType,
    title: draft.title,
    content: draft.content as DraftContent,
    lastSavedAt: draft.lastSavedAt,
    autoSaved: draft.autoSaved,
    expiresAt: draft.expiresAt,
  };
}

/**
 * Get all drafts for a user
 */
export async function getUserDrafts(userId: string): Promise<DraftData[]> {
  const drafts = await prisma.draft.findMany({
    where: {
      userId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { lastSavedAt: "desc" },
  });

  return drafts.map((draft) => ({
    id: draft.id,
    userId: draft.userId,
    caseId: draft.caseId,
    type: draft.type as DraftType,
    title: draft.title,
    content: draft.content as DraftContent,
    lastSavedAt: draft.lastSavedAt,
    autoSaved: draft.autoSaved,
    expiresAt: draft.expiresAt,
  }));
}

/**
 * Delete a draft
 */
export async function deleteDraft(draftId: string, userId: string): Promise<void> {
  await prisma.draft.deleteMany({
    where: {
      id: draftId,
      userId,
    },
  });
}

/**
 * Delete all drafts for a case
 */
export async function deleteCaseDrafts(caseId: string, userId: string): Promise<void> {
  await prisma.draft.deleteMany({
    where: {
      caseId,
      userId,
    },
  });
}

/**
 * Cleanup old drafts to stay within limits
 */
async function cleanupOldDrafts(userId: string): Promise<void> {
  // Delete expired drafts
  await prisma.draft.deleteMany({
    where: {
      userId,
      expiresAt: { lt: new Date() },
    },
  });

  // Get count of remaining drafts
  const count = await prisma.draft.count({
    where: { userId },
  });

  // If over limit, delete oldest auto-saved drafts
  if (count > DEFAULT_CONFIG.maxDrafts) {
    const draftsToDelete = count - DEFAULT_CONFIG.maxDrafts;
    
    const oldestDrafts = await prisma.draft.findMany({
      where: {
        userId,
        autoSaved: true,
      },
      orderBy: { lastSavedAt: "asc" },
      take: draftsToDelete,
      select: { id: true },
    });

    await prisma.draft.deleteMany({
      where: {
        id: { in: oldestDrafts.map((d) => d.id) },
      },
    });
  }
}

/**
 * Restore a draft to continue working on a case
 */
export async function restoreDraft(draftId: string, userId: string): Promise<{
  success: boolean;
  caseId?: string;
  messages?: ChatMessage[];
  formData?: Record<string, unknown>;
}> {
  const draft = await getDraft(draftId, userId);
  
  if (!draft) {
    return { success: false };
  }

  // If draft has a case ID, update the case with draft content
  if (draft.caseId && draft.type === "case_chat" && draft.content.messages) {
    // Store messages back to case
    for (const message of draft.content.messages) {
      await prisma.caseMessage.create({
        data: {
          caseId: draft.caseId,
          role: message.role === "user" ? "USER" : "AI",
          content: message.content,
          intent: message.role === "user" ? "QUESTION" : "ANSWER",
          createdAt: message.timestamp,
        },
      });
    }
  }

  return {
    success: true,
    caseId: draft.caseId || undefined,
    messages: draft.content.messages,
    formData: draft.content.formData,
  };
}

/**
 * Create auto-save handler for client-side use
 */
export function createAutoSaveHandler(
  saveCallback: (content: DraftContent) => Promise<void>,
  config: Partial<AutoSaveConfig> = {}
): {
  start: () => void;
  stop: () => void;
  save: () => Promise<void>;
  setContent: (content: DraftContent) => void;
} {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  let intervalId: NodeJS.Timeout | null = null;
  let pendingContent: DraftContent = {};
  let lastSavedContent: string = "";

  const save = async () => {
    const contentString = JSON.stringify(pendingContent);
    if (contentString !== lastSavedContent) {
      await saveCallback(pendingContent);
      lastSavedContent = contentString;
    }
  };

  return {
    start: () => {
      if (mergedConfig.enabled && !intervalId) {
        intervalId = setInterval(save, mergedConfig.intervalMs);
      }
    },
    stop: () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    },
    save,
    setContent: (content: DraftContent) => {
      pendingContent = content;
    },
  };
}

/**
 * Get draft statistics for a user
 */
export async function getDraftStats(userId: string): Promise<{
  totalDrafts: number;
  autoSavedCount: number;
  manualSavedCount: number;
  oldestDraft: Date | null;
  newestDraft: Date | null;
}> {
  const drafts = await prisma.draft.findMany({
    where: { userId },
    select: {
      autoSaved: true,
      lastSavedAt: true,
    },
    orderBy: { lastSavedAt: "asc" },
  });

  return {
    totalDrafts: drafts.length,
    autoSavedCount: drafts.filter((d) => d.autoSaved).length,
    manualSavedCount: drafts.filter((d) => !d.autoSaved).length,
    oldestDraft: drafts[0]?.lastSavedAt || null,
    newestDraft: drafts[drafts.length - 1]?.lastSavedAt || null,
  };
}
