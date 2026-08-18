import Link from "next/link";
import { Check, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/container";

const plans = [
  {
    name: "BASIC",
    price: "199.000đ",
    features: ["2 vCPU", "4 GB RAM", "80 GB SSD NVMe", "1 TB Bandwidth", "Hỗ trợ 24/7"],
  },
  {
    name: "PRO",
    price: "399.000đ",
    featured: true,
    features: ["4 vCPU", "8 GB RAM", "160 GB SSD NVMe", "2 TB Bandwidth", "1 IP Public", "Hỗ trợ 24/7"],
  },
  {
    name: "BUSINESS",
    price: "699.000đ",
    features: ["8 vCPU", "16 GB RAM", "320 GB SSD NVMe", "4 TB Bandwidth", "1 IP Public", "Hỗ trợ 24/7"],
  },
];

export function PricingPreview() {
  return (
    <section id="pricing" className="relative overflow-hidden border-y border-slate-200/70 bg-white/70 py-16 backdrop-blur-sm sm:py-20">
      <div className="pointer-events-none absolute left-1/2 top-0 h-56 w-[760px] -translate-x-1/2 rounded-full bg-brand-50 blur-3xl" />
      <Container className="relative">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Bảng giá dịch vụ</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-navy-900 sm:text-4xl">
            Chọn cấu hình phù hợp với bạn
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted sm:text-base">
            Giá minh họa cho giao diện; dữ liệu dịch vụ thật sẽ được đồng bộ từ backend ở module quản lý dịch vụ.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`relative rounded-2xl bg-white p-6 shadow-[0_12px_38px_rgba(15,23,42,0.06)] ${
                plan.featured
                  ? "border-2 border-brand-500 shadow-[0_20px_50px_rgba(11,99,246,0.12)]"
                  : "border border-slate-200/90"
              }`}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-5 rounded-full bg-brand-600 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white shadow-sm">
                  Phổ biến
                </span>
              )}
              <p className="text-xs font-semibold tracking-[0.08em] text-navy-900">{plan.name}</p>
              <div className="mt-5 flex items-end gap-1.5">
                <span className={`text-3xl font-semibold tracking-[-0.04em] ${plan.featured ? "text-brand-600" : "text-navy-900"}`}>
                  {plan.price}
                </span>
                <span className="pb-1 text-xs text-muted">/ tháng</span>
              </div>

              <div className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2.5 text-sm text-slate-600">
                    <span className={`grid size-5 place-items-center rounded-full ${plan.featured ? "bg-brand-50 text-brand-600" : "bg-emerald-50 text-emerald-600"}`}>
                      <Check className="size-3.5" strokeWidth={2.5} />
                    </span>
                    {feature}
                  </div>
                ))}
              </div>

              <Link
                href="/pricing"
                className={`mt-7 inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold transition ${
                  plan.featured
                    ? "bg-brand-600 text-white shadow-[0_10px_24px_rgba(11,99,246,0.22)] hover:bg-brand-700"
                    : "border border-line bg-white text-navy-900 hover:border-brand-200 hover:bg-brand-50/60"
                }`}
              >
                Đặt ngay
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted">
          <ShieldCheck className="size-4 text-brand-600" />
          <span><strong className="font-semibold text-brand-600">Dùng thử 7 ngày miễn phí</strong> · Không cần thanh toán trước</span>
        </div>
      </Container>
    </section>
  );
}
