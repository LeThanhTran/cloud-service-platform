"use client";

import Link from "next/link";
import { Check, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Container } from "@/components/ui/container";
import { applyPromotion, billingCycleLabel, formatVnd, getBestPromotion, getPlanPrices, getPromotions, getServicePlans, normalizeBillingCycle } from "@/lib/service-api";
import type { PlanPrice, Promotion, ServicePlan } from "@/types/service";

export function PricingPreview() {
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [prices, setPrices] = useState<PlanPrice[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void Promise.all([getServicePlans(), getPlanPrices(), getPromotions()])
      .then(([planData, priceData, promotionData]) => {
        if (cancelled) return;
        setPlans(planData.filter((plan) => plan.isActive));
        setPrices(priceData.filter((price) => price.isActive));
        setPromotions(promotionData);
      })
      .catch(() => {
        if (!cancelled) {
          setPlans([]);
          setPrices([]);
          setPromotions([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const cards = useMemo(() => {
    return plans
      .map((plan) => {
        const planPrices = prices.filter((price) => price.servicePlanId === plan.id);
        const monthly = planPrices.find((price) => normalizeBillingCycle(price.billingCycle) === "monthly");
        const price = monthly ?? planPrices[0];
        const promotion = getBestPromotion(promotions.filter((item) => item.servicePlanId === plan.id));
        return { plan, price, promotion };
      })
      .filter((item) => item.price)
      .sort((a, b) => Number(b.plan.isFeatured) - Number(a.plan.isFeatured))
      .slice(0, 3);
  }, [plans, prices, promotions]);

  return (
    <section id="pricing" className="relative overflow-hidden border-y border-slate-200/70 bg-white/70 py-16 backdrop-blur-sm sm:py-20">
      <div className="pointer-events-none absolute left-1/2 top-0 h-56 w-[760px] -translate-x-1/2 rounded-full bg-brand-50 blur-3xl" />
      <Container className="relative">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Bảng giá dịch vụ</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-navy-900 sm:text-4xl">Chọn cấu hình phù hợp với bạn</h2>
          <p className="mt-3 text-sm leading-6 text-muted sm:text-base">Giá và khuyến mãi hiển thị trực tiếp từ PlanPrice và Promotion API.</p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {loading && [0,1,2].map((item) => <div key={item} className="h-[420px] animate-pulse rounded-2xl border border-slate-200 bg-white" />)}

          {!loading && cards.length === 0 && <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-muted">Chưa có PlanPrice đang hoạt động.</div>}

          {!loading && cards.map(({ plan, price, promotion }) => {
            if (!price) return null;
            const discounted = applyPromotion(price.price, promotion);
            const hasDiscount = promotion && discounted < price.price;

            return (
              <article key={plan.id} className={`relative rounded-2xl bg-white p-6 shadow-[0_12px_38px_rgba(15,23,42,0.06)] ${plan.isFeatured ? "border-2 border-brand-500 shadow-[0_20px_50px_rgba(11,99,246,0.12)]" : "border border-slate-200/90"}`}>
                {plan.isFeatured && <span className="absolute -top-3 left-5 rounded-full bg-brand-600 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white shadow-sm">Phổ biến</span>}
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-semibold tracking-[0.08em] text-navy-900">{plan.name}</p>
                  {promotion && <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-700">-{promotion.discountPercent}%</span>}
                </div>

                <div className="mt-5">
                  {hasDiscount && <p className="text-xs text-slate-400 line-through">{formatVnd(price.price)}</p>}
                  <div className="flex items-end gap-1.5">
                    <span className={`text-3xl font-semibold tracking-[-0.04em] ${plan.isFeatured ? "text-brand-600" : "text-navy-900"}`}>{formatVnd(discounted)}</span>
                    <span className="pb-1 text-xs text-muted">/ {billingCycleLabel(price.billingCycle)}</span>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {[`${plan.cpuCores} vCPU`, `${plan.ramGB} GB RAM`, `${plan.storageGB} GB Storage`, `${plan.bandwidthGB} GB Bandwidth`, "Hỗ trợ 24/7"].map((feature) => (
                    <div key={feature} className="flex items-center gap-2.5 text-sm text-slate-600"><span className={`grid size-5 place-items-center rounded-full ${plan.isFeatured ? "bg-brand-50 text-brand-600" : "bg-emerald-50 text-emerald-600"}`}><Check className="size-3.5" strokeWidth={2.5} /></span>{feature}</div>
                  ))}
                </div>

                <Link href={`/services/${plan.id}`} className={`mt-7 inline-flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold transition ${plan.isFeatured ? "bg-brand-600 text-white shadow-[0_10px_24px_rgba(11,99,246,0.22)] hover:bg-brand-700" : "border border-line bg-white text-navy-900 hover:border-brand-200 hover:bg-brand-50/60"}`}>Xem chi tiết</Link>
              </article>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted"><ShieldCheck className="size-4 text-brand-600" /><span>Dữ liệu bảng giá được đồng bộ từ backend NovaCloud.</span></div>
        <div className="mt-5 text-center"><Link href="/pricing" className="text-sm font-semibold text-brand-600 hover:text-brand-700">Xem toàn bộ bảng giá →</Link></div>
      </Container>
    </section>
  );
}
