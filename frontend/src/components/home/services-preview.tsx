"use client";

import Link from "next/link";
import { ArrowRight, Cpu, Database, Gauge, Server } from "lucide-react";
import { useEffect, useState } from "react";
import { Container } from "@/components/ui/container";
import { getServicePlans } from "@/lib/service-api";
import type { ServicePlan } from "@/types/service";

export function ServicesPreview() {
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void getServicePlans()
      .then((data) => {
        if (cancelled) return;
        const active = data.filter((plan) => plan.isActive);
        const featured = active.filter((plan) => plan.isFeatured);
        setPlans((featured.length > 0 ? featured : active).slice(0, 5));
      })
      .catch(() => {
        if (!cancelled) setPlans([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="services" className="relative py-16 sm:py-20">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Dịch vụ nổi bật</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-navy-900 sm:text-4xl">Hạ tầng phù hợp cho từng nhu cầu</h2>
          <p className="mt-3 text-sm leading-6 text-muted sm:text-base">Các gói nổi bật bên dưới được tải trực tiếp từ ServicePlan API.</p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {loading && [0,1,2,3,4].map((item) => <div key={item} className="h-[265px] animate-pulse rounded-2xl border border-slate-200 bg-white/75" />)}

          {!loading && plans.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white/75 p-8 text-center text-sm text-muted">Chưa có ServicePlan đang hoạt động.</div>
          )}

          {!loading && plans.map((plan) => (
            <article key={plan.id} className="group rounded-2xl border border-slate-200/80 bg-white/92 p-5 shadow-[0_10px_35px_rgba(15,23,42,0.055)] backdrop-blur-sm transition duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_18px_45px_rgba(11,99,246,0.10)]">
              <div className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100"><Server className="size-5" /></div>
              <div className="mt-5 flex items-center gap-2">
                <h3 className="text-[15px] font-semibold text-navy-900">{plan.name}</h3>
                {plan.isFeatured && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[9px] font-semibold text-brand-700">HOT</span>}
              </div>
              <p className="mt-2 line-clamp-2 min-h-[40px] text-[12.5px] leading-5 text-muted">{plan.description || "Gói Cloud linh hoạt, tối ưu cho nhu cầu vận hành."}</p>
              <div className="mt-4 space-y-2 text-[11px] text-slate-600">
                <p className="flex items-center gap-2"><Cpu className="size-3.5 text-brand-600" /> {plan.cpuCores} vCPU · {plan.ramGB} GB RAM</p>
                <p className="flex items-center gap-2"><Database className="size-3.5 text-brand-600" /> {plan.storageGB} GB Storage</p>
                <p className="flex items-center gap-2"><Gauge className="size-3.5 text-brand-600" /> {plan.bandwidthGB} GB Bandwidth</p>
              </div>
              <Link href={`/services/${plan.id}`} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 transition group-hover:gap-2">Xem chi tiết <ArrowRight className="size-3.5" /></Link>
            </article>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/services" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700">Xem tất cả dịch vụ <ArrowRight className="size-4" /></Link>
        </div>
      </Container>
    </section>
  );
}
