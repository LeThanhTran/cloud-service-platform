"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Edit3,
  FolderTree,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { AdminOnly } from "@/components/admin/admin-only";
import {
  createServiceCategory,
  deleteServiceCategory,
  getServiceCategories,
  getServicePlans,
  updateServiceCategory,
} from "@/lib/service-api";
import type {
  ServiceCategory,
  ServicePlan,
  UpdateServiceCategoryInput,
} from "@/types/service";

const emptyForm: UpdateServiceCategoryInput = {
  name: "",
  description: "",
  slug: "",
  isActive: true,
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [form, setForm] = useState<UpdateServiceCategoryInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [categoryData, planData] = await Promise.all([
        getServiceCategories(),
        getServicePlans(),
      ]);
      setCategories(categoryData);
      setPlans(planData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh mục dịch vụ.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const planCountByCategory = useMemo(() => {
    const counts = new Map<string, number>();
    plans.forEach((plan) => counts.set(plan.serviceCategoryId, (counts.get(plan.serviceCategoryId) ?? 0) + 1));
    return counts;
  }, [plans]);

  const filteredCategories = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return categories;
    return categories.filter((category) =>
      [category.name, category.slug ?? "", category.description ?? ""]
        .some((value) => value.toLowerCase().includes(needle)),
    );
  }, [categories, query]);

  const activeCount = categories.filter((category) => category.isActive).length;
  const linkedPlanCount = categories.reduce(
    (sum, category) => sum + (planCountByCategory.get(category.id) ?? 0),
    0,
  );

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setSlugTouched(false);
    setMessage(null);
    setError(null);
  }

  function handleNameChange(value: string) {
    setForm((current) => ({
      ...current,
      name: value,
      slug: slugTouched ? current.slug : slugify(value),
    }));
  }

  function startEdit(category: ServiceCategory) {
    setEditingId(category.id);
    setSlugTouched(true);
    setForm({
      name: category.name,
      description: category.description ?? "",
      slug: category.slug ?? "",
      isActive: category.isActive,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const name = form.name.trim();
      const slug = form.slug?.trim() || slugify(name);

      if (!name) throw new Error("Tên danh mục không được để trống.");
      if (!slug) throw new Error("Slug danh mục không hợp lệ.");

      const duplicated = categories.some(
        (category) =>
          category.id !== editingId &&
          (category.name.trim().toLowerCase() === name.toLowerCase() ||
            (category.slug ?? "").trim().toLowerCase() === slug.toLowerCase()),
      );
      if (duplicated) throw new Error("Tên hoặc slug danh mục đã tồn tại.");

      if (editingId) {
        await updateServiceCategory(editingId, {
          name,
          description: form.description?.trim() || null,
          slug,
          isActive: form.isActive,
        });
        setMessage("Đã cập nhật danh mục dịch vụ.");
      } else {
        await createServiceCategory({
          name,
          description: form.description?.trim() || null,
          slug,
        });
        setMessage("Đã tạo danh mục dịch vụ mới.");
      }

      await loadData();
      setEditingId(null);
      setForm(emptyForm);
      setSlugTouched(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu danh mục.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category: ServiceCategory) {
    const linked = planCountByCategory.get(category.id) ?? 0;

    if (linked > 0) {
      setMessage(null);
      setError(
        `Danh mục “${category.name}” đang được ${linked} gói dịch vụ sử dụng. Hãy chuyển các gói sang danh mục khác hoặc tắt trạng thái thay vì xóa.`,
      );
      return;
    }

    if (!window.confirm(`Xóa danh mục “${category.name}”?`)) return;

    setMessage(null);
    setError(null);
    try {
      await deleteServiceCategory(category.id);
      setMessage(`Đã xóa ${category.name}.`);
      if (editingId === category.id) resetForm();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xóa danh mục.");
    }
  }

  return (
    <AdminOnly>
      <div className="space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-600">Category Management</p>
            <h1 className="mt-1.5 text-[28px] font-semibold tracking-[-0.035em] text-navy-900">Danh mục dịch vụ</h1>
            <p className="mt-1 text-sm text-slate-500">Quản lý ServiceCategory được sử dụng bởi các gói NovaCloud.</p>
          </div>
          <button
            type="button"
            onClick={() => void loadData()}
            className="inline-flex h-10 items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-600 transition hover:border-brand-200 hover:text-brand-600"
          >
            <RefreshCw className="size-4" /> Làm mới
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Tổng danh mục" value={categories.length} />
          <Stat label="Đang hoạt động" value={activeCount} />
          <Stat label="Gói đang liên kết" value={linkedPlanCount} />
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
                <p className="text-xs font-semibold text-navy-900">{editingId ? "Chỉnh sửa danh mục" : "Tạo danh mục mới"}</p>
                <p className="mt-1 text-[11px] text-slate-500">Slug được gợi ý tự động từ tên danh mục.</p>
              </div>
              {editingId && (
                <button type="button" onClick={resetForm} className="text-[11px] font-semibold text-brand-600">Hủy sửa</button>
              )}
            </div>

            <div className="mt-5 space-y-4">
              <Field label="Tên danh mục">
                <input
                  value={form.name}
                  onChange={(event) => handleNameChange(event.target.value)}
                  className="input-admin"
                  placeholder="Cloud VPS"
                  maxLength={100}
                  required
                />
              </Field>

              <Field label="Slug">
                <input
                  value={form.slug ?? ""}
                  onChange={(event) => {
                    setSlugTouched(true);
                    setForm((current) => ({ ...current, slug: event.target.value }));
                  }}
                  className="input-admin"
                  placeholder="cloud-vps"
                  maxLength={150}
                />
              </Field>

              <Field label="Mô tả">
                <textarea
                  value={form.description ?? ""}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  className="input-admin min-h-28 resize-y py-3"
                  placeholder="Mô tả ngắn về nhóm dịch vụ"
                  maxLength={500}
                />
              </Field>

              {editingId && (
                <label className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-[11px] font-medium text-slate-600">
                  <span>Đang hoạt động</span>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                    className="size-4 accent-blue-600"
                  />
                </label>
              )}
            </div>

            <button
              disabled={saving}
              className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-xs font-semibold text-white shadow-[0_10px_25px_rgba(11,99,246,0.2)] transition hover:bg-brand-700 disabled:opacity-60"
            >
              {saving ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {saving ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Tạo danh mục"}
            </button>
          </form>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold text-navy-900">Danh sách ServiceCategory</p>
                <p className="mt-1 text-[11px] text-slate-500">{categories.length} danh mục trong hệ thống.</p>
              </div>
              <label className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Tìm danh mục..."
                  className="input-admin pl-9"
                />
              </label>
            </div>

            {loading ? (
              <div className="grid min-h-72 place-items-center"><LoaderCircle className="size-5 animate-spin text-brand-600" /></div>
            ) : filteredCategories.length === 0 ? (
              <div className="grid min-h-72 place-items-center text-sm text-slate-500">Chưa có danh mục phù hợp.</div>
            ) : (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[700px] text-left">
                  <thead className="border-b border-slate-100 text-[10px] uppercase tracking-[0.07em] text-slate-400">
                    <tr>
                      <th className="pb-3 font-semibold">Danh mục</th>
                      <th className="pb-3 font-semibold">Slug</th>
                      <th className="pb-3 font-semibold">Gói</th>
                      <th className="pb-3 font-semibold">Trạng thái</th>
                      <th className="pb-3 text-right font-semibold">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCategories.map((category) => {
                      const linked = planCountByCategory.get(category.id) ?? 0;
                      return (
                        <tr key={category.id} className="text-xs text-slate-600">
                          <td className="py-4 pr-4">
                            <div className="flex items-start gap-3">
                              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                                <FolderTree className="size-4" />
                              </span>
                              <div>
                                <p className="font-semibold text-navy-900">{category.name}</p>
                                <p className="mt-1 max-w-[260px] truncate text-[10.5px] text-slate-400">
                                  {category.description || "Không có mô tả"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 pr-4 font-mono text-[11px] text-slate-500">{category.slug || "—"}</td>
                          <td className="py-4 pr-4">{linked}</td>
                          <td className="py-4 pr-4">
                            <span className={`rounded-full px-2 py-1 text-[9.5px] font-semibold ${category.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                              {category.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <IconButton title="Sửa" onClick={() => startEdit(category)}>
                                <Edit3 className="size-4" />
                              </IconButton>
                              <IconButton title={linked > 0 ? "Danh mục đang được sử dụng" : "Xóa"} danger onClick={() => void handleDelete(category)}>
                                <Trash2 className="size-4" />
                              </IconButton>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-[0_8px_28px_rgba(15,23,42,0.035)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-semibold text-navy-900">{value}</p>
    </div>
  );
}

function IconButton({
  children,
  title,
  danger = false,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`grid size-8 place-items-center rounded-lg border transition ${
        danger
          ? "border-red-100 text-red-500 hover:bg-red-50"
          : "border-slate-200 text-slate-500 hover:border-brand-200 hover:text-brand-600"
      }`}
    >
      {children}
    </button>
  );
}
