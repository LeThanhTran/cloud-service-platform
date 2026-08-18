import { ArrowRight, Mail, Quote } from "lucide-react";
import { Container } from "@/components/ui/container";

export function SocialProof() {
  return (
    <section className="pb-16 sm:pb-20">
      <Container>
        <div className="grid overflow-hidden rounded-[24px] border border-slate-200/80 bg-white/90 shadow-[0_16px_48px_rgba(15,23,42,0.06)] backdrop-blur-sm lg:grid-cols-2">
          <div className="relative p-7 sm:p-9">
            <Quote className="size-8 text-brand-100" fill="currentColor" />
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-navy-900">Khách hàng nói về chúng tôi</h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600">
              “NovaCloud giúp hệ thống của chúng tôi vận hành ổn định hơn rõ rệt. Hạ tầng dễ mở rộng và đội ngũ hỗ trợ phản hồi rất nhanh.”
            </p>
            <div className="mt-6 flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">NA</div>
              <div>
                <p className="text-sm font-semibold text-navy-900">Nguyễn Văn An</p>
                <p className="text-xs text-muted">CTO · Tech Solutions</p>
              </div>
            </div>
          </div>

          <div className="relative border-t border-line bg-[linear-gradient(135deg,#f8fbff_0%,#eef6ff_100%)] p-7 sm:p-9 lg:border-l lg:border-t-0">
            <div className="pointer-events-none absolute right-8 top-7 grid size-16 place-items-center rounded-2xl bg-white/70 text-brand-600 shadow-sm">
              <Mail className="size-7" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Cập nhật mới nhất</p>
            <h2 className="mt-3 max-w-sm text-2xl font-semibold tracking-[-0.03em] text-navy-900">Nhận tin công nghệ và ưu đãi NovaCloud</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted">Nhận thông tin khuyến mãi, cập nhật hạ tầng và các bài viết kỹ thuật mới.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                placeholder="Email của bạn"
                className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-white px-4 text-sm text-navy-900 outline-none transition placeholder:text-slate-400 focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
              />
              <button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white shadow-[0_9px_22px_rgba(11,99,246,0.20)] transition hover:bg-brand-700">
                Đăng ký <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
