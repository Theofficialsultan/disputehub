import { ensureUser, checkOnboarding } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MobileNav } from "@/components/navigation/MobileNav";
import { DesktopSidebar } from "@/components/navigation/DesktopSidebar";
import { TopBar } from "@/components/navigation/TopBar";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await ensureUser();
  
  const needsOnboarding = await checkOnboarding();
  if (needsOnboarding) {
    redirect("/onboarding");
  }

  return (
    <div className="relative flex min-h-screen bg-white lg:bg-[#f5f5f5] overflow-x-hidden max-w-[100vw]">
      {/* Desktop Sidebar */}
      <DesktopSidebar />

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Main Content */}
      <main className="relative z-10 flex-1 lg:ml-[250px] overflow-x-hidden w-full">
        {/* Desktop Top Bar */}
        <TopBar />

        <div className="min-h-screen pb-24 pt-16 lg:pb-0 lg:pt-0">
          <div className="mx-auto max-w-[1400px] px-0 sm:px-6 lg:px-8 py-0 sm:py-4 lg:py-8">
            {children}
          </div>
        </div>
      </main>

      {/* PWA Install Prompt */}
      <InstallPrompt />
    </div>
  );
}
