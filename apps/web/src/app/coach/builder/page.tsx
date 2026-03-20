"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button, Input, Select, Card, Badge, Modal, Drawer, EmptyState, Skeleton, PageTransition } from "@/components/ui";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { api } from "../../../../lib/api";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/components/shared/Toast";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { useRouter } from "next/navigation";

interface DayExercise {
  exerciseId: string;
  nameAr: string;
  nameEn: string;
  muscleGroup: string;
  sets: number;
  reps: string;
  restSeconds: number;
  tempo: string;
  sortOrder: number;
}

interface Day {
  title: string;
  focusArea: string;
  dayNumber: number;
  exercises: DayExercise[];
}

interface Week {
  weekNumber: number;
  title: string;
  days: Day[];
}

const GOALS = [
  { value: "MUSCLE_GAIN", ar: "بناء عضلات", en: "Muscle Gain" },
  { value: "FAT_LOSS", ar: "حرق دهون", en: "Fat Loss" },
  { value: "GENERAL_FITNESS", ar: "لياقة عامة", en: "General Fitness" },
];

const LEVELS = [
  { value: "BEGINNER", ar: "مبتدئ", en: "Beginner" },
  { value: "INTERMEDIATE", ar: "متوسط", en: "Intermediate" },
  { value: "ADVANCED", ar: "محترف", en: "Advanced" },
];

const MUSCLE_TABS = ["ALL", "CHEST", "BACK", "LEGS", "SHOULDERS", "BICEPS", "TRICEPS", "CORE", "GLUTES"];

export default function WorkoutBuilderPage() {
  const router = useRouter();
  const { t, lang } = useTranslation();
  const { toast } = useToast();
  const isAr = lang === "ar";

  // Steps: 1=info, 2=build, 3=assign
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1 — Program info
  const [info, setInfo] = useState({ title: "", goal: "MUSCLE_GAIN", level: "INTERMEDIATE", durationWeeks: "8", description: "" });

  // Step 2 — Weeks & Days
  const [weeks, setWeeks] = useState<Week[]>([{ weekNumber: 1, title: "", days: [{ title: "", focusArea: "", dayNumber: 1, exercises: [] }] }]);
  const [activeWeek, setActiveWeek] = useState(0);
  const [activeDay, setActiveDay] = useState(0);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [exerciseFilter, setExerciseFilter] = useState("ALL");

  // Step 3 — Assign
  const [assignTraineeId, setAssignTraineeId] = useState("");
  const [startDate, setStartDate] = useState("");

  // Data
  const { data: exerciseData } = useQuery({
    queryKey: ["exercises", exerciseSearch, exerciseFilter],
    queryFn: () => api.get<any>("/exercises", { params: { search: exerciseSearch || undefined, muscleGroup: exerciseFilter === "ALL" ? undefined : exerciseFilter, limit: 50 } }),
    staleTime: 10 * 60 * 1000, // 10 min — exercise list rarely changes
  });

  const { data: trainees } = useQuery({
    queryKey: ["coach", "trainees", "all"],
    queryFn: () => api.get<any>("/trainers/trainees", { params: { limit: 100 } }),
    enabled: step === 3,
  });

  // Day helpers
  const currentWeek = weeks[activeWeek];
  const currentDay = currentWeek?.days[activeDay];

  const addWeek = () => {
    setWeeks(prev => [...prev, { weekNumber: prev.length + 1, title: "", days: [{ title: "", focusArea: "", dayNumber: 1, exercises: [] }] }]);
  };

  const addDay = () => {
    setWeeks(prev => {
      const updated = [...prev];
      const w = { ...updated[activeWeek] };
      w.days = [...w.days, { title: "", focusArea: "", dayNumber: w.days.length + 1, exercises: [] }];
      updated[activeWeek] = w;
      return updated;
    });
  };

  const addExercise = (ex: any, config: { sets: number; reps: string; restSeconds: number; tempo: string }) => {
    setWeeks(prev => {
      const updated = [...prev];
      const w = { ...updated[activeWeek] };
      const d = { ...w.days[activeDay] };
      d.exercises = [...d.exercises, {
        exerciseId: ex.id,
        nameAr: ex.nameAr,
        nameEn: ex.nameEn,
        muscleGroup: ex.muscleGroup,
        sets: config.sets,
        reps: config.reps,
        restSeconds: config.restSeconds,
        tempo: config.tempo,
        sortOrder: d.exercises.length,
      }];
      w.days = [...w.days]; w.days[activeDay] = d;
      updated[activeWeek] = w;
      return updated;
    });
    setShowExercisePicker(false);
  };

  const removeExercise = (exIdx: number) => {
    setWeeks(prev => {
      const updated = [...prev];
      const w = { ...updated[activeWeek] };
      const d = { ...w.days[activeDay] };
      d.exercises = d.exercises.filter((_, i) => i !== exIdx);
      w.days = [...w.days]; w.days[activeDay] = d;
      updated[activeWeek] = w;
      return updated;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setWeeks(prev => {
      const updated = [...prev];
      const w = { ...updated[activeWeek] };
      const d = { ...w.days[activeDay] };
      const oldIndex = d.exercises.findIndex(e => e.exerciseId === active.id);
      const newIndex = d.exercises.findIndex(e => e.exerciseId === over.id);
      d.exercises = arrayMove(d.exercises, oldIndex, newIndex).map((e, i) => ({ ...e, sortOrder: i }));
      w.days = [...w.days]; w.days[activeDay] = d;
      updated[activeWeek] = w;
      return updated;
    });
  };

  // Save & Assign
  const handleSaveAndAssign = async () => {
    setSaving(true);
    try {
      // 1. Create program
      const program = await api.post<any>("/workout-programs", {
        title: info.title,
        goal: info.goal,
        level: info.level,
        durationWeeks: parseInt(info.durationWeeks),
        description: info.description || undefined,
      });

      // 2. Create weeks, days, exercises
      for (const week of weeks) {
        const createdWeek = await api.post<any>(`/workout-programs/${program.id}/weeks`, {
          weekNumber: week.weekNumber,
          title: week.title || undefined,
        });

        for (const day of week.days) {
          const createdDay = await api.post<any>(`/workout-programs/${program.id}/weeks/${createdWeek.id}/days`, {
            dayNumber: day.dayNumber,
            title: day.title || undefined,
            focusArea: day.focusArea || undefined,
          });

          for (const ex of day.exercises) {
            await api.post(`/workout-programs/${program.id}/weeks/${createdWeek.id}/days/${createdDay.id}/exercises`, {
              exerciseId: ex.exerciseId,
              sortOrder: ex.sortOrder,
              sets: ex.sets,
              reps: ex.reps,
              restSeconds: ex.restSeconds,
              tempo: ex.tempo || undefined,
            });
          }
        }
      }

      // 3. Assign if trainee selected
      if (assignTraineeId && startDate) {
        await api.post(`/workout-programs/${program.id}/assign`, {
          traineeProfileId: assignTraineeId,
          startsOn: startDate,
        });
      }

      router.push("/coach/trainees");
    } catch (err: any) {
      toast("error", err?.error?.message || (isAr ? "فشل حفظ البرنامج" : "Failed to save program"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageTransition>
    <div>
      <Breadcrumb items={[
        { label: isAr ? "البرامج" : "Programs", href: "/coach/trainees" },
        { label: isAr ? "بناء برنامج جديد" : "Build New Program" },
      ]} />

      {/* Progress */}
      <div className="flex gap-1 mb-6">
        {[1, 2, 3].map(s => (
          <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? "bg-[var(--accent)]" : "bg-[var(--bg-input)]"}`} />
        ))}
      </div>

      {/* ═══ STEP 1: Program Info ═══ */}
      {step === 1 && (
        <Card className="max-w-lg mx-auto animate-fadeIn">
          <h2 className="text-lg font-bold mb-4">{isAr ? "معلومات البرنامج" : "Program Info"}</h2>
          <div className="space-y-4">
            <Input label={isAr ? "عنوان البرنامج" : "Program Title"} value={info.title} onChange={e => setInfo({ ...info, title: e.target.value })} placeholder="Push Pull Legs" />
            <div className="grid grid-cols-2 gap-3">
              <Select label={isAr ? "الهدف" : "Goal"} value={info.goal} onChange={e => setInfo({ ...info, goal: e.target.value })} options={GOALS.map(g => ({ value: g.value, label: isAr ? g.ar : g.en }))} />
              <Select label={isAr ? "المستوى" : "Level"} value={info.level} onChange={e => setInfo({ ...info, level: e.target.value })} options={LEVELS.map(l => ({ value: l.value, label: isAr ? l.ar : l.en }))} />
            </div>
            <Input label={isAr ? "عدد الأسابيع" : "Weeks"} type="number" value={info.durationWeeks} onChange={e => setInfo({ ...info, durationWeeks: e.target.value })} />
            <Button onClick={() => setStep(2)} disabled={!info.title} className="w-full">
              {t("common.next")} →
            </Button>
          </div>
        </Card>
      )}

      {/* ═══ STEP 2: Build Days ═══ */}
      {step === 2 && (
        <div className="animate-fadeIn">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">{info.title}</h2>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setStep(1)}>← {t("common.previous")}</Button>
              <Button size="sm" onClick={() => setStep(3)}>{t("common.next")} →</Button>
            </div>
          </div>

          <div className="flex gap-4">
            {/* Left: Week/Day structure */}
            <div className="w-[260px] shrink-0 space-y-2">
              {weeks.map((week, wi) => (
                <Card key={wi} padding="sm" className={wi === activeWeek ? "border-[var(--accent)]" : ""}>
                  <button onClick={() => { setActiveWeek(wi); setActiveDay(0); }} className="w-full text-start">
                    <p className="font-semibold text-[13px]">{isAr ? `الأسبوع ${week.weekNumber}` : `Week ${week.weekNumber}`}</p>
                  </button>
                  {wi === activeWeek && (
                    <div className="mt-2 space-y-1">
                      {week.days.map((day, di) => (
                        <button key={di} onClick={() => setActiveDay(di)} className={`w-full text-start px-2 py-1.5 rounded text-[12px] ${di === activeDay ? "bg-[var(--accent-muted)] text-[var(--accent)]" : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"}`}>
                          {isAr ? `يوم ${day.dayNumber}` : `Day ${day.dayNumber}`} {day.title ? `— ${day.title}` : ""} ({day.exercises.length})
                        </button>
                      ))}
                      <button onClick={addDay} className="w-full text-start px-2 py-1.5 text-[12px] text-[var(--accent)] hover:bg-[var(--accent-muted)] rounded">
                        + {isAr ? "إضافة يوم" : "Add Day"}
                      </button>
                    </div>
                  )}
                </Card>
              ))}
              <button onClick={addWeek} className="w-full text-center py-2 text-[12px] text-[var(--accent)] border border-dashed border-[var(--border)] rounded-lg hover:bg-[var(--accent-muted)]">
                + {isAr ? "إضافة أسبوع" : "Add Week"}
              </button>
            </div>

            {/* Right: Day exercises */}
            <div className="flex-1">
              {currentDay && (
                <>
                  <div className="flex gap-3 mb-4">
                    <Input placeholder={isAr ? "عنوان اليوم" : "Day title"} value={currentDay.title} onChange={e => {
                      setWeeks(prev => { const u = [...prev]; const w = { ...u[activeWeek] }; const d = { ...w.days[activeDay] }; d.title = e.target.value; w.days = [...w.days]; w.days[activeDay] = d; u[activeWeek] = w; return u; });
                    }} className="flex-1" />
                    <Input placeholder={isAr ? "المجموعة المستهدفة" : "Focus area"} value={currentDay.focusArea} onChange={e => {
                      setWeeks(prev => { const u = [...prev]; const w = { ...u[activeWeek] }; const d = { ...w.days[activeDay] }; d.focusArea = e.target.value; w.days = [...w.days]; w.days[activeDay] = d; u[activeWeek] = w; return u; });
                    }} className="w-40" />
                  </div>

                  {currentDay.exercises.length === 0 ? (
                    <EmptyState icon="💪" title={isAr ? "لا توجد تمارين" : "No exercises"} action={{ label: isAr ? "إضافة تمرين" : "Add Exercise", onClick: () => setShowExercisePicker(true) }} />
                  ) : (
                    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={currentDay.exercises.map(e => e.exerciseId)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {currentDay.exercises.map((ex, i) => (
                        <SortableExerciseCard key={ex.exerciseId} ex={ex} index={i} onRemove={() => removeExercise(i)} isAr={isAr} t={t} />
                      ))}
                      <button onClick={() => setShowExercisePicker(true)} className="w-full py-3 border border-dashed border-[var(--border)] rounded-lg text-[13px] text-[var(--accent)] hover:bg-[var(--accent-muted)]">
                        + {isAr ? "إضافة تمرين" : "Add Exercise"}
                      </button>
                    </div>
                    </SortableContext>
                    </DndContext>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Exercise Picker Drawer */}
          <ExercisePickerDrawer
            open={showExercisePicker}
            onClose={() => setShowExercisePicker(false)}
            exercises={exerciseData?.items ?? []}
            search={exerciseSearch}
            setSearch={setExerciseSearch}
            filter={exerciseFilter}
            setFilter={setExerciseFilter}
            onAdd={addExercise}
            isAr={isAr}
            t={t}
          />
        </div>
      )}

      {/* ═══ STEP 3: Assign ═══ */}
      {step === 3 && (
        <Card className="max-w-lg mx-auto animate-fadeIn">
          <h2 className="text-lg font-bold mb-4">{isAr ? "مراجعة وتعيين" : "Review & Assign"}</h2>

          <div className="space-y-3 mb-6 text-[13px]">
            <div className="flex justify-between"><span className="text-[var(--text-muted)]">{isAr ? "البرنامج" : "Program"}</span><span className="font-medium">{info.title}</span></div>
            <div className="flex justify-between"><span className="text-[var(--text-muted)]">{isAr ? "الأسابيع" : "Weeks"}</span><span>{weeks.length}</span></div>
            <div className="flex justify-between"><span className="text-[var(--text-muted)]">{isAr ? "الأيام" : "Days"}</span><span>{weeks.reduce((s, w) => s + w.days.length, 0)}</span></div>
            <div className="flex justify-between"><span className="text-[var(--text-muted)]">{isAr ? "التمارين" : "Exercises"}</span><span>{weeks.reduce((s, w) => s + w.days.reduce((s2, d) => s2 + d.exercises.length, 0), 0)}</span></div>
          </div>

          <div className="space-y-4">
            <Select
              label={isAr ? "المتدرب" : "Trainee"}
              value={assignTraineeId}
              onChange={e => setAssignTraineeId(e.target.value)}
              options={[
                { value: "", label: isAr ? "— اختر متدرباً —" : "— Select trainee —" },
                ...(trainees?.items?.map((t: any) => ({ value: t.id, label: `${t.user.firstName} ${t.user.lastName}` })) ?? []),
              ]}
            />
            <Input label={isAr ? "تاريخ البداية" : "Start Date"} type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="ghost" onClick={() => setStep(2)} className="flex-1">← {t("common.previous")}</Button>
            <Button onClick={handleSaveAndAssign} loading={saving} className="flex-1">
              {isAr ? "حفظ وتعيين" : "Save & Assign"} →
            </Button>
          </div>
        </Card>
      )}
    </div>
    </PageTransition>
  );
}

// ─── Sortable Exercise Card ─────────────────────────────────────────────────

function SortableExerciseCard({ ex, index, onRemove, isAr, t }: { ex: DayExercise; index: number; onRemove: () => void; isAr: boolean; t: any }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ex.exerciseId });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 10 : undefined };

  return (
    <div ref={setNodeRef} style={style}>
      <Card padding="sm" className={`flex items-center gap-3 ${isDragging ? "shadow-lg" : ""}`}>
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-[var(--text-secondary)] touch-none" aria-label="Drag to reorder">
          <span className="text-[14px]">⠿</span>
        </button>
        <span className="text-[var(--text-muted)] text-[12px] w-5">{index + 1}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[13px] truncate">{isAr ? ex.nameAr : ex.nameEn}</p>
          <p className="text-[11px] text-[var(--text-muted)]">{ex.sets}×{ex.reps} · {ex.restSeconds}s</p>
        </div>
        <Badge variant="info">{t(`muscle.${ex.muscleGroup}` as any)}</Badge>
        <button onClick={onRemove} className="text-[var(--error)] text-[12px] hover:underline">✕</button>
      </Card>
    </div>
  );
}

// ─── Exercise Picker Drawer ─────────────────────────────────────────────────

function ExercisePickerDrawer({ open, onClose, exercises, search, setSearch, filter, setFilter, onAdd, isAr, t }: any) {
  const [selected, setSelected] = useState<any>(null);
  const [config, setConfig] = useState({ sets: 4, reps: "8-12", restSeconds: 90, tempo: "" });

  const handleConfirm = () => {
    if (!selected) return;
    onAdd(selected, config);
    setSelected(null);
    setConfig({ sets: 4, reps: "8-12", restSeconds: 90, tempo: "" });
  };

  return (
    <Drawer open={open} onClose={onClose} title={isAr ? "اختر تمريناً" : "Choose Exercise"}>
      {!selected ? (
        <>
          <Input placeholder={t("common.search")} value={search} onChange={(e: any) => setSearch(e.target.value)} icon={<span>🔍</span>} className="mb-3" />
          <div className="flex gap-1.5 flex-wrap mb-4">
            {["ALL", "CHEST", "BACK", "LEGS", "SHOULDERS", "BICEPS", "TRICEPS", "CORE", "GLUTES"].map(mg => (
              <button key={mg} onClick={() => setFilter(mg)} className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${filter === mg ? "bg-[var(--accent-muted)] text-[var(--accent)]" : "bg-[var(--bg-input)] text-[var(--text-muted)]"}`}>
                {mg === "ALL" ? (isAr ? "الكل" : "All") : t(`muscle.${mg}` as any)}
              </button>
            ))}
          </div>
          <div className="space-y-1 max-h-[50vh] overflow-auto">
            {exercises.map((ex: any) => (
              <button key={ex.id} onClick={() => setSelected(ex)} className="w-full text-start flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--bg-hover)] transition-colors">
                <span className="text-lg">🏋️</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium truncate">{isAr ? ex.nameAr : ex.nameEn}</p>
                  <p className="text-[11px] text-[var(--text-muted)]">{t(`muscle.${ex.muscleGroup}` as any)} · {ex.defaultSets}×{ex.defaultReps}</p>
                </div>
                <span className="text-[var(--accent)] text-lg">+</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🏋️</span>
            <div>
              <p className="font-semibold">{isAr ? selected.nameAr : selected.nameEn}</p>
              <p className="text-[12px] text-[var(--text-muted)]">{t(`muscle.${selected.muscleGroup}` as any)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label={isAr ? "السيتات" : "Sets"} type="number" value={String(config.sets)} onChange={e => setConfig({ ...config, sets: parseInt(e.target.value) || 0 })} />
            <Input label={isAr ? "التكرارات" : "Reps"} value={config.reps} onChange={e => setConfig({ ...config, reps: e.target.value })} />
            <Input label={isAr ? "الراحة (ثانية)" : "Rest (sec)"} type="number" value={String(config.restSeconds)} onChange={e => setConfig({ ...config, restSeconds: parseInt(e.target.value) || 0 })} />
            <Input label={isAr ? "التيمبو" : "Tempo"} value={config.tempo} onChange={e => setConfig({ ...config, tempo: e.target.value })} placeholder="3-1-2-0" />
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setSelected(null)} className="flex-1">← {isAr ? "رجوع" : "Back"}</Button>
            <Button onClick={handleConfirm} className="flex-1">✓ {isAr ? "إضافة للبرنامج" : "Add to Program"}</Button>
          </div>
        </div>
      )}
    </Drawer>
  );
}
