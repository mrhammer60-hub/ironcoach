"use client";

import { useState } from "react";
import { Card, Button } from "@/components/ui";
import { api } from "../../../../lib/api";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/components/shared/Toast";

const REPORTS = [
  { icon: "📊", titleAr: "تقرير المدربين", titleEn: "Coaches Report", descAr: "قائمة كاملة بجميع المدربين والبيانات", descEn: "Complete list of all coaches and their data", endpoint: "/admin/coaches?limit=1000", key: "coaches" },
  { icon: "💰", titleAr: "تقرير الإيرادات", titleEn: "Revenue Report", descAr: "تفصيل كامل للمدفوعات والاشتراكات", descEn: "Full payment and subscription details", endpoint: "/admin/revenue", key: "revenue" },
  { icon: "💪", titleAr: "تقرير التمارين", titleEn: "Exercises Report", descAr: "جميع التمارين المتوفرة في المنصة", descEn: "All exercises on the platform", endpoint: "/exercises?limit=500", key: "exercises" },
  { icon: "🥗", titleAr: "تقرير الأطعمة", titleEn: "Foods Report", descAr: "قاعدة بيانات الأطعمة الكاملة", descEn: "Complete food database", endpoint: "/nutrition/foods?limit=500", key: "foods" },
];

function downloadCSV(data: any[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map(row => headers.map(h => {
      const val = String(row[h] ?? "").replace(/"/g, '""');
      return val.includes(",") || val.includes('"') || val.includes("\n") ? `"${val}"` : val;
    }).join(","))
  ].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }); // BOM for Arabic support
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function flattenCoach(c: any) {
  return {
    id: c.id,
    firstName: c.user?.firstName ?? "",
    lastName: c.user?.lastName ?? "",
    email: c.user?.email ?? "",
    phone: c.user?.phone ?? "",
    planCode: c.subscription?.plan?.code ?? "",
    subscriptionStatus: c.subscription?.status ?? "",
    activeTrainees: c._count?.trainees ?? c.traineeCount ?? "",
    createdAt: c.createdAt ?? "",
  };
}

function flattenExercise(e: any) {
  return {
    id: e.id,
    nameEn: e.nameEn ?? "",
    nameAr: e.nameAr ?? "",
    muscleGroup: e.primaryMuscleGroup ?? e.muscleGroup ?? "",
    secondaryMuscles: Array.isArray(e.secondaryMuscleGroups) ? e.secondaryMuscleGroups.join("; ") : "",
    equipment: e.equipment ?? "",
    difficulty: e.difficulty ?? "",
    isCustom: e.isCustom ?? false,
    createdAt: e.createdAt ?? "",
  };
}

function flattenFood(f: any) {
  return {
    id: f.id,
    nameEn: f.nameEn ?? "",
    nameAr: f.nameAr ?? "",
    calories: f.caloriesPer100g ?? f.calories ?? "",
    proteinG: f.proteinPer100g ?? f.proteinG ?? "",
    carbsG: f.carbsPer100g ?? f.carbsG ?? "",
    fatsG: f.fatsPer100g ?? f.fatsG ?? "",
    servingUnit: f.servingUnit ?? "",
    category: f.category ?? "",
    createdAt: f.createdAt ?? "",
  };
}

export default function ReportsPage() {
  const { lang } = useTranslation();
  const isAr = lang === "ar";
  const { toast } = useToast();
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const handleDownload = async (report: typeof REPORTS[number]) => {
    setLoading(prev => ({ ...prev, [report.key]: true }));
    try {
      const data = await api.get<any>(report.endpoint);
      const items = data?.items || (Array.isArray(data) ? data : [data]);

      if (!items.length) {
        toast("error", isAr ? "لا توجد بيانات للتصدير" : "No data to export");
        return;
      }

      let rows: any[];
      switch (report.key) {
        case "coaches":
          rows = items.map(flattenCoach);
          break;
        case "exercises":
          rows = items.map(flattenExercise);
          break;
        case "foods":
          rows = items.map(flattenFood);
          break;
        default:
          rows = items;
          break;
      }

      const filename = `${report.key}_${new Date().toISOString().slice(0, 10)}.csv`;
      downloadCSV(rows, filename);
      toast("success", isAr ? "تم تحميل التقرير بنجاح" : "Report downloaded successfully");
    } catch {
      toast("error", isAr ? "تعذر تحميل التقرير" : "Failed to download report");
    } finally {
      setLoading(prev => ({ ...prev, [report.key]: false }));
    }
  };

  return (
    <div>
      <h1 className="text-[22px] font-bold tracking-tight mb-2">{isAr ? "التقارير" : "Reports"}</h1>
      <p className="text-[13px] text-[var(--text-muted)] mb-8">{isAr ? "تحميل تقارير المنصة بصيغة CSV" : "Download platform reports as CSV"}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORTS.map((r) => (
          <Card key={r.key} className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[var(--bg-input)] flex items-center justify-center text-2xl shrink-0">{r.icon}</div>
            <div className="flex-1">
              <h3 className="text-[14px] font-semibold mb-1">{isAr ? r.titleAr : r.titleEn}</h3>
              <p className="text-[12px] text-[var(--text-muted)] mb-3">{isAr ? r.descAr : r.descEn}</p>
              <Button
                size="sm"
                variant="ghost"
                disabled={loading[r.key]}
                onClick={() => handleDownload(r)}
              >
                {loading[r.key] ? (isAr ? "⏳ جاري التحميل..." : "⏳ Loading...") : `📥 ${isAr ? "تحميل CSV" : "Download CSV"}`}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
