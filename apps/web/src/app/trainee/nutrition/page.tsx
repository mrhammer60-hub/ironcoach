"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, SkeletonCard, EmptyState, ProgressBar, Badge, Button } from "@/components/ui";
import { CircularProgress } from "@/components/ui";
import { api } from "../../../../lib/api";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/components/shared/Toast";

export default function TraineeNutritionPage() {
  const { t, lang } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = lang === "ar";
  const [expandedMeal, setExpandedMeal] = useState<number | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const [waterCups, setWaterCups] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ironcoach_water_" + today);
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  useEffect(() => {
    localStorage.setItem("ironcoach_water_" + today, waterCups.toString());
  }, [waterCups, today]);

  const { data, isLoading } = useQuery({
    queryKey: ["nutrition", "today"],
    queryFn: () => api.get<any>("/nutrition/today"),
  });

  const consumeMutation = useMutation({
    mutationFn: (meal: any) => api.post("/nutrition/logs", {
      nutritionPlanMealId: meal.id,
      calories: Number(meal.calories) || 0,
      proteinG: Number(meal.proteinG) || 0,
      carbsG: Number(meal.carbsG) || 0,
      fatsG: Number(meal.fatsG) || 0,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nutrition", "today"] });
      toast("success", isAr ? "✅ تم تسجيل الوجبة!" : "✅ Meal logged!");
    },
    onError: () => toast("error", isAr ? "فشل تسجيل الوجبة" : "Failed to log meal"),
  });

  if (isLoading) return <div className="space-y-3 max-w-[440px] mx-auto"><SkeletonCard /><SkeletonCard /></div>;
  if (!data?.plan) return <EmptyState icon="🥗" title={t("trainee.noMealPlan")} description={isAr ? "انتظر مدربك لتعيين خطة غذائية" : "Wait for your coach to assign a meal plan"} />;

  const consumed = data.todayLog?.totalCalories ?? 0;
  const target = data.plan.caloriesTarget ?? 0;
  const remaining = Math.max(0, target - consumed);
  const pct = target > 0 ? Math.min(100, Math.round((consumed / target) * 100)) : 0;

  const proteinConsumed = data.todayLog?.totalProtein ?? 0;
  const carbsConsumed = data.todayLog?.totalCarbs ?? 0;
  const fatsConsumed = data.todayLog?.totalFats ?? 0;

  return (
    <div className="space-y-5 max-w-[440px] mx-auto">
      {/* Macro Summary */}
      <Card className="text-center">
        {/* Large calorie ring */}
        <CircularProgress value={pct} size="lg" color="var(--accent)">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold font-display tabular-nums">{consumed}</span>
            <span className="text-[10px] text-[var(--text-muted)]">{isAr ? `من ${target}` : `of ${target}`}</span>
          </div>
        </CircularProgress>

        <p className="text-sm text-[var(--text-secondary)] my-4">
          {isAr ? `متبقي: ${remaining} سعرة` : `Remaining: ${remaining} kcal`}
        </p>

        {/* Macro bars */}
        <div className="grid grid-cols-3 gap-4">
          <MacroCol icon="🥩" label={isAr ? "بروتين" : "Protein"} current={proteinConsumed} target={data.plan.proteinG} color="var(--success)" />
          <MacroCol icon="🍚" label={isAr ? "كربو" : "Carbs"} current={carbsConsumed} target={data.plan.carbsG} color="var(--warning)" />
          <MacroCol icon="🥑" label={isAr ? "دهون" : "Fats"} current={fatsConsumed} target={data.plan.fatsG} color="var(--error)" />
        </div>
      </Card>

      {/* Meals */}
      <div>
        <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-3">{isAr ? "وجبات اليوم" : "Today's Meals"}</p>
        {data.meals?.map((meal: any, i: number) => {
          const expanded = expandedMeal === i;
          const mealIcons = ["🌅", "☀️", "🏋️", "🌙", "🍎"];
          const mealIcon = mealIcons[i] || "🍽️";
          const hasItems = meal.items && meal.items.length > 0;

          return (
            <Card key={meal.id || i} padding="sm" className="mb-2">
              <button onClick={() => setExpandedMeal(expanded ? null : i)} className="w-full text-start flex items-center justify-between" aria-expanded={expanded}>
                <div className="flex items-center gap-2">
                  <span className="text-base">{mealIcon}</span>
                  <div>
                    <p className="text-sm font-semibold">{isAr ? meal.titleAr || meal.title : meal.title}</p>
                    {meal.timeSuggestion && <p className="text-[10px] text-[var(--text-muted)]">{meal.timeSuggestion}</p>}
                  </div>
                </div>
                <span className="text-sm font-mono text-[var(--accent)]">{Number(meal.calories)} kcal</span>
              </button>

              {expanded && (
                <div className="mt-3 pt-3 border-t border-[var(--border)] animate-fadeIn">
                  {/* Meal items (food list) */}
                  {hasItems ? (
                    meal.items.map((item: any, j: number) => (
                      <div key={j} className="flex items-center justify-between py-1.5 text-xs">
                        <span>{isAr ? (item.food?.nameAr || item.customFoodName || item.food?.nameEn) : (item.food?.nameEn || item.customFoodName || item.food?.nameAr)}</span>
                        <div className="flex items-center gap-3 text-[var(--text-muted)]">
                          <span>{Number(item.quantityGrams)}g</span>
                          <span className="font-mono">{Number(item.calories)} kcal</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[var(--text-muted)] py-2">{isAr ? "لا توجد تفاصيل الأطعمة" : "No food details available"}</p>
                  )}

                  {/* Macro summary for this meal */}
                  <div className="flex gap-3 text-[10px] text-[var(--text-muted)] pt-2 mt-2 border-t border-[var(--border)]">
                    <span>P: <b className="text-[var(--success)]">{Number(meal.proteinG)}g</b></span>
                    <span>C: <b className="text-[var(--warning)]">{Number(meal.carbsG)}g</b></span>
                    <span>F: <b className="text-[var(--error)]">{Number(meal.fatsG)}g</b></span>
                  </div>

                  {/* Consume button */}
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => consumeMutation.mutate(meal)}
                    loading={consumeMutation.isPending}
                  >
                    ✅ {isAr ? "تم تناول هذه الوجبة" : "Mark as consumed"}
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Water Tracker */}
      <Card>
        <p className="text-sm font-semibold mb-3">💧 {isAr ? "شرب الماء" : "Water Intake"}</p>
        <div className="flex gap-1.5 mb-2 justify-center">
          {Array.from({ length: 8 }, (_, i) => (
            <button
              key={i}
              onClick={() => setWaterCups(i < waterCups ? i : i + 1)}
              className={`w-9 h-9 rounded-full text-xs transition-all ${
                i < waterCups
                  ? "bg-[var(--info)] text-white scale-105"
                  : "bg-[var(--bg-input)] text-[var(--text-muted)]"
              }`}
              aria-label={`${i + 1} ${isAr ? "كوب" : "cup"}`}
            >
              💧
            </button>
          ))}
        </div>
        <p className="text-center text-xs text-[var(--text-muted)]">{waterCups} / 8 {isAr ? "أكواب" : "cups"}</p>
      </Card>
    </div>
  );
}

function MacroCol({ icon, label, current, target, color }: { icon: string; label: string; current: number; target: number; color: string }) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  return (
    <div className="text-center">
      <span className="text-sm">{icon}</span>
      <p className="text-base font-bold font-mono mt-1" style={{ color }}>{Math.round(current)}g</p>
      <p className="text-[9px] text-[var(--text-muted)]">/ {target}g</p>
      <div className="h-1.5 bg-[var(--bg-input)] rounded-full overflow-hidden mt-1.5">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
