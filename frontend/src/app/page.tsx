import { ArrowRight, DatabaseZap, Headphones, ShieldCheck, TimerReset } from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { HeroVisual } from "@/components/home/hero-visual";
import { PricingPreview } from "@/components/home/pricing-preview";
import { PromoBanner } from "@/components/home/promo-banner";
import { ServicesPreview } from "@/components/home/services-preview";
import { SocialProof } from "@/components/home/social-proof";
import { StatsStrip } from "@/components/home/stats-strip";
import { NewsPreview } from "@/components/home/news-preview";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";

const trustItems = [
  { icon: TimerReset, value: "99.99%", label: "Uptime cam kết" },
  { icon: DatabaseZap, value: "NVMe SSD", label: "Hiệu năng vượt trội" },
  { icon: Headphones, value: "24/7", label: "Hỗ trợ kỹ thuật" },
  { icon: ShieldCheck, value: "Bảo mật", label: "An toàn dữ liệu" },
];

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden">
      <Navbar />

      <main>
        <section className="relative overflow-hidden border-b border-slate-200/70 bg-white/58 backdrop-blur-[2px]">
          <div className="soft-grid pointer-events-none absolute inset-0 opacity-45 [mask-image:linear-gradient(to_bottom,black,transparent_84%)]" />
          <div className="pointer-events-none absolute left-[-12%] top-[-20%] size-[520px] rounded-full bg-brand-100/45 blur-3xl" />
          <div className="pointer-events-none absolute right-[-8%] top-[2%] size-[460px] rounded-full bg-sky-100/55 blur-3xl" />
          <div className="pointer-events-none absolute left-[46%] top-[28%] h-48 w-48 rounded-full bg-brand-50/90 blur-3xl" />

          <Container className="relative grid min-h-[575px] items-center gap-8 pb-14 pt-12 lg:grid-cols-[0.94fr_1.06fr] lg:pb-16 lg:pt-14">
            <div className="relative z-10 max-w-[570px]">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/75 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-700 shadow-sm backdrop-blur">
                <span className="size-1.5 rounded-full bg-brand-600" />
                Hạ tầng Cloud thế hệ mới
              </div>

              <h1 className="max-w-[570px] text-[43px] font-semibold leading-[1.08] tracking-[-0.045em] text-navy-900 sm:text-[51px] lg:text-[58px]">
                Cloud mạnh mẽ
                <br />
                Doanh nghiệp <span className="text-brand-600">bứt phá</span>
              </h1>

              <p className="mt-5 max-w-[525px] text-[15px] leading-7 text-muted sm:text-base">
                NovaCloud cung cấp hạ tầng Cloud tốc độ cao, bảo mật và linh hoạt, sẵn sàng mở rộng theo mọi nhu cầu vận hành của doanh nghiệp.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/services" className="gap-2">
                  Khám phá dịch vụ <ArrowRight className="size-4" />
                </ButtonLink>
                <ButtonLink href="/pricing" variant="secondary">
                  Xem bảng giá
                </ButtonLink>
              </div>
            </div>

            <HeroVisual />
          </Container>

          <Container className="relative z-20 -mt-8 pb-10 lg:-mt-12 lg:pb-11">
            <div className="grid overflow-hidden rounded-2xl border border-white/90 bg-white/86 shadow-[0_16px_45px_rgba(8,27,63,0.075)] backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-4">
              {trustItems.map(({ icon: Icon, value, label }, index) => (
                <div
                  key={value}
                  className={`flex items-center gap-3.5 px-5 py-4 ${
                    index < trustItems.length - 1 ? "lg:border-r lg:border-slate-200/80" : ""
                  }`}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-brand-50 text-brand-600 ring-1 ring-brand-100/80">
                    <Icon className="size-[18px]" strokeWidth={2} />
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-navy-900">{value}</p>
                    <p className="mt-0.5 text-[11px] text-muted">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>

        <ServicesPreview />
        <StatsStrip />
        <PricingPreview />
        <PromoBanner />
        <NewsPreview />
        <SocialProof />
      </main>

      <Footer />
    </div>
  );
}
