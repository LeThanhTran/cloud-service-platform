"use client";

import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  Clock3,
  FileClock,
  LoaderCircle,
  Mail,
  Server,
} from "lucide-react";
import { useEffect, useState } from "react";
import { CustomerRequestCard } from "@/components/account/customer-request-card";
import { getCustomerOverview } from "@/lib/customer-account-api";
import type { CustomerAccountOverview } from "@/types/customer-account";

export default function AccountOverviewPage() {
  const [overview, setOverview] = useState<CustomerAccountOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const result = await getCustomerOverview();
        if (active) setOverview(result);
      } catch (reason) {
        if (active) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Không thể tải tổng quan tài khoản.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <LoadingState label="Đang tải tổng quan tài khoản..." />;
  }

  if (error || !overview) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
        {error || "Không tìm thấy dữ liệu tài khoản."}
      </div>
    );
  }

  const stats = [
    {
      label: "Tổng yêu cầu",
      value: overview.totalRequests,
      icon: FileClock,
      description: "Order, Contact và Affiliate",
    },
    {
      label: "Đang xử lý",
      value: overview.activeRequests,
      icon: Clock3,
      description: "New hoặc Processing",
    },
    {
      label: "Đã hoàn tất",
      value: overview.completedRequests,
      icon: CheckCircle2,
      description: "Completed hoặc Resolved",
    },
    {
      label: "Thông báo mới",
      value: overview.unreadNotifications,
      icon: Bell,
      description: "Cập nhật chưa đọc",
    },
  ];

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-600">
            Tổng quan
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-navy-900">
            Xin chào, {overview.profile.fullName}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Theo dõi yêu cầu, thông báo và bảo mật tài khoản tại một nơi.
          </p>
        </div>
        <Link
          href="/services"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-xs font-semibold text-white transition hover:bg-brand-700"
        >
          <Server className="size-4" />
          Xem dịch vụ
        </Link>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, description }) => (
          <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex items-center justify-between">
              <span className="grid size-9 place-items-center rounded-xl bg-white text-brand-600 shadow-sm ring-1 ring-slate-200/70">
                <Icon className="size-4" />
              </span>
              <strong className="text-2xl font-semibold tracking-[-0.04em] text-navy-900">
                {value}
              </strong>
            </div>
            <p className="mt-4 text-xs font-semibold text-slate-700">{label}</p>
            <p className="mt-1 text-[10.5px] text-slate-400">{description}</p>
          </div>
        ))}
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-[1.45fr_0.75fr]">
        <section>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-navy-900">Yêu cầu gần đây</h3>
              <p className="mt-1 text-xs text-slate-500">
                Hệ thống tự ghép các yêu cầu có cùng email tài khoản.
              </p>
            </div>
            <Link href="/account/requests" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              Xem tất cả
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {overview.recentRequests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-7 text-center">
                <FileClock className="mx-auto size-7 text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-600">Chưa có yêu cầu nào</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Khi bạn đăng ký dịch vụ, gửi liên hệ hoặc Affiliate bằng email này, yêu cầu sẽ xuất hiện tại đây.
                </p>
              </div>
            ) : (
              overview.recentRequests.map((item) => (
                <CustomerRequestCard key={`${item.requestType}-${item.id}`} item={item} />
              ))
            )}
          </div>
        </section>

        <aside className="space-y-3">
          <div className="rounded-2xl border border-brand-100 bg-brand-50/55 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-brand-600">
              Hồ sơ tài khoản
            </p>
            <p className="mt-3 text-sm font-semibold text-navy-900">{overview.profile.fullName}</p>
            <p className="mt-1 flex items-center gap-2 text-xs text-slate-500">
              <Mail className="size-3.5" /> {overview.profile.email}
            </p>
            <div className="mt-4 rounded-xl border border-brand-100 bg-white/75 px-3 py-2 text-[11px] leading-5 text-slate-500">
              Các yêu cầu cũ gửi bằng đúng email này cũng được hiển thị sau khi bạn đăng nhập.
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold text-navy-900">Thao tác nhanh</p>
            <div className="mt-3 grid gap-2">
              <QuickLink href="/order" label="Đăng ký dịch vụ" />
              <QuickLink href="/contact" label="Gửi yêu cầu hỗ trợ" />
              <QuickLink href="/affiliate" label="Đăng ký Affiliate" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-brand-200 hover:bg-brand-50/50 hover:text-brand-600"
    >
      {label}
    </Link>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-slate-500">
      <LoaderCircle className="size-5 animate-spin text-brand-600" />
      {label}
    </div>
  );
}
