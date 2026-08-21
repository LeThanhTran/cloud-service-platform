"use client";

import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Eye,
  Globe2,
  LoaderCircle,
  Mail,
  Phone,
  RefreshCw,
  Search,
  UserRound,
  XCircle,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  getAffiliateApplicationForManagement,
  getAffiliateApplicationsForManagement,
  updateAffiliateApplicationStatus,
} from "@/lib/order-affiliate-api";
import type {
  AffiliateApplication,
  ManagementSort,
  PagedResult,
  RequestStatus,
} from "@/types/order-affiliate";

const PAGE_SIZE = 8;

const emptyResult: PagedResult<AffiliateApplication> = {
  items: [],
  page: 1,
  pageSize: PAGE_SIZE,
  totalItems: 0,
  totalPages: 0,
};

export default function AdminAffiliatesPage() {
  const [result, setResult] = useState<PagedResult<AffiliateApplication>>(emptyResult);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<ManagementSort>("latest");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AffiliateApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setResult(await getAffiliateApplicationsForManagement({
        search,
        status: status || undefined,
        sort,
        page,
        pageSize: PAGE_SIZE,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách hồ sơ Affiliate.");
    } finally {
      setLoading(false);
    }
  }, [page, search, sort, status]);

  useEffect(() => { void loadData(); }, [loadData]);

  async function openDetail(id: string) {
    setDetailLoading(true);
    setError(null);
    try {
      setSelected(await getAffiliateApplicationForManagement(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải chi tiết hồ sơ Affiliate.");
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
      const updated = await updateAffiliateApplicationStatus(selected.id, nextStatus);
      setSelected(updated);
      setMessage(`Đã chuyển hồ sơ sang ${statusLabel(updated.status)}.`);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật trạng thái hồ sơ.");
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-600">Partner Management</p>
          <h1 className="mt-1.5 text-[28px] font-semibold tracking-[-0.035em] text-navy-900">Hồ sơ Affiliate</h1>
          <p className="mt-1 text-sm text-slate-500">Admin và Editor tiếp nhận, đánh giá và xử lý hồ sơ đối tác NovaCloud.</p>
        </div>
        <button type="button" onClick={() => void loadData()} className="inline-flex h-10 items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-600 transition hover:border-brand-200 hover:text-brand-600">
          <RefreshCw className="size-4" /> Làm mới
        </button>
      </div>

      {(message || error) && (
        <div className={`rounded-xl border px-4 py-3 text-xs ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {error ?? message}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)]">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
          <form onSubmit={submitSearch} className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Tìm theo mã, tên, email, số điện thoại, công ty, website..." className="input-admin pl-9 pr-20" />
            <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-brand-600 px-3 py-1.5 text-[10.5px] font-semibold text-white hover:bg-brand-700">Tìm</button>
          </form>

          <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="input-admin">
            <option value="">Tất cả trạng thái</option>
            <option value="New">Mới</option>
            <option value="Processing">Đang xử lý</option>
            <option value="Completed">Hoàn tất</option>
            <option value="Rejected">Từ chối</option>
          </select>

          <select value={sort} onChange={(event) => { setSort(event.target.value as ManagementSort); setPage(1); }} className="input-admin">
            <option value="latest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="status">Theo trạng thái</option>
          </select>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div><p className="text-xs font-semibold text-navy-900">{result.totalItems.toLocaleString("vi-VN")} hồ sơ</p><p className="mt-0.5 text-[10.5px] text-slate-400">Trang {result.page} / {Math.max(result.totalPages, 1)}</p></div>
          {(search || status) && <button type="button" onClick={() => { setSearchInput(""); setSearch(""); setStatus(""); setPage(1); }} className="text-[11px] font-semibold text-brand-600">Xóa bộ lọc</button>}
        </div>

        {loading ? (
          <LoadingState />
        ) : result.items.length === 0 ? (
          <div className="grid min-h-64 place-items-center text-center text-sm text-slate-500">Chưa có hồ sơ Affiliate phù hợp.</div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="border-b border-slate-100 text-[10px] uppercase tracking-[0.07em] text-slate-400">
                <tr><th className="pb-3 font-semibold">Ứng viên</th><th className="pb-3 font-semibold">Doanh nghiệp</th><th className="pb-3 font-semibold">Website</th><th className="pb-3 font-semibold">Ngày gửi</th><th className="pb-3 font-semibold">Trạng thái</th><th className="pb-3 text-right font-semibold">Chi tiết</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.items.map((application) => (
                  <tr key={application.id} className="text-xs text-slate-600">
                    <td className="py-4 pr-4"><p className="font-semibold text-navy-900">{application.fullName}</p><p className="mt-1 text-[10.5px] text-slate-400">{application.email}</p><p className="mt-1 font-mono text-[9.5px] text-slate-400">{application.referenceCode}</p></td>
                    <td className="py-4 pr-4">{application.companyName || "—"}</td>
                    <td className="max-w-[210px] truncate py-4 pr-4">{application.website || "—"}</td>
                    <td className="py-4 pr-4">{formatDate(application.createdAt)}</td>
                    <td className="py-4 pr-4"><StatusBadge status={application.status} /></td>
                    <td className="py-4 text-right"><button type="button" onClick={() => void openDetail(application.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-[10.5px] font-semibold text-slate-600 hover:border-brand-200 hover:text-brand-600"><Eye className="size-3.5" /> Xem</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={result.page} totalPages={result.totalPages} onPage={setPage} />
      </section>

      {(selected || detailLoading) && (
        <section className="rounded-2xl border border-brand-100 bg-white p-5 shadow-[0_14px_45px_rgba(15,23,42,0.08)] sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div><p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-brand-600">Affiliate Detail</p><p className="mt-1 text-sm font-semibold text-navy-900">Chi tiết hồ sơ đối tác</p></div>
            <button type="button" onClick={() => setSelected(null)} className="rounded-lg border border-slate-200 px-3 py-2 text-[10.5px] font-semibold text-slate-500 hover:text-navy-900">Đóng</button>
          </div>

          {detailLoading ? <LoadingState compact /> : selected && (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div><p className="text-lg font-semibold tracking-[-0.02em] text-navy-900">{selected.fullName}</p><p className="mt-1 font-mono text-[10px] text-slate-400">{selected.referenceCode}</p></div>
                <StatusBadge status={selected.status} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Info icon={UserRound} label="Người đăng ký" value={selected.fullName} />
                <Info icon={Mail} label="Email" value={selected.email} />
                <Info icon={Phone} label="Điện thoại" value={selected.phoneNumber} />
                <Info icon={Building2} label="Công ty" value={selected.companyName || "Không cung cấp"} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-100 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400">Website</p>
                  {selected.website ? <a href={selected.website} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 break-all text-xs font-semibold text-brand-600 hover:underline"><Globe2 className="size-3.5 shrink-0" />{selected.website}<ExternalLink className="size-3" /></a> : <p className="mt-2 text-xs text-slate-600">Không cung cấp</p>}
                </div>
                <TextBlock label="Ngày gửi" value={formatDateTime(selected.createdAt)} />
              </div>
              <TextBlock label="Nội dung đăng ký" value={selected.note || "Không có ghi chú."} />

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div><p className="text-xs font-semibold text-navy-900">Xử lý hồ sơ</p><p className="mt-1 text-[10.5px] text-slate-500">Luồng: New → Processing → Completed / Rejected.</p></div>
                  <div className="flex flex-wrap gap-2">
                    {nextStatuses(selected.status).length === 0 ? <span className="rounded-lg bg-white px-3 py-2 text-[10.5px] font-medium text-slate-500 ring-1 ring-slate-200">Đã kết thúc xử lý</span> : nextStatuses(selected.status).map((action) => (
                      <button key={action} type="button" disabled={updating} onClick={() => void changeStatus(action)} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10.5px] font-semibold text-white disabled:opacity-60 ${action === "Rejected" ? "bg-red-600 hover:bg-red-700" : action === "Completed" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-brand-600 hover:bg-brand-700"}`}>
                        {updating ? <LoaderCircle className="size-3.5 animate-spin" /> : action === "Rejected" ? <XCircle className="size-3.5" /> : action === "Completed" ? <CheckCircle2 className="size-3.5" /> : <Clock3 className="size-3.5" />}
                        {action === "Processing" ? "Bắt đầu xử lý" : action === "Completed" ? "Duyệt hồ sơ" : "Từ chối"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5"><div className="flex items-center gap-2 text-[10px] font-medium text-slate-400"><Icon className="size-3.5" /> {label}</div><p className="mt-2 break-words text-[11.5px] font-semibold text-navy-900">{value}</p></div>;
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
  return <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:text-brand-600 disabled:opacity-40"><ArrowLeft className="size-4" /></button><span className="px-2 text-[10.5px] font-semibold text-slate-500">{page} / {totalPages}</span><button type="button" disabled={page >= totalPages} onClick={() => onPage(page + 1)} className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:text-brand-600 disabled:opacity-40"><ArrowRight className="size-4" /></button></div>;
}

function LoadingState({ compact = false }: { compact?: boolean }) {
  return <div className={`grid place-items-center text-slate-500 ${compact ? "min-h-32" : "min-h-64"}`}><LoaderCircle className="size-5 animate-spin text-brand-600" /></div>;
}

function nextStatuses(status: string): RequestStatus[] {
  if (status === "New") return ["Processing", "Rejected"];
  if (status === "Processing") return ["Completed", "Rejected"];
  return [];
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
