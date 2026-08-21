"use client";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  LockKeyhole,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  UnlockKeyhole,
  UserCheck,
  UserRoundCog,
  UsersRound,
  UserX,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdminOnly } from "@/components/admin/admin-only";
import { useAuth } from "@/components/auth/auth-provider";
import {
  getManagedUsers,
  updateManagedUserRole,
  updateManagedUserStatus,
} from "@/lib/user-management-api";
import type { UserRole } from "@/types/auth";
import type { ManagedUser } from "@/types/user-management";

const PAGE_SIZE = 10;
const roles: UserRole[] = ["Admin", "Editor", "User"];

type RoleFilter = "all" | UserRole;
type StatusFilter = "all" | "active" | "inactive";
type DialogState =
  | { type: "role"; user: ManagedUser }
  | { type: "status"; user: ManagedUser }
  | null;

export default function AdminUsersPage() {
  const { session } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [nextRole, setNextRole] = useState<UserRole>("User");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadUsers() {
    setLoading(true);
    setError(null);

    try {
      setUsers(await getManagedUsers());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể tải danh sách tài khoản.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((user) => user.isActive).length,
      admins: users.filter((user) => user.role === "Admin").length,
      editors: users.filter((user) => user.role === "Editor").length,
    }),
    [users],
  );

  const filteredUsers = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return users.filter((user) => {
      const matchesQuery =
        !needle ||
        user.fullName.toLowerCase().includes(needle) ||
        user.email.toLowerCase().includes(needle);

      const matchesRole =
        roleFilter === "all" || user.role === roleFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.isActive) ||
        (statusFilter === "inactive" && !user.isActive);

      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [query, roleFilter, statusFilter, users]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / PAGE_SIZE),
  );

  const visibleUsers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, page]);

  useEffect(() => {
    setPage(1);
  }, [query, roleFilter, statusFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function openRoleDialog(user: ManagedUser) {
    setNextRole(user.role);
    setDialog({ type: "role", user });
    setMessage(null);
    setError(null);
  }

  function openStatusDialog(user: ManagedUser) {
    setDialog({ type: "status", user });
    setMessage(null);
    setError(null);
  }

  async function submitDialog() {
    if (!dialog || saving) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      if (dialog.type === "role") {
        if (nextRole === dialog.user.role) {
          setDialog(null);
          return;
        }

        const updated = await updateManagedUserRole(dialog.user.id, {
          role: nextRole,
        });

        setUsers((current) =>
          current.map((user) => (user.id === updated.id ? updated : user)),
        );
        setMessage(
          `Đã đổi quyền ${updated.fullName} thành ${updated.role}. Phiên cũ của tài khoản đã được thu hồi.`,
        );
      } else {
        const updated = await updateManagedUserStatus(dialog.user.id, {
          isActive: !dialog.user.isActive,
        });

        setUsers((current) =>
          current.map((user) => (user.id === updated.id ? updated : user)),
        );
        setMessage(
          updated.isActive
            ? `Đã kích hoạt lại tài khoản ${updated.fullName}.`
            : `Đã tạm khóa tài khoản ${updated.fullName}.`,
        );
      }

      setDialog(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể cập nhật tài khoản.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminOnly>
      <div className="space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-600">
              Access Management
            </p>
            <h1 className="mt-1.5 text-[28px] font-semibold tracking-[-0.035em] text-navy-900">
              Tài khoản & phân quyền
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Quản lý User, Editor, Admin và trạng thái truy cập hệ thống.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadUsers()}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-600 transition hover:border-brand-200 hover:text-brand-600"
          >
            <RefreshCw className="size-4" />
            Làm mới
          </button>
        </header>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<UsersRound className="size-5" />}
            label="Tổng tài khoản"
            value={stats.total}
            hint="Tất cả role"
          />
          <StatCard
            icon={<UserCheck className="size-5" />}
            label="Đang hoạt động"
            value={stats.active}
            hint={`${Math.max(stats.total - stats.active, 0)} tài khoản tạm khóa`}
          />
          <StatCard
            icon={<ShieldCheck className="size-5" />}
            label="Admin"
            value={stats.admins}
            hint="Toàn quyền hệ thống"
          />
          <StatCard
            icon={<UserRoundCog className="size-5" />}
            label="Editor"
            value={stats.editors}
            hint="Xử lý nghiệp vụ"
          />
        </div>

        {(message || error) && (
          <div
            className={`rounded-xl border px-4 py-3 text-xs ${
              error
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {error ?? message}
          </div>
        )}

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)]">
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
            <label className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm theo tên hoặc email..."
                className="input-admin !pl-9"
              />
            </label>

            <select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(event.target.value as RoleFilter)
              }
              className="input-admin"
            >
              <option value="all">Tất cả role</option>
              <option value="Admin">Admin</option>
              <option value="Editor">Editor</option>
              <option value="User">User</option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
              className="input-admin"
            >
              <option value="all">Mọi trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Tạm khóa</option>
            </select>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <div>
              <p className="text-xs font-semibold text-navy-900">
                {filteredUsers.length.toLocaleString("vi-VN")} tài khoản phù hợp
              </p>
              <p className="mt-0.5 text-[10.5px] text-slate-400">
                10 tài khoản mỗi trang · Trang {page} / {totalPages}
              </p>
            </div>

            {(query || roleFilter !== "all" || statusFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setRoleFilter("all");
                  setStatusFilter("all");
                }}
                className="text-[11px] font-semibold text-brand-600"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid min-h-72 place-items-center">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <LoaderCircle className="size-5 animate-spin text-brand-600" />
                Đang tải tài khoản...
              </div>
            </div>
          ) : visibleUsers.length === 0 ? (
            <div className="grid min-h-72 place-items-center text-sm text-slate-500">
              Không có tài khoản phù hợp.
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="border-b border-slate-100 text-[10px] uppercase tracking-[0.07em] text-slate-400">
                  <tr>
                    <th className="pb-3 font-semibold">Tài khoản</th>
                    <th className="pb-3 font-semibold">Role</th>
                    <th className="pb-3 font-semibold">Trạng thái</th>
                    <th className="pb-3 font-semibold">Ngày tạo</th>
                    <th className="pb-3 text-right font-semibold">Thao tác</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {visibleUsers.map((user) => {
                    const isCurrentUser = user.id === session?.id;

                    return (
                      <tr key={user.id} className="text-xs text-slate-600">
                        <td className="py-4 pr-5">
                          <div className="flex items-center gap-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-xs font-bold text-brand-700">
                              {initials(user.fullName)}
                            </span>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-navy-900">
                                  {user.fullName}
                                </p>
                                {isCurrentUser && (
                                  <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[9px] font-semibold text-sky-700 ring-1 ring-sky-100">
                                    Bạn
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 flex items-center gap-1.5 text-[10.5px] text-slate-400">
                                <Mail className="size-3" />
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 pr-5">
                          <RoleBadge role={user.role} />
                        </td>

                        <td className="py-4 pr-5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9.5px] font-semibold ${
                              user.isActive
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            <span
                              className={`size-1.5 rounded-full ${
                                user.isActive ? "bg-emerald-500" : "bg-red-500"
                              }`}
                            />
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="py-4 pr-5">
                          <span className="inline-flex items-center gap-1.5 text-[10.5px] text-slate-500">
                            <CalendarDays className="size-3.5 text-slate-400" />
                            {formatDate(user.createdAt)}
                          </span>
                        </td>

                        <td className="py-4 text-right">
                          {isCurrentUser ? (
                            <span className="text-[10.5px] font-medium text-slate-400">
                              Phiên hiện tại
                            </span>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openRoleDialog(user)}
                                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-[10.5px] font-semibold text-slate-600 transition hover:border-brand-200 hover:text-brand-600"
                              >
                                <UserRoundCog className="size-3.5" />
                                Đổi quyền
                              </button>

                              <button
                                type="button"
                                onClick={() => openStatusDialog(user)}
                                className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[10.5px] font-semibold transition ${
                                  user.isActive
                                    ? "border-red-100 text-red-600 hover:border-red-200 hover:bg-red-50"
                                    : "border-emerald-100 text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50"
                                }`}
                              >
                                {user.isActive ? (
                                  <LockKeyhole className="size-3.5" />
                                ) : (
                                  <UnlockKeyhole className="size-3.5" />
                                )}
                                {user.isActive ? "Khóa" : "Mở khóa"}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filteredUsers.length > PAGE_SIZE && (
            <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Trang trước"
              >
                <ChevronLeft className="size-4" />
              </button>

              <span className="px-2 text-[10.5px] font-medium text-slate-500">
                {page} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                disabled={page === totalPages}
                className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Trang sau"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-xs leading-5 text-blue-900">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand-600" />
            <div>
              <p className="font-semibold">Bảo vệ phân quyền</p>
              <p className="mt-1 text-blue-800/75">
                Hệ thống không cho tự hạ quyền/khóa chính mình, không cho loại bỏ
                Admin hoạt động cuối cùng và thu hồi phiên khi role hoặc trạng
                thái tài khoản thay đổi.
              </p>
            </div>
          </div>
        </section>
      </div>

      {dialog && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-600">
                  {dialog.type === "role"
                    ? "Role Management"
                    : "Account Status"}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-navy-900">
                  {dialog.type === "role"
                    ? "Thay đổi quyền tài khoản"
                    : dialog.user.isActive
                      ? "Tạm khóa tài khoản"
                      : "Kích hoạt tài khoản"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {dialog.user.fullName} · {dialog.user.email}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDialog(null)}
                disabled={saving}
                className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            </div>

            {dialog.type === "role" ? (
              <div className="mt-5 space-y-2">
                {roles.map((role) => (
                  <label
                    key={role}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                      nextRole === role
                        ? "border-brand-200 bg-brand-50/60"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="managed-user-role"
                      value={role}
                      checked={nextRole === role}
                      onChange={() => setNextRole(role)}
                      className="mt-0.5 size-4 accent-blue-600"
                    />
                    <div>
                      <p className="text-xs font-semibold text-navy-900">
                        {role}
                      </p>
                      <p className="mt-1 text-[10.5px] leading-4 text-slate-500">
                        {roleDescription(role)}
                      </p>
                    </div>
                  </label>
                ))}

                <p className="pt-2 text-[10.5px] leading-4 text-slate-500">
                  Sau khi đổi role, refresh token hiện tại của tài khoản sẽ bị
                  thu hồi và Audit Log sẽ ghi lại thao tác.
                </p>
              </div>
            ) : (
              <div
                className={`mt-5 rounded-xl border p-4 text-xs leading-5 ${
                  dialog.user.isActive
                    ? "border-red-100 bg-red-50 text-red-800"
                    : "border-emerald-100 bg-emerald-50 text-emerald-800"
                }`}
              >
                {dialog.user.isActive ? (
                  <div className="flex gap-3">
                    <UserX className="mt-0.5 size-5 shrink-0" />
                    <p>
                      Tài khoản sẽ không thể đăng nhập hoặc làm mới phiên cho
                      đến khi Admin mở lại. Refresh token hiện tại cũng sẽ bị
                      thu hồi.
                    </p>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <UserCheck className="mt-0.5 size-5 shrink-0" />
                    <p>
                      Tài khoản sẽ được phép đăng nhập lại và nhận thông báo
                      kích hoạt trong NovaCloud.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDialog(null)}
                disabled={saving}
                className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-600"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void submitDialog()}
                disabled={
                  saving ||
                  (dialog.type === "role" && nextRole === dialog.user.role)
                }
                className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                  dialog.type === "status" && dialog.user.isActive
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-brand-600 hover:bg-brand-700"
                }`}
              >
                {saving && <LoaderCircle className="size-4 animate-spin" />}
                {saving
                  ? "Đang cập nhật..."
                  : dialog.type === "role"
                    ? "Lưu quyền"
                    : dialog.user.isActive
                      ? "Tạm khóa"
                      : "Kích hoạt"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminOnly>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.035)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-400">
          {label}
        </p>
        <span className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-navy-900">
        {value.toLocaleString("vi-VN")}
      </p>
      <p className="mt-1 text-[10.5px] text-slate-400">{hint}</p>
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const classes =
    role === "Admin"
      ? "bg-violet-50 text-violet-700"
      : role === "Editor"
        ? "bg-sky-50 text-sky-700"
        : "bg-slate-100 text-slate-600";

  return (
    <span className={`rounded-full px-2.5 py-1 text-[9.5px] font-semibold ${classes}`}>
      {role}
    </span>
  );
}

function roleDescription(role: UserRole) {
  if (role === "Admin") {
    return "Toàn quyền quản trị, phân quyền, cấu hình dịch vụ và Audit Log.";
  }

  if (role === "Editor") {
    return "Xử lý Order, Affiliate, Contact, News và các nghiệp vụ được phân công.";
  }

  return "Tài khoản khách hàng, sử dụng Customer Account và theo dõi yêu cầu cá nhân.";
}

function initials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}
