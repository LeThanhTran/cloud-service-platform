import type { UserRole } from "@/types/auth";

const MANAGEMENT_ROLES = new Set<UserRole>(["Admin", "Editor"]);

const ADMIN_ONLY_PREFIXES = [
  "/admin/services",
  "/admin/pricing",
  "/admin/promotions",
];

export function isManagementRole(role: UserRole | string | undefined | null) {
  return !!role && MANAGEMENT_ROLES.has(role as UserRole);
}

export function canAccessAdminPath(
  pathname: string,
  role: UserRole | string | undefined | null,
) {
  if (!isManagementRole(role)) return false;

  const adminOnly = ADMIN_ONLY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (adminOnly) return role === "Admin";

  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function sanitizeAdminReturnUrl(value: string | null | undefined) {
  if (!value) return "/admin/dashboard";

  const decoded = safeDecodeURIComponent(value);

  if (
    !decoded.startsWith("/admin") ||
    decoded.startsWith("//") ||
    decoded.startsWith("/admin/login")
  ) {
    return "/admin/dashboard";
  }

  return decoded;
}

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
