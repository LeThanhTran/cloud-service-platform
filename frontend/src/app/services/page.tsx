"use client";

import Link from "next/link";
import { ArrowRight, Cpu, Database, Gauge, MemoryStick, Search, Server, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Container } from "@/components/ui/container";
import { getServiceCategories, getServicePlans } from "@/lib/service-api";
import type { ServiceCategory, ServicePlan } from "@/types/service";

export default function ServicesPage() {
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [planData, categoryData] = await Promise.all([
          getServicePlans(),
          getServiceCategories(),
        ]);

        if (cancelled) return;
        setPlans(planData.filter((plan) => plan.isActive));
        setCategories(categoryData.filter((category) => category.isActive));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Không thể tải danh sách dịch vụ.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );

  const filteredPlans = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return plans.filter((plan) => {
      const matchesCategory =
        selectedCategory === "all" || plan.serviceCategoryId === selectedCategory;
      const categoryName = categoryMap.get(plan.serviceCategoryId)?.name ?? "";
      const matchesQuery =
        !keyword ||
        plan.name.toLowerCase().includes(keyword) ||
        (plan.description ?? "").toLowerCase().includes(keyword) ||
        categoryName.toLowerCase().includes(keyword);

      return matchesCategory && matchesQuery;
    });
  }, [categoryMap, plans, query, selectedCategory]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <section className="relative overflow-hidden border-b border-slate-200/70 bg-white/70 py-14 sm:py-18">
          <div className="soft-grid pointer-events-none absolute inset-0 opacity-40" />
          <div className="pointer-events-none absolute right-[8%] top-[-40%] size-[420px] rounded-full bg-brand-100/55 blur-3xl" />
          <Container className="relative">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Dịch vụ NovaCloud</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-navy-900 sm:text-5xl">
                Hạ tầng Cloud cho mọi quy mô
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
                Khám phá các gói dịch vụ đang hoạt động từ hệ thống NovaCloud. Thông số bên dưới được tải trực tiếp từ Web API.
              </p>
            </div>
          </Container>
        </section>

        <section className="py-12 sm:py-16">
          <Container>
            <div className="grid gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-[0_12px_38px_rgba(15,23,42,0.055)] md:grid-cols-[1fr_auto]">
              <label className="flex items-center gap-3 rounded-xl border border-line bg-surface/70 px-4">
                <Search className="size-4 text-muted" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Tìm VPS, Hosting, Domain..."
                  className="h-11 w-full bg-transparent text-sm text-navy-900 outline-none placeholder:text-slate-400"
                />
              </label>

              <div className="flex items-center gap-2 overflow-x-auto">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <SlidersHorizontal className="size-4" />
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className={`h-10 shrink-0 rounded-xl px-4 text-xs font-semibold transition ${
                    selectedCategory === "all"
                      ? "bg-navy-900 text-white"
                      : "border border-line bg-white text-slate-600 hover:border-brand-200 hover:text-brand-600"
                  }`}
                >
                  Tất cả
                </button>
                {categories.map((category) => (
                  <button
                    type="button"
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`h-10 shrink-0 rounded-xl px-4 text-xs font-semibold transition ${
                      selectedCategory === category.id
                        ? "bg-navy-900 text-white"
                        : "border border-line bg-white text-slate-600 hover:border-brand-200 hover:text-brand-600"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {loading && <LoadingGrid />}

            {!loading && error && (
              <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-700">
                <p className="font-semibold">Không thể tải dịch vụ</p>
                <p className="mt-1 text-red-600">{error}</p>
              </div>
            )}

            {!loading && !error && filteredPlans.length === 0 && (
              <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <Server className="mx-auto size-9 text-brand-500" />
                <h2 className="mt-4 text-lg font-semibold text-navy-900">Chưa có gói dịch vụ phù hợp</h2>
                <p className="mt-2 text-sm text-muted">Thử đổi từ khóa hoặc chọn danh mục khác.</p>
              </div>
            )}

            {!loading && !error && filteredPlans.length > 0 && (
              <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredPlans.map((plan) => (
                  <ServicePlanCard
                    key={plan.id}
                    plan={plan}
                    categoryName={categoryMap.get(plan.serviceCategoryId)?.name}
                  />
                ))}
              </div>
            )}
          </Container>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function ServicePlanCard({ plan, categoryName }: { plan: ServicePlan; categoryName?: string }) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200/85 bg-white p-6 shadow-[0_12px_38px_rgba(15,23,42,0.055)] transition duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-[0_20px_48px_rgba(11,99,246,0.10)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-600 via-sky-400 to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-4">
        <div className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
          <Server className="size-5" />
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {categoryName && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">{categoryName}</span>}
          {plan.isFeatured && <span className="rounded-full bg-brand-600 px-2.5 py-1 text-[10px] font-semibold text-white">Nổi bật</span>}
        </div>
      </div>

      <h2 className="mt-5 text-xl font-semibold tracking-[-0.025em] text-navy-900">{plan.name}</h2>
      <p className="mt-2 min-h-[48px] text-sm leading-6 text-muted">
        {plan.description || "Gói Cloud linh hoạt dành cho nhu cầu vận hành và mở rộng hệ thống."}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Spec icon={Cpu} label="CPU" value={`${plan.cpuCores} vCPU`} />
        <Spec icon={MemoryStick} label="RAM" value={`${plan.ramGB} GB`} />
        <Spec icon={Database} label="Storage" value={`${plan.storageGB} GB`} />
        <Spec icon={Gauge} label="Bandwidth" value={`${plan.bandwidthGB} GB`} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2.5">
        <Link
          href={`/services/${plan.id}`}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-white text-sm font-semibold text-navy-900 transition hover:border-brand-200 hover:bg-brand-50/60"
        >
          Chi tiết <ArrowRight className="size-4" />
        </Link>
        <Link
          href={`/order?servicePlanId=${plan.id}`}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-brand-600 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Đặt ngay
        </Link>
      </div>
    </article>
  );
}

function Spec({ icon: Icon, label, value }: { icon: typeof Cpu; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface/75 p-3">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
        <Icon className="size-3.5 text-brand-600" /> {label}
      </div>
      <p className="mt-1.5 text-sm font-semibold text-navy-900">{value}</p>
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="h-[360px] animate-pulse rounded-2xl border border-slate-200 bg-white/80" />
      ))}
    </div>
  );
}
