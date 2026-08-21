"use client";

import { FileClock, LoaderCircle, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CustomerRequestCard } from "@/components/account/customer-request-card";
import { getCustomerRequests } from "@/lib/customer-account-api";
import type {
  CustomerRequestItem,
  CustomerRequestType,
} from "@/types/customer-account";

type FilterType = "All" | CustomerRequestType;

const filters: Array<{ label: string; value: FilterType }> = [
  { label: "Tất cả", value: "All" },
  { label: "Dịch vụ", value: "Order" },
  { label: "Liên hệ", value: "Contact" },
  { label: "Affiliate", value: "Affiliate" },
];

export default function AccountRequestsPage() {
  const [items, setItems] = useState<CustomerRequestItem[]>([]);
  const [filter, setFilter] = useState<FilterType>("All");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const result = await getCustomerRequests();
        if (active) setItems(result);
      } catch (reason) {
        if (active) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Không thể tải danh sách yêu cầu.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchesType = filter === "All" || item.requestType === filter;
      const matchesQuery =
        !keyword ||
        item.referenceCode.toLowerCase().includes(keyword) ||
        item.title.toLowerCase().includes(keyword) ||
        (item.subtitle ?? "").toLowerCase().includes(keyword) ||
        item.status.toLowerCase().includes(keyword);

      return matchesType && matchesQuery;
    });
  }, [filter, items, query]);

  return (
    <div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-600">
          Request history
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-navy-900">
          Yêu cầu của tôi
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Danh sách được lấy theo email tài khoản đang đăng nhập. Bạn không thể xem yêu cầu của email khác.
        </p>
      </div>

      <div className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/55 p-3 lg:grid-cols-[1fr_auto]">
        <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5">
          <Search className="size-4 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm theo mã, tên hoặc trạng thái..."
            className="h-10 w-full bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
          />
        </label>

        <div className="flex gap-2 overflow-x-auto">
          {filters.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={`h-10 shrink-0 rounded-xl px-3.5 text-xs font-semibold transition ${
                filter === item.value
                  ? "bg-navy-900 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:text-brand-600"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-slate-500">
          <LoaderCircle className="size-5 animate-spin text-brand-600" />
          Đang tải yêu cầu...
        </div>
      ) : error ? (
        <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-9 text-center">
          <FileClock className="mx-auto size-8 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-600">
            Không có yêu cầu phù hợp
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Thử đổi bộ lọc hoặc từ khóa tìm kiếm.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {filtered.map((item) => (
            <CustomerRequestCard key={`${item.requestType}-${item.id}`} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
