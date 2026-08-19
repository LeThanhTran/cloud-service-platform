import { apiFetch, getApiBaseUrl, readProblemDetails } from "@/lib/api";
import type {
  PlanPrice,
  Promotion,
  ServiceCategory,
  ServicePlan,
} from "@/types/service";

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const problem = await readProblemDetails(response);
    throw new Error(problem.detail ?? problem.title ?? "Không thể tải dữ liệu dịch vụ.");
  }

  return (await response.json()) as T;
}

export async function getServiceCategories() {
  const response = await apiFetch("/api/ServiceCategories", { auth: false });
  return readJson<ServiceCategory[]>(response);
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
