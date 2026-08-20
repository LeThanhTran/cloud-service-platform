"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Edit3, LoaderCircle, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { AdminOnly } from "@/components/admin/admin-only";
import {
  createServicePlan,
  deleteServicePlan,
  getServiceCategories,
  getServicePlans,
  updateServicePlan,
} from "@/lib/service-api";
import type { ServiceCategory, ServicePlan, ServicePlanInput } from "@/types/service";

async function fetchServiceAdminData() {
  return Promise.all([getServicePlans(), getServiceCategories()]);
}

const emptyForm: ServicePlanInput = {
  name: "",
  description: "",
  cpuCores: 2,
  ramGB: 4,
  storageGB: 80,
  bandwidthGB: 1000,
  isFeatured: false,
  isActive: true,
  serviceCategoryId: "",
};

export default function AdminServicesPage() {
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [form, setForm] = useState<ServicePlanInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [planData, categoryData] = await fetchServiceAdminData();
      setPlans(planData);
      setCategories(categoryData);
      if (!form.serviceCategoryId && categoryData[0]) {
        setForm((current) => ({ ...current, serviceCategoryId: categoryData[0].id }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải dữ liệu gói dịch vụ.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function initialLoad() {
      try {
        const [planData, categoryData] = await fetchServiceAdminData();
        if (!active) return;
        setPlans(planData);
        setCategories(categoryData);
        setForm((current) =>
          current.serviceCategoryId || !categoryData[0]
            ? current
            : { ...current, serviceCategoryId: categoryData[0].id },
        );
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Không thể tải dữ liệu gói dịch vụ.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void initialLoad();
    return () => {
      active = false;
    };
  }, []);

  const filteredPlans = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return plans;
    return plans.filter((plan) =>
      [plan.name, plan.description ?? ""].some((value) => value.toLowerCase().includes(needle)),
    );
  }, [plans, query]);

  function resetForm() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      serviceCategoryId: categories[0]?.id ?? "",
    });
    setMessage(null);
    setError(null);
  }

  function startEdit(plan: ServicePlan) {
    setEditingId(plan.id);
    setForm({
      name: plan.name,
      description: plan.description ?? "",
      cpuCores: plan.cpuCores,
      ramGB: plan.ramGB,
      storageGB: plan.storageGB,
      bandwidthGB: plan.bandwidthGB,
      isFeatured: plan.isFeatured,
      isActive: plan.isActive,
      serviceCategoryId: plan.serviceCategoryId,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      if (!form.name.trim()) throw new Error("Tên gói dịch vụ không được để trống.");
      if (!form.serviceCategoryId) throw new Error("Hãy chọn danh mục dịch vụ.");
      if ([form.cpuCores, form.ramGB, form.storageGB, form.bandwidthGB].some((value) => value < 0)) {
        throw new Error("Thông số cấu hình không được nhỏ hơn 0.");
      }

      const payload = {
        ...form,
        name: form.name.trim(),
        description: form.description?.trim() || null,
      };

      if (editingId) {
        await updateServicePlan(editingId, payload);
        setMessage("Đã cập nhật gói dịch vụ.");
      } else {
        await createServicePlan(payload);
        setMessage("Đã tạo gói dịch vụ mới.");
      }

      await loadData();
      setEditingId(null);
      setForm({ ...emptyForm, serviceCategoryId: categories[0]?.id ?? "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu gói dịch vụ.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(plan: ServicePlan) {
    if (!window.confirm(`Xóa gói “${plan.name}”?`)) return;
    setError(null);
    setMessage(null);
    try {
      await deleteServicePlan(plan.id);
      setMessage(`Đã xóa ${plan.name}.`);
      await loadData();
      if (editingId === plan.id) resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xóa gói dịch vụ.");
    }
  }

  const categoryName = (id: string) => categories.find((item) => item.id === id)?.name ?? "—";

  return (
    <AdminOnly>
      <div className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-600">Service Management</p>
            <h1 className="mt-1.5 text-[28px] font-semibold tracking-[-0.035em] text-navy-900">Gói dịch vụ</h1>
            <p className="mt-1 text-sm text-slate-500">Quản lý ServicePlan và cấu hình tài nguyên NovaCloud.</p>
          </div>
          <button
            type="button"
            onClick={() => void loadData()}
            className="inline-flex h-10 items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-600 transition hover:border-brand-200 hover:text-brand-600"
          >
            <RefreshCw className="size-4" /> Làm mới
          </button>
        </div>

        {(message || error) && (
          <div className={`rounded-xl border px-4 py-3 text-xs ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
            {error ?? message}
          </div>
        )}

        <div className="grid gap-5 xl:grid-cols-[390px_1fr]">
          <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-navy-900">{editingId ? "Chỉnh sửa gói" : "Tạo gói mới"}</p>
                <p className="mt-1 text-[11px] text-slate-500">Thông tin kỹ thuật của ServicePlan.</p>
              </div>
              {editingId && (
                <button type="button" onClick={resetForm} className="text-[11px] font-semibold text-brand-600">Hủy sửa</button>
              )}
            </div>

            <div className="mt-5 space-y-4">
              <Field label="Tên gói">
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-admin" placeholder="VPS Pro" required />
              </Field>
              <Field label="Danh mục">
                <select value={form.serviceCategoryId} onChange={(e) => setForm({ ...form, serviceCategoryId: e.target.value })} className="input-admin" required>
                  <option value="">Chọn danh mục</option>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </Field>
              <Field label="Mô tả">
                <textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-admin min-h-24 resize-y py-3" placeholder="Mô tả ngắn về gói dịch vụ" />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <NumberField label="CPU (vCPU)" value={form.cpuCores} onChange={(value) => setForm({ ...form, cpuCores: value })} />
                <NumberField label="RAM (GB)" value={form.ramGB} onChange={(value) => setForm({ ...form, ramGB: value })} />
                <NumberField label="Storage (GB)" value={form.storageGB} onChange={(value) => setForm({ ...form, storageGB: value })} />
                <NumberField label="Bandwidth (GB)" value={form.bandwidthGB} onChange={(value) => setForm({ ...form, bandwidthGB: value })} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Toggle label="Nổi bật" checked={form.isFeatured} onChange={(value) => setForm({ ...form, isFeatured: value })} />
                <Toggle label="Đang hoạt động" checked={form.isActive} onChange={(value) => setForm({ ...form, isActive: value })} />
              </div>
            </div>

            <button disabled={saving} className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-xs font-semibold text-white shadow-[0_10px_25px_rgba(11,99,246,0.2)] transition hover:bg-brand-700 disabled:opacity-60">
              {saving ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {saving ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Tạo gói dịch vụ"}
            </button>
          </form>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold text-navy-900">Danh sách ServicePlan</p>
                <p className="mt-1 text-[11px] text-slate-500">{plans.length} gói dịch vụ trong hệ thống.</p>
              </div>
              <label className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm gói dịch vụ..." className="input-admin pl-9" />
              </label>
            </div>

            {loading ? (
              <div className="grid min-h-72 place-items-center text-sm text-slate-500"><LoaderCircle className="size-5 animate-spin text-brand-600" /></div>
            ) : filteredPlans.length === 0 ? (
              <div className="grid min-h-72 place-items-center text-center text-sm text-slate-500">Chưa có gói dịch vụ phù hợp.</div>
            ) : (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead className="border-b border-slate-100 text-[10px] uppercase tracking-[0.07em] text-slate-400">
                    <tr><th className="pb-3 font-semibold">Gói</th><th className="pb-3 font-semibold">Danh mục</th><th className="pb-3 font-semibold">Cấu hình</th><th className="pb-3 font-semibold">Trạng thái</th><th className="pb-3 text-right font-semibold">Thao tác</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPlans.map((plan) => (
                      <tr key={plan.id} className="text-xs text-slate-600">
                        <td className="py-4 pr-4"><p className="font-semibold text-navy-900">{plan.name}</p><p className="mt-1 max-w-[260px] truncate text-[10.5px] text-slate-400">{plan.description || "Không có mô tả"}</p></td>
                        <td className="py-4 pr-4">{categoryName(plan.serviceCategoryId)}</td>
                        <td className="py-4 pr-4"><span className="text-[11px]">{plan.cpuCores} CPU · {plan.ramGB} GB RAM · {plan.storageGB} GB SSD</span></td>
                        <td className="py-4 pr-4"><div className="flex flex-wrap gap-1.5">{plan.isActive ? <Badge tone="green">Active</Badge> : <Badge tone="gray">Inactive</Badge>}{plan.isFeatured && <Badge tone="blue">Featured</Badge>}</div></td>
                        <td className="py-4 text-right"><div className="flex justify-end gap-2"><IconButton title="Sửa" onClick={() => startEdit(plan)}><Edit3 className="size-4" /></IconButton><IconButton title="Xóa" danger onClick={() => void handleDelete(plan)}><Trash2 className="size-4" /></IconButton></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </AdminOnly>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-[11px] font-semibold text-slate-600">{label}</span>{children}</label>;
}
function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <Field label={label}><input type="number" min={0} value={value} onChange={(e) => onChange(Number(e.target.value))} className="input-admin" required /></Field>;
}
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-[11px] font-medium text-slate-600"><span>{label}</span><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-blue-600" /></label>;
}
function Badge({ children, tone }: { children: React.ReactNode; tone: "green" | "gray" | "blue" }) {
  const classes = tone === "green" ? "bg-emerald-50 text-emerald-700" : tone === "blue" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600";
  return <span className={`rounded-full px-2 py-1 text-[9.5px] font-semibold ${classes}`}>{children}</span>;
}
function IconButton({ children, title, danger = false, onClick }: { children: React.ReactNode; title: string; danger?: boolean; onClick: () => void }) {
  return <button type="button" title={title} onClick={onClick} className={`grid size-8 place-items-center rounded-lg border transition ${danger ? "border-red-100 text-red-500 hover:bg-red-50" : "border-slate-200 text-slate-500 hover:border-brand-200 hover:text-brand-600"}`}>{children}</button>;
}
