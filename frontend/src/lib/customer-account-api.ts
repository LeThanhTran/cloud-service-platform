import { apiFetch, readProblemDetails } from "@/lib/api";
import type {
  CustomerAccountOverview,
  CustomerRequestItem,
} from "@/types/customer-account";
import type { AuthSession } from "@/types/auth";

async function readJson<T>(response: Response, fallback: string): Promise<T> {
  if (!response.ok) {
    const problem = await readProblemDetails(response);
    throw new Error(problem.detail ?? problem.title ?? fallback);
  }

  return (await response.json()) as T;
}

export async function getCustomerOverview() {
  const response = await apiFetch("/api/Account/overview");
  return readJson<CustomerAccountOverview>(
    response,
    "Không thể tải tổng quan tài khoản.",
  );
}

export async function getCustomerRequests() {
  const response = await apiFetch("/api/Account/requests");
  return readJson<CustomerRequestItem[]>(
    response,
    "Không thể tải danh sách yêu cầu của bạn.",
  );
}

export async function loginCustomer(email: string, password: string) {
  const response = await apiFetch("/api/Auth/login", {
    auth: false,
    method: "POST",
    body: JSON.stringify({ email: email.trim(), password }),
  });

  return readJson<AuthSession>(response, "Đăng nhập không thành công.");
}

export async function registerCustomer(
  fullName: string,
  email: string,
  password: string,
) {
  const response = await apiFetch("/api/Auth/register", {
    auth: false,
    method: "POST",
    body: JSON.stringify({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
    }),
  });

  return readJson<AuthSession>(response, "Không thể tạo tài khoản.");
}
