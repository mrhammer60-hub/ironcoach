"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, Button, Avatar, Badge, StatCard, PageTransition, SkeletonStat } from "@/components/ui";
import { Sparkline } from "@/components/charts";
import { api } from "../../../../lib/api";
import { useTranslation } from "@/hooks/useTranslation";
import { formatRelativeArabic } from "@/lib/arabic-date";
import Link from "next/link";

export default function CoachDashboard() {
  const { t, lang } = useTranslation();
  const isAr = lang === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["coach", "dashboard"],
    queryFn: () => api.get<any>("/trainers/dashboard"),
    staleTime: 2 * 60 * 1000,
  });

  const { data: trainees } = useQuery({
    queryKey: ["coach", "trainees", "recent"],
    queryFn: () => api.get<any>("/trainers/trainees", { params: { limit: 5 } }),
    staleTime: 2 * 60 * 1000,
  });

  const { data: activity } = useQuery({
    queryKey: ["coach", "activity"],
    queryFn: () => api.get<any>("/trainers/dashboard/activity"),
    staleTime: 2 * 60 * 1000,
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t("greeting.morning") : hour < 18 ? t("greeting.afternoon") : t("greeting.evening");

  const formatTime = (dateStr: string) => {
    if (isAr) return formatRelativeArabic(new Date(dateStr));
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "yesterday";
    return `${days}d ago`;
  };

  return (
    <PageTransition>
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-arabic-heading">{greeting}! 👋</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {new Date().toLocaleDateString(isAr ? "ar-SA" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? [1,2,3,4].map(i => <SkeletonStat key={i} />) : (
          <>
            <StatCard
              icon={<span>👥</span>}
              iconBg="var(--accent-muted)"
              value={data?.activeTrainees ?? 0}
              label={t("coach.activeTrainees")}
              sparkline={<Sparkline data={[0,0,0,0,0,0, data?.activeTrainees ?? 0]} positive />}
            />
            <StatCard
              icon={<span>📋</span>}
              iconBg="var(--warning-muted)"
              value={data?.pendingCheckins ?? 0}
              label={t("coach.pendingCheckins")}
              trend={data?.pendingCheckins > 0 ? { value: data.pendingCheckins, label: isAr ? "معلق" : "pending" } : undefined}
            />
            <StatCard
              icon={<span>💬</span>}
              iconBg="var(--info-muted)"
              value={data?.unreadMessages ?? 0}
              label={t("coach.unreadMessages")}
            />
            <StatCard
              icon={<span>🔥</span>}
              iconBg="var(--success-muted)"
              value={`${data?.weeklyCompletionRate ?? 0}%`}
              label={t("coach.weeklyCompletion")}
              sparkline={<Sparkline data={[0,0,0,0,0,0, data?.weeklyCompletionRate ?? 0]} positive={(data?.weeklyCompletionRate ?? 0) >= 50} />}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Recent Trainees */}
        <Card className="lg:col-span-3" padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">{isAr ? "متدربيّ" : "My Trainees"}</h3>
            <Link href="/coach/trainees" className="text-xs text-[var(--accent)] hover:underline">
              {isAr ? "عرض الكل →" : "View all →"}
            </Link>
          </div>
          {trainees?.items?.length > 0 ? (
            <div className="space-y-1">
              {trainees.items.slice(0, 5).map((t: any) => (
                <Link key={t.id} href={`/coach/trainees/${t.id}`} className="flex items-center gap-3 py-2.5 rounded-lg px-2 hover:bg-[var(--bg-hover)] transition-colors">
                  <Avatar name={`${t.user.firstName} ${t.user.lastName}`} src={t.user.avatarUrl} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.user.firstName} {t.user.lastName}</p>
                    <p className="text-xs text-[var(--text-muted)]">{t.goal || "—"}</p>
                  </div>
                  {t.currentWeightKg && <span className="text-xs font-mono text-[var(--text-muted)]">{Number(t.currentWeightKg)} kg</span>}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-[var(--text-muted)] text-center py-6 text-sm">{t("empty.trainees")}</p>
          )}
        </Card>

        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-base font-semibold mb-1">{isAr ? "إجراءات سريعة" : "Quick Actions"}</h3>
          <Link href="/coach/trainees">
            <Card variant="elevated" className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-muted)] flex items-center justify-center text-xl">👥</div>
              <div>
                <p className="text-sm font-semibold">{t("coach.inviteTrainee")}</p>
                <p className="text-xs text-[var(--text-muted)]">{isAr ? "أضف متدرباً جديداً" : "Add a new trainee"}</p>
              </div>
            </Card>
          </Link>
          <Link href="/coach/builder">
            <Card variant="elevated" className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--info-muted)] flex items-center justify-center text-xl">📋</div>
              <div>
                <p className="text-sm font-semibold">{t("coach.createProgram")}</p>
                <p className="text-xs text-[var(--text-muted)]">{isAr ? "ابنِ برنامج تدريبي" : "Build a workout program"}</p>
              </div>
            </Card>
          </Link>
          <Link href="/coach/nutrition">
            <Card variant="elevated" className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--success-muted)] flex items-center justify-center text-xl">🥗</div>
              <div>
                <p className="text-sm font-semibold">{isAr ? "إنشاء خطة غذائية" : "Create Meal Plan"}</p>
                <p className="text-xs text-[var(--text-muted)]">{isAr ? "خطة تغذية مخصصة" : "Custom nutrition plan"}</p>
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* Activity Feed */}
      {activity?.items?.length > 0 && (
        <Card className="mt-6" padding="lg">
          <h3 className="text-base font-semibold mb-4">{isAr ? "نشاط حديث" : "Recent Activity"}</h3>
          <div className="space-y-0">
            {activity.items.slice(0, 8).map((a: any, i: number) => {
              const iconMap: Record<string, string> = { WORKOUT_COMPLETED: "🏋️", CHECKIN: "📏", MESSAGE: "💬", PROGRAM_ASSIGNED: "🎯", JOINED: "🆕" };
              const icon = iconMap[a.type] || "📋";
              return (
                <div key={i} className="flex items-start gap-3 py-2.5 border-b border-[var(--border-subtle)] last:border-0">
                  <span className="text-base mt-0.5">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-relaxed">
                      <span className="font-medium">{a.traineeName || a.actorName}</span>{" "}
                      <span className="text-[var(--text-muted)]">{a.description}</span>
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{formatTime(a.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
    </PageTransition>
  );
}
