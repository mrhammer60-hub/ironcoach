"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, Badge, Skeleton } from "@/components/ui";
import { api } from "../../../../lib/api";
import { useTranslation } from "@/hooks/useTranslation";

export default function RevenuePage() {
  const { lang } = useTranslation();
  const isAr = lang === "ar";

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "revenue"],
    queryFn: () => api.get<any>("/admin/revenue"),
  });

  const mrrHistory = [8200, 8800, 9100, 9600, 10200, 10800, 11400, 11900, 12500, 13100, 13700, 14200];
  const months = isAr
    ? ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]
    : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div>
      <h1 className="text-[22px] font-bold tracking-tight mb-8">{isAr ? "الإيرادات" : "Revenue"}</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? [1,2,3,4].map(i => <Skeleton key={i} className="h-[120px]" />) : (
          <>
            <Card className="group hover:-translate-y-0.5 transition-transform">
              <span className="text-xl block mb-3">💰</span>
              <p className="text-[32px] font-bold font-[Syne,sans-serif] leading-none text-[var(--accent)]">${(data?.mrr ?? 0).toLocaleString()}</p>
              <p className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] mt-2">MRR</p>
            </Card>
            <Card className="group hover:-translate-y-0.5 transition-transform">
              <span className="text-xl block mb-3">📈</span>
              <p className="text-[32px] font-bold font-[Syne,sans-serif] leading-none">${(data?.arr ?? 0).toLocaleString()}</p>
              <p className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] mt-2">ARR</p>
            </Card>
            <Card className="group hover:-translate-y-0.5 transition-transform">
              <span className="text-xl block mb-3">👤</span>
              <p className="text-[32px] font-bold font-[Syne,sans-serif] leading-none">${data?.mrr && data?.activeSubscriptions ? Math.round(data.mrr / data.activeSubscriptions) : 0}</p>
              <p className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] mt-2">{isAr ? "متوسط/مدرب" : "Avg/Coach"}</p>
            </Card>
            <Card className="group hover:-translate-y-0.5 transition-transform">
              <span className="text-xl block mb-3">📉</span>
              <p className="text-[32px] font-bold font-[Syne,sans-serif] leading-none text-[var(--error)]">{data?.churnRate ?? 0}%</p>
              <p className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] mt-2">{isAr ? "معدل الانسحاب" : "Churn Rate"}</p>
            </Card>
          </>
        )}
      </div>

      {/* MRR Chart */}
      <Card className="mb-8" padding="lg">
        <h3 className="text-[15px] font-semibold mb-6">{isAr ? "نمو MRR — آخر 12 شهر" : "MRR Growth — Last 12 Months"}</h3>
        <div className="flex items-end gap-2 h-[180px]">
          {mrrHistory.map((v, i) => {
            const max = Math.max(...mrrHistory);
            const height = (v / max) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                <div className="w-full relative">
                  <div className="w-full rounded-t bg-gradient-to-t from-[var(--accent)] to-[var(--accent)] opacity-70 group-hover:opacity-100 transition-all cursor-pointer" style={{ height: `${height}%`, minHeight: 6 }} />
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[var(--bg-card)] border border-[var(--border)] px-2 py-0.5 rounded text-[9px] font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-sm">
                    ${v.toLocaleString()}
                  </div>
                </div>
                <span className="text-[8px] text-[var(--text-muted)]">{months[i]?.slice(0, 3)}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Plan Revenue Breakdown */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="text-center">
          <Badge variant="info" >Starter</Badge>
          <p className="text-[24px] font-bold font-[Syne,sans-serif] mt-3">64</p>
          <p className="text-[12px] text-[var(--text-muted)]">{isAr ? "مدرب" : "coaches"}</p>
          <p className="text-[16px] font-bold text-[var(--info)] mt-2">$3,840</p>
          <p className="text-[10px] text-[var(--text-muted)]">{isAr ? "/شهر" : "/month"}</p>
        </Card>
        <Card className="text-center border-[var(--accent)]">
          <Badge variant="accent">Growth</Badge>
          <p className="text-[24px] font-bold font-[Syne,sans-serif] mt-3">54</p>
          <p className="text-[12px] text-[var(--text-muted)]">{isAr ? "مدرب" : "coaches"}</p>
          <p className="text-[16px] font-bold text-[var(--accent)] mt-2">$5,400</p>
          <p className="text-[10px] text-[var(--text-muted)]">{isAr ? "/شهر" : "/month"}</p>
        </Card>
        <Card className="text-center">
          <Badge variant="warning">Pro</Badge>
          <p className="text-[24px] font-bold font-[Syne,sans-serif] mt-3">24</p>
          <p className="text-[12px] text-[var(--text-muted)]">{isAr ? "مدرب" : "coaches"}</p>
          <p className="text-[16px] font-bold text-[var(--warning)] mt-2">$4,800</p>
          <p className="text-[10px] text-[var(--text-muted)]">{isAr ? "/شهر" : "/month"}</p>
        </Card>
      </div>

      {/* Payment Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <h3 className="text-[14px] font-semibold mb-2">{isAr ? "الدفعات الفاشلة (30 يوم)" : "Failed Payments (30d)"}</h3>
          <p className="text-[28px] font-bold font-[Syne,sans-serif] text-[var(--error)]">{data?.failedPaymentsLast30Days ?? 0}</p>
        </Card>
        <Card>
          <h3 className="text-[14px] font-semibold mb-2">{isAr ? "الإلغاءات (30 يوم)" : "Cancellations (30d)"}</h3>
          <p className="text-[28px] font-bold font-[Syne,sans-serif] text-[var(--warning)]">{data?.cancelledLast30Days ?? 0}</p>
        </Card>
      </div>
    </div>
  );
}
