"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Input, Button, Badge, Avatar, Skeleton, EmptyState, ProgressBar } from "@/components/ui";
import { api } from "../../../../lib/api";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/components/shared/Toast";
import Link from "next/link";

const STATUS_FILTERS = [
  { value: "", ar: "الكل", en: "All" },
  { value: "active", ar: "نشط", en: "Active" },
  { value: "suspended", ar: "موقوف", en: "Suspended" },
];

export default function CoachesPage() {
  const { t, lang } = useTranslation();
  const isAr = lang === "ar";
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "coaches", search, statusFilter, page],
    queryFn: () => api.get<any>("/admin/coaches", {
      params: { search: search || undefined, status: statusFilter || undefined, page, limit: 20 },
    }),
  });

  const suspendMutation = useMutation({
    mutationFn: (orgId: string) => api.put(`/admin/coaches/${orgId}/suspend`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coaches"] });
    },
    onError: (err: any) => toast("error", err?.error?.message || (isAr ? "فشل تعليق الحساب" : "Failed to suspend account")),
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-[22px] font-bold tracking-tight">{t("nav.coaches")}</h1>
          <Badge variant="muted">{data?.total ?? 0}</Badge>
        </div>
        <Button variant="ghost" size="sm">{isAr ? "تصدير CSV" : "Export CSV"}</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Input
          placeholder={t("common.search")}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          icon={<span>🔍</span>}
          className="w-72"
        />
        <div className="flex border border-[var(--border)] rounded-lg overflow-hidden">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => { setStatusFilter(f.value); setPage(1); }}
              className={`px-3 py-2 text-[12px] font-medium transition-colors ${statusFilter === f.value ? "bg-[var(--accent-muted)] text-[var(--accent)]" : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"}`}
            >
              {isAr ? f.ar : f.en}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16" />)}</div>
      ) : data?.items?.length === 0 ? (
        <EmptyState icon="🏋️" title={isAr ? "لا يوجد مدربون" : "No coaches found"} />
      ) : (
        <Card padding="sm">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border)]">
                  <th className="text-start pb-3 ps-3 font-semibold">{isAr ? "المدرب" : "Coach"}</th>
                  <th className="text-start pb-3 font-semibold">{isAr ? "الخطة" : "Plan"}</th>
                  <th className="text-start pb-3 font-semibold">{isAr ? "المتدربون" : "Trainees"}</th>
                  <th className="text-start pb-3 font-semibold">{isAr ? "الحالة" : "Status"}</th>
                  <th className="text-start pb-3 font-semibold">{isAr ? "الانضمام" : "Joined"}</th>
                  <th className="text-start pb-3 font-semibold">{isAr ? "إجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {data?.items?.map((org: any) => (
                  <tr key={org.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="py-3 ps-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={org.name} size="sm" />
                        <div>
                          <p className="font-medium">{org.name}</p>
                          <p className="text-[11px] text-[var(--text-muted)]">{org.owner?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <Badge variant={org.subscription?.plan?.code === "PRO" ? "warning" : org.subscription?.plan?.code === "GROWTH" ? "accent" : "info"}>
                        {org.subscription?.plan?.name || "—"}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <div className="w-24">
                        <span className="text-[12px] font-mono">{org._count?.members ?? 0}</span>
                        <ProgressBar value={org._count?.members ?? 0} max={org.subscription?.plan?.maxTrainees ?? 50} className="mt-1" />
                      </div>
                    </td>
                    <td className="py-3">
                      <Badge variant={org.status === "active" ? "success" : "error"}>
                        {org.status === "active" ? (isAr ? "نشط" : "Active") : (isAr ? "موقوف" : "Suspended")}
                      </Badge>
                    </td>
                    <td className="py-3 text-[12px] text-[var(--text-muted)]">
                      {new Date(org.createdAt).toLocaleDateString(isAr ? "ar" : "en")}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <Link href={`/admin/coaches/${org.id}`}>
                          <Button variant="ghost" size="sm">👁️</Button>
                        </Link>
                        <Button variant="ghost" size="sm" loading={suspendMutation.isPending && suspendMutation.variables === org.id} onClick={() => {
                          if (confirm(isAr ? "تعليق هذا الحساب؟" : "Suspend this account?")) {
                            suspendMutation.mutate(org.id);
                          }
                        }}>⚠️</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data?.hasNextPage && (
            <div className="flex justify-center pt-4 border-t border-[var(--border)]">
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  ← {isAr ? "السابق" : "Prev"}
                </Button>
                <span className="px-3 py-1.5 text-[12px] text-[var(--text-muted)]">{page}</span>
                <Button variant="ghost" size="sm" onClick={() => setPage(p => p + 1)}>
                  {isAr ? "التالي" : "Next"} →
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
