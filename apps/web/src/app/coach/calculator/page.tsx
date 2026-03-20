"use client";

import { useState, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, Button, Input, ProgressBar, Badge, Modal, Select } from "@/components/ui";
import { useToast } from "@/components/shared/Toast";
import { useTranslation } from "@/hooks/useTranslation";
import { api } from "../../../../lib/api";

const ACTIVITY_FACTORS = [
  { value: 1.2, ar: "خامل (مكتبي)", en: "Sedentary (desk job)" },
  { value: 1.375, ar: "خفيف (1-2 يوم/أسبوع)", en: "Light (1-2 days/week)" },
  { value: 1.55, ar: "متوسط (3-4 أيام/أسبوع)", en: "Moderate (3-4 days/week)" },
  { value: 1.725, ar: "نشيط (5-6 أيام/أسبوع)", en: "Active (5-6 days/week)" },
  { value: 1.9, ar: "نشيط جداً (رياضي يومي)", en: "Very Active (daily athlete)" },
];

const GOALS = [
  { value: "MUSCLE_GAIN", icon: "💪", ar: "بناء عضلات", en: "Muscle Gain", adj: 300, desc: { ar: "+200 إلى +500 سعرة", en: "+200 to +500 kcal" } },
  { value: "FAT_LOSS", icon: "🔥", ar: "حرق دهون", en: "Fat Loss", adj: -400, desc: { ar: "-250 إلى -500 سعرة", en: "-250 to -500 kcal" } },
  { value: "RECOMP", icon: "⚖️", ar: "تحسين القوام", en: "Body Recomp", adj: 0, desc: { ar: "±0 سعرة", en: "±0 kcal" } },
  { value: "STRENGTH", icon: "🏋️", ar: "قوة وأداء", en: "Strength", adj: 100, desc: { ar: "+100 سعرة", en: "+100 kcal" } },
];

export default function CalcPage() {
  const { lang } = useTranslation();
  const isAr = lang === "ar";

  const [gender, setGender] = useState<"MALE" | "FEMALE">("MALE");
  const [age, setAge] = useState("28");
  const [height, setHeight] = useState("178");
  const [weight, setWeight] = useState("82");
  const [activityFactor, setActivityFactor] = useState(1.55);
  const [goal, setGoal] = useState("MUSCLE_GAIN");
  const [step, setStep] = useState(1);
  const [showTraineeModal, setShowTraineeModal] = useState(false);
  const [selectedTrainee, setSelectedTrainee] = useState("");
  const { toast } = useToast();

  const { data: traineesData } = useQuery({
    queryKey: ["trainees-list"],
    queryFn: () => api.get("/trainers/trainees", { params: { limit: 100 } }),
  });

  const savePlanMutation = useMutation({
    mutationFn: () =>
      api.post("/nutrition/plans", {
        traineeProfileId: selectedTrainee || undefined,
        title: isAr ? "\u062e\u0637\u0629 \u063a\u0630\u0627\u0626\u064a\u0629" : "Nutrition Plan",
        goal: goal,
        caloriesTarget: calc.target,
        proteinG: calc.proteinG,
        carbsG: calc.carbG,
        fatsG: calc.fatG,
      }),
    onSuccess: () => {
      toast("success", isAr ? "تم حفظ الخطة بنجاح" : "Plan saved successfully");
      setShowTraineeModal(false);
      setSelectedTrainee("");
    },
    onError: () => {
      toast("error", isAr ? "حدث خطأ أثناء الحفظ" : "Failed to save plan");
    },
  });

  const calc = useMemo(() => {
    const w = parseFloat(weight) || 0;
    const h = parseFloat(height) || 0;
    const a = parseInt(age) || 0;

    const bmr = gender === "MALE"
      ? Math.round(10 * w + 6.25 * h - 5 * a + 5)
      : Math.round(10 * w + 6.25 * h - 5 * a - 161);

    const tdee = Math.round(bmr * activityFactor);
    const adj = GOALS.find(g => g.value === goal)?.adj ?? 0;
    const target = Math.round(tdee + adj);

    const proteinG = Math.round(w * 2.2);
    const fatG = Math.round((target * 0.30) / 9);
    const carbG = Math.round((target - proteinG * 4 - fatG * 9) / 4);

    const proteinCal = proteinG * 4;
    const carbCal = carbG * 4;
    const fatCal = fatG * 9;

    return { bmr, tdee, target, proteinG, carbG: Math.max(0, carbG), fatG, proteinCal, carbCal, fatCal };
  }, [gender, age, height, weight, activityFactor, goal]);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-[22px] font-bold tracking-tight mb-2">{isAr ? "حاسبة السعرات والماكرو" : "Calorie & Macro Calculator"}</h1>
      <p className="text-[13px] text-[var(--text-muted)] mb-8">{isAr ? "احسب السعرات المثالية لمتدربك" : "Calculate optimal calories for your trainee"}</p>

      {/* Progress */}
      <div className="flex gap-1 mb-8">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-[var(--accent)]" : "bg-[var(--bg-input)]"}`} />
        ))}
      </div>

      {/* Step 1: Body Data */}
      {step === 1 && (
        <Card className="animate-fadeIn">
          <h2 className="text-[16px] font-semibold mb-4">{isAr ? "البيانات الأساسية" : "Basic Data"}</h2>
          <div className="space-y-4">
            <div className="flex gap-3">
              {(["MALE", "FEMALE"] as const).map(g => (
                <button key={g} onClick={() => setGender(g)} className={`flex-1 py-3 rounded-[9px] text-[14px] font-semibold transition-colors ${gender === g ? "bg-[var(--accent)] text-[#0d0d12]" : "bg-[var(--bg-input)] text-[var(--text-secondary)] border border-[var(--border)]"}`}>
                  {g === "MALE" ? (isAr ? "ذكر" : "Male") : (isAr ? "أنثى" : "Female")}
                </button>
              ))}
            </div>
            <Input label={isAr ? "العمر" : "Age"} type="number" value={age} onChange={e => setAge(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Input label={isAr ? "الطول (سم)" : "Height (cm)"} type="number" value={height} onChange={e => setHeight(e.target.value)} />
              <Input label={isAr ? "الوزن (كجم)" : "Weight (kg)"} type="number" value={weight} onChange={e => setWeight(e.target.value)} />
            </div>
            <Button onClick={() => setStep(2)} className="w-full">{isAr ? "التالي" : "Next"} →</Button>
          </div>
        </Card>
      )}

      {/* Step 2: Activity */}
      {step === 2 && (
        <Card className="animate-fadeIn">
          <h2 className="text-[16px] font-semibold mb-4">{isAr ? "النشاط والتدريب" : "Activity & Training"}</h2>
          <div className="space-y-2 mb-4">
            {ACTIVITY_FACTORS.map(af => (
              <button key={af.value} onClick={() => setActivityFactor(af.value)} className={`w-full text-start px-4 py-3 rounded-[9px] text-[13px] transition-colors ${activityFactor === af.value ? "bg-[var(--accent-muted)] text-[var(--accent)] border border-[var(--accent)]" : "bg-[var(--bg-input)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--bg-hover)]"}`}>
                {isAr ? af.ar : af.en}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">← {isAr ? "السابق" : "Back"}</Button>
            <Button onClick={() => setStep(3)} className="flex-1">{isAr ? "التالي" : "Next"} →</Button>
          </div>
        </Card>
      )}

      {/* Step 3: Goal */}
      {step === 3 && (
        <Card className="animate-fadeIn">
          <h2 className="text-[16px] font-semibold mb-4">{isAr ? "الهدف" : "Goal"}</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {GOALS.map(g => (
              <button key={g.value} onClick={() => setGoal(g.value)} className={`text-start p-4 rounded-[9px] transition-colors ${goal === g.value ? "bg-[var(--accent-muted)] border-2 border-[var(--accent)]" : "bg-[var(--bg-input)] border border-[var(--border)] hover:bg-[var(--bg-hover)]"}`}>
                <span className="text-2xl block mb-2">{g.icon}</span>
                <p className="font-semibold text-[13px]">{isAr ? g.ar : g.en}</p>
                <p className="text-[11px] text-[var(--text-muted)] mt-1">{isAr ? g.desc.ar : g.desc.en}</p>
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setStep(2)} className="flex-1">← {isAr ? "السابق" : "Back"}</Button>
            <Button onClick={() => setStep(4)} className="flex-1">{isAr ? "عرض النتائج" : "View Results"} →</Button>
          </div>
        </Card>
      )}

      {/* Step 4: Results */}
      {step === 4 && (
        <div className="animate-fadeIn space-y-4">
          <Card>
            <h2 className="text-[16px] font-semibold mb-4">{isAr ? "نتائج الحساب" : "Calculation Results"}</h2>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">BMR</p>
                <p className="text-[24px] font-bold font-[Syne,sans-serif]">{calc.bmr}</p>
                <p className="text-[10px] text-[var(--text-muted)]">kcal</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">TDEE</p>
                <p className="text-[24px] font-bold font-[Syne,sans-serif]">{calc.tdee}</p>
                <p className="text-[10px] text-[var(--text-muted)]">kcal</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{isAr ? "المستهدف" : "Target"}</p>
                <p className="text-[24px] font-bold font-[Syne,sans-serif] text-[var(--accent)]">{calc.target}</p>
                <p className="text-[10px] text-[var(--text-muted)]">kcal</p>
              </div>
            </div>

            <h3 className="text-[14px] font-semibold mb-3">{isAr ? "توزيع الماكرو" : "Macro Distribution"}</h3>

            <MacroRow icon="🥩" label={isAr ? "بروتين" : "Protein"} grams={calc.proteinG} calories={calc.proteinCal} percent={Math.round((calc.proteinCal / calc.target) * 100)} color="var(--success)" formula={`${weight}kg × 2.2 = ${calc.proteinG}g`} />
            <MacroRow icon="🍚" label={isAr ? "كربوهيدرات" : "Carbs"} grams={calc.carbG} calories={calc.carbCal} percent={Math.round((calc.carbCal / calc.target) * 100)} color="var(--warning)" />
            <MacroRow icon="🥑" label={isAr ? "دهون" : "Fats"} grams={calc.fatG} calories={calc.fatCal} percent={Math.round((calc.fatCal / calc.target) * 100)} color="var(--error)" />
          </Card>

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setStep(3)} className="flex-1">← {isAr ? "تعديل" : "Edit"}</Button>
            <Button className="flex-1" onClick={() => setShowTraineeModal(true)}>{isAr ? "حفظ كخطة للمتدرب" : "Save as Plan"}</Button>
          </div>
        </div>
      )}

      <Modal open={showTraineeModal} onClose={() => setShowTraineeModal(false)} title={isAr ? "حفظ كخطة غذائية" : "Save as Nutrition Plan"}>
        <div className="space-y-4">
          <Select
            label={isAr ? "اختر المتدرب" : "Select Trainee"}
            value={selectedTrainee}
            onChange={(e) => setSelectedTrainee(e.target.value)}
            options={[
              { value: "", label: isAr ? "-- بدون متدرب --" : "-- No trainee --" },
              ...((traineesData as any)?.data ?? []).map((t: any) => ({
                value: t.id,
                label: t.user?.name ?? t.name ?? t.id,
              })),
            ]}
          />
          <Button
            className="w-full"
            onClick={() => savePlanMutation.mutate()}
            disabled={savePlanMutation.isPending}
          >
            {savePlanMutation.isPending
              ? (isAr ? "جاري الحفظ..." : "Saving...")
              : (isAr ? "حفظ" : "Save")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function MacroRow({ icon, label, grams, calories, percent, color, formula }: { icon: string; label: string; grams: number; calories: number; percent: number; color: string; formula?: string }) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span className="text-[13px] font-medium">{label}</span>
        </div>
        <span className="text-[13px] font-mono font-bold" style={{ color }}>{grams}g</span>
      </div>
      <ProgressBar value={percent} max={100} color={color} showLabel />
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-[var(--text-muted)]">{calories} kcal ({percent}%)</span>
        {formula && <span className="text-[10px] text-[var(--text-muted)]">{formula}</span>}
      </div>
    </div>
  );
}
