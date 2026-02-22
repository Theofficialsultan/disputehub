"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  File,
  BarChart3,
  Sparkles,
  Settings,
  HelpCircle,
  LogOut,
  Download,
  Scale,
  Mail,
} from "lucide-react";

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

export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[250px] flex-col lg:flex">
      <div className="absolute inset-0 bg-white" />
      
      <div className="relative z-10 flex flex-col h-full">
        {/* Logo - exactly like Donezo */}
        <div className="flex h-[68px] items-center gap-3 px-6">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center">
            <img 
              src="/logo-200.png" 
              alt="DisputeHub" 
              className="h-9 w-9 rounded-full"
            />
          </div>
          <span className="text-[17px] font-bold text-slate-900">DisputeHub</span>
        </div>

        {/* MENU Section Label */}
        <div className="px-6 pt-4 pb-2">
          <p className="text-[11px] font-semibold text-slate-400 tracking-[0.08em] uppercase">Menu</p>
        </div>

        {/* Menu Navigation */}
        <nav className="px-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-50/70'
                    : 'hover:bg-slate-50'
                }`}
              >
                {/* Icon container */}
                <div className={`w-[34px] h-[34px] rounded-[10px] flex items-center justify-center transition-all ${
                  isActive
                    ? 'bg-blue-600'
                    : ''
                }`}>
                  <item.icon className={`h-[18px] w-[18px] ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-500'
                  }`} />
                </div>
                
                {/* Label */}
                <span className={`flex-1 text-[14px] ${
                  isActive ? 'font-semibold text-slate-900' : 'font-medium text-slate-500 group-hover:text-slate-700'
                }`}>
                  {item.name}
                </span>
                
                {/* Badge */}
                {(item as any).badge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {(item as any).badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* GENERAL Section Label */}
        <div className="px-6 pt-7 pb-2">
          <p className="text-[11px] font-semibold text-slate-400 tracking-[0.08em] uppercase">General</p>
        </div>

        {/* General Navigation */}
        <nav className="px-3 space-y-1">
          {generalItems.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
                  isActive ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                }`}
              >
                <div className={`w-[34px] h-[34px] rounded-[10px] flex items-center justify-center ${
                  isActive ? 'bg-blue-600' : ''
                }`}>
                  <item.icon className={`h-[18px] w-[18px] ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-500'
                  }`} />
                </div>
                <span className={`flex-1 text-[14px] ${
                  isActive ? 'font-semibold text-slate-900' : 'font-medium text-slate-500 group-hover:text-slate-700'
                }`}>
                  {item.name}
                </span>
              </Link>
            );
          })}

          {/* Logout */}
          <button className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 hover:bg-slate-50">
            <div className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center">
              <LogOut className="h-[18px] w-[18px] text-slate-400 group-hover:text-slate-500" />
            </div>
            <span className="flex-1 text-[14px] font-medium text-slate-500 group-hover:text-slate-700 text-left">
              Logout
            </span>
          </button>
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Download Mobile App Card - exactly like Donezo */}
        <div className="px-4 pb-5">
          <div className="rounded-2xl bg-slate-900 p-5 relative overflow-hidden">
            {/* Decorative blur */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-blue-600/30 rounded-full blur-xl" />
            
            <div className="relative z-10">
              <h4 className="text-white font-bold text-sm leading-tight mb-1">
                Download our<br />Mobile App
              </h4>
              <p className="text-slate-400 text-[11px] mb-4">Get easy in another way</p>
              <button className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2">
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
