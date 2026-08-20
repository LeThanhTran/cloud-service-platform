"use client";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  LoaderCircle,
  Mail,
  PackageCheck,
  Phone,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  getOrderRequestForManagement,
  getOrderRequestsForManagement,
  updateOrderRequestStatus,
} from "@/lib/order-affiliate-api";
import type {
  ManagementSort,
  OrderRequest,
  PagedResult,
  RequestStatus,
} from "@/types/order-affiliate";

const PAGE_SIZE = 8;

const emptyResult: PagedResult<OrderRequest> = {
  items: [],
  page: 1,
  pageSize: PAGE_SIZE,
  totalItems: 0,
  totalPages: 0,
};

const statusOptions = ["", "New", "Processing", "Completed", "Rejected"] as const;

export default function AdminOrdersPage() {
  const [result, setResult] = useState<PagedResult<OrderRequest>>(emptyResult);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<ManagementSort>("latest");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<OrderRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getOrderRequestsForManagement({
        search,
        status: status || undefined,
        sort,
        page,
        pageSize: PAGE_SIZE,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách yêu cầu dịch vụ.");
    } finally {
      setLoading(false);
    }
  }, [page, search, sort, status]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function openDetail(id: string) {
    setDetailLoading(true);
    setError(null);
    try {
      setSelected(await getOrderRequestForManagement(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải chi tiết yêu cầu.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function changeStatus(nextStatus: RequestStatus) {
    if (!selected || updating) return;
    setUpdating(true);
    setError(null);
    setMessage(null);

    try {
      const updated = await updateOrderRequestStatus(selected.id, nextStatus);
      setSelected(updated);
      setMessage(`Đã chuyển yêu cầu sang ${statusLabel(updated.status)}.`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật trạng thái.");
    } finally {
      setUpdating(false);
    }
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  return (
    <div className="space-y-5">
      <Header
        eyebrow="Request Management"
        title="Yêu cầu dịch vụ"
        description="Admin và Editor theo dõi, tìm kiếm và xử lý các yêu cầu đăng ký Cloud của khách hàng."
        onRefresh={() => void loadData()}
      />

      {(message || error) && (
        <div className={`rounded-xl border px-4 py-3 text-xs ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {error ?? message}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)]">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
          <form onSubmit={submitSearch} className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Tìm theo tên, email, số điện thoại, công ty..."
              className="input-admin pl-9 pr-20"
            />
            <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-brand-600 px-3 py-1.5 text-[10.5px] font-semibold text-white hover:bg-brand-700">
              Tìm
            </button>
          </form>

          <select
            value={status}
            onChange={(event) => { setStatus(event.target.value); setPage(1); }}
            className="input-admin"
          >
            {statusOptions.map((value) => (
              <option key={value || "all"} value={value}>{value ? statusLabel(value) : "Tất cả trạng thái"}</option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(event) => { setSort(event.target.value as ManagementSort); setPage(1); }}
            className="input-admin"
          >
            <option value="latest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="status">Theo trạng thái</option>
          </select>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div>
            <p className="text-xs font-semibold text-navy-900">{result.totalItems.toLocaleString("vi-VN")} yêu cầu</p>
            <p className="mt-0.5 text-[10.5px] text-slate-400">Trang {result.page} / {Math.max(result.totalPages, 1)}</p>
          </div>
          {(search || status) && (
            <button
              type="button"
              onClick={() => { setSearchInput(""); setSearch(""); setStatus(""); setPage(1); }}
              className="text-[11px] font-semibold text-brand-600"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {loading ? (
          <LoadingState />
        ) : result.items.length === 0 ? (
          <EmptyState text="Chưa có yêu cầu dịch vụ phù hợp." />
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="border-b border-slate-100 text-[10px] uppercase tracking-[0.07em] text-slate-400">
                <tr>
                  <th className="pb-3 font-semibold">Khách hàng</th>
                  <th className="pb-3 font-semibold">Gói dịch vụ</th>
                  <th className="pb-3 font-semibold">Chu kỳ</th>
                  <th className="pb-3 font-semibold">Ngày gửi</th>
                  <th className="pb-3 font-semibold">Trạng thái</th>
                  <th className="pb-3 text-right font-semibold">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.items.map((order) => (
                  <tr key={order.id} className="text-xs text-slate-600">
                    <td className="py-4 pr-4">
                      <p className="font-semibold text-navy-900">{order.customerName}</p>
                      <p className="mt-1 text-[10.5px] text-slate-400">{order.email}</p>
                    </td>
                    <td className="py-4 pr-4">
                      <p className="font-medium text-navy-900">{order.servicePlanName}</p>
                      <p className="mt-1 font-mono text-[9.5px] text-slate-400">{shortId(order.id)}</p>
                    </td>
                    <td className="py-4 pr-4">{order.billingCycle === "Yearly" ? "Theo năm" : "Theo tháng"}</td>
                    <td className="py-4 pr-4">{formatDate(order.createdAt)}</td>
                    <td className="py-4 pr-4"><StatusBadge status={order.status} /></td>
                    <td className="py-4 text-right">
                      <button
                        type="button"
                        onClick={() => void openDetail(order.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-[10.5px] font-semibold text-slate-600 hover:border-brand-200 hover:text-brand-600"
                      >
                        <Eye className="size-3.5" /> Xem
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={result.page} totalPages={result.totalPages} onPage={setPage} />
      </section>

      {(selected || detailLoading) && (
        <DetailPanel title="Chi tiết yêu cầu dịch vụ" onClose={() => setSelected(null)} loading={detailLoading}>
          {selected && (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-lg font-semibold tracking-[-0.02em] text-navy-900">{selected.customerName}</p>
                  <p className="mt-1 font-mono text-[10px] text-slate-400">{selected.id}</p>
                </div>
                <StatusBadge status={selected.status} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Info icon={PackageCheck} label="Gói dịch vụ" value={selected.servicePlanName} />
                <Info icon={CalendarDays} label="Chu kỳ" value={selected.billingCycle === "Yearly" ? "Theo năm" : "Theo tháng"} />
                <Info icon={Mail} label="Email" value={selected.email} />
                <Info icon={Phone} label="Điện thoại" value={selected.phoneNumber} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <TextBlock label="Công ty" value={selected.companyName || "Không cung cấp"} />
                <TextBlock label="Ngày gửi" value={formatDateTime(selected.createdAt)} />
              </div>
              <TextBlock label="Ghi chú khách hàng" value={selected.note || "Không có ghi chú."} />

              <WorkflowActions status={selected.status} updating={updating} onChange={(next) => void changeStatus(next)} />
            </div>
          )}
        </DetailPanel>
      )}
    </div>
  );
}

function WorkflowActions({ status, updating, onChange }: { status: string; updating: boolean; onChange: (status: RequestStatus) => void }) {
  const actions = nextStatuses(status);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-navy-900">Xử lý yêu cầu</p>
          <p className="mt-1 text-[10.5px] text-slate-500">Luồng: New → Processing → Completed / Rejected.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {actions.length === 0 ? (
            <span className="rounded-lg bg-white px-3 py-2 text-[10.5px] font-medium text-slate-500 ring-1 ring-slate-200">Đã kết thúc xử lý</span>
          ) : actions.map((action) => (
            <button
              key={action}
              type="button"
              disabled={updating}
              onClick={() => onChange(action)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10.5px] font-semibold text-white disabled:opacity-60 ${action === "Rejected" ? "bg-red-600 hover:bg-red-700" : action === "Completed" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-brand-600 hover:bg-brand-700"}`}
            >
              {updating ? <LoaderCircle className="size-3.5 animate-spin" /> : action === "Rejected" ? <XCircle className="size-3.5" /> : action === "Completed" ? <CheckCircle2 className="size-3.5" /> : <Clock3 className="size-3.5" />}
              {action === "Processing" ? "Bắt đầu xử lý" : action === "Completed" ? "Hoàn tất" : "Từ chối"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function nextStatuses(status: string): RequestStatus[] {
  if (status === "New") return ["Processing", "Rejected"];
  if (status === "Processing") return ["Completed", "Rejected"];
  return [];
}

function Header({ eyebrow, title, description, onRefresh }: { eyebrow: string; title: string; description: string; onRefresh: () => void }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-600">{eyebrow}</p>
        <h1 className="mt-1.5 text-[28px] font-semibold tracking-[-0.035em] text-navy-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <button type="button" onClick={onRefresh} className="inline-flex h-10 items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-600 transition hover:border-brand-200 hover:text-brand-600">
        <RefreshCw className="size-4" /> Làm mới
      </button>
    </div>
  );
}

function DetailPanel({ title, onClose, loading, children }: { title: string; onClose: () => void; loading: boolean; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-brand-100 bg-white p-5 shadow-[0_14px_45px_rgba(15,23,42,0.08)] sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-brand-600">Request Detail</p>
          <p className="mt-1 text-sm font-semibold text-navy-900">{title}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3 py-2 text-[10.5px] font-semibold text-slate-500 hover:text-navy-900">Đóng</button>
      </div>
      {loading ? <LoadingState compact /> : children}
    </section>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
      <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400"><Icon className="size-3.5" /> {label}</div>
      <p className="mt-2 break-words text-[11.5px] font-semibold text-navy-900">{value}</p>
    </div>
  );
}

function TextBlock({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-slate-100 p-4"><p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400">{label}</p><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-600">{value}</p></div>;
}

function StatusBadge({ status }: { status: string }) {
  const classes = status === "Completed" ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : status === "Rejected" ? "bg-red-50 text-red-700 ring-red-100" : status === "Processing" ? "bg-amber-50 text-amber-700 ring-amber-100" : "bg-blue-50 text-brand-700 ring-blue-100";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ${classes}`}>{statusLabel(status)}</span>;
}

function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
      <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:text-brand-600 disabled:opacity-40"><ArrowLeft className="size-4" /></button>
      <span className="px-2 text-[10.5px] font-semibold text-slate-500">{page} / {totalPages}</span>
      <button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)} className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:text-brand-600 disabled:opacity-40"><ArrowRight className="size-4" /></button>
    </div>
  );
}

function LoadingState({ compact = false }: { compact?: boolean }) {
  return <div className={`grid place-items-center text-slate-500 ${compact ? "min-h-32" : "min-h-64"}`}><LoaderCircle className="size-5 animate-spin text-brand-600" /></div>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="grid min-h-64 place-items-center text-center text-sm text-slate-500">{text}</div>;
}

function statusLabel(status: string) {
  return ({ New: "Mới", Processing: "Đang xử lý", Completed: "Hoàn tất", Rejected: "Từ chối" } as Record<string, string>)[status] ?? status;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function shortId(value: string) {
  return `${value.slice(0, 8)}…`;
}
