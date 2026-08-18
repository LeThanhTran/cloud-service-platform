import {
  Activity,
  Cloud,
  Cpu,
  Gauge,
  HardDrive,
  LockKeyhole,
  Network,
  Server,
  ShieldCheck,
} from "lucide-react";

export function HeroVisual() {
  return (
    <div className="relative mx-auto aspect-[1.16/1] w-full max-w-[590px]" aria-hidden="true">
      <div className="hero-grid absolute inset-[2%] rounded-[34px]" />
      <div className="absolute left-[16%] top-[11%] h-[62%] w-[72%] rounded-full bg-brand-100/65 blur-[54px]" />

      <div className="absolute left-[54%] top-[8%] z-30 flex h-[112px] w-[146px] -translate-x-1/2 items-center justify-center rounded-[34px] border border-white/90 bg-white/95 shadow-[0_24px_75px_rgba(11,99,246,0.16)]">
        <Cloud className="size-[62px] fill-brand-50 text-brand-600" strokeWidth={1.65} />
        <div className="absolute -right-3 top-3 grid size-10 place-items-center rounded-xl bg-brand-600 text-white shadow-[0_10px_24px_rgba(11,99,246,0.28)]">
          <ShieldCheck className="size-5" />
        </div>
      </div>

      <div className="absolute bottom-[21%] right-[7%] z-20 w-[49%] rounded-[26px] border border-brand-100 bg-[linear-gradient(145deg,#ffffff_0%,#f2f7ff_100%)] p-3 shadow-[0_30px_70px_rgba(11,99,246,0.16)]">
        <div className="mb-2.5 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-brand-500" />
            <span className="h-1.5 w-14 rounded-full bg-slate-200" />
          </div>
          <Activity className="size-4 text-emerald-500" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <ServerRack />
          <ServerRack featured />
          <ServerRack />
        </div>
      </div>

      <div className="absolute bottom-[9%] left-[10%] z-40 w-[56%] rotate-[-2deg] rounded-[22px] border border-line bg-white shadow-[0_28px_65px_rgba(8,27,63,0.14)]">
        <div className="flex items-center gap-1.5 border-b border-line px-4 py-2.5">
          <span className="size-2 rounded-full bg-rose-300" />
          <span className="size-2 rounded-full bg-amber-300" />
          <span className="size-2 rounded-full bg-emerald-300" />
          <span className="ml-2 h-1.5 w-16 rounded-full bg-slate-100" />
        </div>
        <div className="grid grid-cols-[0.72fr_1.28fr] gap-3 p-3.5">
          <div className="space-y-2">
            <MiniMetric icon={Gauge} label="CPU" value="42%" />
            <MiniMetric icon={HardDrive} label="SSD" value="68%" />
            <MiniMetric icon={Network} label="NET" value="1.8G" />
          </div>
          <div className="rounded-xl border border-brand-100 bg-brand-50/65 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[8px] font-semibold uppercase tracking-[0.12em] text-brand-700">Cloud Console</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[7px] font-semibold text-emerald-700">Online</span>
            </div>
            <div className="flex h-[66px] items-end gap-1.5">
              {[34, 48, 42, 64, 54, 76, 61, 86].map((height, index) => (
                <span
                  key={index}
                  className="flex-1 rounded-t-[4px] bg-brand-500/80"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="absolute -bottom-3 left-1/2 h-3 w-[74%] -translate-x-1/2 rounded-b-[20px] bg-slate-200 shadow-sm" />
      </div>

      <FloatingIcon className="left-[4%] top-[47%]" icon={LockKeyhole} />
      <FloatingIcon className="right-[2%] top-[41%]" icon={Server} />
      <FloatingIcon className="left-[24%] top-[18%]" icon={Cpu} small />

      <div className="absolute bottom-[3%] left-1/2 h-5 w-[72%] -translate-x-1/2 rounded-[50%] bg-navy-900/10 blur-xl" />
    </div>
  );
}

function ServerRack({ featured = false }: { featured?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-1.5 ${
        featured ? "border-brand-200 bg-brand-50" : "border-line bg-white"
      }`}
    >
      {[0, 1, 2].map((item) => (
        <div key={item} className="mb-1.5 flex h-8 items-center gap-1.5 rounded-lg border border-brand-100 bg-white px-2 last:mb-0">
          <span className="size-1.5 rounded-full bg-brand-500" />
          <span className="h-1 flex-1 rounded-full bg-slate-100" />
          <span className="size-1 rounded-full bg-emerald-400" />
        </div>
      ))}
    </div>
  );
}

function MiniMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1.5">
      <div className="flex items-center gap-1.5">
        <Icon className="size-3 text-brand-600" />
        <span className="text-[7px] font-semibold text-slate-500">{label}</span>
      </div>
      <span className="text-[7px] font-semibold text-navy-900">{value}</span>
    </div>
  );
}

function FloatingIcon({
  icon: Icon,
  className,
  small = false,
}: {
  icon: typeof Server;
  className: string;
  small?: boolean;
}) {
  return (
    <div
      className={`absolute z-40 grid place-items-center rounded-2xl border border-line bg-white text-brand-600 shadow-[0_16px_42px_rgba(8,27,63,0.11)] ${
        small ? "size-10" : "size-12"
      } ${className}`}
    >
      <Icon className={small ? "size-4" : "size-5"} />
    </div>
  );
}
