"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  FileClock,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { apiFetch } from "@/lib/api";

const accountNavigation = [
  { label: "Tổng quan", href: "/account", icon: LayoutDashboard },
  { label: "Yêu cầu của tôi", href: "/account/requests", icon: FileClock },
  { label: "Thông báo", href: "/account/notifications", icon: Bell },
  { label: "Bảo mật", href: "/account/security", icon: LockKeyhole },
];

export function AccountShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, clearSession } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const isActive = (href: string) =>
    href === "/account"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await apiFetch("/api/Auth/logout", { method: "POST" });
    } catch {
      // Dù API tạm lỗi, client vẫn xóa phiên cục bộ.
    } finally {
      clearSession();
      router.replace("/");
      router.refresh();
      setLoggingOut(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="py-9 sm:py-12">
        <Container>
          <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_20px_60px_rgba(8,27,63,0.07)]">
            <div className="relative overflow-hidden border-b border-slate-200 bg-navy-900 px-6 py-7 text-white sm:px-8">
              <div className="dark-grid pointer-events-none absolute inset-0 opacity-45" />
              <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                  <span className="grid size-12 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                    <UserRound className="size-6 text-sky-300" />
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sky-300">
                      NovaCloud Customer
                    </p>
                    <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">
                      {session?.fullName ?? "Tài khoản khách hàng"}
                    </h1>
                    <p className="mt-1 text-xs text-blue-100/65">
                      {session?.email}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  disabled={loggingOut}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/7 px-4 text-xs font-semibold text-white transition hover:bg-white/12 disabled:opacity-60"
                >
                  <LogOut className="size-4" />
                  {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
                </button>
              </div>
            </div>

            <div className="grid lg:grid-cols-[220px_1fr]">
              <aside className="border-b border-slate-200 bg-slate-50/65 p-3 lg:border-b-0 lg:border-r lg:p-4">
                <nav className="flex gap-2 overflow-x-auto lg:flex-col" aria-label="Tài khoản khách hàng">
                  {accountNavigation.map(({ label, href, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className={`flex h-11 shrink-0 items-center gap-2.5 rounded-xl px-3.5 text-xs font-semibold transition ${
                        isActive(href)
                          ? "bg-brand-600 text-white shadow-[0_8px_20px_rgba(11,99,246,0.18)]"
                          : "text-slate-600 hover:bg-white hover:text-brand-600"
                      }`}
                    >
                      <Icon className="size-4" />
                      {label}
                    </Link>
                  ))}
                </nav>
              </aside>

              <div className="min-w-0 p-5 sm:p-7 lg:p-8">{children}</div>
            </div>
          </section>
        </Container>
      </main>

      <Footer />
    </div>
  );
}
