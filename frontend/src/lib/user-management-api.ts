import { apiFetch, readProblemDetails } from "@/lib/api";
import type {
  ManagedUser,
  UpdateUserRoleInput,
  UpdateUserStatusInput,
} from "@/types/user-management";

async function readJson<T>(response: Response, fallbackMessage: string): Promise<T> {
  if (!response.ok) {
    const problem = await readProblemDetails(response);
    throw new Error(problem.detail ?? problem.title ?? fallbackMessage);
  }

  return (await response.json()) as T;
}

export async function getManagedUsers() {
  const response = await apiFetch("/api/Users");
  return readJson<ManagedUser[]>(response, "Không thể tải danh sách tài khoản.");
}

export async function updateManagedUserRole(
  userId: string,
  payload: UpdateUserRoleInput,
) {
  const response = await apiFetch(`/api/Users/${userId}/role`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  return readJson<ManagedUser>(response, "Không thể cập nhật quyền tài khoản.");
}

export async function updateManagedUserStatus(
  userId: string,
  payload: UpdateUserStatusInput,
) {
  const response = await apiFetch(`/api/Users/${userId}/status`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  return readJson<ManagedUser>(response, "Không thể cập nhật trạng thái tài khoản.");
}
