import { requireAdmin } from "@/lib/admin";
import { ensureUser } from "@/lib/auth";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ensure user exists in database
  await ensureUser();

  // Check admin access
  try {
    await requireAdmin();
  } catch {
    redirect("/disputes");
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-destructive/10">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-xl font-bold">
              Admin Dashboard
            </Link>
            <nav className="hidden items-center gap-4 md:flex">
              <Link
                href="/admin"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Overview
              </Link>
              <Link
                href="/disputes"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Back to App
              </Link>
            </nav>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">{children}</div>
      </main>
    </div>
  );
}
