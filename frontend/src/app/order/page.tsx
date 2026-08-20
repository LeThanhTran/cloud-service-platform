"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Cpu,
  Database,
  Gauge,
  LoaderCircle,
  MemoryStick,
  Send,
  Server,
  ShieldCheck,
} from "lucide-react";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { createOrderRequest } from "@/lib/order-affiliate-api";
import {
  billingCycleLabel,
  formatVnd,
  getPlanPrices,
  getServicePlans,
  normalizeBillingCycle,
} from "@/lib/service-api";
import type { OrderRequest } from "@/types/order-affiliate";
import type { PlanPrice, ServicePlan } from "@/types/service";

interface OrderFormState {
  customerName: string;
  email: string;
  phoneNumber: string;
  companyName: string;
  note: string;
}

const emptyForm: OrderFormState = {
  customerName: "",
  email: "",
  phoneNumber: "",
  companyName: "",
  note: "",
};

export default function OrderPage() {
  return (
    <Suspense fallback={<OrderPageSkeleton />}>
      <OrderPageContent />
    </Suspense>
  );
}

function OrderPageContent() {
  const searchParams = useSearchParams();
  const queryPlanId = searchParams.get("servicePlanId") ?? "";
  const queryBillingCycle = searchParams.get("billingCycle") ?? "";

  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [prices, setPrices] = useState<PlanPrice[]>([]);
  const [servicePlanId, setServicePlanId] = useState("");
  const [billingCycle, setBillingCycle] = useState("");
  const [form, setForm] = useState<OrderFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<OrderRequest | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [planData, priceData] = await Promise.all([getServicePlans(), getPlanPrices()]);
        if (cancelled) return;

        const activePlans = planData.filter((plan) => plan.isActive);
        const activePrices = priceData.filter((price) => price.isActive);
        setPlans(activePlans);
        setPrices(activePrices);

        const requestedPlan = activePlans.find((plan) => plan.id === queryPlanId);
        const firstPricedPlan = activePlans.find((plan) =>
          activePrices.some((price) => price.servicePlanId === plan.id),
        );
        const selectedPlanId = requestedPlan?.id ?? firstPricedPlan?.id ?? activePlans[0]?.id ?? "";
        setServicePlanId(selectedPlanId);

        const planPrices = activePrices.filter((price) => price.servicePlanId === selectedPlanId);
        const requestedCycle = normalizeBillingCycle(queryBillingCycle);
        const matchingPrice = planPrices.find(
          (price) => normalizeBillingCycle(price.billingCycle) === requestedCycle,
        );
        setBillingCycle(matchingPrice?.billingCycle ?? planPrices[0]?.billingCycle ?? "");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Không thể tải dữ liệu đăng ký dịch vụ.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [queryBillingCycle, queryPlanId]);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === servicePlanId) ?? null,
    [plans, servicePlanId],
  );

  const availablePrices = useMemo(
    () => prices.filter((price) => price.servicePlanId === servicePlanId),
    [prices, servicePlanId],
  );

  const selectedPrice = useMemo(
    () =>
      availablePrices.find(
        (price) => normalizeBillingCycle(price.billingCycle) === normalizeBillingCycle(billingCycle),
      ) ?? null,
    [availablePrices, billingCycle],
  );

  function handlePlanChange(nextPlanId: string) {
    setServicePlanId(nextPlanId);
    const nextPrices = prices.filter((price) => price.servicePlanId === nextPlanId);
    setBillingCycle(nextPrices[0]?.billingCycle ?? "");
    setError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!servicePlanId || !billingCycle) {
      setError("Vui lòng chọn gói dịch vụ có bảng giá đang hoạt động.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createOrderRequest({
        customerName: form.customerName.trim(),
        email: form.email.trim(),
        phoneNumber: form.phoneNumber.trim(),
        companyName: form.companyName.trim() || null,
        billingCycle,
        note: form.note.trim() || null,
        servicePlanId,
      });
      setSuccess(created);
      setForm(emptyForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể gửi yêu cầu đăng ký dịch vụ.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <section className="relative overflow-hidden border-b border-slate-200/70 bg-white/72 py-12 sm:py-16">
          <div className="soft-grid pointer-events-none absolute inset-0 opacity-40" />
          <div className="pointer-events-none absolute right-[6%] top-[-60%] size-[460px] rounded-full bg-brand-100/60 blur-3xl" />
          <Container className="relative">
            <Link href="/services" className="inline-flex items-center gap-2 text-xs font-semibold text-brand-600 hover:text-brand-700">
              <ArrowLeft className="size-4" /> Quay lại dịch vụ
            </Link>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Đăng ký NovaCloud</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.045em] text-navy-900 sm:text-5xl">
              Gửi yêu cầu triển khai dịch vụ
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
              Chọn gói Cloud phù hợp và để lại thông tin. Yêu cầu sẽ được lưu trực tiếp vào hệ thống để đội ngũ NovaCloud tiếp nhận và xử lý.
            </p>
          </Container>
        </section>

        <section className="py-10 sm:py-14">
          <Container>
            {loading ? (
              <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <div className="h-[620px] animate-pulse rounded-3xl border border-slate-200 bg-white/80" />
                <div className="h-[420px] animate-pulse rounded-3xl border border-slate-200 bg-white/80" />
              </div>
            ) : success ? (
              <SuccessState order={success} onCreateAnother={() => setSuccess(null)} />
            ) : (
              <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200/85 bg-white p-6 shadow-[0_18px_55px_rgba(8,27,63,0.07)] sm:p-8">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-600">Thông tin yêu cầu</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-navy-900">Đăng ký dịch vụ</h2>
                    <p className="mt-2 text-sm leading-6 text-muted">Các trường có dấu * là bắt buộc.</p>
                  </div>

                  <div className="mt-7 grid gap-5 sm:grid-cols-2">
                    <Field label="Họ và tên *">
                      <input required maxLength={100} value={form.customerName} onChange={(e) => setForm((v) => ({ ...v, customerName: e.target.value }))} className="input-admin" placeholder="Nguyễn Văn An" />
                    </Field>
                    <Field label="Email *">
                      <input required type="email" maxLength={150} value={form.email} onChange={(e) => setForm((v) => ({ ...v, email: e.target.value }))} className="input-admin" placeholder="you@example.com" />
                    </Field>
                    <Field label="Số điện thoại *">
                      <input required maxLength={30} value={form.phoneNumber} onChange={(e) => setForm((v) => ({ ...v, phoneNumber: e.target.value }))} className="input-admin" placeholder="0912 345 678" />
                    </Field>
                    <Field label="Công ty">
                      <input maxLength={150} value={form.companyName} onChange={(e) => setForm((v) => ({ ...v, companyName: e.target.value }))} className="input-admin" placeholder="Nova Technology" />
                    </Field>
                    <Field label="Gói dịch vụ *">
                      <select required value={servicePlanId} onChange={(e) => handlePlanChange(e.target.value)} className="input-admin">
                        <option value="" disabled>Chọn gói dịch vụ</option>
                        {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
                      </select>
                    </Field>
                    <Field label="Chu kỳ thanh toán *">
                      <select required value={billingCycle} onChange={(e) => setBillingCycle(e.target.value)} className="input-admin" disabled={availablePrices.length === 0}>
                        {availablePrices.length === 0 && <option value="">Chưa có bảng giá</option>}
                        {availablePrices.map((price) => (
                          <option key={price.id} value={price.billingCycle}>Theo {billingCycleLabel(price.billingCycle)} · {formatVnd(price.price)}</option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <Field label="Ghi chú" className="mt-5">
                    <textarea maxLength={1000} value={form.note} onChange={(e) => setForm((v) => ({ ...v, note: e.target.value }))} className="input-admin min-h-32 resize-y py-3" placeholder="Mô tả website, ứng dụng hoặc nhu cầu cần hỗ trợ..." />
                  </Field>

                  {error && <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-700">{error}</div>}

                  <button type="submit" disabled={submitting || !servicePlanId || !billingCycle} className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(11,99,246,0.22)] transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-55">
                    {submitting ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
                    {submitting ? "Đang gửi yêu cầu..." : "Gửi yêu cầu đăng ký"}
                  </button>
                </form>

                <OrderSummary plan={selectedPlan} price={selectedPrice} />
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
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-xs font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function OrderSummary({ plan, price }: { plan: ServicePlan | null; price: PlanPrice | null }) {
  return (
    <aside className="h-fit rounded-3xl border border-slate-200/85 bg-white p-6 shadow-[0_18px_55px_rgba(8,27,63,0.07)] lg:sticky lg:top-24">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100"><Server className="size-5" /></span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">Gói đã chọn</p>
          <h2 className="mt-1 text-lg font-semibold text-navy-900">{plan?.name ?? "Chọn dịch vụ"}</h2>
        </div>
      </div>

      {plan ? (
        <>
          <p className="mt-4 text-sm leading-6 text-muted">{plan.description || "Gói Cloud linh hoạt, sẵn sàng mở rộng theo nhu cầu vận hành."}</p>
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <MiniSpec icon={Cpu} label="CPU" value={`${plan.cpuCores} vCPU`} />
            <MiniSpec icon={MemoryStick} label="RAM" value={`${plan.ramGB} GB`} />
            <MiniSpec icon={Database} label="Storage" value={`${plan.storageGB} GB`} />
            <MiniSpec icon={Gauge} label="Bandwidth" value={`${plan.bandwidthGB} GB`} />
          </div>
          <div className="mt-5 rounded-2xl border border-brand-100 bg-brand-50/65 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-brand-700">Chi phí cơ bản</p>
            <p className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-brand-600">{price ? formatVnd(price.price) : "Chưa có giá"}</p>
            {price && <p className="mt-1 text-xs text-muted">/ {billingCycleLabel(price.billingCycle)}</p>}
          </div>
        </>
      ) : (
        <p className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-surface p-4 text-sm leading-6 text-muted">Hiện chưa có gói dịch vụ khả dụng.</p>
      )}

      <div className="mt-5 space-y-3 border-t border-slate-100 pt-5 text-xs leading-5 text-muted">
        <p className="flex gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" /> Yêu cầu được lưu trực tiếp vào hệ thống NovaCloud.</p>
        <p className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-600" /> Nhân viên sẽ tiếp nhận và cập nhật trạng thái xử lý.</p>
      </div>
    </aside>
  );
}

function MiniSpec({ icon: Icon, label, value }: { icon: typeof Cpu; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface/70 p-3">
      <Icon className="size-4 text-brand-600" />
      <p className="mt-2 text-[9px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</p>
      <p className="mt-1 text-xs font-semibold text-navy-900">{value}</p>
    </div>
  );
}

function SuccessState({ order, onCreateAnother }: { order: OrderRequest; onCreateAnother: () => void }) {
  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-emerald-100 bg-white p-8 text-center shadow-[0_18px_55px_rgba(8,27,63,0.07)] sm:p-10">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><CheckCircle2 className="size-7" /></span>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.15em] text-emerald-600">Gửi yêu cầu thành công</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-navy-900">NovaCloud đã nhận đăng ký của bạn</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted">Yêu cầu cho gói <strong className="text-navy-900">{order.servicePlanName}</strong> đã được tạo với trạng thái <strong className="text-brand-600">{order.status}</strong>.</p>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-surface/70 p-4 text-left text-xs text-muted">
        <p>Mã yêu cầu</p>
        <p className="mt-1 break-all font-mono text-sm font-semibold text-navy-900">{order.id}</p>
      </div>
      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <button type="button" onClick={onCreateAnother} className="h-11 rounded-xl border border-line bg-white px-5 text-sm font-semibold text-navy-900 hover:border-brand-200 hover:bg-brand-50/60">Gửi yêu cầu khác</button>
        <Link href="/services" className="inline-flex h-11 items-center justify-center rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700">Tiếp tục xem dịch vụ</Link>
      </div>
    </div>
  );
}

function OrderPageSkeleton() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Container className="py-16"><div className="h-[620px] animate-pulse rounded-3xl border border-slate-200 bg-white/80" /></Container>
      <Footer />
    </div>
  );
}
