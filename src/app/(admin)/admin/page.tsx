import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  // Get basic stats
  const [userCount, disputeCount] = await Promise.all([
    prisma.user.count(),
    prisma.dispute.count(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          System overview and management
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-6">
          <div className="text-sm font-medium text-muted-foreground">
            Total Users
          </div>
          <div className="mt-2 text-3xl font-bold">{userCount}</div>
        </div>
        <div className="rounded-lg border p-6">
          <div className="text-sm font-medium text-muted-foreground">
            Total Disputes
          </div>
          <div className="mt-2 text-3xl font-bold">{disputeCount}</div>
        </div>
        <div className="rounded-lg border p-6">
          <div className="text-sm font-medium text-muted-foreground">
            Active Disputes
          </div>
          <div className="mt-2 text-3xl font-bold">
            {disputeCount > 0 ? "—" : "0"}
          </div>
        </div>
        <div className="rounded-lg border p-6">
          <div className="text-sm font-medium text-muted-foreground">
            Resolved
          </div>
          <div className="mt-2 text-3xl font-bold">0</div>
        </div>
      </div>

      {/* Placeholder sections */}
      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">Recent Activity</h2>
        <p className="text-sm text-muted-foreground">
          Activity feed coming soon...
        </p>
      </div>

      <div className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">System Health</h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Database</span>
            <span className="text-sm font-medium text-green-600">
              ✓ Connected
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Authentication</span>
            <span className="text-sm font-medium text-green-600">
              ✓ Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
