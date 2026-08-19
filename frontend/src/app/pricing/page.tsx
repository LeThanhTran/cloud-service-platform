"use client";

import Link from "next/link";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import {
  applyPromotion,
  billingCycleLabel,
  formatVnd,
  getBestPromotion,
  getPlanPrices,
  getPromotions,
  getServicePlans,
  normalizeBillingCycle,
} from "@/lib/service-api";
import type { PlanPrice, Promotion, ServicePlan } from "@/types/service";

type Cycle = "monthly" | "yearly";

export default function PricingPage() {
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [prices, setPrices] = useState<PlanPrice[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [planData, priceData, promotionData] = await Promise.all([
          getServicePlans(),
          getPlanPrices(),
          getPromotions(),
        ]);

        if (cancelled) return;
        setPlans(planData.filter((plan) => plan.isActive));
        setPrices(priceData.filter((price) => price.isActive));
        setPromotions(promotionData);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Không thể tải bảng giá.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const availableCycles = useMemo(
    () => new Set(prices.map((price) => normalizeBillingCycle(price.billingCycle))),
    [prices],
  );

  const visiblePlans = useMemo(() => {
    return plans
      .map((plan) => ({
        plan,
        price: prices.find(
          (item) =>
            item.servicePlanId === plan.id &&
            normalizeBillingCycle(item.billingCycle) === cycle,
        ),
        promotion: getBestPromotion(promotions.filter((item) => item.servicePlanId === plan.id)),
      }))
      .filter((item) => item.price)
      .sort((a, b) => Number(b.plan.isFeatured) - Number(a.plan.isFeatured));
  }, [cycle, plans, prices, promotions]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <section className="relative overflow-hidden border-b border-slate-200/70 bg-white/70 py-14 text-center sm:py-18">
          <div className="pointer-events-none absolute left-1/2 top-[-90%] size-[560px] -translate-x-1/2 rounded-full bg-brand-100/60 blur-3xl" />
          <Container className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Bảng giá NovaCloud</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-navy-900 sm:text-5xl">Cấu hình rõ ràng, chi phí minh bạch</h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
              Giá bên dưới được đồng bộ trực tiếp từ PlanPrice và Promotion trong backend.
            </p>

            <div className="mt-7 inline-flex rounded-xl border border-line bg-white p-1 shadow-sm">
              <button
                type="button"
                disabled={!availableCycles.has("monthly")}
                onClick={() => setCycle("monthly")}
                className={`h-9 rounded-lg px-5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${cycle === "monthly" ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-surface"}`}
              >
                Theo tháng
              </button>
              <button
                type="button"
                disabled={!availableCycles.has("yearly")}
                onClick={() => setCycle("yearly")}
                className={`h-9 rounded-lg px-5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${cycle === "yearly" ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-surface"}`}
              >
                Theo năm
              </button>
            </div>
          </Container>
        </section>

        <section className="py-12 sm:py-16">
          <Container>
            {loading && <div className="grid gap-5 lg:grid-cols-3">{[0,1,2].map((item) => <div key={item} className="h-[430px] animate-pulse rounded-2xl border border-slate-200 bg-white/80" />)}</div>}

            {!loading && error && (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-700">{error}</div>
            )}

            {!loading && !error && visiblePlans.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
                <h2 className="text-lg font-semibold text-navy-900">Chưa có giá cho chu kỳ này</h2>
                <p className="mt-2 text-sm text-muted">Admin có thể thêm PlanPrice trong khu vực quản trị ở checkpoint tiếp theo.</p>
              </div>
            )}

            {!loading && !error && visiblePlans.length > 0 && (
              <div className="grid gap-5 lg:grid-cols-3">
                {visiblePlans.map(({ plan, price, promotion }) => {
                  if (!price) return null;
                  const discounted = applyPromotion(price.price, promotion);
                  const hasDiscount = promotion && discounted < price.price;

                  return (
                    <article key={plan.id} className={`relative rounded-2xl bg-white p-6 shadow-[0_16px_45px_rgba(15,23,42,0.065)] ${plan.isFeatured ? "border-2 border-brand-500" : "border border-slate-200/90"}`}>
                      {plan.isFeatured && <span className="absolute -top-3 left-5 rounded-full bg-brand-600 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white">Phổ biến</span>}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">Cloud plan</p>
                          <h2 className="mt-1 text-xl font-semibold text-navy-900">{plan.name}</h2>
                        </div>
                        {promotion && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">-{promotion.discountPercent}%</span>}
                      </div>

                      <div className="mt-6">
                        {hasDiscount && <p className="text-sm text-slate-400 line-through">{formatVnd(price.price)}</p>}
                        <div className="mt-1 flex items-end gap-1.5">
                          <span className={`text-3xl font-semibold tracking-[-0.04em] ${plan.isFeatured ? "text-brand-600" : "text-navy-900"}`}>{formatVnd(discounted)}</span>
                          <span className="pb-1 text-xs text-muted">/ {billingCycleLabel(price.billingCycle)}</span>
                        </div>
                      </div>

                      <div className="mt-7 space-y-3">
                        {[`${plan.cpuCores} vCPU`, `${plan.ramGB} GB RAM`, `${plan.storageGB} GB Storage`, `${plan.bandwidthGB} GB Bandwidth`, "Hỗ trợ kỹ thuật 24/7"].map((feature) => (
                          <div key={feature} className="flex items-center gap-2.5 text-sm text-slate-600">
                            <span className={`grid size-5 place-items-center rounded-full ${plan.isFeatured ? "bg-brand-50 text-brand-600" : "bg-emerald-50 text-emerald-600"}`}><Check className="size-3.5" strokeWidth={2.5} /></span>
                            {feature}
                          </div>
                        ))}
                      </div>

                      <Link href={`/services/${plan.id}`} className={`mt-7 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition ${plan.isFeatured ? "bg-brand-600 text-white hover:bg-brand-700" : "border border-line bg-white text-navy-900 hover:border-brand-200 hover:bg-brand-50/60"}`}>
                        Xem gói dịch vụ <ArrowRight className="size-4" />
                      </Link>
                    </article>
                  );
                })}
              </div>
            )}

            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted">
              <ShieldCheck className="size-4 text-brand-600" /> Giá và khuyến mãi được đọc trực tiếp từ backend NovaCloud.
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </div>
  );
}
