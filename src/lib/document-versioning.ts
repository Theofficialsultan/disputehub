/**
 * Document Versioning System
 * Tracks all revisions of generated documents
 */

import { prisma } from "@/lib/prisma";

/**
 * Create a new version snapshot before updating a document
 */
export async function createDocumentVersion(
  documentId: string,
  changeReason?: string,
  changedBy?: string
): Promise<void> {
  try {
    // Get current document state
    const document = await prisma.generatedDocument.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        content: true,
        fileUrl: true,
      },
    });

    if (!document) {
      console.warn(`[Versioning] Document ${documentId} not found`);
      return;
    }

    // Get current version count
    const versionCount = await prisma.documentVersion.count({
      where: { documentId },
    });

    // Create version snapshot
    await prisma.documentVersion.create({
      data: {
        documentId,
        versionNumber: versionCount + 1,
        content: document.content,
        fileUrl: document.fileUrl,
        changeReason: changeReason || "Document updated",
        changedBy: changedBy || "system",
      },
    });

    console.log(`[Versioning] Created version ${versionCount + 1} for document ${documentId}`);
  } catch (error) {
    console.error("[Versioning] Error creating version:", error);
    // Don't throw - versioning failure shouldn't block document operations
  }
}

/**
 * Get version history for a document
 */
export async function getDocumentVersions(documentId: string) {
  return prisma.documentVersion.findMany({
    where: { documentId },
    orderBy: { versionNumber: "desc" },
  });
}

/**
 * Restore a previous version
 */
export async function restoreDocumentVersion(
  documentId: string,
  versionNumber: number,
  restoredBy?: string
): Promise<boolean> {
  try {
    const version = await prisma.documentVersion.findUnique({
      where: {
        documentId_versionNumber: {
          documentId,
          versionNumber,
        },
      },
    });

    if (!version) {
      console.warn(`[Versioning] Version ${versionNumber} not found for document ${documentId}`);
      return false;
    }

    // Create a version snapshot of current state before restoring
    await createDocumentVersion(
      documentId,
      `Before restoring to version ${versionNumber}`,
      restoredBy || "system"
    );

    // Restore the content
    await prisma.generatedDocument.update({
      where: { id: documentId },
      data: {
        content: version.content,
        fileUrl: version.fileUrl,
        updatedAt: new Date(),
      },
    });

    console.log(`[Versioning] Restored document ${documentId} to version ${versionNumber}`);
    return true;
  } catch (error) {
    console.error("[Versioning] Error restoring version:", error);
    return false;
  }
}

/**
 * Compare two versions
 */
export async function compareDocumentVersions(
  documentId: string,
  version1: number,
  version2: number
) {
  const [v1, v2] = await Promise.all([
    prisma.documentVersion.findUnique({
      where: { documentId_versionNumber: { documentId, versionNumber: version1 } },
    }),
    prisma.documentVersion.findUnique({
      where: { documentId_versionNumber: { documentId, versionNumber: version2 } },
    }),
  ]);

  if (!v1 || !v2) {
    return null;
  }

  // Simple diff - in production you'd want a proper diff algorithm
  const content1Lines = (v1.content || "").split("\n");
  const content2Lines = (v2.content || "").split("\n");

  return {
    version1: {
      number: v1.versionNumber,
      createdAt: v1.createdAt,
      changeReason: v1.changeReason,
      lineCount: content1Lines.length,
    },
    version2: {
      number: v2.versionNumber,
      createdAt: v2.createdAt,
      changeReason: v2.changeReason,
      lineCount: content2Lines.length,
    },
    differences: {
      linesAdded: content2Lines.filter((line) => !content1Lines.includes(line)).length,
      linesRemoved: content1Lines.filter((line) => !content2Lines.includes(line)).length,
    },
  };
}
