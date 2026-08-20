import type { AuthSession, ProblemDetails } from "@/types/auth";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5128"
).replace(/\/$/, "");

const AUTH_STORAGE_KEY = "novacloud.auth";
export const AUTH_EXPIRED_EVENT = "novacloud:auth-expired";

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export function getStoredSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function storeSession(session: AuthSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function removeStoredSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

function notifyAuthExpired() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
}

function getJwtExpiration(token: string) {
  if (typeof window === "undefined") return null;

  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return null;

    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    const payload = JSON.parse(window.atob(padded)) as { exp?: number };

    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function isAccessTokenExpired(token: string, skewSeconds = 15) {
  const expiresAt = getJwtExpiration(token);
  if (!expiresAt) return false;

  return expiresAt <= Date.now() + skewSeconds * 1000;
}

export async function readProblemDetails(response: Response): Promise<ProblemDetails> {
  try {
    return (await response.json()) as ProblemDetails;
  } catch {
    return {
      status: response.status,
      title: response.statusText || "Request failed",
      detail: "Máy chủ không trả về nội dung lỗi hợp lệ.",
    };
  }
}

async function refreshSession(current: AuthSession): Promise<AuthSession | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/Auth/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ refreshToken: current.refreshToken }),
    });

    if (!response.ok) {
      removeStoredSession();
      notifyAuthExpired();
      return null;
    }

    const refreshed = (await response.json()) as AuthSession;
    storeSession(refreshed);
    return refreshed;
  } catch {
    removeStoredSession();
    notifyAuthExpired();
    return null;
  }
}

export async function restoreStoredSession(): Promise<AuthSession | null> {
  const current = getStoredSession();
  if (!current) return null;

  if (!isAccessTokenExpired(current.token)) {
    return current;
  }

  if (!current.refreshToken) {
    removeStoredSession();
    notifyAuthExpired();
    return null;
  }

  return refreshSession(current);
}

interface ApiFetchOptions extends RequestInit {
  auth?: boolean;
  retryOnUnauthorized?: boolean;
}

export async function apiFetch(
  path: string,
  options: ApiFetchOptions = {},
): Promise<Response> {
  const {
    auth = true,
    retryOnUnauthorized = true,
    headers,
    ...requestOptions
  } = options;

  let session = auth ? getStoredSession() : null;

  const makeRequest = (accessToken?: string) => {
    const requestHeaders = new Headers(headers);

    if (!requestHeaders.has("Accept")) {
      requestHeaders.set("Accept", "application/json");
    }

    const isFormData =
      typeof FormData !== "undefined" && requestOptions.body instanceof FormData;

    if (
      requestOptions.body &&
      !isFormData &&
      !requestHeaders.has("Content-Type")
    ) {
      requestHeaders.set("Content-Type", "application/json");
    }

    if (auth && accessToken) {
      requestHeaders.set("Authorization", `Bearer ${accessToken}`);
    }

    return fetch(`${API_BASE_URL}${path}`, {
      ...requestOptions,
      headers: requestHeaders,
    });
  };

  let response = await makeRequest(session?.token);

  if (
    auth &&
    retryOnUnauthorized &&
    response.status === 401 &&
    session?.refreshToken
  ) {
    const refreshed = await refreshSession(session);

    if (refreshed) {
      session = refreshed;
      response = await makeRequest(session.token);
    }
  }

  if (auth && response.status === 401) {
    removeStoredSession();
    notifyAuthExpired();
  }

  return response;
}
