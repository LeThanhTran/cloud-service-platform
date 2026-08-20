"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Newspaper } from "lucide-react";
import { useEffect, useState } from "react";
import { Container } from "@/components/ui/container";
import { formatNewsDate, getPublishedNews } from "@/lib/news-api";
import type { NewsArticle } from "@/types/news";

export function NewsPreview() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getPublishedNews({ page: 1, pageSize: 3, sort: "latest" })
      .then((data) => {
        if (!cancelled) setArticles(data.items);
      })
      .catch(() => {
        if (!cancelled) setArticles([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!loading && articles.length === 0) return null;

  return (
    <section className="py-14 sm:py-18">
      <Container>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">NovaCloud Insights</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-navy-900">Tin tức & kiến thức mới</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Bài viết kỹ thuật, hướng dẫn và cập nhật mới nhất từ hệ sinh thái NovaCloud.</p>
          </div>
          <Link href="/news" className="inline-flex items-center gap-2 text-xs font-semibold text-brand-600 transition hover:text-brand-700">
            Xem tất cả tin tức <ArrowRight className="size-4" />
          </Link>
        </div>

        {loading ? (
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="aspect-[16/8] animate-pulse bg-slate-100" />
                <div className="space-y-3 p-5">
                  <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
                  <div className="h-5 animate-pulse rounded bg-slate-100" />
                  <div className="h-12 animate-pulse rounded bg-slate-50" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/news/${article.slug}`}
                className="group overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.045)] transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_16px_44px_rgba(15,23,42,0.08)]"
              >
                <div className="relative aspect-[16/8] overflow-hidden bg-[linear-gradient(135deg,#eef6ff,#d9eaff_55%,#f8fbff)]">
                  {article.thumbnailUrl ? (
                    <img src={article.thumbnailUrl} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
                  ) : (
                    <div className="soft-grid absolute inset-0 grid place-items-center">
                      <span className="grid size-12 place-items-center rounded-xl border border-white/90 bg-white/80 text-brand-600 shadow-sm">
                        <Newspaper className="size-5" />
                      </span>
                    </div>
                  )}
                  <span className="absolute left-4 top-4 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-brand-700 shadow-sm">{article.category || "Tin tức"}</span>
                </div>
                <div className="p-5">
                  <p className="flex items-center gap-2 text-[11px] text-muted"><CalendarDays className="size-3.5" /> {formatNewsDate(article.publishedAt ?? article.createdAt)}</p>
                  <h3 className="mt-3 line-clamp-2 text-base font-semibold leading-6 text-navy-900 transition group-hover:text-brand-600">{article.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{article.summary}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-brand-600">Đọc thêm <ArrowRight className="size-3.5" /></span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
