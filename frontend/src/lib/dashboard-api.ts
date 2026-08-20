import { apiFetch, readProblemDetails } from "@/lib/api";
import type { DashboardSummary } from "@/types/dashboard";

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await apiFetch("/api/Dashboard/summary");

  if (!response.ok) {
    const problem = await readProblemDetails(response);
    throw new Error(problem.detail || problem.title || "Không thể tải Dashboard.");
  }

  return (await response.json()) as DashboardSummary;
}
