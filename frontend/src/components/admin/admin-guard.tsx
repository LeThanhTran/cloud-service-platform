"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";

const MANAGEMENT_ROLES = new Set(["Admin", "Editor"]);

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { session, ready } = useAuth();

  useEffect(() => {
    if (!ready) return;

    if (!session) {
      router.replace("/admin/login");
      return;
    }

    if (!MANAGEMENT_ROLES.has(session.role)) {
      router.replace("/admin/login?reason=forbidden");
    }
  }, [ready, router, session]);

  if (!ready || !session || !MANAGEMENT_ROLES.has(session.role)) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f7faff]">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <LoaderCircle className="size-5 animate-spin text-brand-600" />
          Đang kiểm tra phiên đăng nhập...
        </div>
      </div>
    );
  }

  return children;
}
