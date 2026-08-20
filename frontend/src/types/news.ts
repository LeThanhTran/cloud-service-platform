export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  thumbnailUrl: string | null;
  category: string;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface NewsQuery {
  search?: string;
  category?: string;
  sort?: "latest" | "oldest" | "title-asc" | "title-desc";
  page?: number;
  pageSize?: number;
}
