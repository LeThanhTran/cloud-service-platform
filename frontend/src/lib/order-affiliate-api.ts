import { apiFetch, readProblemDetails } from "@/lib/api";
import type {
  AffiliateApplication,
  CreateAffiliateApplicationInput,
  CreateOrderRequestInput,
  OrderRequest,
} from "@/types/order-affiliate";

async function readJson<T>(response: Response, fallbackMessage: string): Promise<T> {
  if (!response.ok) {
    const problem = await readProblemDetails(response);
    throw new Error(problem.detail ?? problem.title ?? fallbackMessage);
  }

  return (await response.json()) as T;
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
