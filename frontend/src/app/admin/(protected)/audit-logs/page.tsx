"use client";

import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  History,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { getAuditLogs } from "@/lib/audit-log-api";
import type { AuditLog, AuditLogPagedResult } from "@/types/audit-log";

const PAGE_SIZE = 10;

const emptyResult: AuditLogPagedResult = {
  items: [],
  page: 1,
  pageSize: PAGE_SIZE,
  totalItems: 0,
  totalPages: 0,
};

const actionOptions = [
  "",
  "CREATE",
  "UPDATE",
  "DELETE",
  "UPDATE_STATUS",
  "PUBLISH",
  "UNPUBLISH",
  "CHANGE_ROLE",
  "CHANGE_PASSWORD",
  "REGENERATE_QR",
  "EXPORT",
] as const;

const entityOptions = [
  "",
  "OrderRequest",
  "AffiliateApplication",
  "ContactRequest",
  "NewsArticle",
  "ServicePlan",
  "PlanPrice",
  "Promotion",
  "ServiceCategory",
  "AppUser",
] as const;

export default function AuditLogsPage() {
  const [result, setResult] = useState<AuditLogPagedResult>(emptyResult);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [userRole, setUserRole] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getAuditLogs({
        search,
        action: action || undefined,
        entityType: entityType || undefined,
        userRole: userRole || undefined,
        from: from || undefined,
        to: to || undefined,
        page,
        pageSize: PAGE_SIZE,
      });

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể tải nhật ký hệ thống.",
      );
    } finally {
      setLoading(false);
    }
  }, [action, entityType, from, page, search, to, userRole]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const pageNumbers = useMemo(() => {
    if (result.totalPages <= 1) return [];

    const start = Math.max(1, result.page - 2);
    const end = Math.min(result.totalPages, start + 4);
    const adjustedStart = Math.max(1, end - 4);

    return Array.from(
      { length: end - adjustedStart + 1 },
      (_, index) => adjustedStart + index,
    );
  }, [result.page, result.totalPages]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function resetFilters() {
    setSearchInput("");
    setSearch("");
    setAction("");
    setEntityType("");
    setUserRole("");
    setFrom("");
    setTo("");
    setPage(1);
  }

  const hasFilters = Boolean(
    search || action || entityType || userRole || from || to,
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-600">
            Audit & Security
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-navy-900">
            Nhật ký hệ thống
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Theo dõi ai đã thực hiện thao tác gì và thay đổi dữ liệu như thế nào.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadData()}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-brand-200 hover:text-brand-600"
        >
          <RefreshCw className="size-4" />
          Làm mới
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)]">
        <form
          onSubmit={submitSearch}
          className="grid gap-3 xl:grid-cols-[1.5fr_160px_190px_140px_150px_150px]"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Tên, mã yêu cầu, mô tả..."
              className="input-admin !pl-10 !pr-16"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-brand-600 px-3 py-1.5 text-[10.5px] font-semibold text-white hover:bg-brand-700"
            >
              Tìm
            </button>
          </div>

          <select
            value={action}
            onChange={(event) => {
              setAction(event.target.value);
              setPage(1);
            }}
            className="input-admin"
          >
            {actionOptions.map((value) => (
              <option key={value || "all"} value={value}>
                {value ? actionLabel(value) : "Tất cả thao tác"}
              </option>
            ))}
          </select>

          <select
            value={entityType}
            onChange={(event) => {
              setEntityType(event.target.value);
              setPage(1);
            }}
            className="input-admin"
          >
            {entityOptions.map((value) => (
              <option key={value || "all"} value={value}>
                {value ? entityLabel(value) : "Tất cả đối tượng"}
              </option>
            ))}
          </select>

          <select
            value={userRole}
            onChange={(event) => {
              setUserRole(event.target.value);
              setPage(1);
            }}
            className="input-admin"
          >
            <option value="">Mọi role</option>
            <option value="Admin">Admin</option>
            <option value="Editor">Editor</option>
            <option value="User">User</option>
            <option value="Guest">Khách</option>
          </select>

          <input
            type="date"
            value={from}
            onChange={(event) => {
              setFrom(event.target.value);
              setPage(1);
            }}
            className="input-admin"
            aria-label="Từ ngày"
          />

          <input
            type="date"
            value={to}
            onChange={(event) => {
              setTo(event.target.value);
              setPage(1);
            }}
            className="input-admin"
            aria-label="Đến ngày"
          />
        </form>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div>
            <p className="text-xs font-semibold text-navy-900">
              {result.totalItems.toLocaleString("vi-VN")} bản ghi
            </p>
            <p className="mt-0.5 text-[10.5px] text-slate-400">
              10 bản ghi mỗi trang · Trang {result.page} /{" "}
              {Math.max(result.totalPages, 1)}
            </p>
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-[11px] font-semibold text-brand-600"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid min-h-64 place-items-center">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <LoaderCircle className="size-5 animate-spin text-brand-600" />
              Đang tải nhật ký...
            </div>
          </div>
        ) : result.items.length === 0 ? (
          <div className="grid min-h-64 place-items-center text-center">
            <div>
              <History className="mx-auto size-8 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-navy-900">
                Chưa có lịch sử phù hợp
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Các thao tác quản trị mới sẽ xuất hiện tại đây.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">
              <thead className="border-b border-slate-100 text-[10px] uppercase tracking-[0.07em] text-slate-400">
                <tr>
                  <th className="pb-3 font-semibold">Thời gian</th>
                  <th className="pb-3 font-semibold">Người thực hiện</th>
                  <th className="pb-3 font-semibold">Thao tác</th>
                  <th className="pb-3 font-semibold">Đối tượng</th>
                  <th className="pb-3 font-semibold">Thay đổi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.items.map((log) => (
                  <AuditRow key={log.id} log={log} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {result.totalPages > 1 && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <p className="text-[10.5px] text-slate-400">
              Hiển thị{" "}
              {Math.min((result.page - 1) * PAGE_SIZE + 1, result.totalItems)}–
              {Math.min(result.page * PAGE_SIZE, result.totalItems)} /{" "}
              {result.totalItems}
            </p>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={result.page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Trang trước"
              >
                <ArrowLeft className="size-3.5" />
              </button>

              {pageNumbers.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  className={`grid size-8 place-items-center rounded-lg text-[11px] font-semibold ${
                    pageNumber === result.page
                      ? "bg-brand-600 text-white"
                      : "border border-slate-200 text-slate-500 hover:border-brand-200 hover:text-brand-600"
                  }`}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                type="button"
                disabled={result.page >= result.totalPages}
                onClick={() =>
                  setPage((current) =>
                    Math.min(result.totalPages, current + 1),
                  )
                }
                className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Trang sau"
              >
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>
        )}
      </section>

      <div className="flex items-start gap-2 rounded-2xl border border-blue-100 bg-blue-50/65 px-4 py-3 text-[11px] leading-5 text-blue-700">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" />
        Chỉ Admin được xem Audit Log. Editor vẫn được ghi nhận khi xử lý Order,
        Affiliate, Contact hoặc News nhưng không có quyền mở trang lịch sử này.
      </div>
    </div>
  );
}

function AuditRow({ log }: { log: AuditLog }) {
  return (
    <tr className="align-top text-xs text-slate-600">
      <td className="py-4 pr-5">
        <div className="flex items-start gap-2">
          <Clock3 className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
          <div>
            <p className="whitespace-nowrap font-medium text-navy-900">
              {formatDateTime(log.createdAt)}
            </p>
            <p className="mt-1 text-[10px] text-slate-400">
              {relativeTime(log.createdAt)}
            </p>
          </div>
        </div>
      </td>

      <td className="py-4 pr-5">
        <p className="font-semibold text-navy-900">{log.userName}</p>
        <span
          className={`mt-1.5 inline-flex rounded-full px-2 py-1 text-[9.5px] font-semibold ${roleClass(
            log.userRole,
          )}`}
        >
          {log.userRole}
        </span>
      </td>

      <td className="py-4 pr-5">
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-[9.5px] font-bold ${actionClass(
            log.action,
          )}`}
        >
          {actionLabel(log.action)}
        </span>
      </td>

      <td className="py-4 pr-5">
        <p className="font-semibold text-navy-900">
          {entityLabel(log.entityType)}
        </p>
        {log.referenceCode && (
          <p className="mt-1 font-mono text-[10px] text-brand-600">
            {log.referenceCode}
          </p>
        )}
        {log.description && (
          <p className="mt-1.5 max-w-[300px] text-[10.5px] leading-4 text-slate-500">
            {log.description}
          </p>
        )}
      </td>

      <td className="py-4">
        {log.oldValue || log.newValue ? (
          <div className="max-w-[340px] space-y-1.5 text-[10.5px] leading-4">
            {log.oldValue && (
              <div className="rounded-lg bg-red-50 px-2.5 py-1.5 text-red-700">
                <span className="font-semibold">Trước:</span> {log.oldValue}
              </div>
            )}
            {log.newValue && (
              <div className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-emerald-700">
                <span className="font-semibold">Sau:</span> {log.newValue}
              </div>
            )}
          </div>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </td>
    </tr>
  );
}

function actionLabel(action: string) {
  const labels: Record<string, string> = {
    CREATE: "Tạo mới",
    UPDATE: "Cập nhật",
    DELETE: "Xóa",
    UPDATE_STATUS: "Đổi trạng thái",
    PUBLISH: "Xuất bản",
    UNPUBLISH: "Gỡ xuất bản",
    CHANGE_ROLE: "Đổi quyền",
    CHANGE_PASSWORD: "Đổi mật khẩu",
    REGENERATE_QR: "Tạo lại QR",
    EXPORT: "Xuất dữ liệu",
  };

  return labels[action] ?? action;
}

function entityLabel(entityType: string) {
  const labels: Record<string, string> = {
    OrderRequest: "Yêu cầu dịch vụ",
    AffiliateApplication: "Affiliate",
    ContactRequest: "Liên hệ",
    NewsArticle: "Tin tức",
    ServicePlan: "Gói dịch vụ",
    PlanPrice: "Bảng giá",
    Promotion: "Khuyến mãi",
    ServiceCategory: "Danh mục dịch vụ",
    AppUser: "Tài khoản",
    System: "Hệ thống",
  };

  return labels[entityType] ?? entityType;
}

function actionClass(action: string) {
  if (action === "DELETE") return "bg-red-50 text-red-700 ring-1 ring-red-100";
  if (action === "CREATE") return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
  if (action === "EXPORT" || action === "PUBLISH") return "bg-violet-50 text-violet-700 ring-1 ring-violet-100";
  if (action === "CHANGE_ROLE" || action === "CHANGE_PASSWORD")
    return "bg-amber-50 text-amber-700 ring-1 ring-amber-100";

  return "bg-blue-50 text-blue-700 ring-1 ring-blue-100";
}

function roleClass(role: string) {
  if (role === "Admin") return "bg-blue-50 text-blue-700 ring-1 ring-blue-100";
  if (role === "Editor")
    return "bg-violet-50 text-violet-700 ring-1 ring-violet-100";
  if (role === "Guest")
    return "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100";

  return "bg-slate-100 text-slate-600 ring-1 ring-slate-200";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(value));
}

function relativeTime(value: string) {
  const date = new Date(value);
  const diffSeconds = Math.max(
    0,
    Math.round((Date.now() - date.getTime()) / 1000),
  );

  if (diffSeconds < 60) return "Vừa xong";
  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}
