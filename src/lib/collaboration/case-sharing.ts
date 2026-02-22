/**
 * Feature 2: Case Collaboration
 * Share case with others via invite link
 */

import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export type CollaboratorRole = "VIEWER" | "EDITOR" | "ADMIN";

export interface CaseCollaborator {
  id: string;
  caseId: string;
  userId: string | null;
  email: string;
  role: CollaboratorRole;
  inviteToken: string | null;
  inviteAcceptedAt: Date | null;
  createdAt: Date;
}

export interface CaseShareLink {
  id: string;
  caseId: string;
  token: string;
  role: CollaboratorRole;
  expiresAt: Date | null;
  maxUses: number | null;
  useCount: number;
  createdAt: Date;
  createdBy: string;
}

/**
 * Generate a unique share token
 */
function generateShareToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Create a share link for a case
 */
export async function createShareLink(params: {
  caseId: string;
  userId: string;
  role?: CollaboratorRole;
  expiresInDays?: number;
  maxUses?: number;
}): Promise<CaseShareLink> {
  const { caseId, userId, role = "VIEWER", expiresInDays, maxUses } = params;

  // Verify user owns the case
  const caseData = await prisma.dispute.findFirst({
    where: { id: caseId, userId },
  });

  if (!caseData) {
    throw new Error("Case not found or you don't have permission");
  }

  const token = generateShareToken();
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  const shareLink = await prisma.caseShareLink.create({
    data: {
      caseId,
      token,
      role,
      expiresAt,
      maxUses,
      useCount: 0,
      createdBy: userId,
    },
  });

  return shareLink;
}

/**
 * Get share link URL
 */
export function getShareLinkUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl}/share/${token}`;
}

/**
 * Accept a share invitation
 */
export async function acceptShareInvitation(params: {
  token: string;
  userId: string;
  email: string;
}): Promise<CaseCollaborator> {
  const { token, userId, email } = params;

  // Find the share link
  const shareLink = await prisma.caseShareLink.findUnique({
    where: { token },
  });

  if (!shareLink) {
    throw new Error("Invalid share link");
  }

  // Check expiration
  if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
    throw new Error("Share link has expired");
  }

  // Check max uses
  if (shareLink.maxUses && shareLink.useCount >= shareLink.maxUses) {
    throw new Error("Share link has reached maximum uses");
  }

  // Check if user is already a collaborator
  const existingCollaborator = await prisma.caseCollaborator.findFirst({
    where: {
      caseId: shareLink.caseId,
      userId,
    },
  });

  if (existingCollaborator) {
    return existingCollaborator;
  }

  // Create collaborator and update use count in a transaction
  const [collaborator] = await prisma.$transaction([
    prisma.caseCollaborator.create({
      data: {
        caseId: shareLink.caseId,
        userId,
        email,
        role: shareLink.role,
        inviteToken: token,
        inviteAcceptedAt: new Date(),
      },
    }),
    prisma.caseShareLink.update({
      where: { id: shareLink.id },
      data: { useCount: { increment: 1 } },
    }),
  ]);

  return collaborator;
}

/**
 * Get all collaborators for a case
 */
export async function getCaseCollaborators(
  caseId: string,
  userId: string
): Promise<CaseCollaborator[]> {
  // Verify user has access
  const hasAccess = await canAccessCase(caseId, userId);
  if (!hasAccess) {
    throw new Error("Access denied");
  }

  return prisma.caseCollaborator.findMany({
    where: { caseId },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Remove a collaborator from a case
 */
export async function removeCollaborator(
  collaboratorId: string,
  requestingUserId: string
): Promise<void> {
  const collaborator = await prisma.caseCollaborator.findUnique({
    where: { id: collaboratorId },
    include: { case: true },
  });

  if (!collaborator) {
    throw new Error("Collaborator not found");
  }

  // Only case owner or admins can remove collaborators
  const isOwner = collaborator.case.userId === requestingUserId;
  const requestingCollab = await prisma.caseCollaborator.findFirst({
    where: { caseId: collaborator.caseId, userId: requestingUserId, role: "ADMIN" },
  });

  if (!isOwner && !requestingCollab) {
    throw new Error("Permission denied");
  }

  await prisma.caseCollaborator.delete({
    where: { id: collaboratorId },
  });
}

/**
 * Update collaborator role
 */
export async function updateCollaboratorRole(
  collaboratorId: string,
  newRole: CollaboratorRole,
  requestingUserId: string
): Promise<CaseCollaborator> {
  const collaborator = await prisma.caseCollaborator.findUnique({
    where: { id: collaboratorId },
    include: { case: true },
  });

  if (!collaborator) {
    throw new Error("Collaborator not found");
  }

  // Only case owner can change roles
  if (collaborator.case.userId !== requestingUserId) {
    throw new Error("Only the case owner can change roles");
  }

  return prisma.caseCollaborator.update({
    where: { id: collaboratorId },
    data: { role: newRole },
  });
}

/**
 * Check if a user can access a case
 */
export async function canAccessCase(
  caseId: string,
  userId: string
): Promise<boolean> {
  // Check if owner
  const ownCase = await prisma.dispute.findFirst({
    where: { id: caseId, userId },
  });

  if (ownCase) return true;

  // Check if collaborator
  const collaborator = await prisma.caseCollaborator.findFirst({
    where: { caseId, userId },
  });

  return !!collaborator;
}

/**
 * Check if user can edit a case
 */
export async function canEditCase(
  caseId: string,
  userId: string
): Promise<boolean> {
  // Check if owner
  const ownCase = await prisma.dispute.findFirst({
    where: { id: caseId, userId },
  });

  if (ownCase) return true;

  // Check if collaborator with edit rights
  const collaborator = await prisma.caseCollaborator.findFirst({
    where: {
      caseId,
      userId,
      role: { in: ["EDITOR", "ADMIN"] },
    },
  });

  return !!collaborator;
}

/**
 * Revoke a share link
 */
export async function revokeShareLink(
  linkId: string,
  userId: string
): Promise<void> {
  const shareLink = await prisma.caseShareLink.findUnique({
    where: { id: linkId },
    include: { case: true },
  });

  if (!shareLink) {
    throw new Error("Share link not found");
  }

  if (shareLink.case.userId !== userId) {
    throw new Error("Only the case owner can revoke share links");
  }

  await prisma.caseShareLink.delete({
    where: { id: linkId },
  });
}

/**
 * Get all share links for a case
 */
export async function getCaseShareLinks(
  caseId: string,
  userId: string
): Promise<CaseShareLink[]> {
  // Verify user owns the case
  const caseData = await prisma.dispute.findFirst({
    where: { id: caseId, userId },
  });

  if (!caseData) {
    throw new Error("Case not found or you don't have permission");
  }

  return prisma.caseShareLink.findMany({
    where: { caseId },
    orderBy: { createdAt: "desc" },
  });
}
