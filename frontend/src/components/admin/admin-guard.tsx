"use client";

import { LoaderCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import {
  canAccessAdminPath,
  isManagementRole,
} from "@/lib/admin-route-policy";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, ready } = useAuth();

  useEffect(() => {
    if (!ready) return;

    if (!session) {
      const returnUrl = encodeURIComponent(pathname || "/admin/dashboard");
      router.replace(`/admin/login?returnUrl=${returnUrl}`);
      return;
    }

    if (!isManagementRole(session.role)) {
      router.replace("/403?reason=management-role");
      return;
    }

    if (!canAccessAdminPath(pathname, session.role)) {
      router.replace(`/403?reason=role&from=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, ready, router, session]);

  const allowed =
    ready &&
    !!session &&
    isManagementRole(session.role) &&
    canAccessAdminPath(pathname, session.role);

  if (!allowed) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f7faff]">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <LoaderCircle className="size-5 animate-spin text-brand-600" />
          Đang kiểm tra quyền truy cập...
        </div>
      </div>
    );
  }

  return children;
}
