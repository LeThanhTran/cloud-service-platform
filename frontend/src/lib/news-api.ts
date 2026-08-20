import { apiFetch, readProblemDetails } from "@/lib/api";
import type {
  NewsArticle,
  NewsArticleInput,
  NewsManagementQuery,
  NewsQuery,
  PagedResult,
} from "@/types/news";

async function readJson<T>(response: Response, fallback: string): Promise<T> {
  if (!response.ok) {
    const problem = await readProblemDetails(response);
    throw new Error(problem.detail ?? problem.title ?? fallback);
  }

  return (await response.json()) as T;
}

function buildPublicQuery(query: NewsQuery = {}) {
  const params = new URLSearchParams();

  if (query.search?.trim()) params.set("search", query.search.trim());
  if (query.category?.trim()) params.set("category", query.category.trim());
  if (query.sort) params.set("sort", query.sort);
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));

  const value = params.toString();
  return value ? `?${value}` : "";
}

function buildManagementQuery(query: NewsManagementQuery = {}) {
  const params = new URLSearchParams();

  if (query.search?.trim()) params.set("search", query.search.trim());
  if (query.category?.trim()) params.set("category", query.category.trim());
  if (typeof query.isPublished === "boolean") {
    params.set("isPublished", String(query.isPublished));
  }
  if (query.sort) params.set("sort", query.sort);
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));

  const value = params.toString();
  return value ? `?${value}` : "";
}

export async function getPublishedNews(query: NewsQuery = {}) {
  const response = await apiFetch(`/api/NewsArticles${buildPublicQuery(query)}`, {
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

export async function getNewsForManagement(query: NewsManagementQuery = {}) {
  const response = await apiFetch(
    `/api/NewsArticles/manage${buildManagementQuery(query)}`,
  );

  return readJson<PagedResult<NewsArticle>>(
    response,
    "Không thể tải danh sách bài viết quản trị.",
  );
}

export async function getNewsForManagementById(id: string) {
  const response = await apiFetch(`/api/NewsArticles/manage/${id}`);
  if (response.status === 404) return null;
  return readJson<NewsArticle>(response, "Không thể tải bài viết.");
}

export async function createNewsArticle(input: NewsArticleInput) {
  const response = await apiFetch("/api/NewsArticles", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return readJson<NewsArticle>(response, "Không thể tạo bài viết.");
}

export async function updateNewsArticle(id: string, input: NewsArticleInput) {
  const response = await apiFetch(`/api/NewsArticles/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const problem = await readProblemDetails(response);
    throw new Error(problem.detail ?? problem.title ?? "Không thể cập nhật bài viết.");
  }
}

export async function deleteNewsArticle(id: string) {
  const response = await apiFetch(`/api/NewsArticles/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const problem = await readProblemDetails(response);
    throw new Error(problem.detail ?? problem.title ?? "Không thể xóa bài viết.");
  }
}

export async function uploadNewsImage(file: File) {
  const form = new FormData();
  form.append("file", file);

  const response = await apiFetch("/api/NewsArticles/upload-image", {
    method: "POST",
    body: form,
  });

  const result = await readJson<{ url: string }>(
    response,
    "Không thể upload ảnh bài viết.",
  );

  return result.url;
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
