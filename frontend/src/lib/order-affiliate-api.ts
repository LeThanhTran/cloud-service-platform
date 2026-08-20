import { apiFetch, readProblemDetails } from "@/lib/api";
import type {
  AffiliateApplication,
  CreateAffiliateApplicationInput,
  CreateOrderRequestInput,
  ManagementQuery,
  OrderRequest,
  PagedResult,
  RequestStatus,
} from "@/types/order-affiliate";

async function readJson<T>(response: Response, fallbackMessage: string): Promise<T> {
  if (!response.ok) {
    const problem = await readProblemDetails(response);
    throw new Error(problem.detail ?? problem.title ?? fallbackMessage);
  }

  return (await response.json()) as T;
}

function buildManagementQuery(query: ManagementQuery) {
  const params = new URLSearchParams();

  if (query.search?.trim()) params.set("search", query.search.trim());
  if (query.status?.trim()) params.set("status", query.status.trim());
  if (query.sort) params.set("sort", query.sort);
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(query.pageSize ?? 10));

  return params.toString();
}

export async function createOrderRequest(payload: CreateOrderRequestInput) {
  const response = await apiFetch("/api/OrderRequests", {
    auth: false,
    method: "POST",
    body: JSON.stringify(payload),
  });

  return readJson<OrderRequest>(response, "Không thể gửi yêu cầu đăng ký dịch vụ.");
}

export async function createAffiliateApplication(payload: CreateAffiliateApplicationInput) {
  const response = await apiFetch("/api/AffiliateApplications", {
    auth: false,
    method: "POST",
    body: JSON.stringify(payload),
  });

  return readJson<AffiliateApplication>(response, "Không thể gửi hồ sơ Affiliate.");
}

export async function getOrderRequestsForManagement(query: ManagementQuery = {}) {
  const response = await apiFetch(`/api/OrderRequests/manage?${buildManagementQuery(query)}`);
  return readJson<PagedResult<OrderRequest>>(response, "Không thể tải danh sách yêu cầu dịch vụ.");
}

export async function getOrderRequestForManagement(id: string) {
  const response = await apiFetch(`/api/OrderRequests/manage/${id}`);
  return readJson<OrderRequest>(response, "Không thể tải chi tiết yêu cầu dịch vụ.");
}

export async function updateOrderRequestStatus(id: string, status: RequestStatus) {
  const response = await apiFetch(`/api/OrderRequests/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return readJson<OrderRequest>(response, "Không thể cập nhật trạng thái yêu cầu dịch vụ.");
}

export async function getAffiliateApplicationsForManagement(query: ManagementQuery = {}) {
  const response = await apiFetch(`/api/AffiliateApplications/manage?${buildManagementQuery(query)}`);
  return readJson<PagedResult<AffiliateApplication>>(response, "Không thể tải danh sách hồ sơ Affiliate.");
}

export async function getAffiliateApplicationForManagement(id: string) {
  const response = await apiFetch(`/api/AffiliateApplications/manage/${id}`);
  return readJson<AffiliateApplication>(response, "Không thể tải chi tiết hồ sơ Affiliate.");
}

export async function updateAffiliateApplicationStatus(id: string, status: RequestStatus) {
  const response = await apiFetch(`/api/AffiliateApplications/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return readJson<AffiliateApplication>(response, "Không thể cập nhật trạng thái hồ sơ Affiliate.");
}
