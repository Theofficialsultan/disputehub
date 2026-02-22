"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Sparkles,
  Settings,
  Menu,
  X,
  Plus,
  HelpCircle,
  LogOut,
  File,
  Download,
  Scale,
  Mail,
} from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";
import { NotificationBell } from "@/components/notifications/NotificationBell";

const menuItems = [
  { name: "Dashboard", href: "/disputes", icon: LayoutDashboard },
  { name: "Cases", href: "/cases", icon: FileText },
  { name: "Documents", href: "/documents", icon: File },
  { name: "Email", href: "/email", icon: Mail },
  { name: "Timeline", href: "/timeline", icon: BarChart3 },
  { name: "AI Chat", href: "/ai-chat", icon: Sparkles },
  { name: "Find a Lawyer", href: "/lawyer", icon: Scale },
];

const generalItems = [
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Help", href: "/help", icon: HelpCircle },
];

const bottomTabs = [
  { name: "Home", href: "/disputes", icon: LayoutDashboard },
  { name: "Cases", href: "/cases", icon: FileText },
  { name: "Docs", href: "/documents", icon: File },
  { name: "Timeline", href: "/timeline", icon: BarChart3 },
];

export function MobileNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useUser();

  const isChatPage = pathname === "/ai-chat" || pathname.includes("/case");

  return (
    <>
      {/* Mobile header - fixed full width */}
      <header className={`fixed top-0 left-0 right-0 z-40 lg:hidden ${isChatPage ? "hidden" : ""}`}>
        <div className="bg-white border-b border-slate-200">
          <div className="flex h-16 items-center justify-between px-5">
            <Link href="/disputes" className="flex items-center gap-3">
              <img src="/logo-200.png" alt="DisputeHub" className="h-10 w-10 rounded-full" />
              <span className="text-lg font-bold text-slate-900">DisputeHub</span>
            </Link>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <button
                type="button"
                className="p-2.5 rounded-xl text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-7 w-7" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-sm animate-slide-in-right">
            <div className="flex h-full flex-col bg-white shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between px-5 h-14 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <img src="/logo-200.png" alt="DisputeHub" className="h-8 w-8 rounded-full" />
                  <span className="font-bold text-slate-900">DisputeHub</span>
                </div>
                <button
                  type="button"
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Nav */}
              <nav className="flex-1 overflow-y-auto px-3 pt-5">
                <p className="text-[11px] font-semibold text-slate-400 tracking-[0.08em] uppercase px-3 mb-3">Menu</p>
                <div className="space-y-1">
                  {menuItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                          isActive ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center ${
                          isActive ? 'bg-blue-600' : ''
                        }`}>
                          <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        </div>
                        <span className={`flex-1 text-[15px] ${
                          isActive ? 'font-semibold text-slate-900' : 'font-medium text-slate-500'
                        }`}>
                          {item.name}
                        </span>
                        {(item as any).badge && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isActive ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'
                          }`}>{(item as any).badge}</span>
                        )}
                      </Link>
                    );
                  })}
                </div>

                <p className="text-[11px] font-semibold text-slate-400 tracking-[0.08em] uppercase px-3 mt-7 mb-3">General</p>
                <div className="space-y-1">
                  {generalItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                          isActive ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center ${
                          isActive ? 'bg-blue-600' : ''
                        }`}>
                          <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        </div>
                        <span className={`flex-1 text-[15px] ${
                          isActive ? 'font-semibold text-slate-900' : 'font-medium text-slate-500'
                        }`}>{item.name}</span>
                      </Link>
                    );
                  })}
                  <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 transition-all">
                    <div className="w-9 h-9 rounded-[10px] flex items-center justify-center">
                      <LogOut className="h-5 w-5 text-slate-400" />
                    </div>
                    <span className="flex-1 text-[15px] font-medium text-slate-500 text-left">Logout</span>
                  </button>
                </div>
              </nav>

              {/* Download App Card */}
              <div className="px-4 py-3">
                <div className="rounded-2xl bg-slate-900 p-4 relative overflow-hidden">
                  <div className="absolute -top-4 -right-4 w-16 h-16 bg-blue-600/30 rounded-full blur-xl" />
                  <div className="relative z-10">
                    <h4 className="text-white font-bold text-sm mb-0.5">Download our Mobile App</h4>
                    <p className="text-slate-400 text-[11px] mb-3">Get easy in another way</p>
                    <button className="w-full py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold flex items-center justify-center gap-2">
                      <Download className="h-4 w-4" /> Download
                    </button>
                  </div>
                </div>
              </div>

              {/* User */}
              <div className="p-4 border-t border-slate-100">
                <div className="flex items-center gap-3 px-2">
                  <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "h-10 w-10 rounded-full" } }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{user?.firstName || 'User'} {user?.lastName || ''}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.primaryEmailAddress?.emailAddress || ''}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Tab Bar - hidden on chat pages */}
      <nav className={`fixed bottom-0 inset-x-0 z-40 lg:hidden ${isChatPage ? "hidden" : ""}`}>
        <div className="bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)]">
          <div className="grid grid-cols-5 h-20">
            {bottomTabs.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-1.5 transition-colors ${
                    isActive ? 'text-blue-600' : 'text-slate-400'
                  }`}
                >
                  <item.icon className="h-7 w-7" />
                  <span className="text-xs font-medium leading-none">{item.name}</span>
                </Link>
              );
            })}
            <Link
              href="/disputes/start"
              className="flex flex-col items-center justify-center gap-1.5"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 shadow-lg shadow-blue-600/25">
                <Plus className="h-6 w-6 text-white" />
              </div>
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}
