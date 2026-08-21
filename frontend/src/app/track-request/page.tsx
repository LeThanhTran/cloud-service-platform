"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileSearch,
  LoaderCircle,
  Mail,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { lookupRequest } from "@/lib/request-tracking-api";
import type { RequestTrackingResult } from "@/types/request-tracking";

export default function TrackRequestPage() {
  return (
    <Suspense fallback={<TrackRequestSkeleton />}>
      <TrackRequestContent />
    </Suspense>
  );
}

function TrackRequestContent() {
  const searchParams = useSearchParams();
  const [referenceCode, setReferenceCode] = useState(
    (searchParams.get("code") ?? "").toUpperCase(),
  );
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<RequestTrackingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const data = await lookupRequest({
        referenceCode: referenceCode.trim().toUpperCase(),
        email: email.trim(),
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tra cứu yêu cầu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <section className="relative overflow-hidden border-b border-slate-200/70 bg-white/72 py-12 sm:py-16">
          <div className="soft-grid pointer-events-none absolute inset-0 opacity-40" />
          <Container className="relative">
            <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-brand-600 hover:text-brand-700">
              <ArrowLeft className="size-4" /> Về trang chủ
            </Link>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Request Tracking</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.045em] text-navy-900 sm:text-5xl">
              Tra cứu trạng thái yêu cầu
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
              Nhập mã yêu cầu NovaCloud và email đã dùng khi đăng ký. Hệ thống chỉ hiển thị thông tin khi cả hai dữ liệu khớp nhau.
            </p>
          </Container>
        </section>

        <section className="py-10 sm:py-14">
          <Container>
            <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <form onSubmit={submit} className="h-fit rounded-3xl border border-slate-200/85 bg-white p-6 shadow-[0_18px_55px_rgba(8,27,63,0.07)] sm:p-8">
                <div className="flex items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
                    <FileSearch className="size-5" />
                  </span>
                  <div>
                    <h2 className="text-xl font-semibold tracking-[-0.025em] text-navy-900">Thông tin tra cứu</h2>
                    <p className="mt-1 text-xs leading-5 text-muted">Ví dụ mã: ORD-20260821-A8D3Q9</p>
                  </div>
                </div>

                <label className="mt-6 block">
                  <span className="mb-2 block text-xs font-semibold text-slate-700">Mã yêu cầu *</span>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                      required
                      maxLength={30}
                      value={referenceCode}
                      onChange={(event) => setReferenceCode(event.target.value.toUpperCase())}
                      className="input-admin !pl-10 font-mono uppercase"
                      placeholder="CON-20260821-K4M7P2"
                    />
                  </div>
                </label>

                <label className="mt-5 block">
                  <span className="mb-2 block text-xs font-semibold text-slate-700">Email đã đăng ký *</span>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                      required
                      type="email"
                      maxLength={150}
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="input-admin !pl-10"
                      placeholder="you@example.com"
                    />
                  </div>
                </label>

                {error && (
                  <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(11,99,246,0.22)] transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {loading ? <LoaderCircle className="size-4 animate-spin" /> : <Search className="size-4" />}
                  {loading ? "Đang tra cứu..." : "Tra cứu yêu cầu"}
                </button>

                <div className="mt-5 flex gap-2.5 rounded-xl bg-slate-50 p-3.5 text-[11px] leading-5 text-slate-500">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  Email không được đưa vào URL và phải khớp với yêu cầu để bảo vệ thông tin khách hàng.
                </div>
              </form>

              <div className="rounded-3xl border border-slate-200/85 bg-white p-6 shadow-[0_18px_55px_rgba(8,27,63,0.07)] sm:p-8">
                {result ? <TrackingResultCard result={result} /> : <EmptyTrackingState />}
              </div>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function TrackingResultCard({ result }: { result: RequestTrackingResult }) {
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-600">Đã tìm thấy yêu cầu</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-navy-900">{result.title}</h2>
          {result.subtitle && <p className="mt-2 text-sm leading-6 text-muted">{result.subtitle}</p>}
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
          <CheckCircle2 className="size-5" />
        </span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <InfoBlock label="Mã yêu cầu" value={result.referenceCode} mono />
        <InfoBlock label="Loại yêu cầu" value={requestTypeLabel(result.requestType)} />
        <InfoBlock label="Ngày gửi" value={formatDateTime(result.createdAt)} />
        <InfoBlock label="Cập nhật gần nhất" value={formatDateTime(result.updatedAt ?? result.createdAt)} />
      </div>

      <div className="mt-5 rounded-2xl border border-brand-100 bg-brand-50/60 p-5">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-700">
          <Clock3 className="size-4" /> Trạng thái hiện tại
        </div>
        <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-navy-900">{statusLabel(result.status)}</p>
        <p className="mt-2 text-xs leading-5 text-muted">{statusDescription(result.requestType, result.status)}</p>
      </div>

      <p className="mt-5 text-[11px] leading-5 text-slate-400">
        Trang này hiển thị trạng thái hiện tại. Lịch sử thao tác chi tiết sẽ được lưu riêng trong Audit Log của hệ thống quản trị.
      </p>
    </div>
  );
}

function EmptyTrackingState() {
  return (
    <div className="grid min-h-[380px] place-items-center text-center">
      <div className="max-w-sm">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-slate-50 text-slate-400 ring-1 ring-slate-200">
          <FileSearch className="size-6" />
        </span>
        <h2 className="mt-5 text-xl font-semibold tracking-[-0.02em] text-navy-900">Chưa có kết quả tra cứu</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Nhập mã yêu cầu và email ở biểu mẫu bên trái để xem trạng thái mới nhất.</p>
      </div>
    </div>
  );
}

function InfoBlock({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-400">{label}</p>
      <p className={`mt-2 break-words text-xs font-semibold text-navy-900 ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function requestTypeLabel(value: string) {
  if (value === "Order") return "Đăng ký dịch vụ";
  if (value === "Affiliate") return "Hồ sơ Affiliate";
  return "Liên hệ hỗ trợ";
}

function statusLabel(value: string) {
  const labels: Record<string, string> = {
    New: "Mới tiếp nhận",
    Processing: "Đang xử lý",
    Completed: "Hoàn tất",
    Rejected: "Từ chối",
    Resolved: "Đã giải quyết",
  };
  return labels[value] ?? value;
}

function statusDescription(type: string, status: string) {
  if (status === "New") return "NovaCloud đã tiếp nhận yêu cầu và đang chờ nhân viên xử lý.";
  if (status === "Processing") return "Yêu cầu đang được đội ngũ NovaCloud xử lý.";
  if (status === "Completed") return type === "Affiliate" ? "Hồ sơ đã được duyệt và hoàn tất xử lý." : "Yêu cầu dịch vụ đã hoàn tất xử lý.";
  if (status === "Resolved") return "Yêu cầu liên hệ đã được NovaCloud giải quyết.";
  if (status === "Rejected") return "Yêu cầu đã bị từ chối. Vui lòng kiểm tra email hoặc liên hệ NovaCloud nếu cần hỗ trợ.";
  return "Trạng thái yêu cầu đã được cập nhật.";
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function TrackRequestSkeleton() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Container className="py-16"><div className="h-[520px] animate-pulse rounded-3xl border border-slate-200 bg-white/80" /></Container>
      <Footer />
    </div>
  );
}
