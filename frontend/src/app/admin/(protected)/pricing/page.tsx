"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Edit3, LoaderCircle, Plus, RefreshCw, Trash2 } from "lucide-react";
import { AdminOnly } from "@/components/admin/admin-only";
import {
  billingCycleLabel,
  createPlanPrice,
  deletePlanPrice,
  formatVnd,
  getPlanPrices,
  getServicePlans,
  updatePlanPrice,
} from "@/lib/service-api";
import type { PlanPrice, PlanPriceInput, ServicePlan } from "@/types/service";

async function fetchPricingAdminData() {
  return Promise.all([getPlanPrices(), getServicePlans()]);
}

const emptyForm: PlanPriceInput = {
  servicePlanId: "",
  billingCycle: "Monthly",
  price: 199000,
  isActive: true,
};

export default function AdminPricingPage() {
  const [prices, setPrices] = useState<PlanPrice[]>([]);
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [form, setForm] = useState<PlanPriceInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [priceData, planData] = await fetchPricingAdminData();
      setPrices(priceData);
      setPlans(planData);
      if (!form.servicePlanId && planData[0]) {
        setForm((current) => ({ ...current, servicePlanId: planData[0].id }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải bảng giá.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function initialLoad() {
      try {
        const [priceData, planData] = await fetchPricingAdminData();
        if (!active) return;
        setPrices(priceData);
        setPlans(planData);
        setForm((current) =>
          current.servicePlanId || !planData[0]
            ? current
            : { ...current, servicePlanId: planData[0].id },
        );
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Không thể tải bảng giá.");
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
    setEditingId(null);
    setForm({ ...emptyForm, servicePlanId: plans[0]?.id ?? "" });
  }

  function startEdit(price: PlanPrice) {
    setEditingId(price.id);
    setForm({
      servicePlanId: price.servicePlanId,
      billingCycle: price.billingCycle,
      price: price.price,
      isActive: price.isActive,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      if (!form.servicePlanId) throw new Error("Hãy chọn gói dịch vụ.");
      if (!form.billingCycle.trim()) throw new Error("Chu kỳ thanh toán không được để trống.");
      if (form.price <= 0) throw new Error("Giá phải lớn hơn 0.");

      if (editingId) {
        await updatePlanPrice(editingId, form);
        setMessage("Đã cập nhật bảng giá.");
      } else {
        await createPlanPrice(form);
        setMessage("Đã thêm mức giá mới.");
      }
      await loadData();
      setEditingId(null);
      setForm({ ...emptyForm, servicePlanId: plans[0]?.id ?? "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu bảng giá.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(price: PlanPrice) {
    const planName = planMap.get(price.servicePlanId)?.name ?? "gói dịch vụ";
    if (!window.confirm(`Xóa giá ${billingCycleLabel(price.billingCycle)} của ${planName}?`)) return;
    try {
      setError(null);
      setMessage(null);
      await deletePlanPrice(price.id);
      setMessage("Đã xóa mức giá.");
      await loadData();
      if (editingId === price.id) resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xóa bảng giá.");
    }
  }

  return (
    <AdminOnly>
      <div className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-600">Service Management</p><h1 className="mt-1.5 text-[28px] font-semibold tracking-[-0.035em] text-navy-900">Bảng giá</h1><p className="mt-1 text-sm text-slate-500">Quản lý PlanPrice theo chu kỳ thanh toán.</p></div>
          <button type="button" onClick={() => void loadData()} className="inline-flex h-10 items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-600 hover:border-brand-200 hover:text-brand-600"><RefreshCw className="size-4" /> Làm mới</button>
        </div>

        {(message || error) && <div className={`rounded-xl border px-4 py-3 text-xs ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{error ?? message}</div>}

        <div className="grid gap-5 xl:grid-cols-[390px_1fr]">
          <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between"><div><p className="text-xs font-semibold text-navy-900">{editingId ? "Chỉnh sửa mức giá" : "Thêm mức giá"}</p><p className="mt-1 text-[11px] text-slate-500">Gắn giá với một ServicePlan.</p></div>{editingId && <button type="button" onClick={resetForm} className="text-[11px] font-semibold text-brand-600">Hủy sửa</button>}</div>
            <div className="mt-5 space-y-4">
              <Field label="Gói dịch vụ"><select className="input-admin" value={form.servicePlanId} onChange={(e) => setForm({ ...form, servicePlanId: e.target.value })} required><option value="">Chọn gói</option>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</select></Field>
              <Field label="Chu kỳ"><select className="input-admin" value={form.billingCycle} onChange={(e) => setForm({ ...form, billingCycle: e.target.value })}><option value="Monthly">Monthly / Theo tháng</option><option value="Yearly">Yearly / Theo năm</option></select></Field>
              <Field label="Giá (VND)"><input type="number" min={1} step={1000} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="input-admin" required /></Field>
              <label className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-[11px] font-medium text-slate-600"><span>Đang hoạt động</span><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="size-4 accent-blue-600" /></label>
            </div>
            <button disabled={saving} className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-60">{saving ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />}{saving ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Thêm mức giá"}</button>
          </form>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)]">
            <div><p className="text-xs font-semibold text-navy-900">PlanPrice hiện có</p><p className="mt-1 text-[11px] text-slate-500">{prices.length} mức giá.</p></div>
            {loading ? <div className="grid min-h-72 place-items-center"><LoaderCircle className="size-5 animate-spin text-brand-600" /></div> : prices.length === 0 ? <div className="grid min-h-72 place-items-center text-sm text-slate-500">Chưa có bảng giá.</div> : (
              <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[650px] text-left"><thead className="border-b border-slate-100 text-[10px] uppercase tracking-[0.07em] text-slate-400"><tr><th className="pb-3">Gói</th><th className="pb-3">Chu kỳ</th><th className="pb-3">Giá</th><th className="pb-3">Trạng thái</th><th className="pb-3 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-slate-100">{prices.map((price) => <tr key={price.id} className="text-xs text-slate-600"><td className="py-4 pr-4 font-semibold text-navy-900">{planMap.get(price.servicePlanId)?.name ?? "ServicePlan"}</td><td className="py-4 pr-4">{billingCycleLabel(price.billingCycle)}</td><td className="py-4 pr-4 font-semibold text-brand-700">{formatVnd(price.price)}</td><td className="py-4 pr-4">{price.isActive ? <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9.5px] font-semibold text-emerald-700">Active</span> : <span className="rounded-full bg-slate-100 px-2 py-1 text-[9.5px] font-semibold text-slate-600">Inactive</span>}</td><td className="py-4 text-right"><div className="flex justify-end gap-2"><ActionButton onClick={() => startEdit(price)}><Edit3 className="size-4" /></ActionButton><ActionButton danger onClick={() => void handleDelete(price)}><Trash2 className="size-4" /></ActionButton></div></td></tr>)}</tbody></table></div>
            )}
          </section>
        </div>
      </div>
    </AdminOnly>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-[11px] font-semibold text-slate-600">{label}</span>{children}</label>; }
function ActionButton({ children, danger = false, onClick }: { children: React.ReactNode; danger?: boolean; onClick: () => void }) { return <button type="button" onClick={onClick} className={`grid size-8 place-items-center rounded-lg border transition ${danger ? "border-red-100 text-red-500 hover:bg-red-50" : "border-slate-200 text-slate-500 hover:border-brand-200 hover:text-brand-600"}`}>{children}</button>; }
