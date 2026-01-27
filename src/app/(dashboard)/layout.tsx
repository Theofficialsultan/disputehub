import { ensureUser } from "@/lib/auth";
import { MobileNav } from "@/components/navigation/MobileNav";
import { DesktopSidebar } from "@/components/navigation/DesktopSidebar";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Lazy sync: ensure user exists in database
  await ensureUser();

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <DesktopSidebar />

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Main Content */}
      <main className="flex-1 lg:ml-72">
        {/* Mobile: Add padding for header and bottom nav */}
        {/* Desktop: Full height */}
        <div className="min-h-screen pb-20 pt-16 lg:pb-0 lg:pt-0">
          <div className="container mx-auto px-6 lg:px-8 py-8 lg:py-12">
            {children}
          </div>
        </div>
      </main>

      {/* PWA Install Prompt */}
      <InstallPrompt />
    </div>
  );
}
