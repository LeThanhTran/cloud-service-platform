export interface CreateContactRequestInput {
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  subject: string;
  message: string;
}

export interface ContactRequest {
  id: string;
  referenceCode: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  updatedAt?: string | null;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export type ContactStatus = "New" | "Processing" | "Resolved";
export type ContactSort = "latest" | "oldest" | "status";

export interface ContactManagementQuery {
  search?: string;
  status?: string;
  sort?: ContactSort;
  page?: number;
  pageSize?: number;
}
