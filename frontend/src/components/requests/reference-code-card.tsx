"use client";

import Link from "next/link";
import { Check, Copy, Search } from "lucide-react";
import { useState } from "react";

export function ReferenceCodeCard({
  code,
  label = "Mã yêu cầu",
}: {
  code: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-surface/70 p-4 text-left">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs text-muted">{label}</p>
          <p className="mt-1 break-all font-mono text-sm font-semibold tracking-[0.04em] text-navy-900">
            {code}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void copyCode()}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-600 transition hover:border-brand-200 hover:text-brand-600"
        >
          {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
          {copied ? "Đã sao chép" : "Sao chép mã"}
        </button>
      </div>
      <div className="mt-4 flex flex-col gap-2 border-t border-slate-200/80 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] leading-5 text-muted">
          Hãy lưu mã này cùng email đã đăng ký để tra cứu trạng thái sau này.
        </p>
        <Link
          href={`/track-request?code=${encodeURIComponent(code)}`}
          className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700"
        >
          <Search className="size-3.5" /> Tra cứu ngay
        </Link>
      </div>
    </div>
  );
}
