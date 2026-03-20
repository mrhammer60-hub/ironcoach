"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Card, Badge, Skeleton, EmptyState, Drawer } from "@/components/ui";
import { api } from "../../../../lib/api";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/components/shared/Toast";

export default function AdminFoodsPage() {
  const { t, lang } = useTranslation();
  const isAr = lang === "ar";
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editFood, setEditFood] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "foods", search],
    queryFn: () => api.get<any>("/nutrition/foods", { params: { search, limit: 50 } }),
    staleTime: 10 * 60 * 1000, // 10 min — food database rarely changes
  });

  const [form, setForm] = useState({
    nameAr: "", nameEn: "", caloriesPer100g: "", proteinG: "", carbsG: "", fatsG: "", fiberG: "",
  });

  const openAdd = () => {
    setEditFood(null);
    setForm({ nameAr: "", nameEn: "", caloriesPer100g: "", proteinG: "", carbsG: "", fatsG: "", fiberG: "" });
    setDrawerOpen(true);
  };

  // Calculate calories from macros
  const calcCals = () => {
    const p = parseFloat(form.proteinG) || 0;
    const c = parseFloat(form.carbsG) || 0;
    const f = parseFloat(form.fatsG) || 0;
    return Math.round(p * 4 + c * 4 + f * 9);
  };

  const saveMutation = useMutation({
    mutationFn: (data: any) => api.post("/nutrition/foods", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "foods"] });
      setDrawerOpen(false);
      toast("success", isAr ? "تم إضافة الطعام بنجاح" : "Food added successfully");
    },
    onError: () => toast("error", isAr ? "فشل إضافة الطعام" : "Failed to add food"),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">{t("admin.foodDatabase")}</h1>
          <p className="text-[var(--text-muted)] text-sm">
            {data?.total ?? 0} {isAr ? "طعام" : "foods"}
          </p>
        </div>
        <Button onClick={openAdd}>+ {t("admin.addFood")}</Button>
      </div>

      <Input
        placeholder={t("common.search")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        icon={<span>🔍</span>}
        className="mb-4 max-w-sm"
      />

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : data?.items?.length === 0 ? (
        <EmptyState icon="🥗" title={t("empty.foods")} />
      ) : (
        <Card padding="sm">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[var(--text-muted)] text-[11px] border-b border-[var(--border)]">
                <th className="text-start pb-2 font-medium">{isAr ? "الطعام" : "Food"}</th>
                <th className="text-start pb-2 font-medium">{t("nutrition.calories")}</th>
                <th className="text-start pb-2 font-medium">{t("nutrition.protein")}</th>
                <th className="text-start pb-2 font-medium">{t("nutrition.carbs")}</th>
                <th className="text-start pb-2 font-medium">{t("nutrition.fats")}</th>
              </tr>
            </thead>
            <tbody>
              {data?.items?.map((food: any) => (
                <tr key={food.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors">
                  <td className="py-2.5">
                    <p className="font-medium">{isAr ? food.nameAr : food.nameEn}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">{isAr ? food.nameEn : food.nameAr}</p>
                  </td>
                  <td className="py-2.5 font-mono text-[var(--warning)]">{Number(food.caloriesPer100g)}</td>
                  <td className="py-2.5 font-mono text-[var(--success)]">{Number(food.proteinG)}g</td>
                  <td className="py-2.5 font-mono text-[var(--info)]">{Number(food.carbsG)}g</td>
                  <td className="py-2.5 font-mono text-[var(--error)]">{Number(food.fatsG)}g</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Add/Edit Food Drawer */}
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={t("admin.addFood")}>
        <div className="space-y-4">
          <Input
            label={isAr ? "اسم الطعام بالعربية" : "Food Name (Arabic)"}
            value={form.nameAr}
            onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
            placeholder={isAr ? "دجاج مشوي" : "Grilled Chicken"}
          />
          <Input
            label={isAr ? "اسم الطعام بالإنجليزية" : "Food Name (English)"}
            value={form.nameEn}
            onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
            placeholder="Grilled Chicken"
          />

          <div className="border-t border-[var(--border)] pt-4">
            <p className="text-[12px] font-medium text-[var(--text-secondary)] mb-3">
              {t("nutrition.per100g")}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Input label={t("nutrition.calories")} type="number" value={form.caloriesPer100g} onChange={(e) => setForm({ ...form, caloriesPer100g: e.target.value })} />
              <Input label={t("nutrition.protein") + " (g)"} type="number" value={form.proteinG} onChange={(e) => setForm({ ...form, proteinG: e.target.value })} />
              <Input label={t("nutrition.carbs") + " (g)"} type="number" value={form.carbsG} onChange={(e) => setForm({ ...form, carbsG: e.target.value })} />
              <Input label={t("nutrition.fats") + " (g)"} type="number" value={form.fatsG} onChange={(e) => setForm({ ...form, fatsG: e.target.value })} />
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-2">
              {isAr ? "من الماكرو:" : "From macros:"} {calcCals()} {isAr ? "سعرة" : "kcal"}
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
            <Button variant="ghost" onClick={() => setDrawerOpen(false)} className="flex-1">
              {t("common.cancel")}
            </Button>
            <Button
              className="flex-1"
              loading={saveMutation.isPending}
              onClick={() => saveMutation.mutate({
                nameAr: form.nameAr,
                nameEn: form.nameEn,
                caloriesPer100g: parseInt(form.caloriesPer100g) || calcCals(),
                proteinG: parseFloat(form.proteinG) || 0,
                carbsG: parseFloat(form.carbsG) || 0,
                fatsG: parseFloat(form.fatsG) || 0,
                fiberG: parseFloat(form.fiberG) || 0,
              })}
            >
              💾 {t("common.save")}
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
