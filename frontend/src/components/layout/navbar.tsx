"use client";

import Link from "next/link";
import { LayoutDashboard, Menu, UserRound, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Brand } from "@/components/ui/brand";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { useAuth } from "@/components/auth/auth-provider";
import { NotificationBell } from "@/components/notifications/notification-bell";

const navigation = [
  { label: "Trang chủ", href: "/" },
  { label: "Giới thiệu", href: "/about" },
  { label: "Dịch vụ", href: "/services" },
  { label: "Bảng giá", href: "/pricing" },
  { label: "Tin tức", href: "/news" },
  { label: "Khách hàng", href: "/customers" },
  { label: "Tra cứu", href: "/track-request" },
  { label: "Đối tác", href: "/affiliate" },
  { label: "Liên hệ", href: "/contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { session, ready } = useAuth();
  const canManage = ready && session && ["Admin", "Editor"].includes(session.role);
  const isCustomer = ready && session?.role === "User";

  const accountHref = canManage
    ? "/admin/dashboard"
    : isCustomer
      ? "/account"
      : "/login";

  const accountLabel = canManage
    ? "Quản trị"
    : isCustomer
      ? "Tài khoản"
      : "Đăng nhập";

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-white/96 backdrop-blur-md">
      <Container className="flex h-[66px] items-center justify-between">
        <Brand />

        <nav className="hidden items-center gap-5 lg:flex xl:gap-7" aria-label="Điều hướng chính">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href} className={`relative py-6 text-[12px] font-medium transition ${active ? "text-brand-600" : "text-slate-600 hover:text-brand-600"}`}>
                {item.label}
                {active && <span className="absolute inset-x-0 bottom-0 mx-auto h-[2px] w-5 rounded-full bg-brand-600" />}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2.5 lg:flex">
          {ready && session && <NotificationBell />}
          <ButtonLink href={accountHref} className="h-10 gap-2 rounded-[10px] px-4 text-[12px]">
            {canManage ? <LayoutDashboard className="size-4" /> : isCustomer ? <UserRound className="size-4" /> : null}
            {accountLabel}
          </ButtonLink>
        </div>

        <button type="button" className="grid size-10 place-items-center rounded-lg border border-line text-navy-900 lg:hidden" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={open ? "Đóng menu" : "Mở menu"}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </Container>

      {open && (
        <div className="border-t border-line bg-white lg:hidden">
          <Container className="flex flex-col py-4">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={`rounded-lg px-3 py-3 text-sm font-medium ${isActive(item.href) ? "bg-brand-50 text-brand-600" : "text-slate-700 hover:bg-surface hover:text-brand-600"}`}>
                {item.label}
              </Link>
            ))}
            {ready && session && (
              <div className="mt-3 flex justify-end"><NotificationBell /></div>
            )}
            <ButtonLink href={accountHref} className="mt-3 w-full gap-2">
              {canManage ? <LayoutDashboard className="size-4" /> : isCustomer ? <UserRound className="size-4" /> : null}
              {accountLabel}
            </ButtonLink>
          </Container>
        </div>
      )}
    </header>
  );
}
