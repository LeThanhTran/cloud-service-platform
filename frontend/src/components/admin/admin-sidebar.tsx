"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BadgeDollarSign,
  ExternalLink,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Newspaper,
  Percent,
  Handshake,
  ShoppingCart,
  Server,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { apiFetch } from "@/lib/api";
import { Brand } from "@/components/ui/brand";

const navigation = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Gói dịch vụ",
    href: "/admin/services",
    icon: Server,
    adminOnly: true,
  },
  {
    label: "Bảng giá",
    href: "/admin/pricing",
    icon: BadgeDollarSign,
    adminOnly: true,
  },
  {
    label: "Khuyến mãi",
    href: "/admin/promotions",
    icon: Percent,
    adminOnly: true,
  },
  {
    label: "Tin tức",
    href: "/admin/news",
    icon: Newspaper,
  },
  {
    label: "Yêu cầu dịch vụ",
    href: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    label: "Affiliate",
    href: "/admin/affiliates",
    icon: Handshake,
  },
  {
    label: "Liên hệ",
    href: "/admin/contacts",
    icon: MessageSquare,
  },
  {
    label: "Nhật ký hệ thống",
    href: "/admin/audit-logs",
    icon: ScrollText,
    adminOnly: true,
  },
  {
    label: "Bảo mật tài khoản",
    href: "/admin/settings/security",
    icon: KeyRound,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, clearSession } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      await apiFetch("/api/Auth/logout", {
        method: "POST",
      });
    } catch {
      // Luôn xóa phiên local ngay cả khi API đang tạm thời không truy cập được.
    } finally {
      clearSession();
      router.replace("/admin/login");
      router.refresh();
      setLoggingOut(false);
    }
  }

  return (
    <aside className="flex h-full w-[260px] flex-col bg-[linear-gradient(180deg,#071a3d_0%,#092655_100%)] px-4 py-5 text-white shadow-[18px_0_45px_rgba(8,27,63,0.08)]">
      <div className="px-2 pb-7">
        <Brand inverse />
        <p className="mt-2 text-[11px] text-blue-100/65">Management Console</p>
      </div>

      <nav className="space-y-1.5" aria-label="Điều hướng quản trị">
        {navigation
          .filter((item) => !item.adminOnly || session?.role === "Admin")
          .map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-[13px] font-medium transition ${
                  active
                    ? "bg-brand-600 text-white shadow-[0_9px_24px_rgba(11,99,246,0.28)]"
                    : "text-blue-50/72 hover:bg-white/7 hover:text-white"
                }`}
              >
                <Icon className="size-[18px]" strokeWidth={1.9} />
                {label}
              </Link>
            );
          })}
      </nav>

      <div className="mt-5 border-t border-white/10 pt-5">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-[13px] font-medium text-blue-50/72 transition hover:bg-white/7 hover:text-white"
        >
          <ExternalLink className="size-[18px]" />
          Xem website
        </Link>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.055] p-3.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-50">
          <ShieldCheck className="size-4 text-sky-300" />
          Phiên bảo mật
        </div>
        <p className="mt-2 truncate text-[11px] text-blue-100/65">{session?.email}</p>
        <span className="mt-2 inline-flex rounded-full bg-emerald-400/12 px-2 py-1 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-300/15">
          {session?.role}
        </span>
      </div>

      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        className="mt-auto flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-[13px] font-medium text-blue-50/72 transition hover:bg-white/7 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        <LogOut className="size-[18px]" />
        {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
      </button>
    </aside>
  );
}
