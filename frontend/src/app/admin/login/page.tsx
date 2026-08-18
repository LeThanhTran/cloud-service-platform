"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Cloud,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Server,
  ShieldCheck,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Brand } from "@/components/ui/brand";
import { useAuth } from "@/components/auth/auth-provider";
import { getApiBaseUrl, readProblemDetails } from "@/lib/api";
import type { AuthSession } from "@/types/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const { session, ready, saveSession } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && session && ["Admin", "Editor"].includes(session.role)) {
      router.replace("/admin/dashboard");
    }
  }, [ready, router, session]);

  useEffect(() => {
    const reason = new URLSearchParams(window.location.search).get("reason");
    if (reason === "forbidden") {
      setError("Tài khoản này không có quyền truy cập khu vực quản trị.");
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/Auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!response.ok) {
        const problem = await readProblemDetails(response);
        setError(problem.detail ?? "Đăng nhập không thành công.");
        return;
      }

      const result = (await response.json()) as AuthSession;

      if (!["Admin", "Editor"].includes(result.role)) {
        setError("Tài khoản không có quyền truy cập khu vực quản trị.");
        return;
      }

      saveSession(result);
      router.replace("/admin/dashboard");
      router.refresh();
    } catch {
      setError(
        "Không thể kết nối tới Web API. Hãy kiểm tra backend đang chạy tại localhost:5128.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7faff]">
      <div className="soft-grid pointer-events-none absolute inset-0 opacity-45 [mask-image:linear-gradient(to_bottom,black,transparent_86%)]" />
      <div className="pointer-events-none absolute -left-28 top-[-120px] size-[420px] rounded-full bg-brand-100/55 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-[-180px] size-[480px] rounded-full bg-sky-100/60 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen w-full max-w-[1320px] items-stretch px-4 py-5 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6 lg:px-8 lg:py-8">
        <section className="relative hidden overflow-hidden rounded-[28px] bg-[linear-gradient(145deg,#071a3d_0%,#0a2e69_55%,#0b63f6_145%)] p-10 text-white shadow-[0_30px_80px_rgba(8,27,63,0.2)] lg:flex lg:flex-col">
          <div className="dark-grid pointer-events-none absolute inset-0 opacity-50" />
          <div className="pointer-events-none absolute -right-24 top-16 size-72 rounded-full bg-brand-500/20 blur-3xl" />

          <div className="relative z-10">
            <Brand inverse />
          </div>

          <div className="relative z-10 my-auto max-w-[510px] py-14">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/7 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-100">
              <ShieldCheck className="size-3.5" />
              Secure Management Console
            </span>

            <h1 className="mt-6 text-[44px] font-semibold leading-[1.08] tracking-[-0.045em]">
              Quản lý Cloud rõ ràng,
              <br />
              bảo mật và tập trung.
            </h1>

            <p className="mt-5 max-w-[470px] text-sm leading-7 text-blue-100/72">
              Khu vực dành cho Admin và Editor quản lý dịch vụ, nội dung và các yêu cầu khách hàng trên NovaCloud.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {[
                [LockKeyhole, "JWT + Refresh Token", "Phiên đăng nhập an toàn"],
                [Server, "Cloud API", "Kết nối ASP.NET Core"],
                [ShieldCheck, "Role Authorization", "Admin và Editor"],
                [Cloud, "NovaCloud", "Một hệ thống quản trị"],
              ].map(([Icon, title, description]) => {
                const FeatureIcon = Icon as typeof Cloud;
                return (
                  <div key={title as string} className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur-sm">
                    <FeatureIcon className="size-5 text-sky-300" />
                    <p className="mt-3 text-xs font-semibold">{title as string}</p>
                    <p className="mt-1 text-[11px] text-blue-100/60">{description as string}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-2 text-[11px] text-blue-100/55">
            <CheckCircle2 className="size-3.5 text-emerald-300" />
            Backend API protected by JWT authentication
          </div>
        </section>

        <section className="flex items-center justify-center py-8 lg:py-0">
          <div className="w-full max-w-[455px]">
            <div className="mb-8 lg:hidden">
              <Brand />
            </div>

            <div className="rounded-[24px] border border-white bg-white/88 p-6 shadow-[0_24px_70px_rgba(8,27,63,0.09)] backdrop-blur-xl sm:p-8">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-600">
                  NovaCloud Console
                </p>
                <h2 className="mt-2 text-[30px] font-semibold tracking-[-0.035em] text-navy-900">
                  Đăng nhập quản trị
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Sử dụng tài khoản Admin hoặc Editor để tiếp tục.
                </p>
              </div>

              {error && (
                <div className="mt-5 flex gap-3 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-xs leading-5 text-red-700">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  {error}
                </div>
              )}

              <form className="mt-6 space-y-4.5" onSubmit={handleSubmit}>
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-slate-700">Email</span>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="admin@novacloud.vn"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-navy-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100/70"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-semibold text-slate-700">Mật khẩu</span>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Nhập mật khẩu"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-11 text-sm text-navy-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100/70"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-400 transition hover:text-brand-600"
                      aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(11,99,246,0.22)] transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-65"
                >
                  {loading ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" /> Đang đăng nhập...
                    </>
                  ) : (
                    <>
                      Đăng nhập <ArrowRight className="size-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5 text-[11px] text-slate-500">
                <span>JWT protected area</span>
                <Link href="/" className="font-semibold text-brand-600 hover:text-brand-700">
                  ← Về trang chủ
                </Link>
              </div>
            </div>

            <p className="mt-5 text-center text-[11px] text-slate-400">
              © 2026 NovaCloud · Management Console
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
