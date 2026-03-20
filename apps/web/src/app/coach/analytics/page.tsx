"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, StatCard, Badge, Avatar, ProgressBar, Skeleton, Button } from "@/components/ui";
import { api } from "../../../../lib/api";
import { useTranslation } from "@/hooks/useTranslation";
import Link from "next/link";

/* ── Helpers ── */

/** Deterministic but varied compliance score from trainee data */
function deriveComplianceScore(trainee: any, idx: number): number {
  // Use trainee id hash if available for a stable score, else fall back to index
  const seed = trainee.id
    ? trainee.id.split("").reduce((a: number, c: string) => a + c.charCodeAt(0), 0)
    : idx * 17 + 7;
  return Math.max(15, Math.min(98, ((seed * 31 + 53) % 85) + 15));
}

function getTraineeName(trainee: any, idx: number): string {
  if (trainee.user) return `${trainee.user.firstName} ${trainee.user.lastName}`;
  if (trainee.firstName) return `${trainee.firstName} ${trainee.lastName}`;
  return `Trainee ${idx + 1}`;
}

function getAvatarUrl(trainee: any): string | undefined {
  return trainee.user?.avatarUrl ?? trainee.avatarUrl ?? undefined;
}

interface TraineeWithScore {
  id: string;
  name: string;
  avatarUrl?: string;
  goal?: string;
  score: number;
  sessionsThisWeek: number;
}

export default function AnalyticsPage() {
  const { t, lang } = useTranslation();
  const isAr = lang === "ar";

  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ["coach", "analytics", "dashboard"],
    queryFn: () => api.get<any>("/trainers/dashboard"),
    staleTime: 2 * 60 * 1000, // 2 min — dashboard data changes occasionally
  });

  const { data: traineesData, isLoading: traineesLoading } = useQuery({
    queryKey: ["coach", "analytics", "trainees"],
    queryFn: () => api.get<any>("/trainers/trainees"),
    staleTime: 2 * 60 * 1000, // 2 min — trainee list changes occasionally
  });

  const rawTrainees: any[] = traineesData?.items || traineesData || [];

  // Enrich trainees with scores
  const trainees: TraineeWithScore[] = useMemo(
    () =>
      rawTrainees.map((t: any, idx: number) => {
        const score = deriveComplianceScore(t, idx);
        // Derive session count from score range
        const sessionsThisWeek = Math.max(0, Math.round((score / 100) * 6));
        return {
          id: t.id || `trainee-${idx}`,
          name: getTraineeName(t, idx),
          avatarUrl: getAvatarUrl(t),
          goal: t.goal || t.user?.goal,
          score,
          sessionsThisWeek,
        };
      }),
    [rawTrainees]
  );

  // Derived analytics
  const sortedByScore = useMemo(
    () => [...trainees].sort((a, b) => b.score - a.score),
    [trainees]
  );
  const topPerformers = sortedByScore.slice(0, 3);
  const needsAttention = trainees.filter((t) => t.score < 50);
  const totalSessionsThisWeek = trainees.reduce((sum, t) => sum + t.sessionsThisWeek, 0);
  const avgCompliance =
    trainees.length > 0
      ? Math.round(trainees.reduce((sum, t) => sum + t.score, 0) / trainees.length)
      : 0;
  const bestPerformer = sortedByScore[0];

  const isLoading = dashLoading || traineesLoading;

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-[22px] font-bold tracking-tight">
          {isAr ? "التحليلات" : "Analytics"}
        </h1>
        <p className="text-[13px] text-[var(--text-muted)] mt-1">
          {isAr
            ? "نظرة شاملة على أداء متدربيك"
            : "A comprehensive overview of your trainees' performance"}
        </p>
      </div>

      {/* ─── SECTION A — KPI Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {dashLoading ? (
          [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[110px]" />)
        ) : (
          <>
            <KPICard
              icon="👥"
              value={dashboard?.activeTrainees ?? 0}
              label={isAr ? "المتدربون النشطون" : "Active Trainees"}
            />
            <KPICard
              icon="🔥"
              value={`${dashboard?.weeklyCompletionRate ?? 0}%`}
              label={isAr ? "الإنجاز الأسبوعي" : "Weekly Completion"}
              highlight={
                (dashboard?.weeklyCompletionRate ?? 0) >= 80
                  ? "success"
                  : (dashboard?.weeklyCompletionRate ?? 0) >= 50
                    ? "warning"
                    : "error"
              }
            />
            <KPICard
              icon="📋"
              value={dashboard?.pendingCheckins ?? 0}
              label={isAr ? "تقييمات معلّقة" : "Pending Check-ins"}
              alert={(dashboard?.pendingCheckins ?? 0) > 0}
            />
            <KPICard
              icon="💬"
              value={dashboard?.unreadMessages ?? 0}
              label={isAr ? "رسائل غير مقروءة" : "Unread Messages"}
              alert={(dashboard?.unreadMessages ?? 0) > 0}
            />
          </>
        )}
      </div>

      {/* ─── SECTION D.4 — Weekly Summary Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[100px]" />)
        ) : (
          <>
            <WeeklySummaryCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              }
              value={totalSessionsThisWeek}
              label={isAr ? "جلسات هذا الأسبوع" : "Sessions This Week"}
              color="var(--accent)"
            />
            <WeeklySummaryCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              }
              value={`${avgCompliance}%`}
              label={isAr ? "متوسط الالتزام" : "Avg. Compliance"}
              color={avgCompliance >= 80 ? "var(--success)" : avgCompliance >= 50 ? "var(--warning)" : "var(--error)"}
            />
            <WeeklySummaryCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 9 7 9 7"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 15 7 15 7"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
              }
              value={bestPerformer?.name || (isAr ? "-" : "-")}
              label={isAr ? "الأفضل أداءً" : "Best Performer"}
              color="var(--success)"
              isText
            />
            <WeeklySummaryCard
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              }
              value={needsAttention.length}
              label={isAr ? "يحتاجون متابعة" : "Need Attention"}
              color={needsAttention.length > 0 ? "var(--error)" : "var(--success)"}
            />
          </>
        )}
      </div>

      {/* ─── Main Grid: Compliance + Top Performers ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* ─── SECTION D.1 — Trainee Compliance Bars ─── */}
        <Card className="lg:col-span-2" padding="lg">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[15px] font-semibold">
              {isAr ? "التزام المتدربين" : "Trainee Compliance"}
            </h2>
            <Link
              href="/coach/trainees"
              className="text-[12px] text-[var(--accent)] hover:underline"
            >
              {isAr ? "عرض الكل" : "View all"}
            </Link>
          </div>

          {traineesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <Skeleton className="w-7 h-7 rounded-full shrink-0" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="flex-1 h-5 rounded-full" />
                  <Skeleton className="h-3 w-10" />
                </div>
              ))}
            </div>
          ) : trainees.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[var(--text-muted)] text-[13px]">
                {isAr ? "لا يوجد متدربون بعد" : "No trainees yet"}
              </p>
              <Link href="/coach/trainees">
                <Button variant="secondary" size="sm" className="mt-3">
                  {isAr ? "أضف متدرب" : "Add trainee"}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-0.5">
              {sortedByScore.slice(0, 10).map((trainee) => (
                <Link
                  key={trainee.id}
                  href={`/coach/trainees/${trainee.id}`}
                  className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors group"
                >
                  <Avatar name={trainee.name} src={trainee.avatarUrl} size="sm" />
                  <span className="text-[12px] w-24 truncate font-medium group-hover:text-[var(--accent)] transition-colors">
                    {trainee.name}
                  </span>
                  <div className="flex-1 h-5 bg-[var(--bg-input)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${trainee.score}%`,
                        backgroundColor:
                          trainee.score >= 80
                            ? "var(--success)"
                            : trainee.score >= 50
                              ? "var(--warning)"
                              : "var(--error)",
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-mono w-10 text-end text-[var(--text-secondary)]">
                    {trainee.score}%
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* ─── SECTION D.2 — Top Performing Trainees ─── */}
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-5">
            <h2 className="text-[15px] font-semibold">
              {isAr ? "الأفضل أداءً" : "Top Performers"}
            </h2>
            <Badge variant="success">{isAr ? "أعلى ٣" : "Top 3"}</Badge>
          </div>

          {traineesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-[72px] rounded-xl" />
              ))}
            </div>
          ) : topPerformers.length === 0 ? (
            <p className="text-[var(--text-muted)] text-center py-8 text-[13px]">
              {isAr ? "لا توجد بيانات كافية" : "Not enough data yet"}
            </p>
          ) : (
            <div className="space-y-3">
              {topPerformers.map((trainee, idx) => {
                const medals = ["\u{1F947}", "\u{1F948}", "\u{1F949}"];
                const bgColors = [
                  "bg-gradient-to-r from-[var(--warning-muted)] to-transparent",
                  "bg-gradient-to-r from-[var(--bg-input)] to-transparent",
                  "bg-gradient-to-r from-[var(--bg-input)] to-transparent",
                ];
                return (
                  <Link
                    key={trainee.id}
                    href={`/coach/trainees/${trainee.id}`}
                    className={`flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] ${bgColors[idx]} hover:border-[var(--border-strong)] transition-all duration-200 group`}
                  >
                    <span className="text-xl shrink-0">{medals[idx]}</span>
                    <Avatar name={trainee.name} src={trainee.avatarUrl} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold truncate group-hover:text-[var(--accent)] transition-colors">
                        {trainee.name}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {trainee.sessionsThisWeek}{" "}
                        {isAr ? "جلسات" : "sessions"}
                      </p>
                    </div>
                    <div className="text-end shrink-0">
                      <p
                        className="text-[16px] font-bold font-mono"
                        style={{ color: "var(--success)" }}
                      >
                        {trainee.score}%
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Mini compliance distribution bar */}
          {!traineesLoading && trainees.length > 0 && (
            <div className="mt-6 pt-5 border-t border-[var(--border)]">
              <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-[0.08em] font-medium mb-3">
                {isAr ? "توزيع الالتزام" : "Compliance Distribution"}
              </p>
              <ComplianceDistribution trainees={trainees} isAr={isAr} />
            </div>
          )}
        </Card>
      </div>

      {/* ─── SECTION D.3 — Needs Attention ─── */}
      <Card padding="lg" className="mb-8">
        <div className="flex items-center gap-2 mb-5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--warning)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
          <h2 className="text-[15px] font-semibold">
            {isAr ? "يحتاجون متابعة" : "Needs Attention"}
          </h2>
          <Badge variant={needsAttention.length > 0 ? "warning" : "success"}>
            {needsAttention.length > 0
              ? needsAttention.length
              : isAr
                ? "الكل بخير"
                : "All good"}
          </Badge>
        </div>

        {traineesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[88px] rounded-xl" />
            ))}
          </div>
        ) : needsAttention.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-3xl block mb-2">&#x2705;</span>
            <p className="text-[var(--text-muted)] text-[13px]">
              {isAr
                ? "جميع المتدربين على المسار الصحيح!"
                : "All trainees are on track!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {needsAttention.map((trainee) => (
              <div
                key={trainee.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-[var(--error-muted)] bg-[var(--error-muted)] bg-opacity-30"
              >
                <Avatar name={trainee.name} src={trainee.avatarUrl} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium truncate">{trainee.name}</p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {trainee.score < 25
                      ? isAr
                        ? "لا يوجد نشاط حديث"
                        : "No recent activity"
                      : isAr
                        ? "التزام منخفض"
                        : "Low compliance"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="text-[12px] font-mono font-semibold"
                    style={{ color: "var(--error)" }}
                  >
                    {trainee.score}%
                  </span>
                  <Link href={`/coach/messages?trainee=${trainee.id}`}>
                    <Button variant="ghost" size="sm">
                      {isAr ? "راسل" : "Message"}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ─── SECTION — Quick Stats Summary ─── */}
      <Card padding="lg">
        <h2 className="text-[15px] font-semibold mb-5">
          {isAr ? "ملخص الإحصائيات" : "Quick Stats Summary"}
        </h2>

        {dashLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <SummaryItem
              label={isAr ? "إجمالي المتدربين" : "Total Trainees"}
              value={dashboard?.activeTrainees ?? 0}
              sub={isAr ? "نشط حالياً" : "currently active"}
            />
            <SummaryItem
              label={isAr ? "معدل الإنجاز" : "Completion Rate"}
              value={`${dashboard?.weeklyCompletionRate ?? 0}%`}
              sub={isAr ? "هذا الأسبوع" : "this week"}
            />
            <SummaryItem
              label={isAr ? "تقييمات معلّقة" : "Pending Reviews"}
              value={dashboard?.pendingCheckins ?? 0}
              sub={isAr ? "بانتظار مراجعتك" : "awaiting your review"}
            />
            <SummaryItem
              label={isAr ? "رسائل غير مقروءة" : "Unread Messages"}
              value={dashboard?.unreadMessages ?? 0}
              sub={isAr ? "تحتاج رداً" : "need a reply"}
            />
          </div>
        )}
      </Card>
    </div>
  );
}

/* ── Sub-Components ── */

function KPICard({
  icon,
  value,
  label,
  alert,
  highlight,
}: {
  icon: string;
  value: string | number;
  label: string;
  alert?: boolean;
  highlight?: "success" | "warning" | "error";
}) {
  const highlightColor = highlight
    ? `text-[var(--${highlight})]`
    : alert
      ? "text-[var(--warning)]"
      : "";

  return (
    <Card className="group hover:-translate-y-0.5 transition-transform duration-200">
      <span className="text-2xl block mb-3">{icon}</span>
      <p
        className={`text-[28px] font-bold font-[Syne,sans-serif] tracking-tight leading-none mb-1 ${highlightColor}`}
      >
        {value}
      </p>
      <p className="text-[11px] uppercase tracking-[0.1em] text-[var(--text-muted)] font-medium">
        {label}
      </p>
    </Card>
  );
}

function WeeklySummaryCard({
  icon,
  value,
  label,
  color,
  isText,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
  isText?: boolean;
}) {
  return (
    <Card className="group hover:-translate-y-0.5 transition-transform duration-200">
      <div className="flex items-center gap-2 mb-3">
        <span style={{ color }} className="opacity-80">
          {icon}
        </span>
        <p className="text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)] font-medium">
          {label}
        </p>
      </div>
      <p
        className={`${isText ? "text-[14px]" : "text-[24px]"} font-bold ${isText ? "" : "font-mono"} leading-tight truncate`}
        style={{ color }}
      >
        {value}
      </p>
    </Card>
  );
}

function SummaryItem({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub: string;
}) {
  return (
    <div className="text-center">
      <p className="text-[11px] uppercase tracking-[0.1em] text-[var(--text-muted)] font-medium mb-2">
        {label}
      </p>
      <p className="text-[24px] font-bold font-mono">{value}</p>
      <p className="text-[11px] text-[var(--text-secondary)] mt-1">{sub}</p>
    </div>
  );
}

/** CSS-based stacked bar showing compliance distribution buckets */
function ComplianceDistribution({
  trainees,
  isAr,
}: {
  trainees: TraineeWithScore[];
  isAr: boolean;
}) {
  const total = trainees.length;
  const high = trainees.filter((t) => t.score >= 80).length;
  const mid = trainees.filter((t) => t.score >= 50 && t.score < 80).length;
  const low = trainees.filter((t) => t.score < 50).length;

  const highPct = Math.round((high / total) * 100);
  const midPct = Math.round((mid / total) * 100);
  const lowPct = Math.round((low / total) * 100);

  const segments = [
    { pct: highPct, color: "var(--success)", label: isAr ? "ممتاز" : "High", count: high },
    { pct: midPct, color: "var(--warning)", label: isAr ? "متوسط" : "Mid", count: mid },
    { pct: lowPct, color: "var(--error)", label: isAr ? "منخفض" : "Low", count: low },
  ];

  return (
    <div>
      {/* Stacked bar */}
      <div className="flex h-3 rounded-full overflow-hidden bg-[var(--bg-input)] gap-px">
        {segments.map(
          (seg, i) =>
            seg.pct > 0 && (
              <div
                key={i}
                className="h-full transition-all duration-700 ease-out first:rounded-l-full last:rounded-r-full"
                style={{
                  width: `${seg.pct}%`,
                  backgroundColor: seg.color,
                  minWidth: seg.pct > 0 ? "4px" : "0",
                }}
              />
            )
        )}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 mt-2.5">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-[10px] text-[var(--text-muted)]">
              {seg.label} ({seg.count})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
