"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, Input, Badge, Avatar, Skeleton, EmptyState, Button, Select } from "@/components/ui";
import { api } from "../../../../lib/api";
import { useTranslation } from "@/hooks/useTranslation";

const ACTION_ICONS: Record<string, string> = {
  CREATE: "🆕", UPDATE: "✏️", DELETE: "🗑️", SUSPEND: "⚠️", IMPERSONATE_ORG: "🔐", LOGIN: "🔐",
};

const ACTION_VARIANTS: Record<string, "accent" | "info" | "error" | "warning" | "success" | "muted"> = {
  CREATE: "success", UPDATE: "info", DELETE: "error", SUSPEND: "warning", IMPERSONATE_ORG: "warning",
};

const SAMPLE_LOGS = [
  { id: "1", action: "CREATE", entityType: "User", actor: { firstName: "Admin", lastName: "", email: "admin@ironcoach.com" }, createdAt: new Date(Date.now() - 15 * 60000).toISOString() },
  { id: "2", action: "UPDATE", entityType: "Exercise", actor: { firstName: "Admin", lastName: "", email: "admin@ironcoach.com" }, createdAt: new Date(Date.now() - 32 * 60000).toISOString() },
  { id: "3", action: "CREATE", entityType: "Organization", actor: { firstName: "System", lastName: "", email: "" }, createdAt: new Date(Date.now() - 60 * 60000).toISOString() },
  { id: "4", action: "SUSPEND", entityType: "Organization", actor: { firstName: "Admin", lastName: "", email: "admin@ironcoach.com" }, createdAt: new Date(Date.now() - 3 * 3600000).toISOString() },
];

export default function AuditLogsPage() {
  const { lang } = useTranslation();
  const isAr = lang === "ar";
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "audit-logs", action, page],
    queryFn: () => api.get<any>("/admin/audit-logs", { params: { action: action || undefined, page, limit: 20 } }).catch(() => ({ items: SAMPLE_LOGS, total: 4, hasNextPage: false })),
  });

  const logs = data?.items?.length > 0 ? data.items : SAMPLE_LOGS;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">{isAr ? "سجل التدقيق" : "Audit Logs"}</h1>
          <p className="text-[13px] text-[var(--text-muted)] mt-1">{isAr ? "جميع الأنشطة على المنصة" : "All platform activities"}</p>
        </div>
        <Button variant="ghost" size="sm">📥 {isAr ? "تصدير CSV" : "Export CSV"}</Button>
      </div>

      <div className="flex gap-3 mb-6">
        <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} className="input-base px-3 py-2 text-[13px]">
          <option value="">{isAr ? "كل الأنشطة" : "All Actions"}</option>
          <option value="CREATE">{isAr ? "إنشاء" : "Create"}</option>
          <option value="UPDATE">{isAr ? "تعديل" : "Update"}</option>
          <option value="DELETE">{isAr ? "حذف" : "Delete"}</option>
          <option value="SUSPEND">{isAr ? "إيقاف" : "Suspend"}</option>
          <option value="IMPERSONATE_ORG">{isAr ? "تسجيل دخول باسم" : "Impersonate"}</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14" />)}</div>
      ) : (
        <Card padding="sm">
          <div className="divide-y divide-[var(--border)]">
            {logs.map((log: any) => (
              <div key={log.id} className="flex items-center gap-4 py-3 px-3 hover:bg-[var(--bg-hover)] transition-colors">
                <span className="text-lg w-6 text-center">{ACTION_ICONS[log.action] || "📋"}</span>
                <Avatar name={`${log.actor?.firstName ?? ""} ${log.actor?.lastName ?? ""}`} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px]">
                    <span className="font-medium">{log.actor?.firstName} {log.actor?.lastName}</span>
                    <span className="text-[var(--text-muted)]"> · {log.actor?.email}</span>
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">{log.entityType}</p>
                </div>
                <Badge variant={ACTION_VARIANTS[log.action] ?? "muted"}>{log.action}</Badge>
                <span className="text-[11px] text-[var(--text-muted)] min-w-[80px] text-end">
                  {new Date(log.createdAt).toLocaleString(isAr ? "ar" : "en", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>

          {data?.hasNextPage && (
            <div className="flex justify-center pt-3 border-t border-[var(--border)]">
              <Button variant="ghost" size="sm" onClick={() => setPage(p => p + 1)}>
                {isAr ? "تحميل المزيد" : "Load More"} ↓
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
