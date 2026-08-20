"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Clock3,
  FileQuestion,
  Newspaper,
  Tag,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { formatNewsDate, getPublishedNewsBySlug } from "@/lib/news-api";
import type { NewsArticle } from "@/types/news";

export default function NewsDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;
    setLoading(true);
    setError("");
    setNotFound(false);

    getPublishedNewsBySlug(slug)
      .then((data) => {
        if (cancelled) return;
        if (!data) {
          setNotFound(true);
          return;
        }
        setArticle(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Không thể tải bài viết.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const readingMinutes = useMemo(() => {
    if (!article?.content) return 1;
    const words = article.content.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 220));
  }, [article]);

  return (
    <div className="min-h-screen">
      <Navbar />

      <main>
        {loading && <ArticleLoading />}

        {!loading && (notFound || error) && (
          <Container className="py-20">
            <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <FileQuestion className="mx-auto size-11 text-brand-500" />
              <h1 className="mt-4 text-2xl font-semibold text-navy-900">
                {notFound ? "Không tìm thấy bài viết" : "Không thể tải bài viết"}
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted">
                {notFound
                  ? "Bài viết có thể chưa được xuất bản, đã bị xóa hoặc đường dẫn không còn tồn tại."
                  : error}
              </p>
              <Link
                href="/news"
                className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                <ArrowLeft className="size-4" /> Quay lại tin tức
              </Link>
            </div>
          </Container>
        )}

        {!loading && article && (
          <>
            <section className="relative overflow-hidden border-b border-slate-200/70 bg-white/72 py-10 sm:py-14">
              <div className="soft-grid pointer-events-none absolute inset-0 opacity-35" />
              <div className="pointer-events-none absolute right-[6%] top-[-35%] size-[390px] rounded-full bg-brand-100/55 blur-3xl" />

              <Container className="relative">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  <Link href="/" className="transition hover:text-brand-600">Trang chủ</Link>
                  <ChevronRight className="size-3.5" />
                  <Link href="/news" className="transition hover:text-brand-600">Tin tức</Link>
                  <ChevronRight className="size-3.5" />
                  <span className="max-w-[280px] truncate text-slate-500">{article.title}</span>
                </div>

                <div className="mt-8 max-w-4xl">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-3 py-1.5 text-[11px] font-semibold text-brand-700">
                    <Tag className="size-3.5" /> {article.category || "Tin tức"}
                  </span>
                  <h1 className="mt-4 text-3xl font-semibold leading-[1.16] tracking-[-0.04em] text-navy-900 sm:text-4xl lg:text-[46px]">
                    {article.title}
                  </h1>
                  {article.summary && (
                    <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                      {article.summary}
                    </p>
                  )}
                  <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays className="size-4 text-brand-600" />
                      {formatNewsDate(article.publishedAt ?? article.createdAt)}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Clock3 className="size-4 text-brand-600" />
                      Khoảng {readingMinutes} phút đọc
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <Newspaper className="size-4 text-brand-600" /> NovaCloud Editorial
                    </span>
                  </div>
                </div>
              </Container>
            </section>

            <section className="py-10 sm:py-14">
              <Container>
                <div className="mx-auto max-w-[860px]">
                  {article.thumbnailUrl ? (
                    <div className="mb-9 overflow-hidden rounded-2xl border border-slate-200 bg-surface shadow-[0_14px_42px_rgba(15,23,42,0.055)]">
                      <img src={article.thumbnailUrl} alt="" className="aspect-[16/8.5] w-full object-cover" />
                    </div>
                  ) : (
                    <div className="soft-grid relative mb-9 grid aspect-[16/7] place-items-center overflow-hidden rounded-2xl border border-brand-100 bg-[linear-gradient(135deg,#eef6ff_0%,#f8fbff_62%,#e7f2ff_100%)]">
                      <div className="grid size-16 place-items-center rounded-2xl border border-white/90 bg-white/85 text-brand-600 shadow-sm backdrop-blur">
                        <Newspaper className="size-7" />
                      </div>
                    </div>
                  )}

                  <article className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_14px_42px_rgba(15,23,42,0.045)] sm:p-9">
                    <div className="news-content whitespace-pre-line text-[15px] leading-8 text-slate-700 sm:text-base">
                      {article.content}
                    </div>
                  </article>

                  <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-brand-100 bg-brand-50/65 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-600">NovaCloud Insights</p>
                      <p className="mt-1 text-sm text-slate-600">Khám phá thêm các bài viết và hướng dẫn Cloud mới nhất.</p>
                    </div>
                    <Link
                      href="/news"
                      className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 text-xs font-semibold text-white transition hover:bg-navy-800"
                    >
                      <ArrowLeft className="size-3.5" /> Tất cả bài viết
                    </Link>
                  </div>
                </div>
              </Container>
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

function ArticleLoading() {
  return (
    <>
      <section className="border-b border-slate-200 bg-white/70 py-14">
        <Container>
          <div className="max-w-4xl space-y-4">
            <div className="h-4 w-48 animate-pulse rounded bg-slate-100" />
            <div className="h-9 w-full max-w-3xl animate-pulse rounded bg-slate-100" />
            <div className="h-9 w-2/3 animate-pulse rounded bg-slate-100" />
            <div className="h-5 w-1/2 animate-pulse rounded bg-slate-50" />
          </div>
        </Container>
      </section>
      <Container className="py-10">
        <div className="mx-auto max-w-[860px] space-y-5">
          <div className="aspect-[16/7] animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        </div>
      </Container>
    </>
  );
}
