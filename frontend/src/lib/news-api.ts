import { apiFetch, readProblemDetails } from "@/lib/api";
import type { NewsArticle, NewsQuery, PagedResult } from "@/types/news";

async function readJson<T>(response: Response, fallback: string): Promise<T> {
  if (!response.ok) {
    const problem = await readProblemDetails(response);
    throw new Error(problem.detail ?? problem.title ?? fallback);
  }

  return (await response.json()) as T;
}

function buildQuery(query: NewsQuery = {}) {
  const params = new URLSearchParams();

  if (query.search?.trim()) params.set("search", query.search.trim());
  if (query.category?.trim()) params.set("category", query.category.trim());
  if (query.sort) params.set("sort", query.sort);
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));

  const value = params.toString();
  return value ? `?${value}` : "";
}

export async function getPublishedNews(query: NewsQuery = {}) {
  const response = await apiFetch(`/api/NewsArticles${buildQuery(query)}`, {
    auth: false,
  });

  return readJson<PagedResult<NewsArticle>>(
    response,
    "Không thể tải danh sách tin tức.",
  );
}

export async function getPublishedNewsBySlug(slug: string) {
  const response = await apiFetch(
    `/api/NewsArticles/slug/${encodeURIComponent(slug)}`,
    { auth: false },
  );

  if (response.status === 404) return null;

  return readJson<NewsArticle>(response, "Không thể tải bài viết.");
}

export async function getPublishedNewsCategories() {
  const response = await apiFetch("/api/NewsArticles/categories", {
    auth: false,
  });

  return readJson<string[]>(response, "Không thể tải danh mục tin tức.");
}

export function formatNewsDate(value: string | null | undefined) {
  if (!value) return "Chưa cập nhật";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa cập nhật";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}
