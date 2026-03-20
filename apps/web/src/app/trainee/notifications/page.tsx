"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Button, Skeleton, EmptyState, Badge } from "@/components/ui";
import { api } from "../../../../lib/api";
import { useTranslation } from "@/hooks/useTranslation";

const NOTIF_ICONS: Record<string, string> = {
  WORKOUT_ASSIGNED: "🏋️",
  MEAL_PLAN_ASSIGNED: "🥗",
  MESSAGE_RECEIVED: "💬",
  WORKOUT_COMPLETED: "✅",
  CHECKIN_REMINDER: "📊",
  PAYMENT_FAILED: "⚠️",
  PLAN_EXPIRING: "⏰",
};

export default function NotificationsPage() {
  const { lang } = useTranslation();
  const isAr = lang === "ar";
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", "all"],
    queryFn: () => api.get<any>("/notifications", { params: { limit: 30 } }),
    staleTime: 30 * 1000, // 30s — notifications change frequently
  });

  const markAll = useMutation({
    mutationFn: () => api.put("/notifications/read-all"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <div className="max-w-[440px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[20px] font-bold">{isAr ? "الإشعارات" : "Notifications"}</h1>
        <Button variant="ghost" size="sm" onClick={() => markAll.mutate()}>
          {isAr ? "قراءة الكل" : "Mark all read"}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <Skeleton key={i} className="h-16" />)}</div>
      ) : data?.items?.length === 0 ? (
        <EmptyState icon="🔔" title={isAr ? "لا توجد إشعارات" : "No notifications"} />
      ) : (
        <div className="space-y-2">
          {data?.items?.map((n: any) => (
            <Card key={n.id} padding="sm" className={`flex items-start gap-3 ${!n.isRead ? "border-s-2 border-[var(--accent)]" : ""}`}>
              <span className="text-xl mt-0.5">{NOTIF_ICONS[n.type] || "🔔"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium">{n.title}</p>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5 truncate">{n.body}</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                  {new Date(n.createdAt).toLocaleString(isAr ? "ar" : "en", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                </p>
              </div>
              {!n.isRead && <span className="w-2 h-2 rounded-full bg-[var(--accent)] mt-2 shrink-0" />}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
