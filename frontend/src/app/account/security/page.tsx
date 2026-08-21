"use client";

import { AlertCircle, CheckCircle2, LoaderCircle, LockKeyhole, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { apiFetch, readProblemDetails } from "@/lib/api";

export default function AccountSecurityPage() {
  const router = useRouter();
  const { session, clearSession } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Xác nhận mật khẩu mới không khớp.");
      return;
    }

    setSubmitting(true);
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

      setSuccess("Đổi mật khẩu thành công. Bạn sẽ được chuyển về trang đăng nhập.");
      window.setTimeout(() => {
        clearSession();
        router.replace("/login?reason=password-changed");
        router.refresh();
      }, 900);
    } catch {
      setError("Không thể kết nối tới Web API.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-600">Security</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-navy-900">Bảo mật tài khoản</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">Đổi mật khẩu cho tài khoản {session?.email}.</p>
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-[1fr_0.7fr]">
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><LockKeyhole className="size-5" /></span>
            <div>
              <h3 className="text-sm font-semibold text-navy-900">Đổi mật khẩu</h3>
              <p className="mt-0.5 text-xs text-slate-400">Refresh token hiện tại sẽ bị thu hồi sau khi đổi.</p>
            </div>
          </div>

          {error && <div className="mt-5 flex gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-xs leading-5 text-red-700"><AlertCircle className="mt-0.5 size-4 shrink-0" />{error}</div>}
          {success && <div className="mt-5 flex gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs leading-5 text-emerald-700"><CheckCircle2 className="mt-0.5 size-4 shrink-0" />{success}</div>}

          <div className="mt-5 space-y-4">
            <Field label="Mật khẩu hiện tại"><input required type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="input-admin" autoComplete="current-password" /></Field>
            <Field label="Mật khẩu mới"><input required minLength={6} type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="input-admin" autoComplete="new-password" /></Field>
            <Field label="Xác nhận mật khẩu mới"><input required minLength={6} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="input-admin" autoComplete="new-password" /></Field>
          </div>

          <button type="submit" disabled={submitting || !!success} className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60">
            {submitting ? <LoaderCircle className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
            {submitting ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
          </button>
        </form>

        <aside className="h-fit rounded-2xl border border-brand-100 bg-brand-50/50 p-5">
          <ShieldCheck className="size-6 text-brand-600" />
          <h3 className="mt-4 text-sm font-semibold text-navy-900">Phiên đăng nhập an toàn</h3>
          <p className="mt-2 text-xs leading-6 text-slate-500">NovaCloud dùng JWT Access Token và Refresh Token. Khi đổi mật khẩu, Refresh Token hiện tại bị thu hồi và bạn cần đăng nhập lại.</p>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-xs font-semibold text-slate-700">{label}</span>{children}</label>;
}
