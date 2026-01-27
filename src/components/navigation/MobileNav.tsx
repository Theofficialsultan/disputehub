"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  FileText,
  Clock,
  Settings,
  Menu,
  X,
  Plus,
  Sparkles,
  Scale,
  File,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/nextjs";
import { NotificationBell } from "@/components/notifications/NotificationBell";

const navigation = [
  { name: "Dashboard", href: "/disputes", icon: Home },
  { name: "Cases", href: "/cases", icon: FileText },
  { name: "Documents", href: "/documents", icon: File },
  { name: "Lawyer", href: "/lawyer", icon: Scale },
  { name: "Timeline", href: "/timeline", icon: Clock },
];

export function MobileNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile header */}
      <header className="sticky top-0 z-40 lg:hidden">
        <div className="glass-strong backdrop-blur-3xl border-b border-indigo-500/20">
          <div className="flex h-16 items-center justify-between px-4">
            <Link href="/disputes" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg glow-purple">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-white">DisputeHub</span>
                <div className="flex items-center gap-1 text-[10px] text-indigo-400 font-medium">
                  <Sparkles className="h-2.5 w-2.5" />
                  <span>AI</span>
                </div>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <NotificationBell />
              <Button
                size="icon"
                className="h-10 w-10 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-lg glow-purple"
                asChild
              >
                <Link href="/disputes/start">
                  <Plus className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="h-10 w-10 rounded-xl text-slate-400 hover:text-white hover:bg-indigo-500/10"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed right-0 top-0 h-full w-3/4 max-w-sm glass-strong backdrop-blur-3xl border-l border-indigo-500/20 p-6">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserButton />
                <div>
                  <p className="text-sm font-semibold text-white">Account</p>
                  <p className="text-xs text-slate-400">Manage profile</p>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setMobileMenuOpen(false)}
                className="h-10 w-10 rounded-xl text-slate-400 hover:text-white hover:bg-indigo-500/10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <nav className="space-y-2">
              <Button
                asChild
                size="lg"
                className="w-full justify-start bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-lg glow-purple h-14 rounded-2xl text-base"
              >
                <Link
                  href="/disputes/start"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Plus className="mr-3 h-5 w-5" />
                  New Dispute
                </Link>
              </Button>

              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-4 text-base font-medium transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-r from-indigo-600/30 to-purple-600/30 text-white border border-indigo-500/40 shadow-lg"
                        : "text-slate-400 hover:text-white hover:bg-indigo-500/10 border border-transparent"
                    }`}
                  >
                    <item.icon className={`h-5 w-5 ${isActive ? "text-indigo-400" : "text-slate-500"}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Bottom navigation bar for mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
        <div className="glass-strong backdrop-blur-3xl border-t border-indigo-500/20">
          <div className="grid h-16 grid-cols-4 px-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                    isActive
                      ? "text-indigo-400"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{item.name}</span>
                  {isActive && (
                    <div className="h-1 w-1 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 animate-pulse shadow-lg shadow-indigo-400/50" />
                  )}
                </Link>
              );
            })}
            <Link
              href="/disputes/start"
              className="flex flex-col items-center justify-center gap-1 text-slate-400 transition-colors hover:text-indigo-400"
            >
              <Plus className="h-5 w-5" />
              <span className="text-xs font-medium">New</span>
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}
