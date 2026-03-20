"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Badge, StatCard, SkeletonCard } from "@ironcoach/ui";
import { api } from "../../../../../lib/api";

export default function CoachDetailPage() {
  const params = useParams();
  const orgId = params.orgId as string;

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "coaches", orgId],
    queryFn: () => api.get<any>(`/admin/coaches/${orgId}`),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!data) return <p>المنظمة غير موجودة</p>;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-xl font-bold">{data.name}</h1>
        <Badge variant={data.status === "active" ? "lime" : "rose"}>
          {data.status}
        </Badge>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="المالك" value={`${data.owner?.firstName} ${data.owner?.lastName}`} />
        <StatCard label="البريد" value={data.owner?.email || "—"} />
        <StatCard label="الخطة" value={data.subscription?.plan?.name || "بدون"} />
        <StatCard label="المتدربون" value={`${data.stats?.activeTrainees ?? 0} نشط`} />
      </div>

      <div className="bg-[#13131c] border border-[rgba(255,255,255,0.06)] rounded-xl p-5 space-y-3">
        <h3 className="font-semibold text-[14px] mb-3">بيانات الاشتراك</h3>
        <p className="text-[13px] text-[#7878a0]">
          الحالة: <span className="text-[#e8e8f2]">{data.subscription?.status ?? "—"}</span>
        </p>
        <p className="text-[13px] text-[#7878a0]">
          النطاق الفرعي: <span className="text-[#e8e8f2]">{data.subdomain}.ironcoach.com</span>
        </p>
        <p className="text-[13px] text-[#7878a0]">
          تاريخ الإنشاء: <span className="text-[#e8e8f2]">{new Date(data.createdAt).toLocaleDateString("ar")}</span>
        </p>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          onClick={async () => {
            if (confirm("هل أنت متأكد من تعليق هذا الحساب؟")) {
              await api.put(`/admin/coaches/${orgId}/suspend`, { reason: "تعليق من الأدمن" });
              window.location.reload();
            }
          }}
          className="px-4 py-2 bg-[rgba(255,79,123,0.12)] text-[#ff4f7b] border border-[rgba(255,79,123,0.2)] rounded-lg text-[13px] font-medium"
        >
          تعليق الحساب
        </button>
        <button
          onClick={async () => {
            if (confirm(`ستدخل كـ ${data.name} — لمدة ساعة واحدة`)) {
              const result = await api.post<any>(`/admin/coaches/${orgId}/impersonate`);
              document.cookie = `ironcoach_access=${result.impersonationToken};path=/;max-age=3600`;
              window.location.href = "/coach/dashboard";
            }
          }}
          className="px-4 py-2 bg-[rgba(255,176,64,0.12)] text-[#ffb040] border border-[rgba(255,176,64,0.2)] rounded-lg text-[13px] font-medium"
        >
          تسجيل الدخول كـ مدرب
        </button>
      </div>
    </div>
  );
}
