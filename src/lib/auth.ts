import { currentUser } from "@clerk/nextjs/server";
import { verifyToken } from "@clerk/backend";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * Get Clerk user from either cookies (web) or Bearer token (mobile)
 */
async function getClerkUser() {
  // First try cookie-based auth (web)
  const clerkUser = await currentUser();
  if (clerkUser) {
    return clerkUser;
  }

  // If no cookie session, try Bearer token (mobile)
  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY!,
      });
      
      if (payload?.sub) {
        // Return a minimal user object with the Clerk ID
        return {
          id: payload.sub,
          emailAddresses: [{ emailAddress: (payload as any).email || "" }],
          firstName: (payload as any).first_name || null,
          lastName: (payload as any).last_name || null,
          imageUrl: (payload as any).image_url || null,
        };
      }
    } catch (error) {
      console.error("Token verification failed:", error);
    }
  }

  return null;
}

/**
 * Ensures the current Clerk user exists in the database
 * Creates the user if missing, does nothing if already exists
 * Supports both web (cookie) and mobile (Bearer token) auth
 */
export async function ensureUser() {
  const clerkUser = await getClerkUser();

  if (!clerkUser) {
    return null;
  }

  // Check if user exists
  let user = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  // Create if missing
  if (!user) {
    const email = clerkUser.emailAddresses?.[0]?.emailAddress || "";
    user = await prisma.user.create({
      data: {
        clerkId: clerkUser.id,
        email,
        firstName: clerkUser.firstName || null,
        lastName: clerkUser.lastName || null,
        imageUrl: clerkUser.imageUrl || null,
      },
    });
  }

  return user;
}

/**
 * Get the current user's ID (Prisma user ID, not Clerk ID)
 */
export async function getCurrentUserId() {
  const user = await ensureUser();
  return user?.id || null;
}

/**
 * Check if current user needs to complete onboarding
 * Returns true if onboarding is not completed
 */
export async function checkOnboarding() {
  const user = await ensureUser();
  
  if (!user) {
    return false; // Not logged in, don't redirect
  }
  
  // Check if onboarding is completed
  return !user.onboardingCompleted;
}

/**
 * Get full user profile data
 */
export async function getUserProfile() {
  const user = await ensureUser();
  
  if (!user) {
    return null;
  }
  
  return prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      postcode: true,
      imageUrl: true,
      onboardingCompleted: true,
    },
  });
}
