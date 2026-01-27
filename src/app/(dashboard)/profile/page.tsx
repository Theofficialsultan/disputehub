import { currentUser } from "@clerk/nextjs/server";
import { ensureUser } from "@/lib/auth";

export default async function ProfilePage() {
  const clerkUser = await currentUser();
  const dbUser = await ensureUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      <div className="rounded-lg border p-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Name
            </label>
            <p className="text-base">
              {clerkUser?.firstName} {clerkUser?.lastName}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Email
            </label>
            <p className="text-base">{clerkUser?.emailAddresses[0]?.emailAddress}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              User ID
            </label>
            <p className="font-mono text-sm text-muted-foreground">
              {dbUser?.id}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Member Since
            </label>
            <p className="text-base">
              {dbUser?.createdAt.toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
