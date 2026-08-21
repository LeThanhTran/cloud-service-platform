import { apiFetch, readProblemDetails } from "@/lib/api";
import type { AuditLogPagedResult, AuditLogQuery } from "@/types/audit-log";

export async function getAuditLogs(query: AuditLogQuery = {}) {
  const params = new URLSearchParams();

  if (query.search?.trim()) params.set("search", query.search.trim());
  if (query.action?.trim()) params.set("action", query.action.trim());
  if (query.entityType?.trim()) params.set("entityType", query.entityType.trim());
  if (query.userRole?.trim()) params.set("userRole", query.userRole.trim());
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  params.set("page", String(query.page ?? 1));
  params.set("pageSize", String(query.pageSize ?? 10));

  const response = await apiFetch(`/api/AuditLogs?${params.toString()}`);

  if (!response.ok) {
    const problem = await readProblemDetails(response);
    throw new Error(
      problem.detail ?? problem.title ?? "Không thể tải nhật ký hệ thống.",
    );
  }

  return (await response.json()) as AuditLogPagedResult;
}
