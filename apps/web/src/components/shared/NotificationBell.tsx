"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../../lib/api";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "./Toast";
import { formatRelativeArabic } from "@/lib/arabic-date";
import Link from "next/link";

const NOTIFICATION_ICONS: Record<string, string> = {
  WORKOUT_ASSIGNED: "🏋️",
  MEAL_PLAN_ASSIGNED: "🥗",
  WORKOUT_COMPLETED: "✅",
  MESSAGE_RECEIVED: "💬",
  CHECKIN_REMINDER: "📋",
  PAYMENT_FAILED: "💳",
  PLAN_EXPIRING: "⏰",
};

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { lang } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isAr = lang === "ar";

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get<any>("/notifications", { params: { limit: 10 } }),
    refetchInterval: 30000,
  });

  const markAllRead = useMutation({
    mutationFn: () => api.put("/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast("success", isAr ? "تم تعيين الكل كمقروء" : "All notifications marked as read");
    },
    onError: () => {
      toast("error", isAr ? "فشل تعيين الكل كمقروء" : "Failed to mark notifications as read");
    },
  });

  const unreadCount = data?.items?.filter((n: any) => !n.isRead).length ?? 0;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
        aria-label={isAr ? "الإشعارات" : "Notifications"}
      >
        <span className="text-lg">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -end-0.5 w-5 h-5 rounded-full bg-[var(--error)] text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute end-0 top-12 z-50 w-[min(320px,calc(100vw-32px))] card p-0 shadow-lg animate-scaleIn">
            <div className="flex items-center justify-between p-3 border-b border-[var(--border)]">
              <span className="text-[13px] font-semibold">
                {isAr ? "الإشعارات" : "Notifications"}
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  className="text-[11px] text-[var(--accent)] hover:underline"
                >
                  {isAr ? "قراءة الكل" : "Mark all read"}
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-auto">
              {data?.items?.length === 0 ? (
                <p className="p-6 text-center text-[13px] text-[var(--text-muted)]">
                  {isAr ? "لا توجد إشعارات" : "No notifications"}
                </p>
              ) : (
                data?.items?.map((n: any) => (
                  <div
                    key={n.id}
                    className={`flex gap-3 p-3 border-b border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer ${
                      !n.isRead ? "bg-[var(--accent-muted)]" : ""
                    }`}
                  >
                    <span className="text-base mt-0.5 shrink-0">
                      {NOTIFICATION_ICONS[n.type] ?? "🔔"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate">{n.title}</p>
                      <p className="text-[11px] text-[var(--text-muted)] truncate">{n.body}</p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-1">
                        {isAr
                          ? formatRelativeArabic(new Date(n.createdAt))
                          : formatTimeAgo(new Date(n.createdAt))}
                      </p>
                    </div>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[var(--accent)] mt-1.5 shrink-0" />
                    )}
                  </div>
                ))
              )}
            </div>
            <Link
              href="/trainee/notifications"
              onClick={() => setOpen(false)}
              className="block text-center py-2.5 text-[12px] text-[var(--accent)] hover:bg-[var(--bg-hover)] transition-colors border-t border-[var(--border)]"
            >
              {isAr ? "عرض جميع الإشعارات" : "View all notifications"}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
