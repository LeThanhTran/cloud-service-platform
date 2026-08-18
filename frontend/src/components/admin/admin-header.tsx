"use client";

import { Bell, Menu, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";

export function AdminHeader({ onOpenSidebar }: { onOpenSidebar?: () => void }) {
  const { session } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-slate-200/80 bg-white/92 px-5 backdrop-blur-xl lg:px-7">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="grid size-9 place-items-center rounded-xl border border-slate-200 text-slate-600 lg:hidden"
          aria-label="Mở menu quản trị"
        >
          <Menu className="size-4.5" />
        </button>
        <div>
          <p className="text-[13px] font-semibold text-navy-900">NovaCloud Console</p>
          <p className="text-[11px] text-slate-500">Quản trị hệ thống</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="relative grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:text-brand-600"
          aria-label="Thông báo"
        >
          <Bell className="size-4" />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-brand-600 ring-2 ring-white" />
        </button>

        <div className="hidden h-8 w-px bg-slate-200 sm:block" />

        <div className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
            <ShieldCheck className="size-4.5" />
          </div>
          <div className="hidden sm:block">
            <p className="max-w-40 truncate text-xs font-semibold text-navy-900">
              {session?.fullName}
            </p>
            <p className="text-[10.5px] text-slate-500">{session?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
