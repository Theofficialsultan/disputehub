import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Ensures the current Clerk user exists in the database
 * Creates the user if missing, does nothing if already exists
 * Must be called server-side only
 */
export async function ensureUser() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  // Check if user exists
  let user = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  // Create if missing
  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0].emailAddress,
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
