/**
 * Feature 1: Document Versioning
 * Track revision history for generated documents
 */

import { prisma } from "@/lib/prisma";

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  content: string | null;
  fileUrl: string | null;
  pdfData: Buffer | null;
  changesSummary: string;
  createdAt: Date;
  createdBy: string;
}

/**
 * Get version history for a document
 */
export async function getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
  const versions = await prisma.documentVersion.findMany({
    where: { documentId },
    orderBy: { version: "desc" },
    select: {
      id: true,
      documentId: true,
      version: true,
      content: true,
      fileUrl: true,
      pdfData: true,
      changesSummary: true,
      createdAt: true,
      createdBy: true,
    },
  });

  return versions;
}

/**
 * Create a new document version
 */
export async function createDocumentVersion(params: {
  documentId: string;
  content: string | null;
  fileUrl: string | null;
  pdfData: Buffer | null;
  changesSummary: string;
  userId: string;
}): Promise<DocumentVersion> {
  const { documentId, content, fileUrl, pdfData, changesSummary, userId } = params;

  // Get the latest version number
  const latestVersion = await prisma.documentVersion.findFirst({
    where: { documentId },
    orderBy: { version: "desc" },
    select: { version: true },
  });

  const nextVersion = (latestVersion?.version || 0) + 1;

  const version = await prisma.documentVersion.create({
    data: {
      documentId,
      version: nextVersion,
      content,
      fileUrl,
      pdfData,
      changesSummary,
      createdBy: userId,
    },
  });

  return version;
}

/**
 * Restore a document to a previous version
 */
export async function restoreDocumentVersion(
  versionId: string,
  userId: string
): Promise<DocumentVersion> {
  // Get the version to restore
  const versionToRestore = await prisma.documentVersion.findUnique({
    where: { id: versionId },
    include: {
      document: true,
    },
  });

  if (!versionToRestore) {
    throw new Error("Version not found");
  }

  // Update the main document
  await prisma.generatedDocument.update({
    where: { id: versionToRestore.documentId },
    data: {
      content: versionToRestore.content,
      fileUrl: versionToRestore.fileUrl,
      pdfData: versionToRestore.pdfData,
      updatedAt: new Date(),
    },
  });

  // Create a new version entry for the restoration
  const restoredVersion = await createDocumentVersion({
    documentId: versionToRestore.documentId,
    content: versionToRestore.content,
    fileUrl: versionToRestore.fileUrl,
    pdfData: versionToRestore.pdfData,
    changesSummary: `Restored from version ${versionToRestore.version}`,
    userId,
  });

  return restoredVersion;
}

/**
 * Compare two document versions
 */
export async function compareVersions(
  versionId1: string,
  versionId2: string
): Promise<{ v1: DocumentVersion; v2: DocumentVersion; diff: string }> {
  const [v1, v2] = await Promise.all([
    prisma.documentVersion.findUnique({ where: { id: versionId1 } }),
    prisma.documentVersion.findUnique({ where: { id: versionId2 } }),
  ]);

  if (!v1 || !v2) {
    throw new Error("One or both versions not found");
  }

  // Simple diff - in production, use a proper diff library
  const diff = generateSimpleDiff(v1.content || "", v2.content || "");

  return { v1, v2, diff };
}

function generateSimpleDiff(oldText: string, newText: string): string {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  
  const changes: string[] = [];
  const maxLength = Math.max(oldLines.length, newLines.length);
  
  for (let i = 0; i < maxLength; i++) {
    if (oldLines[i] !== newLines[i]) {
      if (oldLines[i] && !newLines[i]) {
        changes.push(`- Line ${i + 1}: "${oldLines[i]}"`);
      } else if (!oldLines[i] && newLines[i]) {
        changes.push(`+ Line ${i + 1}: "${newLines[i]}"`);
      } else {
        changes.push(`~ Line ${i + 1}: "${oldLines[i]}" → "${newLines[i]}"`);
      }
    }
  }
  
  return changes.join("\n") || "No differences found";
}
