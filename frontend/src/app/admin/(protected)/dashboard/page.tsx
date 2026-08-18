"use client";

import {
  Activity,
  ArrowUpRight,
  KeyRound,
  Server,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { apiFetch, getApiBaseUrl } from "@/lib/api";

export default function AdminDashboardPage() {
  const { session } = useAuth();
  const [planCount, setPlanCount] = useState<number | null>(null);
  const [userCount, setUserCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOverview() {
      try {
        const planResponse = await apiFetch("/api/ServicePlans", { auth: false });
        if (planResponse.ok) {
          const plans = (await planResponse.json()) as unknown[];
          if (!cancelled) setPlanCount(plans.length);
        }

        if (session?.role === "Admin") {
          const userResponse = await apiFetch("/api/Users");
          if (userResponse.ok) {
            const users = (await userResponse.json()) as unknown[];
            if (!cancelled) setUserCount(users.length);
          }
        }
      } catch {
        // Dashboard vẫn hiển thị shell nếu API overview tạm thời không phản hồi.
      }
    }

    loadOverview();
    return () => {
      cancelled = true;
    };
  }, [session?.role]);

  const cards = [
    {
      label: "Gói dịch vụ",
      value: planCount === null ? "—" : planCount.toLocaleString("vi-VN"),
      caption: "ServicePlan hiện có",
      icon: Server,
    },
    {
      label: "Người dùng",
      value:
        session?.role === "Admin"
          ? userCount === null
            ? "—"
            : userCount.toLocaleString("vi-VN")
          : "Giới hạn",
      caption: session?.role === "Admin" ? "Tài khoản hệ thống" : "Chỉ Admin được xem",
      icon: Users,
    },
    {
      label: "Vai trò hiện tại",
      value: session?.role ?? "—",
      caption: "Role-based authorization",
      icon: ShieldCheck,
    },
    {
      label: "Phiên đăng nhập",
      value: "Hoạt động",
      caption: "JWT + Refresh Token",
      icon: Activity,
    },
  ];

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-600">
            Dashboard
          </p>
          <h1 className="mt-1.5 text-[28px] font-semibold tracking-[-0.035em] text-navy-900">
            Xin chào, {session?.fullName || "quản trị viên"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Tổng quan phiên quản trị NovaCloud và trạng thái kết nối API.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 sm:self-auto">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Authenticated
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, caption, icon: Icon }) => (
          <article
            key={label}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.045)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium text-slate-500">{label}</p>
                <p className="mt-2 text-[24px] font-semibold tracking-[-0.035em] text-navy-900">
                  {value}
                </p>
              </div>
              <span className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100/80">
                <Icon className="size-4.5" />
              </span>
            </div>
            <p className="mt-3 text-[10.5px] text-slate-400">{caption}</p>
          </article>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="pointer-events-none absolute right-[-60px] top-[-80px] size-64 rounded-full bg-brand-50 blur-3xl" />
          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-navy-900">Backend integration</p>
                <p className="mt-1 text-[11px] text-slate-500">ASP.NET Core Web API</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                Ready
              </span>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-100 bg-[#f8fbff] p-4 sm:p-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <StatusItem label="API Base URL" value={getApiBaseUrl()} />
                <StatusItem label="Authentication" value="JWT Bearer" />
                <StatusItem label="Refresh Token" value="Rotation enabled" />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {["ProblemDetails", "Role Authorization", "CORS", "QR Factory"].map((item) => (
                <span
                  key={item}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10.5px] font-medium text-slate-600"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)] sm:p-6">
          <p className="text-xs font-semibold text-navy-900">Thao tác nhanh</p>
          <p className="mt-1 text-[11px] leading-5 text-slate-500">
            Các thao tác thuộc module Authentication của NovaCloud.
          </p>

          <Link
            href="/admin/settings/security"
            className="mt-5 flex items-center justify-between rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            <span className="flex items-center gap-2.5">
              <KeyRound className="size-4" /> Đổi mật khẩu
            </span>
            <ArrowUpRight className="size-4" />
          </Link>

          <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Tài khoản</p>
            <p className="mt-1 truncate text-xs font-medium text-navy-900">{session?.email}</p>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatusItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-slate-400">{label}</p>
      <p className="mt-1 truncate text-[11px] font-semibold text-navy-900" title={value}>
        {value}
      </p>
    </div>
  );
}
