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
  Tags,
  UsersRound,
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
    label: "Danh mục dịch vụ",
    href: "/admin/categories",
    icon: Tags,
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
    label: "Tài khoản & phân quyền",
    href: "/admin/users",
    icon: UsersRound,
    adminOnly: true,
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
    <aside className="flex h-full w-[228px] flex-col overflow-hidden bg-[linear-gradient(180deg,#071a3d_0%,#092655_100%)] px-3 py-4 text-white shadow-[14px_0_36px_rgba(8,27,63,0.07)]">
      <div className="shrink-0 px-2 pb-3.5">
        <Brand inverse />
        <p className="mt-1.5 text-[10px] text-blue-100/55">Management Console</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-color:rgba(255,255,255,0.16)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/15 [&::-webkit-scrollbar-thumb:hover]:bg-white/25 [&::-webkit-scrollbar-track]:bg-transparent">
        <nav className="space-y-0.5" aria-label="Điều hướng quản trị">
          {navigation
            .filter((item) => !item.adminOnly || session?.role === "Admin")
            .map(({ label, href, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);

              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex min-h-10 items-center gap-2.5 rounded-lg px-3 py-2.5 text-[12.5px] font-medium transition ${
                    active
                      ? "bg-brand-600 text-white shadow-[0_7px_18px_rgba(11,99,246,0.22)]"
                      : "text-blue-50/70 hover:bg-white/[0.065] hover:text-white"
                  }`}
                >
                  <Icon className="size-[16px] shrink-0" strokeWidth={1.85} />
                  <span className="truncate">{label}</span>
                </Link>
              );
            })}
        </nav>

        <div className="mt-3 border-t border-white/10 pt-3">
          <Link
            href="/"
            className="flex min-h-10 items-center gap-2.5 rounded-lg px-3 py-2.5 text-[12.5px] font-medium text-blue-50/70 transition hover:bg-white/[0.065] hover:text-white"
          >
            <ExternalLink className="size-[16px] shrink-0" />
            <span>Xem website</span>
          </Link>
        </div>

        <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2 text-[11px] font-semibold text-blue-50">
              <ShieldCheck className="size-3.5 shrink-0 text-sky-300" />
              <span className="truncate">Phiên bảo mật</span>
            </div>
            <span className="shrink-0 rounded-full bg-emerald-400/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-300 ring-1 ring-emerald-300/15">
              {session?.role}
            </span>
          </div>
          <p className="mt-1 truncate pl-[22px] text-[9.5px] text-blue-100/50">{session?.email}</p>
        </div>
      </div>

      <div className="mt-2 shrink-0 border-t border-white/10 pt-2">
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex min-h-10 w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[12.5px] font-medium text-blue-50/70 transition hover:bg-white/[0.065] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LogOut className="size-[16px] shrink-0" />
          {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
        </button>
      </div>
    </aside>
  );
}
