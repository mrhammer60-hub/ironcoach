"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, Button, Input, Select, Badge, Skeleton, EmptyState, Drawer, ProgressBar } from "@/components/ui";
import { api } from "../../../../lib/api";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/components/shared/Toast";

interface MealFood { foodId: string; name: string; grams: number; calories: number; proteinG: number; carbsG: number; fatsG: number; }
interface BuilderMeal { title: string; titleAr: string; time: string; foods: MealFood[]; }

export default function NutritionPage() {
  const { t, lang } = useTranslation();
  const isAr = lang === "ar";
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [showBuilder, setShowBuilder] = useState(false);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [selectedTrainee, setSelectedTrainee] = useState("");
  const [planTitle, setPlanTitle] = useState("");
  const [calories, setCalories] = useState("2500");
  const [proteinG, setProteinG] = useState("160");
  const [carbsG, setCarbsG] = useState("280");
  const [fatsG, setFatsG] = useState("80");
  const [meals, setMeals] = useState<BuilderMeal[]>([
    { title: "Breakfast", titleAr: "الفطور", time: "07:30", foods: [] },
    { title: "Lunch", titleAr: "الغداء", time: "13:00", foods: [] },
    { title: "Dinner", titleAr: "العشاء", time: "20:00", foods: [] },
  ]);
  const [activeMeal, setActiveMeal] = useState(0);
  const [foodSearch, setFoodSearch] = useState("");

  const { data: plans, isLoading } = useQuery({ queryKey: ["nutrition", "plans"], queryFn: () => api.get<any[]>("/nutrition/plans") });
  const { data: trainees } = useQuery({ queryKey: ["coach", "trainees", "sel"], queryFn: () => api.get<any>("/trainers/trainees", { params: { limit: 100 } }), enabled: showBuilder });
  const { data: foodResults } = useQuery({ queryKey: ["foods", foodSearch], queryFn: () => api.get<any>("/nutrition/foods", { params: { search: foodSearch, limit: 15 } }), enabled: foodSearch.length >= 2, staleTime: 10 * 60 * 1000 });

  const handleTraineeSelect = (id: string) => {
    setSelectedTrainee(id);
    const tr = trainees?.items?.find((t: any) => t.id === id);
    if (tr) { const w = Number(tr.currentWeightKg) || 80; setProteinG(String(Math.round(w * 2))); setFatsG(String(Math.round((2500 * 0.25) / 9))); setCarbsG(String(Math.round((2500 - Math.round(w * 2) * 4 - Math.round((2500 * 0.25) / 9) * 9) / 4))); }
  };

  const addFood = (food: any, grams: number) => {
    const f = grams / 100;
    setMeals(prev => { const u = [...prev]; u[activeMeal] = { ...u[activeMeal], foods: [...u[activeMeal].foods, { foodId: food.id, name: isAr ? food.nameAr : food.nameEn, grams, calories: Math.round(Number(food.caloriesPer100g) * f), proteinG: Math.round(Number(food.proteinG) * f * 10) / 10, carbsG: Math.round(Number(food.carbsG) * f * 10) / 10, fatsG: Math.round(Number(food.fatsG) * f * 10) / 10 }] }; return u; });
    setFoodSearch("");
  };

  const removeFood = (mi: number, fi: number) => { setMeals(prev => { const u = [...prev]; u[mi] = { ...u[mi], foods: u[mi].foods.filter((_, i) => i !== fi) }; return u; }); };
  const mealTotals = (m: BuilderMeal) => m.foods.reduce((a, f) => ({ cal: a.cal + f.calories, p: a.p + f.proteinG, c: a.c + f.carbsG, f: a.f + f.fatsG }), { cal: 0, p: 0, c: 0, f: 0 });

  const handleSave = async () => {
    setSaving(true);
    try {
      const plan = await api.post<any>("/nutrition/plans", { traineeProfileId: selectedTrainee || undefined, title: planTitle || (isAr ? "خطة غذائية" : "Meal Plan"), goal: "GENERAL_FITNESS", caloriesTarget: parseInt(calories), proteinG: parseInt(proteinG), carbsG: parseInt(carbsG), fatsG: parseInt(fatsG) });
      for (let i = 0; i < meals.length; i++) { const m = meals[i]; if (!m.foods.length) continue; const cm = await api.post<any>(`/nutrition/plans/${plan.id}/meals`, { title: m.title, titleAr: m.titleAr, mealOrder: i + 1, timeSuggestion: m.time }); for (const f of m.foods) await api.post(`/nutrition/meals/${cm.id}/items`, { foodId: f.foodId, quantityGrams: f.grams }); }
      if (selectedTrainee) await api.post(`/nutrition/plans/${plan.id}/assign`, { traineeProfileId: selectedTrainee, startDate: new Date().toISOString().slice(0, 10) });
      toast("success", isAr ? "تم إنشاء الخطة بنجاح!" : "Plan created!");
      setShowBuilder(false);
      queryClient.invalidateQueries({ queryKey: ["nutrition"] });
    } catch (err: any) { toast("error", err?.error?.message || "Error"); } finally { setSaving(false); }
  };

  const reset = () => { setStep(1); setSelectedTrainee(""); setPlanTitle(""); setCalories("2500"); setProteinG("160"); setCarbsG("280"); setFatsG("80"); setMeals([{ title: "Breakfast", titleAr: "الفطور", time: "07:30", foods: [] }, { title: "Lunch", titleAr: "الغداء", time: "13:00", foods: [] }, { title: "Dinner", titleAr: "العشاء", time: "20:00", foods: [] }]); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-[22px] font-bold tracking-tight">{t("nav.nutrition")}</h1><p className="text-[13px] text-[var(--text-muted)] mt-1">{(plans as any[])?.length ?? 0} {isAr ? "خطة" : "plans"}</p></div>
        <Button onClick={() => { reset(); setShowBuilder(true); }}>+ {isAr ? "خطة جديدة" : "New Plan"}</Button>
      </div>

      {isLoading ? <div className="grid grid-cols-2 gap-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-32" />)}</div>
      : !(plans as any[])?.length ? <EmptyState icon="🥗" title={isAr ? "لا توجد خطط بعد" : "No plans yet"} description={isAr ? "أنشئ خطة تغذية لمتدربيك" : "Create a plan"} action={{ label: isAr ? "إنشاء خطة" : "Create", onClick: () => { reset(); setShowBuilder(true); } }} />
      : <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{(plans as any[]).map((p: any) => (
        <Card key={p.id}>
          <div className="flex justify-between mb-2"><h3 className="font-semibold text-[14px]">{p.title}</h3><Badge variant={p.isActive ? "success" : "muted"}>{p.isActive ? (isAr ? "نشط" : "Active") : "—"}</Badge></div>
          <p className="text-[24px] font-bold font-[Syne,sans-serif] text-[var(--accent)]">{p.caloriesTarget} <span className="text-[12px] font-normal text-[var(--text-muted)]">kcal</span></p>
          <div className="flex gap-4 text-[12px] text-[var(--text-muted)] mt-1"><span>P: <b className="text-[var(--success)]">{p.proteinG}g</b></span><span>C: <b className="text-[var(--warning)]">{p.carbsG}g</b></span><span>F: <b className="text-[var(--error)]">{p.fatsG}g</b></span></div>
        </Card>
      ))}</div>}

      {/* Builder Drawer */}
      <Drawer open={showBuilder} onClose={() => setShowBuilder(false)} title={isAr ? "إنشاء خطة غذائية" : "Create Meal Plan"} width="max-w-2xl">
        <div className="flex gap-1 mb-6">{[1,2,3,4].map(s => <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? "bg-[var(--accent)]" : "bg-[var(--bg-input)]"}`} />)}</div>

        {step === 1 && <div className="space-y-4 animate-fadeIn">
          <Input label={isAr ? "اسم الخطة" : "Plan Name"} value={planTitle} onChange={e => setPlanTitle(e.target.value)} placeholder={isAr ? "خطة بناء عضلات" : "Muscle Plan"} />
          <Select label={isAr ? "المتدرب" : "Trainee"} value={selectedTrainee} onChange={e => handleTraineeSelect(e.target.value)} options={[{ value: "", label: isAr ? "— بدون متدرب —" : "— No trainee —" }, ...(trainees?.items?.map((t: any) => ({ value: t.id, label: `${t.user.firstName} ${t.user.lastName}` })) ?? [])]} />
          <Button onClick={() => setStep(2)} className="w-full">{isAr ? "التالي" : "Next"} →</Button>
        </div>}

        {step === 2 && <div className="space-y-4 animate-fadeIn">
          <h3 className="text-[15px] font-semibold">{isAr ? "أهداف الماكرو" : "Macro Targets"}</h3>
          <Input label={isAr ? "السعرات" : "Calories"} type="number" value={calories} onChange={e => setCalories(e.target.value)} />
          <div className="grid grid-cols-3 gap-3">
            <Input label={`${isAr ? "بروتين" : "P"} (g)`} type="number" value={proteinG} onChange={e => setProteinG(e.target.value)} />
            <Input label={`${isAr ? "كربو" : "C"} (g)`} type="number" value={carbsG} onChange={e => setCarbsG(e.target.value)} />
            <Input label={`${isAr ? "دهون" : "F"} (g)`} type="number" value={fatsG} onChange={e => setFatsG(e.target.value)} />
          </div>
          <div className="flex gap-3"><Button variant="ghost" onClick={() => setStep(1)} className="flex-1">←</Button><Button onClick={() => setStep(3)} className="flex-1">{isAr ? "التالي" : "Next"} →</Button></div>
        </div>}

        {step === 3 && <div className="animate-fadeIn">
          <h3 className="text-[15px] font-semibold mb-3">{isAr ? "بناء الوجبات" : "Build Meals"}</h3>
          <Card padding="sm" className="mb-3"><div className="flex justify-between text-[12px]"><span className="text-[var(--text-muted)]">{isAr ? "الإجمالي" : "Total"}</span><span className="font-mono">{meals.reduce((s, m) => s + mealTotals(m).cal, 0)} / {calories} kcal</span></div><ProgressBar value={meals.reduce((s, m) => s + mealTotals(m).cal, 0)} max={parseInt(calories) || 1} color="var(--accent)" className="mt-1" /></Card>

          {meals.map((meal, mi) => { const tot = mealTotals(meal); return (
            <Card key={mi} padding="sm" className={`mb-2 ${mi === activeMeal ? "border-[var(--accent)]" : ""}`}>
              <button onClick={() => setActiveMeal(mi)} className="w-full text-start flex justify-between">
                <span className="font-semibold text-[13px]">{mi === 0 ? "🌅" : mi === 1 ? "☀️" : mi === 2 ? "🌙" : "🍎"} {isAr ? meal.titleAr : meal.title}</span>
                <span className="text-[12px] font-mono text-[var(--accent)]">{tot.cal} kcal</span>
              </button>
              {mi === activeMeal && <div className="mt-3 pt-2 border-t border-[var(--border)]">
                {meal.foods.map((f, fi) => <div key={fi} className="flex justify-between text-[12px] py-1"><span>{f.name} — {f.grams}g</span><div className="flex gap-2"><span className="font-mono text-[var(--text-muted)]">{f.calories} kcal</span><button onClick={() => removeFood(mi, fi)} className="text-[var(--error)]">✕</button></div></div>)}
                <Input placeholder={isAr ? "ابحث عن طعام..." : "Search food..."} value={foodSearch} onChange={e => setFoodSearch(e.target.value)} icon={<span>🔍</span>} className="mt-2" />
                {foodSearch.length >= 2 && foodResults?.items?.map((food: any) => (
                  <FoodResult key={food.id} food={food} isAr={isAr} onAdd={g => addFood(food, g)} />
                ))}
              </div>}
            </Card>
          ); })}
          <button onClick={() => setMeals(p => [...p, { title: `Snack`, titleAr: "وجبة خفيفة", time: "16:00", foods: [] }])} className="w-full py-2 border border-dashed border-[var(--border)] rounded-lg text-[12px] text-[var(--accent)] mb-3">+ {isAr ? "إضافة وجبة" : "Add Meal"}</button>
          <div className="flex gap-3"><Button variant="ghost" onClick={() => setStep(2)} className="flex-1">←</Button><Button onClick={() => setStep(4)} className="flex-1">{isAr ? "مراجعة" : "Review"} →</Button></div>
        </div>}

        {step === 4 && <div className="animate-fadeIn">
          <h3 className="text-[15px] font-semibold mb-3">{isAr ? "مراجعة وحفظ" : "Review"}</h3>
          <Card padding="sm" className="mb-4 space-y-2 text-[13px]">
            <div className="flex justify-between"><span className="text-[var(--text-muted)]">{isAr ? "السعرات" : "Calories"}</span><span className="font-bold text-[var(--accent)]">{calories} kcal</span></div>
            <div className="flex justify-between"><span className="text-[var(--text-muted)]">P / C / F</span><span className="font-mono">{proteinG}g / {carbsG}g / {fatsG}g</span></div>
            <div className="flex justify-between"><span className="text-[var(--text-muted)]">{isAr ? "الوجبات" : "Meals"}</span><span>{meals.filter(m => m.foods.length).length}</span></div>
          </Card>
          <div className="flex gap-3"><Button variant="ghost" onClick={() => setStep(3)} className="flex-1">←</Button><Button onClick={handleSave} loading={saving} className="flex-1">💾 {isAr ? "حفظ" : "Save"}</Button></div>
        </div>}
      </Drawer>
    </div>
  );
}

function FoodResult({ food, isAr, onAdd }: { food: any; isAr: boolean; onAdd: (g: number) => void }) {
  const [g, setG] = useState("100");
  return (
    <div className="flex items-center gap-2 py-1.5 text-[12px]">
      <span className="flex-1 truncate">{isAr ? food.nameAr : food.nameEn} ({Number(food.caloriesPer100g)} kcal/100g)</span>
      <input type="number" value={g} onChange={e => setG(e.target.value)} className="input-base w-14 px-1 py-0.5 text-[11px] text-center" />
      <button onClick={() => onAdd(parseInt(g) || 100)} className="text-[var(--accent)] font-semibold">+</button>
    </div>
  );
}
