"use client";

import Link from "next/link";
import {
  BadgePercent,
  CheckCircle2,
  Handshake,
  LoaderCircle,
  Send,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { ReferenceCodeCard } from "@/components/requests/reference-code-card";
import { createAffiliateApplication } from "@/lib/order-affiliate-api";
import type { AffiliateApplication } from "@/types/order-affiliate";

const benefits = [
  { icon: WalletCards, title: "Cơ hội doanh thu", description: "Giới thiệu giải pháp Cloud phù hợp tới khách hàng và mở rộng nguồn doanh thu hợp tác." },
  { icon: Users, title: "Đồng hành lâu dài", description: "NovaCloud xây dựng quan hệ đối tác minh bạch, hỗ trợ xuyên suốt quá trình tư vấn khách hàng." },
  { icon: ShieldCheck, title: "Hạ tầng đáng tin cậy", description: "Danh mục Cloud VPS, Hosting và dịch vụ hạ tầng hướng đến tính ổn định và khả năng mở rộng." },
];

export default function AffiliatePage() {
  const { session, ready } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<AffiliateApplication | null>(null);

  useEffect(() => {
    if (!ready || session?.role !== "User") return;
    setFullName((value) => value || session.fullName);
    setEmail(session.email);
  }, [ready, session]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const created = await createAffiliateApplication({
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        companyName: companyName.trim() || null,
        website: website.trim() || null,
        note: note.trim() || null,
      });
      setSuccess(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể gửi hồ sơ Affiliate.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <section className="relative overflow-hidden border-b border-slate-200/70 bg-white/72 py-14 sm:py-18">
          <div className="soft-grid pointer-events-none absolute inset-0 opacity-40" />
          <div className="pointer-events-none absolute left-[8%] top-[-75%] size-[500px] rounded-full bg-brand-100/60 blur-3xl" />
          <Container className="relative grid items-center gap-9 lg:grid-cols-[1fr_0.85fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.09em] text-brand-700 shadow-sm">
                <Handshake className="size-3.5" /> NovaCloud Partner
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.045em] text-navy-900 sm:text-5xl">Trở thành đối tác cùng NovaCloud</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">Đăng ký Affiliate để cùng NovaCloud kết nối khách hàng với các giải pháp Cloud phù hợp, minh bạch và có khả năng mở rộng.</p>
              <div className="mt-6 flex flex-wrap gap-3 text-xs font-semibold text-slate-600">
                <span className="rounded-full border border-line bg-white px-3 py-2">Đăng ký miễn phí</span>
                <span className="rounded-full border border-line bg-white px-3 py-2">Quy trình rõ ràng</span>
                <span className="rounded-full border border-line bg-white px-3 py-2">Hỗ trợ đối tác</span>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {benefits.map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex gap-3 rounded-2xl border border-white/90 bg-white/88 p-4 shadow-[0_12px_38px_rgba(15,23,42,0.055)] backdrop-blur">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon className="size-5" /></span>
                  <div><h2 className="text-sm font-semibold text-navy-900">{title}</h2><p className="mt-1 text-xs leading-5 text-muted">{description}</p></div>
                </div>
              ))}
            </div>
          </Container>
        </section>

        <section className="py-11 sm:py-16">
          <Container>
            {success ? (
              <AffiliateSuccess application={success} onReset={() => {
                setSuccess(null); setFullName(session?.role === "User" ? session.fullName : ""); setEmail(session?.role === "User" ? session.email : ""); setPhoneNumber(""); setCompanyName(""); setWebsite(""); setNote("");
              }} />
            ) : (
              <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
                <aside className="h-fit rounded-3xl bg-navy-900 p-7 text-white shadow-[0_18px_55px_rgba(8,27,63,0.14)] lg:sticky lg:top-24">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sky-300">Quy trình tham gia</p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">Bắt đầu chỉ với một hồ sơ</h2>
                  <div className="mt-7 space-y-5">
                    {["Gửi thông tin đăng ký Affiliate", "NovaCloud tiếp nhận và chuyển trạng thái xử lý", "Đội ngũ liên hệ để trao đổi phương án hợp tác"].map((item, index) => (
                      <div key={item} className="flex gap-3">
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-semibold text-sky-200 ring-1 ring-white/10">{index + 1}</span>
                        <p className="pt-1 text-sm leading-6 text-slate-300">{item}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-7 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-6 text-slate-300">
                    <BadgePercent className="mb-2 size-5 text-sky-300" /> Hồ sơ mới được tạo với trạng thái <strong className="text-white">New</strong> và được quản lý trực tiếp trong hệ thống.
                  </div>
                </aside>

                <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200/85 bg-white p-6 shadow-[0_18px_55px_rgba(8,27,63,0.07)] sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-600">Hồ sơ Affiliate</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-navy-900">Thông tin đăng ký đối tác</h2>
                  <p className="mt-2 text-sm leading-6 text-muted">Điền thông tin liên hệ để NovaCloud có thể phản hồi hồ sơ.</p>

                  <div className="mt-7 grid gap-5 sm:grid-cols-2">
                    <Field label="Họ và tên *"><input required maxLength={100} value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-admin" placeholder="Trần Minh Khoa" /></Field>
                    <Field label="Email *"><input required readOnly={session?.role === "User"} type="email" maxLength={150} value={email} onChange={(e) => setEmail(e.target.value)} className="input-admin read-only:bg-slate-50 read-only:text-slate-500" placeholder="khoa@example.com" /></Field>
                    <Field label="Số điện thoại *"><input required maxLength={30} value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="input-admin" placeholder="0987 654 321" /></Field>
                    <Field label="Công ty"><input maxLength={150} value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="input-admin" placeholder="Khoa Digital" /></Field>
                  </div>
                  <Field label="Website" className="mt-5"><input type="url" maxLength={500} value={website} onChange={(e) => setWebsite(e.target.value)} className="input-admin" placeholder="https://example.com" /></Field>
                  <Field label="Nội dung hợp tác" className="mt-5"><textarea maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} className="input-admin min-h-32 resize-y py-3" placeholder="Mô tả nhóm khách hàng, kênh giới thiệu hoặc mong muốn hợp tác..." /></Field>

                  {error && <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-700">{error}</div>}

                  <button type="submit" disabled={submitting} className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(11,99,246,0.22)] transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-55">
                    {submitting ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
                    {submitting ? "Đang gửi hồ sơ..." : "Gửi hồ sơ Affiliate"}
                  </button>
                </form>
              </div>
            )}
          </Container>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`block ${className}`}><span className="mb-2 block text-xs font-semibold text-slate-700">{label}</span>{children}</label>;
}

function AffiliateSuccess({ application, onReset }: { application: AffiliateApplication; onReset: () => void }) {
  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-emerald-100 bg-white p-8 text-center shadow-[0_18px_55px_rgba(8,27,63,0.07)] sm:p-10">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><CheckCircle2 className="size-7" /></span>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-600">Đăng ký thành công</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-navy-900">Cảm ơn bạn đã đăng ký đối tác</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted">Hồ sơ của <strong className="text-navy-900">{application.fullName}</strong> đã được lưu với trạng thái <strong className="text-brand-600">{application.status}</strong>.</p>
      <ReferenceCodeCard code={application.referenceCode} label="Mã hồ sơ" />
      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <button type="button" onClick={onReset} className="h-11 rounded-xl border border-line bg-white px-5 text-sm font-semibold text-navy-900 hover:border-brand-200 hover:bg-brand-50/60">Gửi hồ sơ khác</button>
        <Link href="/" className="inline-flex h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700">Về trang chủ</Link>
      </div>
    </div>
  );
}
