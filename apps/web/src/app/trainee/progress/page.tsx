"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, StatCard, SkeletonCard, Badge, Button, Input, Modal, PageTransition } from "@/components/ui";
import { WeightChart, StrengthPRChart } from "@/components/charts";
import { api } from "../../../../lib/api";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/components/shared/Toast";

const MOODS = [
  { value: 5, icon: "💪", ar: "ممتاز", en: "Excellent" },
  { value: 4, icon: "😊", ar: "جيد", en: "Good" },
  { value: 3, icon: "😐", ar: "عادي", en: "Okay" },
  { value: 2, icon: "😓", ar: "متعب", en: "Tired" },
  { value: 1, icon: "😔", ar: "سيء", en: "Bad" },
];

export default function TraineeProgressPage() {
  const { t, lang } = useTranslation();
  const { toast } = useToast();
  const isAr = lang === "ar";
  const queryClient = useQueryClient();
  const [showCheckin, setShowCheckin] = useState(false);

  // Check-in form state
  const [checkinForm, setCheckinForm] = useState({ weightKg: "", waistCm: "", chestCm: "", armsCm: "", thighsCm: "", sleepScore: 4, notes: "" });
  const cf = (k: string, v: any) => setCheckinForm(p => ({ ...p, [k]: v }));

  const { data, isLoading } = useQuery({
    queryKey: ["trainees", "me", "progress"],
    queryFn: () => api.get<any>("/trainees/me/progress"),
  });

  const checkinMutation = useMutation({
    mutationFn: () => api.post("/progress/checkins", {
      weightKg: parseFloat(checkinForm.weightKg) || undefined,
      waistCm: parseFloat(checkinForm.waistCm) || undefined,
      chestCm: parseFloat(checkinForm.chestCm) || undefined,
      armsCm: parseFloat(checkinForm.armsCm) || undefined,
      thighsCm: parseFloat(checkinForm.thighsCm) || undefined,
      sleepScore: checkinForm.sleepScore,
      notes: checkinForm.notes || undefined,
    }),
    onSuccess: () => {
      toast("success", isAr ? "✅ تم حفظ تسجيلك!" : "✅ Check-in saved!");
      setShowCheckin(false);
      queryClient.invalidateQueries({ queryKey: ["trainees", "me", "progress"] });
    },
    onError: () => toast("error", isAr ? "فشل الحفظ" : "Save failed"),
  });

  if (isLoading) return <div className="grid grid-cols-2 gap-3 max-w-[440px] mx-auto"><SkeletonCard /><SkeletonCard /></div>;

  const currentWeight = data?.weightHistory?.[0]?.weightKg;
  const startWeight = data?.weightHistory?.[data.weightHistory.length - 1]?.weightKg;
  const weightDelta = currentWeight && startWeight ? (currentWeight - startWeight).toFixed(1) : null;

  return (
    <PageTransition>
    <div className="space-y-5 max-w-[440px] mx-auto">
      <h1 className="text-[22px] font-bold tracking-tight">{t("trainee.myProgress")} 📈</h1>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="text-center">
          <span className="text-lg">⚖️</span>
          <p className="text-[24px] font-bold font-[Syne,sans-serif] mt-1">{currentWeight ?? "—"}</p>
          <p className="text-[10px] text-[var(--text-muted)]">kg {isAr ? "الآن" : "now"}</p>
        </Card>
        <Card className="text-center">
          <span className="text-lg">{Number(weightDelta) < 0 ? "📉" : "📈"}</span>
          <p className={`text-[24px] font-bold font-[Syne,sans-serif] mt-1 ${Number(weightDelta) < 0 ? "text-[var(--success)]" : Number(weightDelta) > 0 ? "text-[var(--error)]" : ""}`}>
            {weightDelta ? `${Number(weightDelta) > 0 ? "+" : ""}${weightDelta}` : "—"}
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">kg {isAr ? "منذ البداية" : "since start"}</p>
        </Card>
        <Card className="text-center">
          <span className="text-lg">💪</span>
          <p className="text-[24px] font-bold font-[Syne,sans-serif] mt-1">{data?.totalWorkoutsCompleted ?? 0}</p>
          <p className="text-[10px] text-[var(--text-muted)]">{isAr ? "جلسة" : "sessions"}</p>
        </Card>
        <Card className="text-center">
          <span className="text-lg">🔥</span>
          <p className="text-[24px] font-bold font-[Syne,sans-serif] mt-1 text-[var(--warning)]">{data?.workoutStreak ?? 0}</p>
          <p className="text-[10px] text-[var(--text-muted)]">{isAr ? "أيام متتالية" : "day streak"}</p>
        </Card>
      </div>

      {/* Weight History Chart */}
      <Card>
        <h2 className="text-[14px] font-semibold mb-3">{isAr ? "تاريخ الوزن" : "Weight History"}</h2>
        {data?.weightHistory?.length > 0 ? (
          <>
            <WeightChart data={data.weightHistory.slice(0, 12)} targetWeight={data?.targetWeight} isAr={isAr} />
            <div className="mt-3">
              {data.weightHistory.slice(0, 6).map((entry: any, i: number) => (
                <div key={i} className="flex justify-between py-1.5 border-b border-[var(--border)] last:border-0 text-[12px]">
                  <span className="text-[var(--text-muted)]">{new Date(entry.date).toLocaleDateString(isAr ? "ar" : "en", { day: "numeric", month: "short" })}</span>
                  <span className="font-mono font-medium">{entry.weightKg} kg</span>
                </div>
              ))}
            </div>
          </>
        ) : <p className="text-[var(--text-muted)] text-center py-4 text-[13px]">{isAr ? "لا توجد قياسات بعد — سجّل أول قياس" : "No measurements yet — log your first check-in"}</p>}
      </Card>

      {/* Strength PRs Chart */}
      <Card>
        <h2 className="text-[14px] font-semibold mb-3">{isAr ? "أرقامك القياسية" : "Strength PRs"} 🏆</h2>
        {data?.strengthPRs?.length > 0 ? (
          <>
            <StrengthPRChart data={data.strengthPRs} isAr={isAr} />
            <div className="mt-3">
              {data.strengthPRs.map((pr: any) => (
                <div key={pr.exerciseId} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                  <span className="text-[13px]">{isAr ? pr.exerciseNameAr : pr.exerciseName}</span>
                  <Badge variant="accent">{pr.weightKg} kg × {pr.reps}</Badge>
                </div>
              ))}
            </div>
          </>
        ) : <p className="text-[var(--text-muted)] text-center py-4 text-[13px]">{isAr ? "لم تسجل أي رقم قياسي بعد" : "No PRs yet"}</p>}
      </Card>

      {/* Check-in Button */}
      <Button variant="primary" className="w-full py-3.5 text-[15px]" onClick={() => setShowCheckin(true)}>
        📊 {t("trainee.weeklyCheckin")}
      </Button>

      {/* Check-in Modal */}
      <Modal open={showCheckin} onClose={() => setShowCheckin(false)} title={isAr ? "تسجيل وصول أسبوعي" : "Weekly Check-in"} size="md">
        <div className="space-y-4">
          <Input label={`${isAr ? "الوزن الحالي" : "Current Weight"} (kg) *`} type="number" value={checkinForm.weightKg} onChange={e => cf("weightKg", e.target.value)} placeholder="82.0" />

          <div>
            <p className="text-[11.5px] font-medium text-[var(--text-secondary)] mb-2">{isAr ? "القياسات (اختياري)" : "Measurements (optional)"}</p>
            <div className="grid grid-cols-2 gap-3">
              <Input label={isAr ? "الصدر (سم)" : "Chest (cm)"} type="number" value={checkinForm.chestCm} onChange={e => cf("chestCm", e.target.value)} />
              <Input label={isAr ? "الخصر (سم)" : "Waist (cm)"} type="number" value={checkinForm.waistCm} onChange={e => cf("waistCm", e.target.value)} />
              <Input label={isAr ? "الذراع (سم)" : "Arm (cm)"} type="number" value={checkinForm.armsCm} onChange={e => cf("armsCm", e.target.value)} />
              <Input label={isAr ? "الفخذ (سم)" : "Thigh (cm)"} type="number" value={checkinForm.thighsCm} onChange={e => cf("thighsCm", e.target.value)} />
            </div>
          </div>

          <div>
            <p className="text-[11.5px] font-medium text-[var(--text-secondary)] mb-2">{isAr ? "كيف تشعر هذا الأسبوع؟" : "How do you feel?"}</p>
            <div className="flex gap-2">
              {MOODS.map(m => (
                <button key={m.value} onClick={() => cf("sleepScore", m.value)} className={`flex-1 py-2 rounded-lg text-center text-[12px] transition-colors ${checkinForm.sleepScore === m.value ? "bg-[var(--accent-muted)] border-2 border-[var(--accent)]" : "bg-[var(--bg-input)] border border-[var(--border)]"}`}>
                  <span className="text-lg block">{m.icon}</span>
                  <span className="text-[9px]">{isAr ? m.ar : m.en}</span>
                </button>
              ))}
            </div>
          </div>

          <Input label={isAr ? "ملاحظة للمدرب" : "Note for coach"} value={checkinForm.notes} onChange={e => cf("notes", e.target.value)} placeholder={isAr ? "اختياري" : "Optional"} />

          <Button onClick={() => checkinMutation.mutate()} loading={checkinMutation.isPending} disabled={!checkinForm.weightKg} className="w-full">
            {isAr ? "إرسال التسجيل" : "Submit Check-in"} →
          </Button>
        </div>
      </Modal>
    </div>
    </PageTransition>
  );
}
