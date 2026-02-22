"use client";

import { Search, Mail, Bell } from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export function TopBar() {
  const { user } = useUser();

  return (
    <div className="hidden lg:block sticky top-0 z-20">
      <div className="bg-white rounded-b-2xl border-b border-slate-200/60 mx-6 mt-0">
        <div className="flex items-center justify-between h-16 px-6">
          {/* Search */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search task"
                className="w-full pl-10 pr-16 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-100"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-200/60 text-[10px] text-slate-500 font-medium">
                <span>⌘</span><span>F</span>
              </div>
            </div>
          </div>

          {/* Right side: mail, bell, user */}
          <div className="flex items-center gap-4">
            <button className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors relative">
              <Mail className="h-[18px] w-[18px]" />
            </button>
            <NotificationBell />

            {/* Divider */}
            <div className="w-px h-8 bg-slate-200" />

            {/* User */}
            <div className="flex items-center gap-3">
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-9 w-9 rounded-full"
                  }
                }}
              />
              <div className="hidden xl:block">
                <p className="text-sm font-semibold text-slate-900 leading-tight">
                  {user?.firstName || 'User'} {user?.lastName || ''}
                </p>
                <p className="text-[11px] text-slate-400 leading-tight">
                  {user?.primaryEmailAddress?.emailAddress || ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
