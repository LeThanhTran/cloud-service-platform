"use client";

import { ShieldX } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";

export function AdminOnly({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();

  if (session?.role === "Admin") return children;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-[0_10px_35px_rgba(15,23,42,0.04)]">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-amber-600 ring-1 ring-amber-200">
          <ShieldX className="size-5" />
        </span>
        <div>
          <p className="text-sm font-semibold">Chức năng dành cho Admin</p>
          <p className="mt-1 text-xs leading-5 text-amber-800/80">
            Editor có thể vào khu vực quản trị nhưng không được tạo, sửa hoặc xóa danh mục, gói dịch vụ, bảng giá và khuyến mãi.
          </p>
        </div>
      </div>
    </div>
  );
}
