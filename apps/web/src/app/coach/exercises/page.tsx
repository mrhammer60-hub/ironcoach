"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, Input, Badge, Skeleton, EmptyState, Modal } from "@/components/ui";
import { api } from "../../../../lib/api";
import { useTranslation } from "@/hooks/useTranslation";

const MUSCLE_TABS = [
  { value: "", ar: "الكل", en: "All" },
  { value: "CHEST", ar: "💪 الصدر", en: "💪 Chest" },
  { value: "BACK", ar: "🏊 الظهر", en: "🏊 Back" },
  { value: "LEGS", ar: "🦵 الأرجل", en: "🦵 Legs" },
  { value: "SHOULDERS", ar: "🤸 الأكتاف", en: "🤸 Shoulders" },
  { value: "BICEPS", ar: "✊ البايسبس", en: "✊ Biceps" },
  { value: "TRICEPS", ar: "🔱 الترايسبس", en: "🔱 Triceps" },
  { value: "CORE", ar: "🎯 البطن", en: "🎯 Core" },
  { value: "GLUTES", ar: "🍑 الأرداف", en: "🍑 Glutes" },
];

export default function CoachExercisesPage() {
  const { t, lang } = useTranslation();
  const isAr = lang === "ar";
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState("");
  const [selected, setSelected] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["exercises", search, muscle],
    queryFn: () => api.get<any>("/exercises", { params: { search: search || undefined, muscleGroup: muscle || undefined, limit: 80 } }),
    staleTime: 10 * 60 * 1000, // 10 min — exercise list rarely changes
  });

  return (
    <div>
      <h1 className="text-[22px] font-bold tracking-tight mb-2">{t("nav.exercises")}</h1>
      <p className="text-[13px] text-[var(--text-muted)] mb-6">{data?.total ?? 0} {isAr ? "تمرين" : "exercises"}</p>

      {/* Search */}
      <Input placeholder={t("common.search")} value={search} onChange={e => setSearch(e.target.value)} icon={<span>🔍</span>} className="mb-4 max-w-sm" />

      {/* Muscle group tabs */}
      <div className="flex gap-1.5 flex-wrap mb-6">
        {MUSCLE_TABS.map(tab => (
          <button key={tab.value} onClick={() => setMuscle(tab.value)} className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${muscle === tab.value ? "bg-[var(--accent-muted)] text-[var(--accent)]" : "bg-[var(--bg-input)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"}`}>
            {isAr ? tab.ar : tab.en}
          </button>
        ))}
      </div>

      {/* Exercise Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">{[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-36" />)}</div>
      ) : data?.items?.length === 0 ? (
        <EmptyState icon="🏋️" title={t("empty.exercises")} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {data?.items?.map((ex: any) => (
            <Card key={ex.id} hover padding="sm" className="cursor-pointer" onClick={() => setSelected(ex)}>
              <div className="w-full h-16 bg-[var(--bg-input)] rounded-lg mb-2 flex items-center justify-center text-2xl">🏋️</div>
              <p className="font-semibold text-[12px] truncate">{isAr ? ex.nameAr : ex.nameEn}</p>
              <p className="text-[10px] text-[var(--text-muted)] truncate">{isAr ? ex.nameEn : ex.nameAr}</p>
              <div className="flex gap-1 mt-1.5 flex-wrap">
                <Badge variant="info">{t(`muscle.${ex.muscleGroup}` as any)}</Badge>
                <Badge variant="muted">{t(`level.${ex.difficultyLevel}` as any)}</Badge>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-1">{ex.defaultSets}×{ex.defaultReps} · {ex.equipment || "—"}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Exercise Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? (isAr ? selected.nameAr : selected.nameEn) : ""} size="md">
        {selected && (
          <div>
            <div className="w-full h-32 bg-[var(--bg-input)] rounded-lg mb-4 flex items-center justify-center text-4xl">🏋️</div>
            <div className="flex gap-2 mb-4">
              <Badge variant="info">{t(`muscle.${selected.muscleGroup}` as any)}</Badge>
              <Badge variant="muted">{t(`level.${selected.difficultyLevel}` as any)}</Badge>
              {selected.equipment && <Badge variant="muted">{selected.equipment}</Badge>}
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <Card padding="sm" className="text-center">
                <p className="text-[18px] font-bold font-mono">{selected.defaultSets}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{t("exercise.sets")}</p>
              </Card>
              <Card padding="sm" className="text-center">
                <p className="text-[18px] font-bold font-mono">{selected.defaultReps}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{t("exercise.reps")}</p>
              </Card>
              <Card padding="sm" className="text-center">
                <p className="text-[18px] font-bold font-mono">{selected.defaultRestSeconds}s</p>
                <p className="text-[10px] text-[var(--text-muted)]">{t("exercise.rest")}</p>
              </Card>
            </div>
            {selected.tempo && (
              <p className="text-[12px] text-[var(--text-muted)] mb-2">{t("exercise.tempo")}: <span className="font-mono">{selected.tempo}</span></p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
