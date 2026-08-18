import { Headphones, ServerCog, ShieldCheck, UsersRound } from "lucide-react";
import { Container } from "@/components/ui/container";

const stats = [
  { icon: UsersRound, value: "10.000+", label: "Khách hàng tin tưởng" },
  { icon: ServerCog, value: "99.99%", label: "Uptime cam kết" },
  { icon: ShieldCheck, value: "50.000+", label: "Dịch vụ đã triển khai" },
  { icon: Headphones, value: "24/7", label: "Hỗ trợ toàn quốc" },
];

export function StatsStrip() {
  return (
    <section className="pb-16 sm:pb-20">
      <Container>
        <div className="relative overflow-hidden rounded-[24px] border border-blue-950/20 bg-[#081b3f] text-white shadow-[0_24px_60px_rgba(8,27,63,0.20)]">
          <div className="dark-grid pointer-events-none absolute inset-0 opacity-50" />
          <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-brand-500/20 blur-3xl" />
          <div className="relative grid sm:grid-cols-2 lg:grid-cols-4">
            {stats.map(({ icon: Icon, value, label }, index) => (
              <div
                key={value}
                className={`flex items-center gap-4 px-6 py-6 ${
                  index < stats.length - 1 ? "lg:border-r lg:border-white/10" : ""
                }`}
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-brand-200">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="text-lg font-semibold tracking-[-0.02em]">{value}</p>
                  <p className="mt-0.5 text-xs text-slate-300">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
