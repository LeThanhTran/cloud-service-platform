import { apiFetch, getApiBaseUrl, readProblemDetails } from "@/lib/api";
import type {
  PlanPrice,
  PlanPriceInput,
  Promotion,
  PromotionInput,
  ServiceCategory,
  CreateServiceCategoryInput,
  UpdateServiceCategoryInput,
  ServicePlan,
  ServicePlanInput,
} from "@/types/service";

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const problem = await readProblemDetails(response);
    throw new Error(problem.detail ?? problem.title ?? "Không thể tải dữ liệu dịch vụ.");
  }

  return (await response.json()) as T;
}

async function ensureOk(response: Response, fallbackMessage: string) {
  if (response.ok) return;
  const problem = await readProblemDetails(response);
  throw new Error(problem.detail ?? problem.title ?? fallbackMessage);
}

export async function getServiceCategories() {
  const response = await apiFetch("/api/ServiceCategories", { auth: false });
  return readJson<ServiceCategory[]>(response);
}

export async function createServiceCategory(payload: CreateServiceCategoryInput) {
  const response = await apiFetch("/api/ServiceCategories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return readJson<ServiceCategory>(response);
}

export async function updateServiceCategory(id: string, payload: UpdateServiceCategoryInput) {
  const response = await apiFetch(`/api/ServiceCategories/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return readJson<ServiceCategory>(response);
}

export async function deleteServiceCategory(id: string) {
  const response = await apiFetch(`/api/ServiceCategories/${id}`, {
    method: "DELETE",
  });
  await ensureOk(response, "Không thể xóa danh mục dịch vụ.");
}

export async function getServicePlans() {
  const response = await apiFetch("/api/ServicePlans", { auth: false });
  return readJson<ServicePlan[]>(response);
}

export async function getServicePlan(id: string) {
  const response = await apiFetch(`/api/ServicePlans/${id}`, { auth: false });

  if (response.status === 404) return null;
  return readJson<ServicePlan>(response);
}

export async function createServicePlan(payload: ServicePlanInput) {
  const response = await apiFetch("/api/ServicePlans", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return readJson<ServicePlan>(response);
}

export async function updateServicePlan(id: string, payload: ServicePlanInput) {
  const response = await apiFetch(`/api/ServicePlans/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  await ensureOk(response, "Không thể cập nhật gói dịch vụ.");
}

export async function deleteServicePlan(id: string) {
  const response = await apiFetch(`/api/ServicePlans/${id}`, {
    method: "DELETE",
  });
  await ensureOk(response, "Không thể xóa gói dịch vụ.");
}

export async function getPlanPrices() {
  const response = await apiFetch("/api/PlanPrices", { auth: false });
  return readJson<PlanPrice[]>(response);
}

export async function getPlanPricesByPlan(servicePlanId: string) {
  const response = await apiFetch(`/api/PlanPrices/by-plan/${servicePlanId}`, {
    auth: false,
  });
  return readJson<PlanPrice[]>(response);
}

export async function createPlanPrice(payload: PlanPriceInput) {
  const response = await apiFetch("/api/PlanPrices", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return readJson<PlanPrice>(response);
}

export async function updatePlanPrice(id: string, payload: PlanPriceInput) {
  const response = await apiFetch(`/api/PlanPrices/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  await ensureOk(response, "Không thể cập nhật bảng giá.");
}

export async function deletePlanPrice(id: string) {
  const response = await apiFetch(`/api/PlanPrices/${id}`, {
    method: "DELETE",
  });
  await ensureOk(response, "Không thể xóa bảng giá.");
}

export async function getPromotions() {
  const response = await apiFetch("/api/Promotions", { auth: false });
  return readJson<Promotion[]>(response);
}

export async function getPromotionsByPlan(servicePlanId: string) {
  const response = await apiFetch(`/api/Promotions/by-plan/${servicePlanId}`, {
    auth: false,
  });
  return readJson<Promotion[]>(response);
}

export async function createPromotion(payload: PromotionInput) {
  const response = await apiFetch("/api/Promotions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return readJson<Promotion>(response);
}

export async function updatePromotion(id: string, payload: PromotionInput) {
  const response = await apiFetch(`/api/Promotions/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  await ensureOk(response, "Không thể cập nhật khuyến mãi.");
}

export async function deletePromotion(id: string) {
  const response = await apiFetch(`/api/Promotions/${id}`, {
    method: "DELETE",
  });
  await ensureOk(response, "Không thể xóa khuyến mãi.");
}

export async function regenerateServicePlanQr(
  servicePlanId: string,
  format: "png" | "svg" = "png",
) {
  const response = await apiFetch(
    `/api/ServicePlans/${servicePlanId}/qr-code/regenerate?format=${encodeURIComponent(format)}`,
    {
      method: "POST",
      headers: {
        Accept: format === "svg" ? "image/svg+xml" : "image/png",
      },
    },
  );

  if (!response.ok) {
    const problem = await readProblemDetails(response);
    throw new Error(problem.detail ?? problem.title ?? "Không thể sinh lại QR code.");
  }

  return response.blob();
}

export async function downloadServicePlanQr(
  servicePlanId: string,
  format: "png" | "svg" = "png",
) {
  const response = await apiFetch(
    `/api/ServicePlans/${servicePlanId}/qr-code?format=${encodeURIComponent(format)}`,
    {
      auth: false,
      headers: {
        Accept: format === "svg" ? "image/svg+xml" : "image/png",
      },
    },
  );

  if (!response.ok) {
    const problem = await readProblemDetails(response);
    throw new Error(problem.detail ?? problem.title ?? "Không thể tải QR code.");
  }

  return response.blob();
}

export function getServicePlanQrUrl(servicePlanId: string, format = "png") {
  return `${getApiBaseUrl()}/api/ServicePlans/${servicePlanId}/qr-code?format=${encodeURIComponent(format)}`;
}

export function isPromotionActive(promotion: Promotion, now = new Date()) {
  if (!promotion.isActive) return false;

  const start = new Date(promotion.startDate);
  const end = new Date(promotion.endDate);

  return now >= start && now <= end;
}

export function getBestPromotion(promotions: Promotion[]) {
  return promotions
    .filter((promotion) => isPromotionActive(promotion))
    .sort((a, b) => b.discountPercent - a.discountPercent)[0] ?? null;
}

export function applyPromotion(price: number, promotion: Promotion | null) {
  if (!promotion) return price;
  return price * (1 - promotion.discountPercent / 100);
}

export function formatVnd(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export function normalizeBillingCycle(value: string) {
  const normalized = value.trim().toLowerCase();

  if (["monthly", "month", "tháng", "hangthang"].includes(normalized)) {
    return "monthly";
  }

  if (["yearly", "annual", "year", "năm", "hangnam"].includes(normalized)) {
    return "yearly";
  }

  return normalized;
}

export function billingCycleLabel(value: string) {
  const normalized = normalizeBillingCycle(value);
  if (normalized === "monthly") return "tháng";
  if (normalized === "yearly") return "năm";
  return value;
}
