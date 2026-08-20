import { apiFetch, readProblemDetails } from "@/lib/api";
import type {
  ContactManagementQuery,
  ContactRequest,
  ContactStatus,
  CreateContactRequestInput,
  PagedResult,
} from "@/types/contact";

async function readJson<T>(response: Response, fallbackMessage: string): Promise<T> {
  if (!response.ok) {
    const problem = await readProblemDetails(response);
    throw new Error(problem.detail ?? problem.title ?? fallbackMessage);
  }

  return (await response.json()) as T;
}

function buildManagementQuery(query: ContactManagementQuery) {
  const params = new URLSearchParams();

  if (query.search?.trim()) params.set("search", query.search.trim());
  if (query.status?.trim()) params.set("status", query.status.trim());
  if (query.sort) params.set("sort", query.sort);
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(query.pageSize ?? 10));

  return params.toString();
}

export async function createContactRequest(payload: CreateContactRequestInput) {
  const response = await apiFetch("/api/ContactRequests", {
    auth: false,
    method: "POST",
    body: JSON.stringify(payload),
  });

  return readJson<ContactRequest>(response, "Không thể gửi yêu cầu liên hệ.");
}

export async function getContactRequestsForManagement(
  query: ContactManagementQuery = {},
) {
  const response = await apiFetch(
    `/api/ContactRequests/manage?${buildManagementQuery(query)}`,
  );

  return readJson<PagedResult<ContactRequest>>(
    response,
    "Không thể tải danh sách liên hệ.",
  );
}

export async function getContactRequestForManagement(id: string) {
  const response = await apiFetch(`/api/ContactRequests/manage/${id}`);

  return readJson<ContactRequest>(
    response,
    "Không thể tải chi tiết yêu cầu liên hệ.",
  );
}

export async function updateContactRequestStatus(
  id: string,
  status: ContactStatus,
) {
  const response = await apiFetch(`/api/ContactRequests/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

  return readJson<ContactRequest>(
    response,
    "Không thể cập nhật trạng thái liên hệ.",
  );
}
