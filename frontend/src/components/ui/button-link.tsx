import Link from "next/link";
import type { ReactNode } from "react";

interface ButtonLinkProps {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
}: ButtonLinkProps) {
  const styles =
    variant === "primary"
      ? "bg-brand-600 text-white shadow-[0_8px_22px_rgba(11,99,246,0.22)] hover:bg-brand-700"
      : "border border-line bg-white text-navy-900 hover:border-brand-200 hover:bg-brand-50/60";

  return (
    <Link
      href={href}
      className={`inline-flex h-11 items-center justify-center rounded-[10px] px-5 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${styles} ${className}`}
    >
      {children}
    </Link>
  );
}
