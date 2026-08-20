"use client";

import {
  Activity,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  FileText,
  Mail,
  Newspaper,
  RefreshCw,
  Server,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { getDashboardSummary } from "@/lib/dashboard-api";
import type { DashboardRecentItem, DashboardSummary } from "@/types/dashboard";

export default function AdminDashboardPage() {
  const { session } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadSummary = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);

    setError("");

    try {
      const data = await getDashboardSummary();
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải dữ liệu Dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const cards = [
    {
      label: "Gói dịch vụ",
      value: summary?.totalServicePlans,
      caption: summary
        ? `${formatNumber(summary.activeServicePlans)} đang hoạt động`
        : "ServicePlan trong hệ thống",
      icon: Server,
      href: "/admin/services",
    },
    {
      label: "Người dùng",
      value: summary?.totalUsers,
      caption: summary
        ? `${formatNumber(summary.activeUsers)} tài khoản hoạt động`
        : "Tài khoản hệ thống",
      icon: Users,
      href: null,
    },
    {
      label: "Đơn dịch vụ",
      value: summary?.totalOrders,
      caption: summary
        ? `${formatNumber(summary.newOrders + summary.processingOrders)} cần xử lý`
        : "OrderRequest",
      icon: BriefcaseBusiness,
      href: "/admin/orders",
    },
    {
      label: "Affiliate",
      value: summary?.totalAffiliates,
      caption: summary
        ? `${formatNumber(summary.newAffiliates + summary.processingAffiliates)} cần xử lý`
        : "Hồ sơ đối tác",
      icon: Activity,
      href: "/admin/affiliates",
    },
    {
      label: "Liên hệ",
      value: summary?.totalContacts,
      caption: summary
        ? `${formatNumber(summary.newContacts + summary.processingContacts)} chưa hoàn tất`
        : "ContactRequest",
      icon: Mail,
      href: "/admin/contacts",
    },
    {
      label: "Tin tức",
      value: summary?.totalNews,
      caption: summary
        ? `${formatNumber(summary.publishedNews)} đã xuất bản`
        : "NewsArticle",
      icon: Newspaper,
      href: "/admin/news",
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
            Số liệu vận hành được tổng hợp trực tiếp từ cơ sở dữ liệu NovaCloud.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadSummary(true)}
          disabled={refreshing}
          className="inline-flex h-9 items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-600 shadow-sm transition hover:border-brand-200 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
        >
          <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>

      {error ? (
        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700 sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void loadSummary(true)}
            className="font-semibold underline underline-offset-2"
          >
            Thử lại
          </button>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {cards.map(({ label, value, caption, icon: Icon, href }) => {
          const content = (
            <article className="h-full rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.045)] transition hover:-translate-y-0.5 hover:border-brand-100 hover:shadow-[0_14px_40px_rgba(15,23,42,0.065)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium text-slate-500">{label}</p>
                  <p className="mt-2 text-[24px] font-semibold tracking-[-0.035em] text-navy-900">
                    {loading ? "—" : formatNumber(value ?? 0)}
                  </p>
                </div>
                <span className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100/80">
                  <Icon className="size-4.5" />
                </span>
              </div>
              <p className="mt-3 text-[10.5px] text-slate-400">{caption}</p>
            </article>
          );

          return href ? (
            <Link key={label} href={href} className="block">
              {content}
            </Link>
          ) : (
            <div key={label}>{content}</div>
          );
        })}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.82fr_1.18fr]">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-navy-900">Khối lượng cần xử lý</p>
              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                Tổng hợp các yêu cầu đang ở trạng thái New hoặc Processing.
              </p>
            </div>
            <span className="rounded-xl bg-amber-50 px-3 py-2 text-lg font-semibold text-amber-700 ring-1 ring-amber-100">
              {loading ? "—" : formatNumber(summary?.pendingWork ?? 0)}
            </span>
          </div>

          <div className="mt-5 space-y-3">
            <WorkloadRow
              label="Đơn dịch vụ"
              href="/admin/orders"
              newCount={summary?.newOrders ?? 0}
              processingCount={summary?.processingOrders ?? 0}
              loading={loading}
            />
            <WorkloadRow
              label="Affiliate"
              href="/admin/affiliates"
              newCount={summary?.newAffiliates ?? 0}
              processingCount={summary?.processingAffiliates ?? 0}
              loading={loading}
            />
            <WorkloadRow
              label="Liên hệ"
              href="/admin/contacts"
              newCount={summary?.newContacts ?? 0}
              processingCount={summary?.processingContacts ?? 0}
              loading={loading}
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5">
            <MiniStat
              label="Order hoàn tất"
              value={summary?.completedOrders ?? 0}
              icon={CheckCircle2}
              loading={loading}
            />
            <MiniStat
              label="Contact đã xử lý"
              value={summary?.resolvedContacts ?? 0}
              icon={CheckCircle2}
              loading={loading}
            />
            <MiniStat
              label="Tin đã xuất bản"
              value={summary?.publishedNews ?? 0}
              icon={FileText}
              loading={loading}
            />
            <MiniStat
              label="Tin nháp"
              value={summary?.draftNews ?? 0}
              icon={Clock3}
              loading={loading}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-navy-900">Hoạt động gần đây</p>
              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                8 yêu cầu hoặc nội dung mới nhất trong hệ thống.
              </p>
            </div>
            <Activity className="size-4 text-brand-600" />
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {loading ? (
              <DashboardSkeleton />
            ) : summary?.recentItems.length ? (
              summary.recentItems.map((item, index) => (
                <RecentItemRow key={`${item.type}-${item.createdAt}-${index}`} item={item} />
              ))
            ) : (
              <div className="py-10 text-center text-xs text-slate-400">
                Chưa có hoạt động nào để hiển thị.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function WorkloadRow({
  label,
  href,
  newCount,
  processingCount,
  loading,
}: {
  label: string;
  href: string;
  newCount: number;
  processingCount: number;
  loading: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3.5 transition hover:border-brand-100 hover:bg-brand-50/40"
    >
      <div>
        <p className="text-[11px] font-semibold text-navy-900">{label}</p>
        <p className="mt-1 text-[10px] text-slate-500">
          {loading ? "Đang tải..." : `${formatNumber(newCount)} mới · ${formatNumber(processingCount)} đang xử lý`}
        </p>
      </div>
      <ArrowRight className="size-4 shrink-0 text-slate-400" />
    </Link>
  );
}

function MiniStat({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string;
  value: number;
  icon: typeof CheckCircle2;
  loading: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-100 px-3.5 py-3">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon className="size-3.5" />
        <p className="text-[9.5px] font-medium">{label}</p>
      </div>
      <p className="mt-2 text-lg font-semibold text-navy-900">
        {loading ? "—" : formatNumber(value)}
      </p>
    </div>
  );
}

function RecentItemRow({ item }: { item: DashboardRecentItem }) {
  return (
    <Link
      href={item.link}
      className="flex items-center gap-3 py-3.5 transition first:pt-1 last:pb-1 hover:bg-slate-50/60"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-[10px] font-bold text-brand-700 ring-1 ring-brand-100/80">
        {typeLabel(item.type)}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[11px] font-semibold text-navy-900">{item.title}</p>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ${statusClass(item.status)}`}>
            {statusLabel(item.status)}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[10px] text-slate-500">{item.subtitle}</p>
      </div>

      <time className="hidden shrink-0 text-[9.5px] text-slate-400 sm:block">
        {formatDateTime(item.createdAt)}
      </time>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-1 py-1">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="flex animate-pulse items-center gap-3 py-3">
          <div className="size-9 rounded-xl bg-slate-100" />
          <div className="flex-1">
            <div className="h-2.5 w-1/3 rounded bg-slate-100" />
            <div className="mt-2 h-2 w-1/2 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function formatNumber(value: number) {
  return value.toLocaleString("vi-VN");
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function typeLabel(type: string) {
  switch (type) {
    case "Order":
      return "ORD";
    case "Affiliate":
      return "AFF";
    case "Contact":
      return "CON";
    case "News":
      return "NEW";
    default:
      return "SYS";
  }
}

function statusLabel(status: string) {
  switch (status.toLowerCase()) {
    case "new":
      return "Mới";
    case "processing":
      return "Đang xử lý";
    case "completed":
      return "Hoàn tất";
    case "resolved":
      return "Đã xử lý";
    case "rejected":
      return "Từ chối";
    case "published":
      return "Đã đăng";
    case "draft":
      return "Nháp";
    default:
      return status;
  }
}

function statusClass(status: string) {
  switch (status.toLowerCase()) {
    case "new":
      return "bg-blue-50 text-blue-700";
    case "processing":
      return "bg-amber-50 text-amber-700";
    case "completed":
    case "resolved":
    case "published":
      return "bg-emerald-50 text-emerald-700";
    case "rejected":
      return "bg-rose-50 text-rose-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}
