"use client";

import {
  Bell,
  CheckCheck,
  CircleAlert,
  FileText,
  Handshake,
  LoaderCircle,
  Mail,
  Server,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/notification-api";
import type { NotificationItem } from "@/types/notification";

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

function NotificationIcon({ type }: { type: string }) {
  const key = type.toLowerCase();
  if (key === "order") return <Server className="size-4" />;
  if (key === "affiliate") return <Handshake className="size-4" />;
  if (key === "contact") return <Mail className="size-4" />;
  if (key === "news") return <FileText className="size-4" />;
  return <CircleAlert className="size-4" />;
}

export default function AccountNotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const result = await getNotifications(false, 50);
        if (active) setItems(result);
      } catch (reason) {
        if (active) {
          setError(
            reason instanceof Error ? reason.message : "Không thể tải thông báo.",
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

  const unreadCount = items.filter((item) => !item.isRead).length;

  async function openItem(item: NotificationItem) {
    if (!item.isRead) {
      try {
        await markNotificationAsRead(item.id);
        setItems((current) =>
          current.map((value) =>
            value.id === item.id ? { ...value, isRead: true } : value,
          ),
        );
      } catch {
        // Vẫn cho phép điều hướng tới nội dung liên quan.
      }
    }

    if (item.link) router.push(item.link);
  }

  async function markAllRead() {
    setUpdating(true);
    setError("");
    try {
      await markAllNotificationsAsRead();
      setItems((current) => current.map((item) => ({ ...item, isRead: true })));
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Không thể cập nhật thông báo.",
      );
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-600">
            Notifications
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-navy-900">
            Thông báo của tôi
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Cập nhật trạng thái Order, Contact, Affiliate và các thay đổi bảo mật tài khoản.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void markAllRead()}
            disabled={updating}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 text-xs font-semibold text-brand-700 transition hover:bg-brand-100 disabled:opacity-60"
          >
            {updating ? <LoaderCircle className="size-4 animate-spin" /> : <CheckCheck className="size-4" />}
            Đọc tất cả ({unreadCount})
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-slate-500">
          <LoaderCircle className="size-5 animate-spin text-brand-600" />
          Đang tải thông báo...
        </div>
      ) : error ? (
        <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-9 text-center">
          <Bell className="mx-auto size-8 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-600">Chưa có thông báo</p>
          <p className="mt-1 text-xs text-slate-400">Các cập nhật mới sẽ xuất hiện tại đây.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => void openItem(item)}
              className={`flex w-full gap-3.5 border-b border-slate-100 p-4 text-left transition last:border-b-0 hover:bg-slate-50 sm:p-5 ${
                item.isRead ? "bg-white" : "bg-brand-50/35"
              }`}
            >
              <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${item.isRead ? "bg-slate-100 text-slate-500" : "bg-brand-100 text-brand-700"}`}>
                <NotificationIcon type={item.type} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-3">
                  <span className="text-sm font-semibold text-navy-900">{item.title}</span>
                  {!item.isRead && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-600" />}
                </span>
                <span className="mt-1.5 block text-xs leading-5 text-slate-500">{item.message}</span>
                <span className="mt-2 block text-[10.5px] font-medium text-slate-400">{formatDate(item.createdAt)}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
