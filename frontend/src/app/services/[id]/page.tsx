"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { ArrowLeft, BadgePercent, Cpu, Database, Gauge, MemoryStick, QrCode, ShieldCheck } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import {
  applyPromotion,
  billingCycleLabel,
  formatVnd,
  getBestPromotion,
  getPlanPricesByPlan,
  getPromotionsByPlan,
  getServicePlan,
  getServicePlanQrUrl,
} from "@/lib/service-api";
import type { PlanPrice, Promotion, ServicePlan } from "@/types/service";

export default function ServiceDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [plan, setPlan] = useState<ServicePlan | null>(null);
  const [prices, setPrices] = useState<PlanPrice[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [planData, priceData, promotionData] = await Promise.all([
          getServicePlan(id),
          getPlanPricesByPlan(id),
          getPromotionsByPlan(id),
        ]);

        if (cancelled) return;
        setPlan(planData);
        setPrices(priceData.filter((price) => price.isActive));
        setPromotions(promotionData);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Không thể tải chi tiết gói dịch vụ.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (id) void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const promotion = useMemo(() => getBestPromotion(promotions), [promotions]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <Container className="py-16">
          <div className="h-[520px] animate-pulse rounded-3xl border border-slate-200 bg-white/80" />
        </Container>
        <Footer />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <Container className="py-20 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Service detail</p>
          <h1 className="mt-3 text-3xl font-semibold text-navy-900">Không tìm thấy gói dịch vụ</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted">{error || "Gói dịch vụ này không tồn tại hoặc đã được gỡ khỏi hệ thống."}</p>
          <Link href="/services" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white">
            <ArrowLeft className="size-4" /> Quay lại dịch vụ
          </Link>
        </Container>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="py-10 sm:py-14">
        <Container>
          <Link href="/services" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700">
            <ArrowLeft className="size-4" /> Tất cả dịch vụ
          </Link>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
            <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_18px_55px_rgba(8,27,63,0.07)] sm:p-8">
              <div className="pointer-events-none absolute right-[-80px] top-[-90px] size-64 rounded-full bg-brand-100/50 blur-3xl" />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-brand-700">Cloud Service Plan</span>
                  {plan.isFeatured && <span className="rounded-full bg-brand-600 px-3 py-1 text-[10px] font-semibold text-white">Phổ biến</span>}
                </div>

                <h1 className="mt-5 text-4xl font-semibold tracking-[-0.045em] text-navy-900 sm:text-5xl">{plan.name}</h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
                  {plan.description || "Gói Cloud được thiết kế cho hiệu năng ổn định, khả năng mở rộng linh hoạt và vận hành liên tục."}
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <DetailSpec icon={Cpu} label="CPU" value={`${plan.cpuCores} vCPU`} />
                  <DetailSpec icon={MemoryStick} label="RAM" value={`${plan.ramGB} GB`} />
                  <DetailSpec icon={Database} label="Storage" value={`${plan.storageGB} GB`} />
                  <DetailSpec icon={Gauge} label="Bandwidth" value={`${plan.bandwidthGB} GB`} />
                </div>

                {promotion && (
                  <div className="mt-7 flex gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-emerald-600 shadow-sm">
                      <BadgePercent className="size-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-emerald-900">{promotion.name} · Giảm {promotion.discountPercent}%</p>
                      <p className="mt-1 text-xs leading-5 text-emerald-700">{promotion.description || `Ưu đãi đang áp dụng đến ${new Date(promotion.endDate).toLocaleDateString("vi-VN")}.`}</p>
                    </div>
                  </div>
                )}

                <div className="mt-8">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Bảng giá</p>
                      <h2 className="mt-1 text-xl font-semibold text-navy-900">Chọn chu kỳ thanh toán</h2>
                    </div>
                  </div>

                  {prices.length === 0 ? (
                    <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-surface/60 p-5 text-sm text-muted">
                      Gói này chưa được cấu hình giá. Vui lòng liên hệ NovaCloud để được tư vấn.
                    </div>
                  ) : (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {prices.map((price) => {
                        const discounted = applyPromotion(price.price, promotion);
                        const hasDiscount = promotion && discounted < price.price;

                        return (
                          <div key={price.id} className="rounded-2xl border border-slate-200 bg-surface/55 p-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">Theo {billingCycleLabel(price.billingCycle)}</p>
                            {hasDiscount && <p className="mt-3 text-sm text-slate-400 line-through">{formatVnd(price.price)}</p>}
                            <p className="mt-1 text-2xl font-semibold tracking-[-0.035em] text-brand-600">{formatVnd(discounted)}</p>
                            <p className="mt-1 text-xs text-muted">/{billingCycleLabel(price.billingCycle)}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href={`/contact?plan=${plan.id}`} className="inline-flex h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(11,99,246,0.20)] hover:bg-brand-700">
                    Đăng ký dịch vụ
                  </Link>
                  <Link href="/pricing" className="inline-flex h-11 items-center justify-center rounded-xl border border-line bg-white px-5 text-sm font-semibold text-navy-900 hover:border-brand-200 hover:bg-brand-50/60">
                    So sánh bảng giá
                  </Link>
                </div>
              </div>
            </section>

            <aside className="h-fit rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_18px_55px_rgba(8,27,63,0.07)] lg:sticky lg:top-24">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><QrCode className="size-5" /></span>
                <div>
                  <h2 className="text-sm font-semibold text-navy-900">QR gói dịch vụ</h2>
                  <p className="mt-0.5 text-xs text-muted">Quét để mở nhanh trang này</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                <img src={getServicePlanQrUrl(plan.id)} alt={`QR code ${plan.name}`} className="mx-auto aspect-square w-full max-w-[250px] object-contain" />
              </div>

              <div className="mt-5 space-y-3 text-xs text-muted">
                <p className="flex items-start gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" /> QR được sinh trực tiếp từ backend NovaCloud.</p>
                <p>Đích đến: <span className="break-all font-medium text-brand-600">/services/{plan.id}</span></p>
              </div>
            </aside>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}

function DetailSpec({ icon: Icon, label, value }: { icon: typeof Cpu; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface/60 p-4">
      <Icon className="size-5 text-brand-600" />
      <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">{label}</p>
      <p className="mt-1 text-base font-semibold text-navy-900">{value}</p>
    </div>
  );
}
