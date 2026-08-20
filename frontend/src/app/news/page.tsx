"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  Newspaper,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import {
  formatNewsDate,
  getPublishedNews,
  getPublishedNewsCategories,
} from "@/lib/news-api";
import type { NewsArticle, PagedResult } from "@/types/news";

const PAGE_SIZE = 6;

const emptyResult: PagedResult<NewsArticle> = {
  items: [],
  page: 1,
  pageSize: PAGE_SIZE,
  totalItems: 0,
  totalPages: 0,
};

export default function NewsPage() {
  const [result, setResult] = useState<PagedResult<NewsArticle>>(emptyResult);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<"latest" | "oldest" | "title-asc" | "title-desc">("latest");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNews = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getPublishedNews({
        search,
        category,
        sort,
        page,
        pageSize: PAGE_SIZE,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải tin tức.");
    } finally {
      setLoading(false);
    }
  }, [category, page, search, sort]);

  useEffect(() => {
    void loadNews();
  }, [loadNews]);

  useEffect(() => {
    let cancelled = false;

    getPublishedNewsCategories()
      .then((data) => {
        if (!cancelled) setCategories(data);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function chooseCategory(value: string) {
    setPage(1);
    setCategory(value);
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main>
        <section className="relative overflow-hidden border-b border-slate-200/70 bg-white/70 py-14 sm:py-18">
          <div className="soft-grid pointer-events-none absolute inset-0 opacity-40" />
          <div className="pointer-events-none absolute right-[8%] top-[-55%] size-[440px] rounded-full bg-brand-100/55 blur-3xl" />
          <div className="pointer-events-none absolute left-[14%] top-[50%] size-56 rounded-full bg-sky-100/45 blur-3xl" />

          <Container className="relative">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-700 shadow-sm">
                <Newspaper className="size-3.5" /> NovaCloud Insights
              </div>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.045em] text-navy-900 sm:text-5xl">
                Tin tức & kiến thức Cloud
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
                Cập nhật xu hướng công nghệ, hướng dẫn vận hành và thông tin mới nhất từ hệ sinh thái NovaCloud.
              </p>
            </div>
          </Container>
        </section>

        <section className="py-10 sm:py-14">
          <Container>
            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-[0_12px_38px_rgba(15,23,42,0.055)]">
              <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                <form onSubmit={submitSearch} className="flex min-w-0 items-center gap-2">
                  <label className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-xl border border-line bg-surface/70 px-4">
                    <Search className="size-4 shrink-0 text-muted" />
                    <input
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                      placeholder="Tìm bài viết về VPS, Hosting, bảo mật..."
                      className="min-w-0 flex-1 bg-transparent text-sm text-navy-900 outline-none placeholder:text-slate-400"
                    />
                  </label>
                  <button
                    type="submit"
                    className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-brand-600 px-5 text-xs font-semibold text-white transition hover:bg-brand-700"
                  >
                    Tìm kiếm
                  </button>
                </form>

                <label className="flex h-11 items-center gap-2 rounded-xl border border-line bg-white px-3 text-xs text-slate-600">
                  <SlidersHorizontal className="size-4 text-brand-600" />
                  <select
                    value={sort}
                    onChange={(event) => {
                      setPage(1);
                      setSort(event.target.value as typeof sort);
                    }}
                    className="bg-transparent pr-2 outline-none"
                    aria-label="Sắp xếp bài viết"
                  >
                    <option value="latest">Mới nhất</option>
                    <option value="oldest">Cũ nhất</option>
                    <option value="title-asc">Tiêu đề A-Z</option>
                    <option value="title-desc">Tiêu đề Z-A</option>
                  </select>
                </label>
              </div>

              <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => chooseCategory("")}
                  className={`h-9 shrink-0 rounded-xl px-4 text-xs font-semibold transition ${
                    category === ""
                      ? "bg-navy-900 text-white"
                      : "border border-line bg-white text-slate-600 hover:border-brand-200 hover:text-brand-600"
                  }`}
                >
                  Tất cả
                </button>

                {categories.map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => chooseCategory(item)}
                    className={`h-9 shrink-0 rounded-xl px-4 text-xs font-semibold transition ${
                      category === item
                        ? "bg-navy-900 text-white"
                        : "border border-line bg-white text-slate-600 hover:border-brand-200 hover:text-brand-600"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {!loading && !error && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                <p>
                  Tìm thấy <span className="font-semibold text-navy-900">{result.totalItems}</span> bài viết
                  {search ? <> cho “<span className="font-semibold text-navy-900">{search}</span>”</> : null}
                </p>
                {category && <p>Danh mục: <span className="font-semibold text-brand-600">{category}</span></p>}
              </div>
            )}

            {loading && <NewsSkeleton />}

            {!loading && error && (
              <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-700">
                <p className="font-semibold">Không thể tải tin tức</p>
                <p className="mt-1 text-red-600">{error}</p>
              </div>
            )}

            {!loading && !error && result.items.length === 0 && (
              <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <FileText className="mx-auto size-10 text-brand-500" />
                <h2 className="mt-4 text-lg font-semibold text-navy-900">Chưa có bài viết phù hợp</h2>
                <p className="mt-2 text-sm text-muted">Thử từ khóa khác hoặc chuyển sang danh mục khác.</p>
              </div>
            )}

            {!loading && !error && result.items.length > 0 && (
              <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {result.items.map((article) => (
                  <NewsCard key={article.id} article={article} />
                ))}
              </div>
            )}

            {!loading && !error && result.totalPages > 1 && (
              <Pagination
                page={result.page}
                totalPages={result.totalPages}
                onChange={(value) => {
                  setPage(value);
                  window.scrollTo({ top: 270, behavior: "smooth" });
                }}
              />
            )}
          </Container>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function NewsCard({ article }: { article: NewsArticle }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_14px_42px_rgba(15,23,42,0.055)] transition duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_18px_48px_rgba(15,23,42,0.09)]">
      <Link href={`/news/${article.slug}`} className="block">
        <div className="relative aspect-[16/9] overflow-hidden bg-[linear-gradient(135deg,#eef6ff_0%,#dcecff_58%,#f7faff_100%)]">
          {article.thumbnailUrl ? (
            <img
              src={article.thumbnailUrl}
              alt=""
              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.025]"
            />
          ) : (
            <div className="soft-grid absolute inset-0 grid place-items-center">
              <span className="grid size-14 place-items-center rounded-2xl border border-white/90 bg-white/80 text-brand-600 shadow-sm backdrop-blur">
                <Newspaper className="size-6" />
              </span>
            </div>
          )}
          <span className="absolute left-4 top-4 rounded-full border border-white/80 bg-white/90 px-3 py-1 text-[10px] font-semibold text-brand-700 shadow-sm backdrop-blur">
            {article.category || "Tin tức"}
          </span>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-2 text-[11px] text-muted">
            <CalendarDays className="size-3.5" />
            {formatNewsDate(article.publishedAt ?? article.createdAt)}
          </div>
          <h2 className="mt-3 line-clamp-2 text-[18px] font-semibold leading-6 tracking-[-0.02em] text-navy-900 transition group-hover:text-brand-600">
            {article.title}
          </h2>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">
            {article.summary || "Đọc bài viết để xem nội dung chi tiết từ NovaCloud."}
          </p>
          <span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-brand-600">
            Đọc bài viết <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
    </article>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (value) => value === 1 || value === totalPages || Math.abs(value - page) <= 1,
  );

  return (
    <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Phân trang tin tức">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="grid size-10 place-items-center rounded-xl border border-line bg-white text-slate-600 transition hover:border-brand-200 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-35"
        aria-label="Trang trước"
      >
        <ChevronLeft className="size-4" />
      </button>

      {pages.map((value, index) => {
        const previous = pages[index - 1];
        return (
          <span key={value} className="contents">
            {previous && value - previous > 1 && <span className="px-1 text-xs text-muted">…</span>}
            <button
              type="button"
              onClick={() => onChange(value)}
              className={`size-10 rounded-xl text-xs font-semibold transition ${
                value === page
                  ? "bg-navy-900 text-white"
                  : "border border-line bg-white text-slate-600 hover:border-brand-200 hover:text-brand-600"
              }`}
              aria-current={value === page ? "page" : undefined}
            >
              {value}
            </button>
          </span>
        );
      })}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="grid size-10 place-items-center rounded-xl border border-line bg-white text-slate-600 transition hover:border-brand-200 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-35"
        aria-label="Trang sau"
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}

function NewsSkeleton() {
  return (
    <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((item) => (
        <div key={item} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="aspect-[16/9] animate-pulse bg-slate-100" />
          <div className="space-y-3 p-5">
            <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
            <div className="h-5 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-slate-100" />
            <div className="h-14 animate-pulse rounded bg-slate-50" />
          </div>
        </div>
      ))}
    </div>
  );
}
