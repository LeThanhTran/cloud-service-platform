import Link from "next/link";
import { Cloud } from "lucide-react";

interface BrandProps {
  inverse?: boolean;
}

export function Brand({ inverse = false }: BrandProps) {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2.5 font-semibold tracking-[-0.02em]"
      aria-label="NovaCloud - Trang chủ"
    >
      <span
        className={`grid size-8 place-items-center rounded-[10px] ${
          inverse ? "bg-white/10 text-white" : "bg-brand-600 text-white"
        }`}
      >
        <Cloud className="size-[18px]" strokeWidth={2.4} />
      </span>
      <span className={`text-[18px] ${inverse ? "text-white" : "text-navy-900"}`}>
        NovaCloud
      </span>
    </Link>
  );
}
