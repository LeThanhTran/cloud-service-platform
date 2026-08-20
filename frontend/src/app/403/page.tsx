"use client";

import Link from "next/link";
import { ArrowLeft, LayoutDashboard, ShieldX } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { isManagementRole } from "@/lib/admin-route-policy";

export default function ForbiddenPage() {
  const { session, ready } = useAuth();
  const canOpenDashboard = ready && isManagementRole(session?.role);

  return (
    <main className="grid min-h-screen place-items-center bg-[#f7faff] px-4 py-12">
      <section className="w-full max-w-xl rounded-[24px] border border-slate-200 bg-white p-7 text-center shadow-[0_24px_70px_rgba(8,27,63,0.09)] sm:p-9">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100">
          <ShieldX className="size-7" />
        </span>

        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-red-600">
          403 · Forbidden
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-navy-900">
          Bạn không có quyền truy cập
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
          Khu vực này được bảo vệ theo vai trò. Nếu bạn cho rằng đây là nhầm lẫn,
          hãy đăng nhập bằng tài khoản có quyền phù hợp.
        </p>

        {ready && session && (
          <div className="mx-auto mt-5 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
            Vai trò hiện tại: {session.role}
          </div>
        )}

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          {canOpenDashboard ? (
            <Link
              href="/admin/dashboard"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              <LayoutDashboard className="size-4" />
              Về Dashboard
            </Link>
          ) : (
            <Link
              href="/admin/login"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              Đăng nhập quản trị
            </Link>
          )}

          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700"
          >
            <ArrowLeft className="size-4" />
            Về website
          </Link>
        </div>
      </section>
    </main>
  );
}
