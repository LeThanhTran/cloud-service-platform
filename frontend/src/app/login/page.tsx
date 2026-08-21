"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Cloud,
  LoaderCircle,
  LockKeyhole,
  LogIn,
  Server,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Brand } from "@/components/ui/brand";
import { loginCustomer, registerCustomer } from "@/lib/customer-account-api";

type Mode = "login" | "register";

function sanitizeReturnUrl(value: string | null) {
  if (!value) return "/account";

  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    // Giữ nguyên nếu chuỗi không decode được.
  }

  if (
    !decoded.startsWith("/account") ||
    decoded.startsWith("//") ||
    decoded.startsWith("/account/login")
  ) {
    return "/account";
  }

  return decoded;
}

export default function CustomerLoginPage() {
  const router = useRouter();
  const { session, ready, saveSession } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!ready || !session) return;

    if (session.role === "User") {
      const returnUrl = sanitizeReturnUrl(
        new URLSearchParams(window.location.search).get("returnUrl"),
      );
      router.replace(returnUrl);
    } else {
      router.replace("/admin/dashboard");
    }
  }, [ready, router, session]);

  useEffect(() => {
    const reason = new URLSearchParams(window.location.search).get("reason");
    if (reason === "password-changed") {
      setNotice("Mật khẩu đã được cập nhật. Vui lòng đăng nhập lại.");
    }
  }, []);

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setNotice("");
    setPassword("");
    setConfirmPassword("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (mode === "register") {
      if (fullName.trim().length === 0) {
        setError("Vui lòng nhập họ và tên.");
        return;
      }
      if (password.length < 6) {
        setError("Mật khẩu phải có ít nhất 6 ký tự.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Xác nhận mật khẩu không khớp.");
        return;
      }
    }

    setLoading(true);
    try {
      const result =
        mode === "login"
          ? await loginCustomer(email, password)
          : await registerCustomer(fullName, email, password);

      if (result.role !== "User") {
        setError("Tài khoản Admin/Editor vui lòng sử dụng cổng đăng nhập quản trị.");
        return;
      }

      saveSession(result);
      const returnUrl = sanitizeReturnUrl(
        new URLSearchParams(window.location.search).get("returnUrl"),
      );
      router.replace(returnUrl);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Không thể xử lý yêu cầu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7faff]">
      <div className="soft-grid pointer-events-none absolute inset-0 opacity-45 [mask-image:linear-gradient(to_bottom,black,transparent_86%)]" />
      <div className="pointer-events-none absolute -left-28 top-[-120px] size-[420px] rounded-full bg-brand-100/55 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-[-180px] size-[480px] rounded-full bg-sky-100/60 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen w-full max-w-[1280px] items-stretch px-4 py-5 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-6 lg:px-8 lg:py-8">
        <section className="relative hidden overflow-hidden rounded-[28px] bg-[linear-gradient(145deg,#071a3d_0%,#0a2e69_58%,#0b63f6_145%)] p-10 text-white shadow-[0_30px_80px_rgba(8,27,63,0.2)] lg:flex lg:flex-col">
          <div className="dark-grid pointer-events-none absolute inset-0 opacity-50" />
          <div className="relative z-10"><Brand inverse /></div>

          <div className="relative z-10 my-auto max-w-[500px] py-12">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/7 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-100">
              <ShieldCheck className="size-3.5" /> Customer Portal
            </span>
            <h1 className="mt-6 text-[43px] font-semibold leading-[1.08] tracking-[-0.045em]">
              Theo dõi dịch vụ Cloud
              <br />
              trong một tài khoản.
            </h1>
            <p className="mt-5 max-w-[460px] text-sm leading-7 text-blue-100/72">
              Đăng nhập để xem Order, Contact, Affiliate và thông báo trạng thái gắn với email của bạn.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                [Server, "Yêu cầu của tôi", "Order, Contact, Affiliate"],
                [Cloud, "Cloud Services", "Theo dõi trạng thái xử lý"],
                [LockKeyhole, "Bảo mật", "JWT + Refresh Token"],
                [CheckCircle2, "Lịch sử", "Nhận lại yêu cầu cùng email"],
              ].map(([Icon, title, description]) => {
                const FeatureIcon = Icon as typeof Cloud;
                return (
                  <div key={title as string} className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
                    <FeatureIcon className="size-5 text-sky-300" />
                    <p className="mt-3 text-xs font-semibold">{title as string}</p>
                    <p className="mt-1 text-[11px] text-blue-100/60">{description as string}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <Link href="/" className="relative z-10 text-xs font-semibold text-blue-100/65 transition hover:text-white">
            ← Quay về trang chủ NovaCloud
          </Link>
        </section>

        <section className="flex items-center justify-center py-8 lg:py-0">
          <div className="w-full max-w-[470px]">
            <div className="mb-8 lg:hidden"><Brand /></div>

            <div className="rounded-[24px] border border-white bg-white/90 p-6 shadow-[0_24px_70px_rgba(8,27,63,0.09)] backdrop-blur-xl sm:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-600">NovaCloud Customer</p>
              <h2 className="mt-2 text-[30px] font-semibold tracking-[-0.035em] text-navy-900">
                {mode === "login" ? "Đăng nhập khách hàng" : "Tạo tài khoản"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {mode === "login"
                  ? "Dùng tài khoản User để truy cập khu vực khách hàng."
                  : "Tài khoản mới mặc định được tạo với role User."}
              </p>

              <div className="mt-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
                <button type="button" onClick={() => switchMode("login")} className={`h-9 rounded-lg text-xs font-semibold transition ${mode === "login" ? "bg-white text-brand-600 shadow-sm" : "text-slate-500"}`}>Đăng nhập</button>
                <button type="button" onClick={() => switchMode("register")} className={`h-9 rounded-lg text-xs font-semibold transition ${mode === "register" ? "bg-white text-brand-600 shadow-sm" : "text-slate-500"}`}>Đăng ký</button>
              </div>

              {notice && <div className="mt-5 flex gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-3 text-xs leading-5 text-emerald-700"><CheckCircle2 className="mt-0.5 size-4 shrink-0" />{notice}</div>}
              {error && <div className="mt-5 flex gap-3 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-xs leading-5 text-red-700"><AlertCircle className="mt-0.5 size-4 shrink-0" />{error}</div>}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {mode === "register" && (
                  <Field label="Họ và tên"><input required maxLength={100} value={fullName} onChange={(event) => setFullName(event.target.value)} className="input-admin" placeholder="Nguyễn Văn An" autoComplete="name" /></Field>
                )}
                <Field label="Email"><input required type="email" maxLength={150} value={email} onChange={(event) => setEmail(event.target.value)} className="input-admin" placeholder="you@example.com" autoComplete="email" /></Field>
                <Field label="Mật khẩu"><input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="input-admin" autoComplete={mode === "login" ? "current-password" : "new-password"} /></Field>
                {mode === "register" && (
                  <Field label="Xác nhận mật khẩu"><input required minLength={6} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="input-admin" autoComplete="new-password" /></Field>
                )}

                <button type="submit" disabled={loading} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(11,99,246,0.2)] transition hover:bg-brand-700 disabled:opacity-60">
                  {loading ? <LoaderCircle className="size-4 animate-spin" /> : mode === "login" ? <LogIn className="size-4" /> : <UserPlus className="size-4" />}
                  {loading ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
                </button>
              </form>

              <div className="mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-500">
                Bạn là Admin hoặc Editor?{" "}
                <Link href="/admin/login" className="font-semibold text-brand-600 hover:text-brand-700">Đăng nhập quản trị</Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-xs font-semibold text-slate-700">{label}</span>{children}</label>;
}
