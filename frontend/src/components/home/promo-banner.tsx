import { ArrowRight, BarChart3, CheckCircle2, Layers3, ShieldCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";

export function PromoBanner() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <div className="relative overflow-hidden rounded-[28px] border border-blue-950/20 bg-[#071a3d] px-6 py-8 text-white shadow-[0_26px_70px_rgba(8,27,63,0.22)] sm:px-9 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-10 lg:px-11 lg:py-10">
          <div className="dark-grid pointer-events-none absolute inset-0 opacity-55" />
          <div className="pointer-events-none absolute -right-20 -top-24 size-80 rounded-full bg-brand-500/25 blur-3xl" />
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-blue-100">
              <ShieldCheck className="size-3.5" /> NovaCloud Control Center
            </span>
            <h2 className="mt-5 max-w-[520px] text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
              Quản lý dịch vụ Cloud dễ dàng từ một nơi
            </h2>
            <div className="mt-6 space-y-3 text-sm text-slate-300">
              {["Theo dõi tài nguyên trực quan", "Quản lý dịch vụ nhanh chóng", "Hỗ trợ kỹ thuật 24/7"].map((item) => (
                <p key={item} className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 text-blue-300" /> {item}
                </p>
              ))}
            </div>
            <ButtonLink href="/admin/login" className="mt-7 gap-2 bg-brand-600 hover:bg-brand-500">
              Đăng nhập quản trị <ArrowRight className="size-4" />
            </ButtonLink>
          </div>

          <div className="relative z-10 mt-9 lg:mt-0">
            <div className="mx-auto max-w-[560px] rotate-[1deg] rounded-[22px] border border-white/15 bg-white/[0.97] p-3 text-navy-900 shadow-[0_32px_70px_rgba(0,0,0,0.25)]">
              <div className="flex items-center justify-between border-b border-line px-2 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-rose-300" />
                  <span className="size-2 rounded-full bg-amber-300" />
                  <span className="size-2 rounded-full bg-emerald-300" />
                </div>
                <span className="text-[9px] font-semibold text-slate-400">dashboard.novacloud.vn</span>
              </div>
              <div className="grid grid-cols-[0.72fr_1.28fr] gap-3 pt-3">
                <div className="rounded-xl bg-[#0b2550] p-3 text-white">
                  <div className="mb-4 flex items-center gap-2 text-[10px] font-semibold"><Layers3 className="size-4 text-blue-300" /> NovaCloud</div>
                  {["Dashboard", "Dịch vụ", "Đơn hàng", "Khuyến mãi"].map((item, index) => (
                    <div key={item} className={`mb-1.5 rounded-lg px-2.5 py-2 text-[8px] ${index === 0 ? "bg-brand-600" : "text-slate-300"}`}>{item}</div>
                  ))}
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {["128", "24", "36"].map((value, index) => (
                      <div key={value} className="rounded-xl border border-line bg-slate-50 p-2.5">
                        <span className="text-[7px] text-slate-400">{["Đơn hàng", "Dịch vụ", "Tin tức"][index]}</span>
                        <p className="mt-1 text-sm font-semibold">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-line bg-white p-3">
                    <div className="mb-3 flex items-center justify-between"><span className="text-[8px] font-semibold">Tăng trưởng</span><BarChart3 className="size-4 text-brand-600" /></div>
                    <div className="flex h-24 items-end gap-2">
                      {[38, 54, 46, 72, 58, 82, 68, 90, 74, 86].map((height, index) => (
                        <span key={index} className="flex-1 rounded-t bg-brand-500/80" style={{ height: `${height}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
