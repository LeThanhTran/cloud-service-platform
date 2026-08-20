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
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/notification-api";
import type { NotificationItem } from "@/types/notification";

type NotificationBellProps = {
  compact?: boolean;
};

function parseUtcDate(value: string) {
  // SQL Server datetime2 không lưu timezone. Nếu API cũ trả chuỗi không có
  // Z/offset, coi giá trị đó là UTC để tránh lệch đúng 7 giờ ở Việt Nam.
  const hasTimeZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
  return new Date(hasTimeZone ? value : `${value}Z`);
}

function relativeTime(value: string) {
  const createdDate = parseUtcDate(value);
  const created = createdDate.getTime();

  if (Number.isNaN(created)) return "";

  const seconds = Math.max(0, Math.floor((Date.now() - created) / 1000));

  if (seconds < 60) return "Vừa xong";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} ngày trước`;

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(createdDate);
}

function NotificationIcon({ type }: { type: string }) {
  const key = type.toLowerCase();

  if (key === "order") return <Server className="size-4" />;
  if (key === "affiliate") return <Handshake className="size-4" />;
  if (key === "contact") return <Mail className="size-4" />;
  if (key === "news") return <FileText className="size-4" />;

  return <CircleAlert className="size-4" />;
}

export function NotificationBell({ compact = false }: NotificationBellProps) {
  const router = useRouter();
  const { session, ready } = useAuth();
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCount = useCallback(async () => {
    if (!session) return;

    try {
      setUnreadCount(await getUnreadNotificationCount());
    } catch {
      // Không làm gián đoạn giao diện nếu polling tạm thời thất bại.
    }
  }, [session]);

  const loadItems = useCallback(async () => {
    if (!session) return;

    setLoading(true);
    setError(null);

    try {
      const [notifications, count] = await Promise.all([
        getNotifications(false, 20),
        getUnreadNotificationCount(),
      ]);

      setItems(notifications);
      setUnreadCount(count);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Không thể tải thông báo.",
      );
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!ready || !session) return;

    void loadCount();

    const timer = window.setInterval(() => {
      void loadCount();
    }, 30000);

    return () => window.clearInterval(timer);
  }, [loadCount, ready, session]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  if (!ready || !session) return null;

  async function toggleOpen() {
    const next = !open;
    setOpen(next);

    if (next) {
      await loadItems();
    }
  }

  async function openNotification(notification: NotificationItem) {
    if (!notification.isRead) {
      try {
        await markNotificationAsRead(notification.id);
        setItems((current) =>
          current.map((item) =>
            item.id === notification.id ? { ...item, isRead: true } : item,
          ),
        );
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch {
        // Vẫn cho phép điều hướng tới nội dung liên quan.
      }
    }

    setOpen(false);
    router.push(notification.link);
  }

  async function markAllRead() {
    try {
      await markAllNotificationsAsRead();
      setItems((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      );
      setUnreadCount(0);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Không thể cập nhật thông báo.",
      );
    }
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => void toggleOpen()}
        className={
          compact
            ? "relative grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:text-brand-600"
            : "relative grid size-10 place-items-center rounded-xl border border-line bg-white text-slate-600 transition hover:border-brand-200 hover:text-brand-600"
        }
        aria-label="Thông báo"
        aria-expanded={open}
      >
        <Bell className="size-4" />

        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white ring-2 ring-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-[80] w-[390px] max-w-[calc(100vw-24px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(8,27,63,0.18)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
            <div>
              <p className="text-sm font-semibold text-navy-900">Thông báo</p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {unreadCount > 0
                  ? `${unreadCount} thông báo chưa đọc`
                  : "Bạn đã đọc tất cả thông báo"}
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-600 transition hover:text-brand-700"
              >
                <CheckCheck className="size-3.5" />
                Đọc tất cả
              </button>
            )}
          </div>

          <div className="max-h-[430px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-10 text-xs text-slate-500">
                <LoaderCircle className="size-4 animate-spin text-brand-600" />
                Đang tải thông báo...
              </div>
            ) : error ? (
              <div className="px-4 py-8 text-center text-xs leading-5 text-red-600">
                {error}
              </div>
            ) : items.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <Bell className="mx-auto size-6 text-slate-300" />
                <p className="mt-3 text-xs font-semibold text-slate-600">
                  Chưa có thông báo
                </p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Các cập nhật mới sẽ xuất hiện tại đây.
                </p>
              </div>
            ) : (
              items.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => void openNotification(notification)}
                  className={`flex w-full gap-3 border-b border-slate-100 px-4 py-3.5 text-left transition last:border-b-0 hover:bg-slate-50 ${
                    notification.isRead ? "bg-white" : "bg-brand-50/45"
                  }`}
                >
                  <span
                    className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl ${
                      notification.isRead
                        ? "bg-slate-100 text-slate-500"
                        : "bg-brand-100 text-brand-700"
                    }`}
                  >
                    <NotificationIcon type={notification.type} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-3">
                      <span className="truncate text-xs font-semibold text-navy-900">
                        {notification.title}
                      </span>
                      {!notification.isRead && (
                        <span className="mt-1 size-2 shrink-0 rounded-full bg-brand-600" />
                      )}
                    </span>

                    <span className="mt-1 line-clamp-2 block text-[11px] leading-5 text-slate-500">
                      {notification.message}
                    </span>

                    <span className="mt-1.5 block text-[10px] font-medium text-slate-400">
                      {relativeTime(notification.createdAt)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
