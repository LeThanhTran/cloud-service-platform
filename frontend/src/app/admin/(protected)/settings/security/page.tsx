"use client";

import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { apiFetch, readProblemDetails } from "@/lib/api";

export default function SecuritySettingsPage() {
  const router = useRouter();
  const { session, clearSession } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Xác nhận mật khẩu mới không khớp.");
      return;
    }

    setLoading(true);

    try {
      const response = await apiFetch("/api/Auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        const problem = await readProblemDetails(response);
        setError(problem.detail ?? "Không thể đổi mật khẩu.");
        return;
      }

      setSuccess("Đổi mật khẩu thành công. Phiên hiện tại sẽ được kết thúc để bảo vệ tài khoản.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      window.setTimeout(() => {
        clearSession();
        router.replace("/admin/login");
        router.refresh();
      }, 1200);
    } catch {
      setError("Không thể kết nối tới Web API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-[900px]">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-600">Bảo mật</p>
        <h1 className="mt-1.5 text-[28px] font-semibold tracking-[-0.035em] text-navy-900">Đổi mật khẩu</h1>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Sau khi đổi mật khẩu, refresh token hiện tại sẽ bị thu hồi và bạn cần đăng nhập lại.
        </p>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_300px]">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.04)] sm:p-6">
          {error && (
            <div className="mb-5 flex gap-3 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-xs leading-5 text-red-700">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 flex gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-3 text-xs leading-5 text-emerald-700">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              {success}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <PasswordField
              label="Mật khẩu hiện tại"
              value={currentPassword}
              onChange={setCurrentPassword}
              visible={showPasswords}
            />
            <PasswordField
              label="Mật khẩu mới"
              value={newPassword}
              onChange={setNewPassword}
              visible={showPasswords}
            />
            <PasswordField
              label="Xác nhận mật khẩu mới"
              value={confirmPassword}
              onChange={setConfirmPassword}
              visible={showPasswords}
            />

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setShowPasswords((value) => !value)}
                className="inline-flex items-center gap-2 self-start text-xs font-medium text-slate-500 transition hover:text-brand-600"
              >
                {showPasswords ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                {showPasswords ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              </button>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-xs font-semibold text-white shadow-[0_8px_22px_rgba(11,99,246,0.18)] transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <LoaderCircle className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
                {loading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
              </button>
            </div>
          </form>
        </section>

        <aside className="h-fit rounded-2xl border border-brand-100 bg-[linear-gradient(180deg,#f5f9ff_0%,#ffffff_100%)] p-5">
          <span className="grid size-10 place-items-center rounded-xl bg-brand-600 text-white shadow-[0_8px_20px_rgba(11,99,246,0.2)]">
            <ShieldCheck className="size-5" />
          </span>
          <p className="mt-4 text-xs font-semibold text-navy-900">Thông tin phiên</p>
          <dl className="mt-4 space-y-3 text-[11px]">
            <div>
              <dt className="text-slate-400">Email</dt>
              <dd className="mt-0.5 break-all font-medium text-slate-700">{session?.email}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Role</dt>
              <dd className="mt-0.5 font-medium text-slate-700">{session?.role}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Refresh Token</dt>
              <dd className="mt-0.5 font-medium text-emerald-700">Rotation enabled</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  visible,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-slate-700">{label}</span>
      <input
        type={visible ? "text" : "password"}
        required
        minLength={6}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={label.includes("hiện tại") ? "current-password" : "new-password"}
        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-navy-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100/70"
      />
    </label>
  );
}
