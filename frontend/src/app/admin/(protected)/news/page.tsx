"use client";

import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Edit3,
  ExternalLink,
  FileImage,
  ImagePlus,
  LoaderCircle,
  Newspaper,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  createNewsArticle,
  deleteNewsArticle,
  formatNewsDate,
  getNewsForManagement,
  updateNewsArticle,
  uploadNewsImage,
} from "@/lib/news-api";
import type {
  NewsArticle,
  NewsArticleInput,
  PagedResult,
} from "@/types/news";

const PAGE_SIZE = 8;

const emptyResult: PagedResult<NewsArticle> = {
  items: [],
  page: 1,
  pageSize: PAGE_SIZE,
  totalItems: 0,
  totalPages: 0,
};

const emptyForm: NewsArticleInput = {
  title: "",
  slug: "",
  summary: "",
  content: "",
  thumbnailUrl: null,
  category: "Tin tức",
  isPublished: false,
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminNewsPage() {
  const [result, setResult] = useState<PagedResult<NewsArticle>>(emptyResult);
  const [form, setForm] = useState<NewsArticleInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "published" | "draft">("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getNewsForManagement({
        search,
        isPublished:
          status === "all" ? undefined : status === "published",
        sort: "updated-desc",
        page,
        pageSize: PAGE_SIZE,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách bài viết.");
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const currentArticle = useMemo(
    () => result.items.find((item) => item.id === editingId) ?? null,
    [editingId, result.items],
  );

  function resetForm(clearMessages = true) {
    setEditingId(null);
    setForm(emptyForm);
    if (clearMessages) {
      setMessage(null);
      setError(null);
    }
  }

  function startEdit(article: NewsArticle) {
    setEditingId(article.id);
    setForm({
      title: article.title,
      slug: article.slug,
      summary: article.summary,
      content: article.content,
      thumbnailUrl: article.thumbnailUrl,
      category: article.category,
      isPublished: article.isPublished,
    });
    setMessage(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateTitle(value: string) {
    setForm((current) => ({
      ...current,
      title: value,
      slug:
        !editingId && (!current.slug || current.slug === slugify(current.title))
          ? slugify(value)
          : current.slug,
    }));
  }

  async function handleImage(file: File | undefined) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Hãy chọn file ảnh JPG, PNG hoặc WebP.");
      return;
    }

    setUploading(true);
    setError(null);
    setMessage(null);

    try {
      const url = await uploadNewsImage(file);
      setForm((current) => ({ ...current, thumbnailUrl: url }));
      setMessage("Upload ảnh đại diện thành công.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể upload ảnh.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      if (!form.title.trim()) throw new Error("Tiêu đề không được để trống.");
      if (!form.slug.trim()) throw new Error("Slug không được để trống.");
      if (!form.summary.trim()) throw new Error("Tóm tắt không được để trống.");
      if (!form.content.trim()) throw new Error("Nội dung không được để trống.");
      if (!form.category.trim()) throw new Error("Danh mục không được để trống.");

      const payload: NewsArticleInput = {
        title: form.title.trim(),
        slug: form.slug.trim().toLowerCase(),
        summary: form.summary.trim(),
        content: form.content.trim(),
        thumbnailUrl: form.thumbnailUrl?.trim() || null,
        category: form.category.trim(),
        isPublished: form.isPublished,
      };

      if (editingId) {
        await updateNewsArticle(editingId, payload);
        setMessage("Đã cập nhật bài viết.");
      } else {
        await createNewsArticle(payload);
        setMessage(payload.isPublished ? "Đã xuất bản bài viết mới." : "Đã lưu bài viết nháp.");
      }

      resetForm(false);
      setPage(1);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu bài viết.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(article: NewsArticle) {
    if (!window.confirm(`Xóa bài “${article.title}”?`)) return;

    setError(null);
    setMessage(null);

    try {
      await deleteNewsArticle(article.id);
      setMessage("Đã xóa bài viết.");
      if (editingId === article.id) resetForm(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xóa bài viết.");
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-600">
            Content Management
          </p>
          <h1 className="mt-1.5 text-[28px] font-semibold tracking-[-0.035em] text-navy-900">
            Tin tức
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Admin và Editor có thể tạo, biên tập, xuất bản và quản lý bài viết NovaCloud.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => resetForm()}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-600 px-3.5 text-xs font-semibold text-white transition hover:bg-brand-700"
          >
            <Plus className="size-4" /> Bài viết mới
          </button>
          <button
            type="button"
            onClick={() => void loadData()}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-600 transition hover:border-brand-200 hover:text-brand-600"
          >
            <RefreshCw className="size-4" /> Làm mới
          </button>
        </div>
      </div>

      {(message || error) && (
        <div
          className={`rounded-xl border px-4 py-3 text-xs ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {error ?? message}
        </div>
      )}

      <div className="grid gap-5 2xl:grid-cols-[455px_1fr]">
        <form
          onSubmit={handleSubmit}
          className="h-fit rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)]"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-navy-900">
                {editingId ? "Chỉnh sửa bài viết" : "Soạn bài viết mới"}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                {editingId && currentArticle
                  ? `Cập nhật: ${currentArticle.title}`
                  : "Có thể lưu nháp trước khi xuất bản."}
              </p>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={() => resetForm()}
                className="text-[11px] font-semibold text-brand-600"
              >
                Hủy sửa
              </button>
            )}
          </div>

          <div className="mt-5 space-y-4">
            <Field label="Tiêu đề">
              <input
                value={form.title}
                onChange={(event) => updateTitle(event.target.value)}
                placeholder="Ví dụ: Hướng dẫn bảo mật Cloud VPS"
                className="input-admin"
                maxLength={200}
              />
            </Field>

            <Field label="Slug">
              <div className="flex gap-2">
                <input
                  value={form.slug}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, slug: event.target.value }))
                  }
                  placeholder="huong-dan-bao-mat-cloud-vps"
                  className="input-admin"
                  maxLength={220}
                />
                <button
                  type="button"
                  onClick={() =>
                    setForm((current) => ({ ...current, slug: slugify(current.title) }))
                  }
                  className="shrink-0 rounded-xl border border-slate-200 px-3 text-[11px] font-semibold text-brand-600 hover:bg-brand-50"
                >
                  Tạo slug
                </button>
              </div>
            </Field>

            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">
              <Field label="Danh mục">
                <input
                  value={form.category}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, category: event.target.value }))
                  }
                  placeholder="Kiến thức"
                  className="input-admin"
                  maxLength={100}
                />
              </Field>

              <Field label="Trạng thái">
                <select
                  value={form.isPublished ? "published" : "draft"}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      isPublished: event.target.value === "published",
                    }))
                  }
                  className="input-admin"
                >
                  <option value="draft">Bản nháp</option>
                  <option value="published">Xuất bản</option>
                </select>
              </Field>
            </div>

            <Field label="Ảnh đại diện">
              <div className="overflow-hidden rounded-xl border border-dashed border-slate-200 bg-slate-50/70">
                {form.thumbnailUrl ? (
                  <div className="relative">
                    <img
                      src={form.thumbnailUrl}
                      alt="Ảnh đại diện bài viết"
                      className="aspect-[16/7] w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setForm((current) => ({ ...current, thumbnailUrl: null }))
                      }
                      className="absolute right-2 top-2 grid size-8 place-items-center rounded-lg bg-white/90 text-slate-600 shadow-sm hover:text-red-600"
                      aria-label="Xóa ảnh"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ) : (
                  <div className="grid min-h-32 place-items-center px-4 py-5 text-center">
                    <div>
                      <ImagePlus className="mx-auto size-7 text-brand-500" />
                      <p className="mt-2 text-[11px] text-slate-500">
                        JPG, PNG hoặc WebP · tối đa 5 MB
                      </p>
                    </div>
                  </div>
                )}
                <label className="flex cursor-pointer items-center justify-center gap-2 border-t border-slate-200 bg-white px-3 py-3 text-[11px] font-semibold text-brand-600 hover:bg-brand-50">
                  {uploading ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <UploadCloud className="size-4" />
                  )}
                  {uploading ? "Đang upload..." : "Chọn ảnh từ máy"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    disabled={uploading}
                    onChange={(event) => {
                      void handleImage(event.target.files?.[0]);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
              </div>
            </Field>

            <Field label="Tóm tắt">
              <textarea
                value={form.summary}
                onChange={(event) =>
                  setForm((current) => ({ ...current, summary: event.target.value }))
                }
                rows={3}
                maxLength={500}
                placeholder="Mô tả ngắn hiển thị ở danh sách tin tức..."
                className="input-admin min-h-24 resize-y py-3"
              />
            </Field>

            <Field label="Nội dung">
              <textarea
                value={form.content}
                onChange={(event) =>
                  setForm((current) => ({ ...current, content: event.target.value }))
                }
                rows={10}
                placeholder="Nhập nội dung bài viết. Xuống dòng để chia đoạn..."
                className="input-admin min-h-56 resize-y py-3 leading-6"
              />
            </Field>
          </div>

          <button
            type="submit"
            disabled={saving || uploading}
            className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 text-xs font-semibold text-white transition hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : form.isPublished ? (
              <CheckCircle2 className="size-4" />
            ) : (
              <Newspaper className="size-4" />
            )}
            {saving
              ? "Đang lưu..."
              : editingId
                ? "Lưu thay đổi"
                : form.isPublished
                  ? "Xuất bản bài viết"
                  : "Lưu bản nháp"}
          </button>
        </form>

        <section className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold text-navy-900">Danh sách bài viết</p>
              <p className="mt-1 text-[11px] text-slate-500">
                {result.totalItems} bài phù hợp bộ lọc hiện tại.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <form onSubmit={submitSearch} className="flex gap-2">
                <label className="flex h-10 min-w-0 items-center gap-2 rounded-xl border border-slate-200 px-3 sm:w-64">
                  <Search className="size-4 shrink-0 text-slate-400" />
                  <input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Tìm bài viết..."
                    className="min-w-0 flex-1 bg-transparent text-xs outline-none"
                  />
                </label>
                <button
                  type="submit"
                  className="h-10 rounded-xl border border-slate-200 px-3 text-[11px] font-semibold text-brand-600 hover:bg-brand-50"
                >
                  Tìm
                </button>
              </form>

              <select
                value={status}
                onChange={(event) => {
                  setPage(1);
                  setStatus(event.target.value as typeof status);
                }}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-600 outline-none"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="published">Đã xuất bản</option>
                <option value="draft">Bản nháp</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid min-h-72 place-items-center">
              <LoaderCircle className="size-6 animate-spin text-brand-600" />
            </div>
          ) : result.items.length === 0 ? (
            <div className="grid min-h-72 place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
              <div>
                <Newspaper className="mx-auto size-8 text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-600">Chưa có bài viết phù hợp</p>
                <p className="mt-1 text-xs text-slate-400">Thử đổi bộ lọc hoặc tạo bài viết mới.</p>
              </div>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {result.items.map((article) => (
                <article
                  key={article.id}
                  className="grid gap-4 rounded-xl border border-slate-200/80 p-3.5 transition hover:border-brand-100 hover:bg-brand-50/20 md:grid-cols-[112px_1fr_auto] md:items-center"
                >
                  <div className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                    {article.thumbnailUrl ? (
                      <img
                        src={article.thumbnailUrl}
                        alt=""
                        className="aspect-[16/10] h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid aspect-[16/10] place-items-center bg-brand-50 text-brand-500">
                        <FileImage className="size-5" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-1 text-[9px] font-semibold ${
                          article.isPublished
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                            : "bg-amber-50 text-amber-700 ring-1 ring-amber-100"
                        }`}
                      >
                        {article.isPublished ? "Đã xuất bản" : "Bản nháp"}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-600">
                        {article.category || "Tin tức"}
                      </span>
                    </div>
                    <h2 className="mt-2 truncate text-sm font-semibold text-navy-900">
                      {article.title}
                    </h2>
                    <p className="mt-1 line-clamp-1 text-[11px] text-slate-500">
                      {article.summary}
                    </p>
                    <p className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-400">
                      <CalendarDays className="size-3" />
                      {formatNewsDate(article.updatedAt ?? article.publishedAt ?? article.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 md:justify-end">
                    {article.isPublished && (
                      <Link
                        href={`/news/${article.slug}`}
                        target="_blank"
                        className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:border-brand-200 hover:text-brand-600"
                        title="Xem bài public"
                      >
                        <ExternalLink className="size-4" />
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => startEdit(article)}
                      className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:border-brand-200 hover:text-brand-600"
                      title="Chỉnh sửa"
                    >
                      <Edit3 className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(article)}
                      className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      title="Xóa"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {result.totalPages > 1 && (
            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-[11px] text-slate-500">
              <span>
                Trang {result.page}/{result.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  className="h-9 rounded-lg border border-slate-200 px-3 font-semibold disabled:opacity-35"
                >
                  Trước
                </button>
                <button
                  type="button"
                  disabled={page >= result.totalPages}
                  onClick={() => setPage((value) => value + 1)}
                  className="h-9 rounded-lg border border-slate-200 px-3 font-semibold disabled:opacity-35"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}
