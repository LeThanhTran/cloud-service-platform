"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-navy-900">
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">
        <AdminSidebar />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-navy-900/45 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-label="Đóng menu"
          />
          <div className="relative h-full w-[280px] max-w-[86vw]">
            <AdminSidebar />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 grid size-8 place-items-center rounded-lg bg-white/8 text-white"
              aria-label="Đóng menu"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      <div className="lg:pl-[260px]">
        <AdminHeader onOpenSidebar={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-7 lg:py-7">
          {children}
        </main>
      </div>
    </div>
  );
}
