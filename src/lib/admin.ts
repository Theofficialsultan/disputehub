import { currentUser } from "@clerk/nextjs/server";

/**
 * Check if the current user is an admin
 * For now, checks against ADMIN_EMAIL env var
 */
export async function isAdmin(): Promise<boolean> {
  const user = await currentUser();

  if (!user) {
    return false;
  }

  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    return false;
  }

  return user.emailAddresses[0]?.emailAddress === adminEmail;
}

/**
 * Require admin access or throw
 */
export async function requireAdmin() {
  const admin = await isAdmin();

  if (!admin) {
    throw new Error("Unauthorized: Admin access required");
  }
}
