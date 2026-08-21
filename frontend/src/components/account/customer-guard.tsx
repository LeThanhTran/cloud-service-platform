"use client";

import { LoaderCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";

export function CustomerGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, ready } = useAuth();

  useEffect(() => {
    if (!ready) return;

    if (!session) {
      const returnUrl = encodeURIComponent(pathname || "/account");
      router.replace(`/login?returnUrl=${returnUrl}`);
      return;
    }

    if (session.role !== "User") {
      router.replace("/admin/dashboard");
    }
  }, [pathname, ready, router, session]);

  if (!ready || !session || session.role !== "User") {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f7faff]">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
          <LoaderCircle className="size-5 animate-spin text-brand-600" />
          Đang kiểm tra tài khoản...
        </div>
      </div>
    );
  }

  return children;
}
