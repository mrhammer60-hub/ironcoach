"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Button, Badge, Modal, ProgressBar } from "@/components/ui";
import { api } from "../../../../lib/api";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/components/shared/Toast";
import { useRouter } from "next/navigation";

export default function WorkoutSessionPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t, lang } = useTranslation();
  const { toast } = useToast();
  const isAr = lang === "ar";

  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Timer
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);

  // Rest timer
  const [restSeconds, setRestSeconds] = useState(0);

  // Set tracking
  const [completedSets, setCompletedSets] = useState<Record<string, Record<number, { weight: number; reps: number }>>>({});
  const [showFinish, setShowFinish] = useState(false);
  const [rating, setRating] = useState(4);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Session ID (workout log)
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionStarted = useRef(false);

  // Data
  const { data } = useQuery({ queryKey: ["workouts", "today"], queryFn: () => api.get<any>("/workout-logs/today") });
  const exercises = data?.day?.exercises ?? [];
  const totalSets = exercises.reduce((s: number, e: any) => s + (e.sets || 0), 0);
  const completedSetCount = Object.values(completedSets).reduce((s, ex) => s + Object.keys(ex).length, 0);
  const completedExerciseCount = exercises.filter((ex: any) => {
    const exSets = completedSets[ex.exercise?.id];
    return exSets && Object.keys(exSets).length >= ex.sets;
  }).length;

  // Auto-start session when day is loaded but no log exists
  useEffect(() => {
    if (!data?.day?.id || sessionStarted.current) return;
    if (data?.log?.id) {
      setSessionId(data.log.id);
      return;
    }
    sessionStarted.current = true;
    api.post<any>("/workout-logs", { workoutDayId: data.day.id })
      .then((res: any) => {
        setSessionId(res?.id ?? res?.log?.id ?? res?.data?.id);
      })
      .catch(() => {
        toast("error", isAr ? "فشل بدء الجلسة" : "Failed to start session");
        sessionStarted.current = false;
      });
  }, [data?.day?.id, data?.log?.id]);

  // Session timer
  useEffect(() => { setRunning(true); }, []);
  useEffect(() => { if (!running) return; const id = setInterval(() => setElapsed(s => s + 1), 1000); return () => clearInterval(id); }, [running]);

  // Rest countdown with audio/vibration on completion
  const prevRestRef = useRef(0);
  useEffect(() => {
    if (restSeconds <= 0) {
      // Fire audio + vibrate when timer just finished (was >0, now 0)
      if (prevRestRef.current > 0) {
        navigator.vibrate?.([200, 100, 200]);
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.frequency.value = 880;
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc.start(); osc.stop(ctx.currentTime + 0.3);
          }
        } catch {}
      }
      prevRestRef.current = 0;
      return;
    }
    prevRestRef.current = restSeconds;
    const id = setInterval(() => setRestSeconds(s => s <= 1 ? 0 : s - 1), 1000);
    return () => clearInterval(id);
  }, [restSeconds]);

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const markSet = (exId: string, setNum: number, weight: number, reps: number, restSec: number) => {
    setCompletedSets(prev => ({
      ...prev,
      [exId]: { ...prev[exId], [setNum]: { weight, reps } },
    }));
    setRestSeconds(restSec);
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(100);
    toast("success", isAr ? `✓ سيت ${setNum} مكتمل!` : `✓ Set ${setNum} done!`);

    // Save set to API (fire and forget)
    if (sessionId) {
      api.put(`/workout-logs/${sessionId}/sets`, {
        sets: [{ exerciseId: exId, setNumber: setNum, weightKg: weight, repsCompleted: reps }],
      }).catch(() => {
        toast("error", isAr ? "فشل حفظ السيت" : "Failed to save set");
      });
    }
  };

  const handleFinish = async () => {
    if (!sessionId) {
      toast("error", isAr ? "لا توجد جلسة نشطة" : "No active session");
      return;
    }
    setSaving(true);
    try {
      await api.put(`/workout-logs/${sessionId}/complete`, {
        difficultyRating: rating,
        traineeNotes: notes || undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      toast("success", isAr ? "🎉 أحسنت! تم حفظ التمرين" : "🎉 Great job! Workout saved");
      router.push("/trainee/today");
    } catch {
      toast("error", isAr ? "فشل الحفظ" : "Save failed");
      setSaving(false);
    }
  };

  // No data state
  if (!data?.day) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-6">
        <div className="text-center">
          <span className="text-5xl block mb-4">📋</span>
          <p className="text-[16px] font-semibold mb-2">{isAr ? "لا يوجد تمرين اليوم" : "No workout today"}</p>
          <Button variant="ghost" onClick={() => router.push("/trainee/today")}>{isAr ? "← رجوع" : "← Back"}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* Fixed Header */}
      <div className="sticky top-0 z-20 bg-[var(--bg-card)] border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => setShowExitConfirm(true)} className="text-[var(--text-muted)] text-sm">
            ← {t("common.back")}
          </button>
          <span className="font-[Syne,sans-serif] text-[var(--accent)] text-[18px] font-bold tabular-nums">{fmt(elapsed)}</span>
          <span className="text-[12px] text-[var(--text-muted)]">{completedSetCount}/{totalSets}</span>
        </div>
        <ProgressBar value={completedSetCount} max={totalSets || 1} color="var(--accent)" />
      </div>

      {/* Week/Day Info Strip */}
      {data?.assignment && (
        <div className="flex gap-1.5 px-4 py-2 bg-[var(--bg-card)] border-b border-[var(--border)] overflow-x-auto">
          <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
            <Badge variant="info">{isAr ? `الأسبوع ${Math.max(1, Math.ceil((Date.now() - new Date(data.assignment.startsOn).getTime()) / (7 * 86400000)))}` : `Week ${Math.max(1, Math.ceil((Date.now() - new Date(data.assignment.startsOn).getTime()) / (7 * 86400000)))}`}</Badge>
            <span>•</span>
            <span>{data.day?.title || `${isAr ? "يوم" : "Day"} ${data.day?.dayNumber}`}</span>
            {data.day?.focusArea && (
              <>
                <span>•</span>
                <span>{data.day.focusArea}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Rest Timer Overlay */}
      {restSeconds > 0 && (
        <div className="bg-[var(--warning-muted)] border-b border-[var(--warning)] py-6 text-center">
          <p className="text-[12px] text-[var(--warning)] mb-1">⏱ {t("trainee.restTime")}</p>
          <p className="text-[40px] font-bold font-[Syne,sans-serif] text-[var(--warning)] tabular-nums">{fmt(restSeconds)}</p>
          <div className="flex gap-3 justify-center mt-3">
            <button onClick={() => setRestSeconds(0)} className="text-[12px] text-[var(--text-muted)] px-3 py-1 rounded-lg hover:bg-[var(--bg-hover)]">{t("trainee.skipRest")}</button>
            <button onClick={() => setRestSeconds(s => s + 30)} className="text-[12px] text-[var(--text-muted)] px-3 py-1 rounded-lg hover:bg-[var(--bg-hover)]">+30s</button>
          </div>
        </div>
      )}

      {/* Exercises */}
      <div className="p-4 space-y-3 pb-24">
        {exercises.map((item: any, idx: number) => {
          const exId = item.exercise?.id ?? item.id;
          const exSets = completedSets[exId] ?? {};
          const allDone = Object.keys(exSets).length >= item.sets;

          return (
            <Card key={item.id} className={`transition-opacity ${allDone ? "opacity-60" : ""}`}>
              {/* Exercise Header */}
              <div className="flex items-center gap-3 mb-3">
                {allDone ? <span className="text-[var(--success)] text-lg">✅</span> : <span className="text-lg">🏋️</span>}
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-bold">{isAr ? item.exercise?.nameAr : item.exercise?.nameEn}</h3>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {item.sets}×{item.reps} · {item.restSeconds}s {isAr ? "راحة" : "rest"}
                  </p>
                </div>
                {allDone && <Badge variant="success">{isAr ? "مكتمل" : "Done"}</Badge>}
              </div>

              {/* Set Logger */}
              {!allDone && (
                <div>
                  {/* Header row */}
                  <div className="grid grid-cols-[40px_1fr_1fr_44px] gap-2 mb-2 text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    <span className="text-center">#</span>
                    <span>{isAr ? "وزن" : "Weight"}</span>
                    <span>{isAr ? "تكرارات" : "Reps"}</span>
                    <span></span>
                  </div>
                  {/* Set rows */}
                  {Array.from({ length: item.sets }, (_, i) => i + 1).map(setNum => {
                    const done = !!exSets[setNum];
                    const isCurrent = !done && !exSets[setNum - 1] && setNum > 1 ? false : !done;
                    return (
                      <SetRow
                        key={setNum}
                        setNum={setNum}
                        target={item.reps}
                        done={done}
                        isCurrent={isCurrent && !Object.keys(exSets).length ? setNum === 1 : isCurrent}
                        savedWeight={exSets[setNum]?.weight}
                        savedReps={exSets[setNum]?.reps}
                        onComplete={(w: number, r: number) => markSet(exId, setNum, w, r, item.restSeconds)}
                        isAr={isAr}
                      />
                    );
                  })}
                </div>
              )}

              {/* Completed summary */}
              {allDone && (
                <div className="flex gap-2 flex-wrap text-[11px] text-[var(--text-muted)]">
                  {Object.entries(exSets).map(([num, s]) => (
                    <span key={num} className="bg-[var(--bg-input)] px-2 py-0.5 rounded">{(s as any).weight}kg × {(s as any).reps}</span>
                  ))}
                </div>
              )}
            </Card>
          );
        })}

        {/* Finish Button */}
        {completedExerciseCount === exercises.length && exercises.length > 0 && (
          <Button onClick={() => setShowFinish(true)} className="w-full text-[16px] py-4">
            🎉 {t("trainee.finishWorkout")}
          </Button>
        )}
      </div>

      {/* Finish Modal */}
      <Modal open={showFinish} onClose={() => setShowFinish(false)} title={isAr ? "🎉 أحسنت!" : "🎉 Great Job!"}>
        <div className="text-center space-y-4">
          <div className="flex justify-center gap-6 text-[13px] text-[var(--text-secondary)]">
            <span>⏱ {fmt(elapsed)}</span>
            <span>✅ {exercises.length} {t("trainee.exercises")}</span>
            <span>🏋️ {totalSets} {isAr ? "سيت" : "sets"}</span>
          </div>
          <div>
            <p className="text-[12px] text-[var(--text-muted)] mb-2">{t("trainee.rateWorkout")}</p>
            <div className="flex gap-1 justify-center">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setRating(s)} className={`text-2xl transition-transform ${s <= rating ? "scale-100" : "scale-75 opacity-30"}`}>⭐</button>
              ))}
            </div>
          </div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={isAr ? "ملاحظة للمدرب (اختياري)" : "Note for coach (optional)"} className="w-full input-base px-3 py-2 text-[13px] resize-none" rows={2} />
          <Button onClick={handleFinish} loading={saving} disabled={saving} className="w-full">💾 {isAr ? "حفظ وإنهاء" : "Save & Finish"}</Button>
        </div>
      </Modal>

      {/* Exit Confirmation */}
      <Modal open={showExitConfirm} onClose={() => setShowExitConfirm(false)} title={isAr ? "إنهاء التمرين؟" : "End Workout?"} size="sm">
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          {isAr ? "سيتم حفظ تقدمك الحالي. هل تريد المتابعة؟" : "Your current progress will be saved. Continue?"}
        </p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setShowExitConfirm(false)}>
            {isAr ? "متابعة التمرين" : "Continue"}
          </Button>
          <Button variant="danger" className="flex-1" onClick={() => router.push("/trainee/today")}>
            {isAr ? "إنهاء" : "End"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function SetRow({ setNum, target, done, isCurrent, savedWeight, savedReps, onComplete, isAr }: any) {
  const [weight, setWeight] = useState(savedWeight?.toString() ?? "");
  const [reps, setReps] = useState(savedReps?.toString() ?? "");

  return (
    <div className={`grid grid-cols-[40px_1fr_1fr_44px] gap-2 items-center py-1.5 ${done ? "opacity-50" : isCurrent ? "" : "opacity-40"}`}>
      <span className={`text-[13px] font-bold text-center ${done ? "text-[var(--success)]" : "text-[var(--text-muted)]"}`}>{setNum}</span>
      <div className="flex items-center gap-1">
        <button onClick={() => setWeight(String(Math.max(0, (parseFloat(weight) || 0) - 2.5)))} className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-lg bg-[var(--bg-input)] text-[var(--text-muted)] text-base flex items-center justify-center" disabled={done}>−</button>
        <input type="number" min="0" max="500" value={weight} onChange={e => setWeight(e.target.value)} disabled={done} placeholder="kg" className="flex-1 input-base px-1 py-1.5 text-center text-[14px] font-bold tabular-nums" />
        <button onClick={() => setWeight(String((parseFloat(weight) || 0) + 2.5))} className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-lg bg-[var(--bg-input)] text-[var(--text-muted)] text-base flex items-center justify-center" disabled={done}>+</button>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => setReps(String(Math.max(0, (parseInt(reps) || 0) - 1)))} className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-lg bg-[var(--bg-input)] text-[var(--text-muted)] text-base flex items-center justify-center" disabled={done}>−</button>
        <input type="number" min="0" max="100" value={reps} onChange={e => setReps(e.target.value)} disabled={done} placeholder={target} className="flex-1 input-base px-1 py-1.5 text-center text-[14px] font-bold tabular-nums" />
        <button onClick={() => setReps(String((parseInt(reps) || 0) + 1))} className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-lg bg-[var(--bg-input)] text-[var(--text-muted)] text-base flex items-center justify-center" disabled={done}>+</button>
      </div>
      <button
        onClick={() => {
          if (done) return;
          const w = parseFloat(weight) || 0;
          const r = parseInt(reps) || 0;
          if (w < 0 || r < 0) return;
          if (w === 0 && r === 0) return;
          onComplete(Math.max(0, w), Math.max(0, r));
        }}
        disabled={done}
        className={`w-10 h-10 rounded-full flex items-center justify-center text-[16px] mx-auto transition-all ${done ? "bg-[var(--accent)] text-[#0d0d12]" : "border-2 border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] active:scale-90"}`}
      >
        ✓
      </button>
    </div>
  );
}
