"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, Badge, Avatar, Skeleton, Button, PageTransition, StatCard, SkeletonStat, DataTable } from "@/components/ui";
import { GrowthChart, Sparkline } from "@/components/charts";
import { api } from "../../../../lib/api";
import { useTranslation } from "@/hooks/useTranslation";
import Link from "next/link";

export default function AdminDashboard() {
  const { t, lang } = useTranslation();
  const isAr = lang === "ar";

  const { data, isLoading, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => api.get<any>("/admin/dashboard"),
    staleTime: 2 * 60 * 1000, // 2 min — dashboard data changes occasionally
  });

  const { data: coaches } = useQuery({
    queryKey: ["admin", "coaches", "recent"],
    queryFn: () => api.get<any>("/admin/coaches", { params: { limit: 8 } }),
    staleTime: 2 * 60 * 1000, // 2 min
  });

  const minutesAgo = dataUpdatedAt ? Math.round((Date.now() - dataUpdatedAt) / 60000) : 0;

  // Derived chart data from API
  const monthlyGrowth: { month: string; count: number }[] = data?.monthlyGrowth ?? [];
  const maxGrowthCount = Math.max(...monthlyGrowth.map((m: any) => m.count), 1);
  const planDistribution: { planCode: string; count: number }[] = data?.planDistribution ?? [];
  const totalSubs = planDistribution.reduce((s: number, p: any) => s + p.count, 0) || 1;
  const recentActivity: { action: string; entityType: string; entityId?: string; actorName: string; createdAt: string }[] = data?.recentActivity ?? [];

  // Check if platform is newly setup
  const isNewPlatform = (data?.totalOrganizations ?? 0) < 3;

  return (
    <PageTransition>
    <div>
      {/* Onboarding Checklist */}
      {isNewPlatform && <OnboardingChecklist health={undefined} totalExercises={data?.totalOrganizations ?? 0} isAr={isAr} />}

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">{isAr ? "مرحباً، System Admin" : "Welcome, System Admin"} 👋</h1>
          <p className="text-[13px] text-[var(--text-muted)] mt-1">
            {new Date().toLocaleDateString(isAr ? "ar-SA" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-[var(--text-muted)]">
            {isAr ? `آخر تحديث: منذ ${minutesAgo} دقيقة` : `Updated ${minutesAgo}m ago`}
          </span>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>🔄</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? [1,2,3,4].map(i => <SkeletonStat key={i} />) : (
          <>
            <StatCard icon={<span>🏋️</span>} iconBg="var(--accent-muted)" value={data?.totalOrganizations ?? 0} label={isAr ? "إجمالي المدربين" : "Total Coaches"} trend={data?.newOrgsThisMonth ? { value: data.newOrgsThisMonth, label: isAr ? "هذا الشهر" : "this month" } : undefined} sparkline={<Sparkline data={monthlyGrowth.map((m: any) => m.count)} positive />} />
            <StatCard icon={<span>👥</span>} iconBg="var(--info-muted)" value={(data?.totalTrainees ?? 0).toLocaleString()} label={isAr ? "إجمالي المتدربين" : "Total Trainees"} />
            <StatCard icon={<span>💳</span>} iconBg="var(--success-muted)" value={`$${(data?.mrr ?? 0).toLocaleString()}`} label="MRR" trend={{ value: 12, label: "↑" }} />
            <StatCard icon={<span>📈</span>} iconBg="var(--warning-muted)" value={`${data?.activeSubscriptions ?? 0}`} label={isAr ? "الاشتراكات النشطة" : "Active Subscriptions"} />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-8">
        {/* Growth Chart */}
        <Card className="lg:col-span-3" padding="lg">
          <h3 className="text-[15px] font-semibold mb-4">{isAr ? "نمو المدربين — آخر 12 شهر" : "Coach Growth — Last 12 Months"}</h3>
          {monthlyGrowth.length > 0 ? (
            <GrowthChart data={monthlyGrowth} isAr={isAr} />
          ) : (
            <p className="text-[var(--text-muted)] text-center py-12 text-[13px]">{isAr ? "لا توجد بيانات بعد" : "No data yet"}</p>
          )}
        </Card>

        {/* Plan Distribution */}
        <Card className="lg:col-span-2" padding="lg">
          <h3 className="text-[15px] font-semibold mb-6">{isAr ? "توزيع الخطط" : "Plan Distribution"}</h3>
          <div className="space-y-5">
            {planDistribution.map((p: any) => {
              const percent = Math.round((p.count / totalSubs) * 100);
              const colorMap: Record<string, string> = { STARTER: "var(--info)", GROWTH: "var(--accent)", PRO: "var(--warning)" };
              const nameArMap: Record<string, string> = { STARTER: "المبتدئ", GROWTH: "النمو", PRO: "الاحترافي" };
              return (
                <PlanBar
                  key={p.planCode}
                  label={p.planCode}
                  nameAr={nameArMap[p.planCode] || p.planCode}
                  percent={percent}
                  count={p.count}
                  color={colorMap[p.planCode] || "var(--accent)"}
                  isAr={isAr}
                />
              );
            })}
          </div>
          <div className="mt-6 pt-4 border-t border-[var(--border)] text-center">
            <span className="text-[28px] font-bold font-[Syne,sans-serif]">{data?.totalOrganizations ?? 0}</span>
            <p className="text-[11px] text-[var(--text-muted)]">{isAr ? "إجمالي المدربين" : "Total Coaches"}</p>
          </div>
        </Card>
      </div>

      {/* Coaches + Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-8">
        {/* Recent Coaches Table */}
        <Card className="lg:col-span-3" padding="lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-semibold">{isAr ? "أحدث المدربين" : "Recent Coaches"}</h3>
            <Link href="/admin/coaches" className="text-[12px] text-[var(--accent)] hover:underline">
              {isAr ? "عرض الكل →" : "View all →"}
            </Link>
          </div>
          <DataTable
            columns={[
              {
                key: "name",
                label: isAr ? "المدرب" : "Coach",
                render: (_: any, org: any) => (
                  <div className="flex items-center gap-3">
                    <Avatar name={org.name} size="sm" />
                    <div>
                      <p className="font-medium text-sm">{org.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{org.owner?.email}</p>
                    </div>
                  </div>
                ),
              },
              {
                key: "plan",
                label: isAr ? "الخطة" : "Plan",
                render: (_: any, org: any) => (
                  <Badge variant={org.subscription?.plan?.code === "PRO" ? "warning" : org.subscription?.plan?.code === "GROWTH" ? "accent" : "info"}>
                    {org.subscription?.plan?.name || "—"}
                  </Badge>
                ),
              },
              {
                key: "trainees",
                label: isAr ? "المتدربون" : "Trainees",
                render: (_: any, org: any) => <span className="font-mono text-xs">{org._count?.members ?? 0}</span>,
              },
              {
                key: "status",
                label: isAr ? "الحالة" : "Status",
                render: (_: any, org: any) => (
                  <Badge variant={org.status === "active" ? "success" : "error"}>
                    {org.status === "active" ? (isAr ? "نشط" : "Active") : (isAr ? "موقوف" : "Suspended")}
                  </Badge>
                ),
              },
            ]}
            data={coaches?.items?.slice(0, 6) ?? []}
            loading={!coaches}
            emptyMessage={isAr ? "لا يوجد مدربين بعد" : "No coaches yet"}
          />
        </Card>

        {/* Activity Feed */}
        <Card className="lg:col-span-2" padding="lg">
          <h3 className="text-[15px] font-semibold mb-4">{isAr ? "نشاط حديث" : "Recent Activity"}</h3>
          <div className="space-y-3">
            {recentActivity.length === 0 && (
              <p className="text-[12px] text-[var(--text-muted)] py-4 text-center">{isAr ? "لا يوجد نشاط بعد" : "No activity yet"}</p>
            )}
            {recentActivity.map((a: any, i: number) => {
              const iconMap: Record<string, string> = {
                CREATE: "🆕", UPDATE: "✏️", DELETE: "🗑️", LOGIN: "🔑",
                INVITE: "📧", SUBSCRIBE: "💳", CANCEL: "❌",
              };
              const actionKey = a.action?.split(".")?.[0]?.toUpperCase() ?? "";
              const icon = iconMap[actionKey] || "📋";
              const timeAgo = formatTimeAgo(a.createdAt, isAr);
              return (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-[var(--border)] last:border-0">
                  <span className="text-lg mt-0.5">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] leading-relaxed">
                      <span className="font-medium">{a.actorName}</span>{" "}
                      <span className="text-[var(--text-muted)]">{a.action}</span>{" "}
                      <span className="text-[var(--text-muted)]">{a.entityType}</span>
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{timeAgo}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="text-center">
          <p className="text-[24px] font-bold font-[Syne,sans-serif]">
            {data?.totalOrganizations ? Math.round((data?.totalTrainees ?? 0) / data.totalOrganizations) : 0}
          </p>
          <p className="text-[11px] text-[var(--text-muted)]">{isAr ? "متوسط المتدربين/مدرب" : "Avg Trainees/Coach"}</p>
        </Card>
        <Card className="text-center">
          <p className="text-[24px] font-bold font-[Syne,sans-serif] text-[var(--success)]">
            {data?.activeSubscriptions && data?.totalOrganizations
              ? `${Math.round((data.activeSubscriptions / data.totalOrganizations) * 100)}%`
              : "—"}
          </p>
          <p className="text-[11px] text-[var(--text-muted)]">{isAr ? "معدل الاحتفاظ" : "Retention Rate"}</p>
        </Card>
        <Card className="text-center">
          <p className="text-[24px] font-bold font-[Syne,sans-serif] text-[var(--accent)]">
            {planDistribution.length > 0
              ? planDistribution.reduce((top: any, p: any) => (p.count > (top?.count ?? 0) ? p : top), planDistribution[0])?.planCode
              : "—"}
          </p>
          <p className="text-[11px] text-[var(--text-muted)]">{isAr ? "أعلى خطة مبيعاً" : "Top Selling Plan"}</p>
        </Card>
      </div>
    </div>
    </PageTransition>
  );
}

function KPICard({ icon, value, label, trend, trendUp }: { icon: string; value: string | number; label: string; trend?: string; trendUp?: boolean }) {
  return (
    <Card className="group hover:-translate-y-0.5 hover:shadow-[var(--shadow)] transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-[var(--bg-input)] flex items-center justify-center text-xl">{icon}</div>
        {trend && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${trendUp ? "bg-[var(--success-muted)] text-[var(--success)]" : "bg-[var(--error-muted)] text-[var(--error)]"}`}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-[36px] font-bold font-[Syne,sans-serif] tracking-tight leading-none mb-1">{value}</p>
      <p className="text-[11px] uppercase tracking-[0.1em] text-[var(--text-muted)] font-medium mt-2">{label}</p>
    </Card>
  );
}

function PlanBar({ label, nameAr, percent, count, color, isAr }: { label: string; nameAr: string; percent: number; count: number; color: string; isAr: boolean }) {
  return (
    <div>
      <div className="flex justify-between text-[12px] mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
          <span className="font-medium">{isAr ? nameAr : label}</span>
        </div>
        <span className="font-mono text-[var(--text-muted)]">{count} ({percent}%)</span>
      </div>
      <div className="h-2 bg-[var(--bg-input)] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${percent}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function formatTimeAgo(dateStr: string, isAr: boolean): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return isAr ? "الآن" : "Just now";
  if (mins < 60) return isAr ? `منذ ${mins} دقيقة` : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return isAr ? `منذ ${hours} ساعة` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return isAr ? `منذ ${days} يوم` : `${days}d ago`;
}

function OnboardingChecklist({ health, totalExercises, isAr }: { health: any; totalExercises: number; isAr: boolean }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const items = [
    { done: true, ar: "قاعدة البيانات — تم الإعداد", en: "Database — Connected", icon: "✅" },
    { done: true, ar: "Redis — متصل", en: "Redis — Connected", icon: "✅" },
    { done: false, ar: "Stripe — أضف مفاتيح الإنتاج", en: "Stripe — Add production keys", icon: "⚠️", link: "/admin/settings" },
    { done: false, ar: "Resend — أضف API Key للبريد", en: "Resend — Add email API key", icon: "⚠️", link: "/admin/settings" },
    { done: false, ar: "التخزين — إعداد Cloudflare R2", en: "Storage — Setup Cloudflare R2", icon: "⚠️", link: "/admin/settings" },
    { done: totalExercises > 0, ar: "أضف أول تمرين للمكتبة", en: "Add first exercise", icon: totalExercises > 0 ? "✅" : "⚠️", link: "/admin/exercises" },
    { done: false, ar: "أرسل دعوة لأول مدرب", en: "Invite first coach", icon: "⚠️" },
  ];
  const doneCount = items.filter(i => i.done).length;

  return (
    <Card className="mb-8 border-[var(--accent)] animate-fadeIn">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[15px] font-semibold">{isAr ? "إعداد المنصة" : "Platform Setup"} 🚀</h3>
          <p className="text-[12px] text-[var(--text-muted)] mt-0.5">{doneCount} {isAr ? "من" : "of"} {items.length} {isAr ? "مكتمل" : "complete"}</p>
        </div>
        <button onClick={() => setDismissed(true)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">✕</button>
      </div>
      <div className="h-2 bg-[var(--bg-input)] rounded-full overflow-hidden mb-4">
        <div className="h-full rounded-full bg-[var(--accent)] transition-all" style={{ width: `${(doneCount / items.length) * 100}%` }} />
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 text-[13px]">
            <span>{item.icon}</span>
            <span className={item.done ? "text-[var(--text-muted)] line-through" : ""}>{isAr ? item.ar : item.en}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
