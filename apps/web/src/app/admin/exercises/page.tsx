"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Select, Textarea, Card, Badge, Skeleton, EmptyState, Drawer } from "@/components/ui";
import { api } from "../../../../lib/api";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/components/shared/Toast";

const MUSCLE_GROUPS = ["CHEST", "BACK", "LEGS", "SHOULDERS", "BICEPS", "TRICEPS", "CORE", "GLUTES"];
const LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

export default function AdminExercisesPage() {
  const { t, lang } = useTranslation();
  const isAr = lang === "ar";
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filterMuscle, setFilterMuscle] = useState("");
  const [view, setView] = useState<"grid" | "table">("grid");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["exercises", search, filterMuscle],
    queryFn: () => api.get<any>("/exercises", { params: { search: search || undefined, muscleGroup: filterMuscle || undefined, limit: 80 } }),
    staleTime: 10 * 60 * 1000, // 10 min — exercise list rarely changes
  });

  const [form, setForm] = useState({ nameAr: "", nameEn: "", muscleGroup: "CHEST", difficultyLevel: "INTERMEDIATE", equipment: "", defaultSets: "4", defaultReps: "8-12", defaultRestSeconds: "90", tempo: "", instructionsAr: "", instructionsEn: "", tipsAr: "", tipsEn: "" });
  const u = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  const saveMutation = useMutation({
    mutationFn: () => api.post("/exercises", { ...form, defaultSets: parseInt(form.defaultSets), defaultRestSeconds: parseInt(form.defaultRestSeconds), secondaryMuscles: [], equipment: form.equipment || undefined, tempo: form.tempo || undefined, instructionsAr: form.instructionsAr || undefined, instructionsEn: form.instructionsEn || undefined, tipsAr: form.tipsAr || undefined, tipsEn: form.tipsEn || undefined }),
    onSuccess: () => {
      setDrawerOpen(false);
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
    },
    onError: (err: any) => toast("error", err?.error?.message || (isAr ? "فشل حفظ التمرين" : "Failed to save exercise")),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">{t("admin.exerciseLibrary")}</h1>
          <p className="text-[var(--text-muted)] text-sm">{data?.total ?? 0} {isAr ? "تمرين" : "exercises"}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-[var(--border)] rounded-lg overflow-hidden">
            <button onClick={() => setView("grid")} className={`px-3 py-1.5 text-[12px] ${view === "grid" ? "bg-[var(--accent-muted)] text-[var(--accent)]" : "text-[var(--text-muted)]"}`}>⊞</button>
            <button onClick={() => setView("table")} className={`px-3 py-1.5 text-[12px] ${view === "table" ? "bg-[var(--accent-muted)] text-[var(--accent)]" : "text-[var(--text-muted)]"}`}>☰</button>
          </div>
          <Button onClick={() => { setForm({ nameAr: "", nameEn: "", muscleGroup: "CHEST", difficultyLevel: "INTERMEDIATE", equipment: "", defaultSets: "4", defaultReps: "8-12", defaultRestSeconds: "90", tempo: "", instructionsAr: "", instructionsEn: "", tipsAr: "", tipsEn: "" }); setDrawerOpen(true); }}>
            + {t("admin.addExercise")}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <Input placeholder={t("common.search")} value={search} onChange={(e) => setSearch(e.target.value)} icon={<span>🔍</span>} className="w-64" />
        <select value={filterMuscle} onChange={(e) => setFilterMuscle(e.target.value)} className="input-base px-3 py-2 text-[13px]">
          <option value="">{t("common.all")}</option>
          {MUSCLE_GROUPS.map(mg => <option key={mg} value={mg}>{t(`muscle.${mg}` as any)}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-40" />)}</div>
      ) : data?.items?.length === 0 ? (
        <EmptyState icon="🏋️" title={t("empty.exercises")} />
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {data?.items?.map((ex: any) => (
            <Card key={ex.id} hover padding="sm">
              <div className="w-full h-20 bg-[var(--bg-input)] rounded-lg mb-3 flex items-center justify-center text-3xl">🏋️</div>
              <p className="font-semibold text-[13px] truncate">{isAr ? ex.nameAr : ex.nameEn}</p>
              <p className="text-[11px] text-[var(--text-muted)] truncate">{isAr ? ex.nameEn : ex.nameAr}</p>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                <Badge variant="info">{t(`muscle.${ex.muscleGroup}` as any)}</Badge>
                <Badge variant="muted">{t(`level.${ex.difficultyLevel}` as any)}</Badge>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">{ex.defaultSets}×{ex.defaultReps}</p>
            </Card>
          ))}
        </div>
      ) : (
        <Card padding="sm">
          <table className="w-full text-[13px]">
            <thead><tr className="text-[var(--text-muted)] text-[11px] border-b border-[var(--border)]">
              <th className="text-start pb-2">{isAr ? "التمرين" : "Exercise"}</th>
              <th className="text-start pb-2">{t("exercise.muscleGroup")}</th>
              <th className="text-start pb-2">{t("exercise.level")}</th>
              <th className="text-start pb-2">{t("exercise.sets")}×{t("exercise.reps")}</th>
            </tr></thead>
            <tbody>{data?.items?.map((ex: any) => (
              <tr key={ex.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-hover)]">
                <td className="py-2.5"><p className="font-medium">{isAr ? ex.nameAr : ex.nameEn}</p><p className="text-[11px] text-[var(--text-muted)]">{isAr ? ex.nameEn : ex.nameAr}</p></td>
                <td className="py-2.5"><Badge variant="info">{t(`muscle.${ex.muscleGroup}` as any)}</Badge></td>
                <td className="py-2.5"><Badge variant="muted">{t(`level.${ex.difficultyLevel}` as any)}</Badge></td>
                <td className="py-2.5 font-mono">{ex.defaultSets}×{ex.defaultReps}</td>
              </tr>
            ))}</tbody>
          </table>
        </Card>
      )}

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={t("admin.addExercise")} width="max-w-xl">
        <div className="space-y-4">
          <Input label={t("exercise.name_ar")} value={form.nameAr} onChange={e => u("nameAr", e.target.value)} placeholder="بنش برس بالباربل" />
          <Input label={t("exercise.name_en")} value={form.nameEn} onChange={e => u("nameEn", e.target.value)} placeholder="Barbell Bench Press" />
          <div className="grid grid-cols-2 gap-3">
            <Select label={t("exercise.muscleGroup")} value={form.muscleGroup} onChange={e => u("muscleGroup", e.target.value)} options={MUSCLE_GROUPS.map(mg => ({ value: mg, label: t(`muscle.${mg}` as any) }))} />
            <Select label={t("exercise.level")} value={form.difficultyLevel} onChange={e => u("difficultyLevel", e.target.value)} options={LEVELS.map(l => ({ value: l, label: t(`level.${l}` as any) }))} />
          </div>
          <Input label={t("exercise.equipment")} value={form.equipment} onChange={e => u("equipment", e.target.value)} />
          <div className="grid grid-cols-3 gap-3">
            <Input label={t("exercise.sets")} type="number" value={form.defaultSets} onChange={e => u("defaultSets", e.target.value)} />
            <Input label={t("exercise.reps")} value={form.defaultReps} onChange={e => u("defaultReps", e.target.value)} />
            <Input label={t("exercise.rest")} type="number" value={form.defaultRestSeconds} onChange={e => u("defaultRestSeconds", e.target.value)} />
          </div>
          <Input label={t("exercise.tempo")} value={form.tempo} onChange={e => u("tempo", e.target.value)} placeholder="3-1-2-0" />
          <Textarea label={t("exercise.instructions") + " (عربي)"} value={form.instructionsAr} onChange={e => u("instructionsAr", e.target.value)} rows={3} />
          <Textarea label={t("exercise.instructions") + " (EN)"} value={form.instructionsEn} onChange={e => u("instructionsEn", e.target.value)} rows={3} />
          <Textarea label={t("exercise.tips") + " (عربي)"} value={form.tipsAr} onChange={e => u("tipsAr", e.target.value)} rows={2} />
          <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
            <Button variant="ghost" onClick={() => setDrawerOpen(false)} className="flex-1">{t("common.cancel")}</Button>
            <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending} className="flex-1">💾 {t("common.save")}</Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
