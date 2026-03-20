"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Card } from "@/components/ui";
import { api } from "../../../../lib/api";
import { useTranslation } from "@/hooks/useTranslation";

const GOALS = [
  { value: "MUSCLE_GAIN", ar: "بناء عضلات 💪", en: "Muscle Gain 💪" },
  { value: "FAT_LOSS", ar: "حرق دهون 🔥", en: "Fat Loss 🔥" },
  { value: "GENERAL_FITNESS", ar: "لياقة عامة ⚡", en: "General Fitness ⚡" },
  { value: "BULK", ar: "زيادة الوزن 🏋️", en: "Bulk 🏋️" },
  { value: "LEAN_CUT", ar: "تنشيف 🏃", en: "Lean Cut 🏃" },
];

const ACTIVITY_LEVELS = [
  { value: "SEDENTARY", ar: "خامل — عمل مكتبي", en: "Sedentary" },
  { value: "LIGHTLY_ACTIVE", ar: "نشاط خفيف — 1-2 يوم/أسبوع", en: "Lightly Active" },
  { value: "MODERATELY_ACTIVE", ar: "نشاط متوسط — 3-5 يوم/أسبوع", en: "Moderately Active" },
  { value: "VERY_ACTIVE", ar: "نشيط — 6-7 يوم/أسبوع", en: "Very Active" },
  { value: "EXTRA_ACTIVE", ar: "نشيط جداً — تمرين مرتين يومياً", en: "Extra Active" },
];

export default function TraineeOnboardingPage() {
  const router = useRouter();
  const { t, lang } = useTranslation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [form, setForm] = useState({
    gender: "MALE",
    birthDate: "",
    heightCm: "",
    currentWeightKg: "",
    targetWeightKg: "",
    activityLevel: "MODERATELY_ACTIVE",
    goal: "MUSCLE_GAIN",
    trainingDaysPerWeek: "4",
    injuriesNotes: "",
    foodPreferences: "",
    allergies: "",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await api.post<any>("/trainees/onboard", {
        gender: form.gender,
        birthDate: form.birthDate,
        heightCm: parseFloat(form.heightCm),
        currentWeightKg: parseFloat(form.currentWeightKg),
        targetWeightKg: form.targetWeightKg ? parseFloat(form.targetWeightKg) : undefined,
        activityLevel: form.activityLevel,
        goal: form.goal,
        trainingDaysPerWeek: parseInt(form.trainingDaysPerWeek),
        injuriesNotes: form.injuriesNotes || undefined,
        foodPreferences: form.foodPreferences || undefined,
        allergies: form.allergies || undefined,
      });
      setResult(res);
      setStep(5);
    } catch (err: any) {
      alert(err?.error?.message || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  const TOTAL_STEPS = 5;
  const isAr = lang === "ar";

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="flex gap-1 mb-8">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i < step ? "bg-[var(--accent)]" : "bg-[var(--bg-input)]"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Personal Info */}
        {step === 1 && (
          <Card className="animate-fadeIn">
            <h2 className="text-lg font-bold mb-1">
              {isAr ? "مرحباً! دعنا نتعرف عليك 👋" : "Welcome! Let's get to know you 👋"}
            </h2>
            <p className="text-[var(--text-secondary)] text-sm mb-6">
              {isAr ? "هذه المعلومات ستساعد مدربك في إعداد برنامجك" : "This info helps your coach prepare your program"}
            </p>
            <div className="space-y-4">
              <div className="flex gap-3">
                {[
                  { v: "MALE", ar: "ذكر", en: "Male" },
                  { v: "FEMALE", ar: "أنثى", en: "Female" },
                ].map((g) => (
                  <button
                    key={g.v}
                    onClick={() => update("gender", g.v)}
                    className={`flex-1 py-3 rounded-[9px] text-[14px] font-semibold transition-colors ${
                      form.gender === g.v
                        ? "bg-[var(--accent)] text-[#0d0d12]"
                        : "bg-[var(--bg-input)] text-[var(--text-secondary)] border border-[var(--border)]"
                    }`}
                  >
                    {isAr ? g.ar : g.en}
                  </button>
                ))}
              </div>
              <Input
                label={isAr ? "تاريخ الميلاد" : "Date of Birth"}
                type="date"
                value={form.birthDate}
                onChange={(e) => update("birthDate", e.target.value)}
              />
              <Button
                onClick={() => setStep(2)}
                disabled={!form.birthDate}
                className="w-full"
              >
                {t("common.next")} →
              </Button>
            </div>
          </Card>
        )}

        {/* Step 2: Body Stats */}
        {step === 2 && (
          <Card className="animate-fadeIn">
            <h2 className="text-lg font-bold mb-1">
              {isAr ? "بياناتك الجسدية 📏" : "Body Stats 📏"}
            </h2>
            <p className="text-[var(--text-secondary)] text-sm mb-6">
              {isAr ? "نحتاج هذه لحساب السعرات" : "We need these to calculate your calories"}
            </p>
            <div className="space-y-4">
              <Input
                label={isAr ? "الطول (سم)" : "Height (cm)"}
                type="number"
                value={form.heightCm}
                onChange={(e) => update("heightCm", e.target.value)}
                placeholder="178"
              />
              <Input
                label={isAr ? "الوزن الحالي (كجم)" : "Current Weight (kg)"}
                type="number"
                value={form.currentWeightKg}
                onChange={(e) => update("currentWeightKg", e.target.value)}
                placeholder="82"
              />
              <Input
                label={isAr ? "الوزن المستهدف (كجم)" : "Target Weight (kg)"}
                type="number"
                value={form.targetWeightKg}
                onChange={(e) => update("targetWeightKg", e.target.value)}
                placeholder="78"
                hint={isAr ? "اختياري" : "Optional"}
              />
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">
                  ← {t("common.previous")}
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!form.heightCm || !form.currentWeightKg}
                  className="flex-1"
                >
                  {t("common.next")} →
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Step 3: Activity & Goal */}
        {step === 3 && (
          <Card className="animate-fadeIn">
            <h2 className="text-lg font-bold mb-1">
              {isAr ? "مستواك وهدفك 🎯" : "Level & Goal 🎯"}
            </h2>
            <div className="space-y-4 mt-4">
              <Select
                label={isAr ? "مستوى النشاط" : "Activity Level"}
                value={form.activityLevel}
                onChange={(e) => update("activityLevel", e.target.value)}
                options={ACTIVITY_LEVELS.map((l) => ({
                  value: l.value,
                  label: isAr ? l.ar : l.en,
                }))}
              />
              <div>
                <label className="text-[11.5px] font-medium text-[var(--text-secondary)] block mb-2">
                  {isAr ? "هدفك" : "Your Goal"}
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {GOALS.map((g) => (
                    <button
                      key={g.value}
                      onClick={() => update("goal", g.value)}
                      className={`text-start px-4 py-3 rounded-[9px] text-[14px] transition-colors ${
                        form.goal === g.value
                          ? "bg-[var(--accent-muted)] text-[var(--accent)] border border-[var(--accent)]"
                          : "bg-[var(--bg-input)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--bg-hover)]"
                      }`}
                    >
                      {isAr ? g.ar : g.en}
                    </button>
                  ))}
                </div>
              </div>
              <Input
                label={isAr ? "أيام التمرين في الأسبوع" : "Training Days/Week"}
                type="number"
                value={form.trainingDaysPerWeek}
                onChange={(e) => update("trainingDaysPerWeek", e.target.value)}
                placeholder="4"
              />
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setStep(2)} className="flex-1">
                  ← {t("common.previous")}
                </Button>
                <Button onClick={() => setStep(4)} className="flex-1">
                  {t("common.next")} →
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Step 4: Notes */}
        {step === 4 && (
          <Card className="animate-fadeIn">
            <h2 className="text-lg font-bold mb-1">
              {isAr ? "معلومات إضافية 📝" : "Additional Info 📝"}
            </h2>
            <p className="text-[var(--text-secondary)] text-sm mb-4">
              {isAr ? "اختياري — يمكنك التخطي" : "Optional — you can skip"}
            </p>
            <div className="space-y-4">
              <Input
                label={isAr ? "إصابات أو ملاحظات صحية" : "Injuries or Health Notes"}
                value={form.injuriesNotes}
                onChange={(e) => update("injuriesNotes", e.target.value)}
                placeholder={isAr ? "مثال: ألم في الكتف الأيسر" : "e.g. Left shoulder pain"}
              />
              <Input
                label={isAr ? "تفضيلات غذائية" : "Food Preferences"}
                value={form.foodPreferences}
                onChange={(e) => update("foodPreferences", e.target.value)}
                placeholder={isAr ? "مثال: نباتي، بدون لحم أحمر" : "e.g. Vegetarian, no red meat"}
              />
              <Input
                label={isAr ? "حساسية غذائية" : "Allergies"}
                value={form.allergies}
                onChange={(e) => update("allergies", e.target.value)}
                placeholder={isAr ? "مثال: حساسية من المكسرات" : "e.g. Nut allergy"}
              />
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setStep(3)} className="flex-1">
                  ← {t("common.previous")}
                </Button>
                <Button onClick={handleSubmit} loading={loading} className="flex-1">
                  {isAr ? "حساب النتائج" : "Calculate"} →
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Step 5: Results */}
        {step === 5 && result && (
          <Card className="animate-fadeIn text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-lg font-bold mb-2">
              {isAr ? "نتائجك جاهزة!" : "Your Results!"}
            </h2>
            <div className="grid grid-cols-2 gap-3 my-6">
              <div className="card p-3 text-center">
                <p className="text-[11px] text-[var(--text-secondary)]">BMR</p>
                <p className="text-xl font-bold font-mono">{result.calculation.bmr}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{isAr ? "سعرة" : "kcal"}</p>
              </div>
              <div className="card p-3 text-center">
                <p className="text-[11px] text-[var(--text-secondary)]">{isAr ? "المستهدف" : "Target"}</p>
                <p className="text-xl font-bold font-mono text-[var(--accent)]">{result.calculation.targetCalories}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{isAr ? "سعرة/يوم" : "kcal/day"}</p>
              </div>
              <div className="card p-3 text-center">
                <p className="text-[11px] text-[var(--text-secondary)]">{isAr ? "بروتين" : "Protein"}</p>
                <p className="text-xl font-bold font-mono text-[var(--success)]">{result.calculation.proteinG}g</p>
              </div>
              <div className="card p-3 text-center">
                <p className="text-[11px] text-[var(--text-secondary)]">{isAr ? "كربوهيدرات" : "Carbs"}</p>
                <p className="text-xl font-bold font-mono text-[var(--warning)]">{result.calculation.carbsG}g</p>
              </div>
            </div>
            <p className="text-[13px] text-[var(--text-secondary)] mb-6">
              {isAr
                ? "سيستخدم مدربك هذه الأرقام لإنشاء خطتك"
                : "Your coach will use these numbers to create your plan"}
            </p>
            <Button onClick={() => router.push("/trainee/today")} className="w-full">
              {isAr ? "ابدأ رحلتك!" : "Start Your Journey!"} 🚀
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
