"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  FileText,
  Clock,
  Settings,
  Plus,
  HelpCircle,
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
  { name: "Help", href: "/help", icon: HelpCircle },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col lg:flex">
      {/* Dark glass background */}
      <div className="absolute inset-0 glass-strong backdrop-blur-3xl" />
      
      {/* Gradient border */}
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-indigo-500/50 to-transparent" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Logo */}
        <div className="flex h-20 items-center gap-3 px-6 border-b border-indigo-500/20">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg glow-purple">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold text-white">DisputeHub</span>
            <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium">
              <Sparkles className="h-3 w-3" />
              <span>AI Powered</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 px-4 py-6">
          <Button
            asChild
            size="lg"
            className="w-full justify-start bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-lg glow-purple mb-6 h-14 rounded-2xl text-base font-semibold"
          >
            <Link href="/disputes/start">
              <Plus className="mr-3 h-5 w-5" />
              New Dispute
            </Link>
          </Button>

          <div className="space-y-2">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center gap-4 rounded-2xl px-5 py-4 text-base font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600/30 to-purple-600/30 text-white border border-indigo-500/40 shadow-lg glow-purple"
                      : "text-slate-400 hover:text-white hover:bg-indigo-500/10 border border-transparent"
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-indigo-400"} transition-colors`} />
                  {item.name}
                  {isActive && (
                    <div className="ml-auto">
                      <div className="h-2 w-2 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 animate-pulse shadow-lg shadow-indigo-400/50" />
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User */}
        <div className="border-t border-indigo-500/20 p-4">
          <div className="flex items-center gap-3 rounded-2xl p-4 glass hover:bg-indigo-500/10 transition-all duration-300 cursor-pointer border border-indigo-500/10">
            <UserButton />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">Your Account</p>
              <p className="text-xs text-slate-400">Manage settings</p>
            </div>
            <NotificationBell />
          </div>
        </div>
      </div>
    </aside>
  );
}
