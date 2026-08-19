"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Edit3, LoaderCircle, Plus, RefreshCw, Trash2 } from "lucide-react";
import { AdminOnly } from "@/components/admin/admin-only";
import {
  createPromotion,
  deletePromotion,
  getPromotions,
  getServicePlans,
  isPromotionActive,
  updatePromotion,
} from "@/lib/service-api";
import type { Promotion, PromotionInput, ServicePlan } from "@/types/service";

async function fetchPromotionAdminData() {
  return Promise.all([getPromotions(), getServicePlans()]);
}

function localDateTime(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const tz = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tz).toISOString().slice(0, 16);
}

const defaultForm = (): PromotionInput => ({
  name: "",
  description: "",
  discountPercent: 10,
  startDate: localDateTime(0),
  endDate: localDateTime(30),
  isActive: true,
  servicePlanId: "",
});

function toInputDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 16);
  const tz = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tz).toISOString().slice(0, 16);
}

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [form, setForm] = useState<PromotionInput>(defaultForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [promotionData, planData] = await fetchPromotionAdminData();
      setPromotions(promotionData);
      setPlans(planData);
      if (!form.servicePlanId && planData[0]) {
        setForm((current) => ({ ...current, servicePlanId: planData[0].id }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải khuyến mãi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function initialLoad() {
      try {
        const [promotionData, planData] = await fetchPromotionAdminData();
        if (!active) return;
        setPromotions(promotionData);
        setPlans(planData);
        setForm((current) =>
          current.servicePlanId || !planData[0]
            ? current
            : { ...current, servicePlanId: planData[0].id },
        );
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Không thể tải khuyến mãi.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void initialLoad();
    return () => {
      active = false;
    };
  }, []);

  const planMap = useMemo(() => new Map(plans.map((plan) => [plan.id, plan])), [plans]);

  function resetForm() {
    const next = defaultForm();
    next.servicePlanId = plans[0]?.id ?? "";
    setForm(next);
    setEditingId(null);
  }

  function startEdit(promotion: Promotion) {
    setEditingId(promotion.id);
    setForm({
      name: promotion.name,
      description: promotion.description ?? "",
      discountPercent: promotion.discountPercent,
      startDate: toInputDateTime(promotion.startDate),
      endDate: toInputDateTime(promotion.endDate),
      isActive: promotion.isActive,
      servicePlanId: promotion.servicePlanId,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      if (!form.name.trim()) throw new Error("Tên khuyến mãi không được để trống.");
      if (!form.servicePlanId) throw new Error("Hãy chọn gói dịch vụ.");
      if (form.discountPercent <= 0 || form.discountPercent > 100) throw new Error("Mức giảm phải trong khoảng 0–100%.");
      const start = new Date(form.startDate);
      const end = new Date(form.endDate);
      if (end <= start) throw new Error("Thời gian kết thúc phải sau thời gian bắt đầu.");

      const payload: PromotionInput = {
        ...form,
        name: form.name.trim(),
        description: form.description?.trim() || null,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      };

      if (editingId) {
        await updatePromotion(editingId, payload);
        setMessage("Đã cập nhật khuyến mãi.");
      } else {
        await createPromotion(payload);
        setMessage("Đã tạo khuyến mãi mới.");
      }
      await loadData();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu khuyến mãi.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(promotion: Promotion) {
    if (!window.confirm(`Xóa khuyến mãi “${promotion.name}”?`)) return;
    try {
      setError(null);
      setMessage(null);
      await deletePromotion(promotion.id);
      setMessage("Đã xóa khuyến mãi.");
      await loadData();
      if (editingId === promotion.id) resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xóa khuyến mãi.");
    }
  }

  return (
    <AdminOnly>
      <div className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-600">Service Management</p><h1 className="mt-1.5 text-[28px] font-semibold tracking-[-0.035em] text-navy-900">Khuyến mãi</h1><p className="mt-1 text-sm text-slate-500">Quản lý Promotion theo thời gian áp dụng.</p></div>
          <button type="button" onClick={() => void loadData()} className="inline-flex h-10 items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-600 hover:border-brand-200 hover:text-brand-600"><RefreshCw className="size-4" /> Làm mới</button>
        </div>

        {(message || error) && <div className={`rounded-xl border px-4 py-3 text-xs ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{error ?? message}</div>}

        <div className="grid gap-5 xl:grid-cols-[410px_1fr]">
          <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between"><div><p className="text-xs font-semibold text-navy-900">{editingId ? "Chỉnh sửa khuyến mãi" : "Tạo khuyến mãi"}</p><p className="mt-1 text-[11px] text-slate-500">Giảm giá theo ServicePlan.</p></div>{editingId && <button type="button" onClick={resetForm} className="text-[11px] font-semibold text-brand-600">Hủy sửa</button>}</div>
            <div className="mt-5 space-y-4">
              <Field label="Tên khuyến mãi"><input className="input-admin" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ưu đãi VPS tháng 8" required /></Field>
              <Field label="Gói dịch vụ"><select className="input-admin" value={form.servicePlanId} onChange={(e) => setForm({ ...form, servicePlanId: e.target.value })} required><option value="">Chọn gói</option>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</select></Field>
              <Field label="Mô tả"><textarea className="input-admin min-h-20 resize-y py-3" value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
              <Field label="Giảm giá (%)"><input type="number" min={0.01} max={100} step="0.01" className="input-admin" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })} required /></Field>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2"><Field label="Bắt đầu"><input type="datetime-local" className="input-admin" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required /></Field><Field label="Kết thúc"><input type="datetime-local" className="input-admin" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required /></Field></div>
              <label className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-[11px] font-medium text-slate-600"><span>Đang hoạt động</span><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="size-4 accent-blue-600" /></label>
            </div>
            <button disabled={saving} className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-60">{saving ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />}{saving ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Tạo khuyến mãi"}</button>
          </form>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)]">
            <div><p className="text-xs font-semibold text-navy-900">Promotion hiện có</p><p className="mt-1 text-[11px] text-slate-500">{promotions.length} chương trình khuyến mãi.</p></div>
            {loading ? <div className="grid min-h-72 place-items-center"><LoaderCircle className="size-5 animate-spin text-brand-600" /></div> : promotions.length === 0 ? <div className="grid min-h-72 place-items-center text-sm text-slate-500">Chưa có khuyến mãi.</div> : (
              <div className="mt-5 space-y-3">{promotions.map((promotion) => { const active = isPromotionActive(promotion); return <article key={promotion.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-navy-900">{promotion.name}</p><span className="rounded-full bg-brand-50 px-2 py-1 text-[9.5px] font-bold text-brand-700">-{promotion.discountPercent}%</span><span className={`rounded-full px-2 py-1 text-[9.5px] font-semibold ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{active ? "Đang áp dụng" : "Không hoạt động"}</span></div><p className="mt-1 text-[11px] text-slate-500">{planMap.get(promotion.servicePlanId)?.name ?? "ServicePlan"}</p><p className="mt-2 text-[10.5px] text-slate-400">{new Date(promotion.startDate).toLocaleString("vi-VN")} → {new Date(promotion.endDate).toLocaleString("vi-VN")}</p>{promotion.description && <p className="mt-2 text-xs leading-5 text-slate-500">{promotion.description}</p>}</div><div className="flex gap-2"><ActionButton onClick={() => startEdit(promotion)}><Edit3 className="size-4" /></ActionButton><ActionButton danger onClick={() => void handleDelete(promotion)}><Trash2 className="size-4" /></ActionButton></div></div></article>; })}</div>
            )}
          </section>
        </div>
      </div>
    </AdminOnly>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-[11px] font-semibold text-slate-600">{label}</span>{children}</label>; }
function ActionButton({ children, danger = false, onClick }: { children: React.ReactNode; danger?: boolean; onClick: () => void }) { return <button type="button" onClick={onClick} className={`grid size-8 place-items-center rounded-lg border transition ${danger ? "border-red-100 text-red-500 hover:bg-red-50" : "border-slate-200 text-slate-500 hover:border-brand-200 hover:text-brand-600"}`}>{children}</button>; }
