"use client";

import {
  CheckCircle2,
  Clock3,
  Headphones,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  Send,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { createContactRequest } from "@/lib/contact-api";
import type { ContactRequest } from "@/types/contact";

const contactCards = [
  {
    icon: Phone,
    title: "Hotline",
    value: "1900 1234",
    description: "Hỗ trợ tư vấn dịch vụ trong giờ làm việc.",
  },
  {
    icon: Mail,
    title: "Email hỗ trợ",
    value: "support@novacloud.vn",
    description: "Gửi yêu cầu kỹ thuật, kinh doanh hoặc hợp tác.",
  },
  {
    icon: MapPin,
    title: "Địa chỉ",
    value: "Đồng Tháp, Việt Nam",
    description: "Đội ngũ NovaCloud sẵn sàng đồng hành cùng khách hàng.",
  },
];

export default function ContactPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<ContactRequest | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const created = await createContactRequest({
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim() || null,
        subject: subject.trim(),
        message: message.trim(),
      });

      setSuccess(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể gửi yêu cầu liên hệ.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setSuccess(null);
    setFullName("");
    setEmail("");
    setPhoneNumber("");
    setSubject("");
    setMessage("");
    setError("");
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <section className="relative overflow-hidden border-b border-slate-200/70 bg-white/75 py-14 sm:py-18">
          <div className="soft-grid pointer-events-none absolute inset-0 opacity-40" />
          <div className="pointer-events-none absolute left-[7%] top-[-75%] size-[520px] rounded-full bg-brand-100/65 blur-3xl" />

          <Container className="relative grid items-center gap-10 lg:grid-cols-[1fr_0.82fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/85 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.09em] text-brand-700 shadow-sm">
                <Headphones className="size-3.5" /> NovaCloud Support
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.045em] text-navy-900 sm:text-5xl">
                Kết nối với đội ngũ NovaCloud
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
                Gửi nhu cầu tư vấn, câu hỏi về dịch vụ hoặc yêu cầu hỗ trợ. Mỗi liên hệ
                sẽ được lưu vào hệ thống để Admin và Editor tiếp nhận, theo dõi và xử lý.
              </p>
            </div>

            <div className="grid gap-3">
              {contactCards.map(({ icon: Icon, title, value, description }) => (
                <div key={title} className="flex gap-3 rounded-2xl border border-white/90 bg-white/90 p-4 shadow-[0_12px_38px_rgba(15,23,42,0.055)] backdrop-blur">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-400">{title}</p>
                    <p className="mt-1 text-sm font-semibold text-navy-900">{value}</p>
                    <p className="mt-1 text-xs leading-5 text-muted">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>

        <section className="py-11 sm:py-16">
          <Container>
            {success ? (
              <ContactSuccess request={success} onReset={resetForm} />
            ) : (
              <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
                <aside className="h-fit rounded-3xl bg-navy-900 p-7 text-white shadow-[0_18px_55px_rgba(8,27,63,0.14)] lg:sticky lg:top-24">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sky-300">Quy trình hỗ trợ</p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">Mỗi liên hệ đều có trạng thái xử lý</h2>

                  <div className="mt-7 space-y-5">
                    {[
                      "Gửi thông tin liên hệ và nội dung cần hỗ trợ",
                      "NovaCloud tiếp nhận với trạng thái New",
                      "Admin/Editor chuyển sang Processing và hoàn tất ở Resolved",
                    ].map((item, index) => (
                      <div key={item} className="flex gap-3">
                        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-semibold text-sky-200 ring-1 ring-white/10">{index + 1}</span>
                        <p className="pt-1 text-sm leading-6 text-slate-300">{item}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-7 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-6 text-slate-300">
                    <Clock3 className="mb-2 size-5 text-sky-300" />
                    Mã yêu cầu được tạo ngay sau khi gửi thành công và sẽ được dùng cho tính năng thông báo ở bước tiếp theo.
                  </div>
                </aside>

                <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200/85 bg-white p-6 shadow-[0_18px_55px_rgba(8,27,63,0.07)] sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-600">Contact Request</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-navy-900">Gửi yêu cầu liên hệ</h2>
                  <p className="mt-2 text-sm leading-6 text-muted">Điền đầy đủ thông tin để đội ngũ NovaCloud có thể phản hồi chính xác.</p>

                  <div className="mt-7 grid gap-5 sm:grid-cols-2">
                    <Field label="Họ và tên *">
                      <input required maxLength={100} value={fullName} onChange={(event) => setFullName(event.target.value)} className="input-admin" placeholder="Nguyễn Văn An" />
                    </Field>
                    <Field label="Email *">
                      <input required type="email" maxLength={150} value={email} onChange={(event) => setEmail(event.target.value)} className="input-admin" placeholder="an@example.com" />
                    </Field>
                    <Field label="Số điện thoại">
                      <input maxLength={30} value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} className="input-admin" placeholder="0912 345 678" />
                    </Field>
                    <Field label="Chủ đề *">
                      <input required maxLength={200} value={subject} onChange={(event) => setSubject(event.target.value)} className="input-admin" placeholder="Tư vấn Cloud VPS" />
                    </Field>
                  </div>

                  <Field label="Nội dung *" className="mt-5">
                    <textarea required maxLength={2000} value={message} onChange={(event) => setMessage(event.target.value)} className="input-admin min-h-36 resize-y py-3" placeholder="Mô tả nhu cầu hoặc câu hỏi của bạn..." />
                  </Field>

                  {error && (
                    <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-700">{error}</div>
                  )}

                  <button type="submit" disabled={submitting} className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(11,99,246,0.22)] transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-55">
                    {submitting ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
                    {submitting ? "Đang gửi liên hệ..." : "Gửi yêu cầu liên hệ"}
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

function ContactSuccess({ request, onReset }: { request: ContactRequest; onReset: () => void }) {
  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-emerald-100 bg-white p-8 text-center shadow-[0_18px_55px_rgba(8,27,63,0.07)] sm:p-10">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><CheckCircle2 className="size-7" /></span>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-600">Gửi liên hệ thành công</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-navy-900">NovaCloud đã nhận yêu cầu của bạn</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted">
        Yêu cầu <strong className="text-navy-900">{request.subject}</strong> đã được lưu với trạng thái <strong className="text-brand-600">{request.status}</strong>.
      </p>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-surface/70 p-4 text-left text-xs text-muted">
        <p>Mã yêu cầu</p>
        <p className="mt-1 break-all font-mono text-sm font-semibold text-navy-900">{request.id}</p>
      </div>
      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <button type="button" onClick={onReset} className="h-11 rounded-xl border border-line bg-white px-5 text-sm font-semibold text-navy-900 hover:border-brand-200 hover:bg-brand-50/60">Gửi liên hệ khác</button>
        <Link href="/" className="inline-flex h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700">Về trang chủ</Link>
      </div>
    </div>
  );
}
