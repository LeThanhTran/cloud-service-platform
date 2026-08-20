import { apiFetch, readProblemDetails } from "@/lib/api";
import type { NotificationItem } from "@/types/notification";

export async function getNotifications(
  unreadOnly = false,
  limit = 20,
): Promise<NotificationItem[]> {
  const params = new URLSearchParams({
    unreadOnly: String(unreadOnly),
    limit: String(limit),
  });

  const response = await apiFetch(`/api/Notifications?${params.toString()}`);

  if (!response.ok) {
    const problem = await readProblemDetails(response);
    throw new Error(problem.detail ?? "Không thể tải thông báo.");
  }

  return (await response.json()) as NotificationItem[];
}

export async function getUnreadNotificationCount(): Promise<number> {
  const response = await apiFetch("/api/Notifications/unread-count");

  if (!response.ok) {
    const problem = await readProblemDetails(response);
    throw new Error(problem.detail ?? "Không thể tải số thông báo chưa đọc.");
  }

  const result = (await response.json()) as { count: number };
  return result.count;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const response = await apiFetch(`/api/Notifications/${id}/read`, {
    method: "PATCH",
  });

  if (!response.ok) {
    const problem = await readProblemDetails(response);
    throw new Error(problem.detail ?? "Không thể đánh dấu thông báo đã đọc.");
  }
}

export async function markAllNotificationsAsRead(): Promise<number> {
  const response = await apiFetch("/api/Notifications/read-all", {
    method: "PATCH",
  });

  if (!response.ok) {
    const problem = await readProblemDetails(response);
    throw new Error(problem.detail ?? "Không thể đánh dấu tất cả thông báo đã đọc.");
  }

  const result = (await response.json()) as { updated: number };
  return result.updated;
}
