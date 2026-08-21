"use client";

import { FileText, Handshake, Mail, Server } from "lucide-react";
import type { CustomerRequestItem } from "@/types/customer-account";

function parseUtcDate(value: string) {
  const hasTimeZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
  return new Date(hasTimeZone ? value : `${value}Z`);
}

function formatDate(value: string) {
  const date = parseUtcDate(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function requestTypeLabel(type: CustomerRequestItem["requestType"]) {
  if (type === "Order") return "Dịch vụ";
  if (type === "Contact") return "Liên hệ";
  return "Affiliate";
}

export function requestTypeIcon(type: CustomerRequestItem["requestType"]) {
  if (type === "Order") return Server;
  if (type === "Contact") return Mail;
  if (type === "Affiliate") return Handshake;
  return FileText;
}

export function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  const className =
    key === "completed" || key === "resolved"
      ? "border-emerald-100 bg-emerald-50 text-emerald-700"
      : key === "rejected"
        ? "border-red-100 bg-red-50 text-red-700"
        : key === "processing"
          ? "border-amber-100 bg-amber-50 text-amber-700"
          : "border-brand-100 bg-brand-50 text-brand-700";

  const label =
    key === "new"
      ? "Mới tiếp nhận"
      : key === "processing"
        ? "Đang xử lý"
        : key === "completed"
          ? "Hoàn tất"
          : key === "resolved"
            ? "Đã giải quyết"
            : key === "rejected"
              ? "Từ chối"
              : status;

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${className}`}>
      {label}
    </span>
  );
}

export function CustomerRequestCard({ item }: { item: CustomerRequestItem }) {
  const Icon = requestTypeIcon(item.requestType);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-brand-200 hover:shadow-[0_12px_32px_rgba(11,99,246,0.07)] sm:p-5">
      <div className="flex items-start gap-3.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
          <Icon className="size-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-brand-600">
                {requestTypeLabel(item.requestType)}
              </p>
              <h3 className="mt-1 truncate text-sm font-semibold text-navy-900">
                {item.title}
              </h3>
            </div>
            <StatusBadge status={item.status} />
          </div>

          {item.subtitle && (
            <p className="mt-2 text-xs leading-5 text-slate-500">{item.subtitle}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10.5px] text-slate-400">
            <span className="font-mono font-semibold text-slate-600">{item.referenceCode}</span>
            <span>{formatDate(item.createdAt)}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
