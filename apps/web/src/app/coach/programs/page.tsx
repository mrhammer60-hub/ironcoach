"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, Button, Badge, Skeleton, EmptyState, Modal } from "@/components/ui";
import { api } from "../../../../lib/api";
import { useTranslation } from "@/hooks/useTranslation";
import { PROGRAM_TEMPLATES, type ProgramTemplate } from "@/data/program-templates";
import Link from "next/link";

export default function ProgramsPage() {
  const { lang } = useTranslation();
  const isAr = lang === "ar";
  const [showTemplates, setShowTemplates] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<ProgramTemplate | null>(null);

  const { data: programs, isLoading } = useQuery({
    queryKey: ["workouts", "programs"],
    queryFn: () => api.get<any>("/workout-programs"),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">{isAr ? "البرامج التدريبية" : "Workout Programs"}</h1>
          <p className="text-[13px] text-[var(--text-muted)] mt-1">{(programs?.length ?? 0)} {isAr ? "برنامج" : "programs"}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowTemplates(true)}>📋 {isAr ? "من قالب" : "From Template"}</Button>
          <Link href="/coach/builder"><Button>+ {isAr ? "برنامج جديد" : "New Program"}</Button></Link>
        </div>
      </div>

      {/* Template Library Section */}
      <div className="mb-8">
        <h2 className="text-[15px] font-semibold mb-3">{isAr ? "القوالب الجاهزة" : "Ready Templates"}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {PROGRAM_TEMPLATES.slice(0, 3).map(t => (
            <Card key={t.id} hover padding="sm" className="cursor-pointer" onClick={() => setPreviewTemplate(t)}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent-muted)] flex items-center justify-center text-xl shrink-0">💪</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[13px]">{isAr ? t.nameAr : t.nameEn}</p>
                  <div className="flex gap-1.5 mt-1">
                    <Badge variant="info">{isAr ? t.goalAr : t.goal}</Badge>
                    <Badge variant="muted">{isAr ? t.levelAr : t.level}</Badge>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
                    {t.durationWeeks} {isAr ? "أسبوع" : "weeks"} · {t.daysPerWeek} {isAr ? "أيام" : "days"}/wk · {t.days.reduce((s, d) => s + d.exercises.length, 0)} {isAr ? "تمرين" : "exercises"}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
        {PROGRAM_TEMPLATES.length > 3 && (
          <button onClick={() => setShowTemplates(true)} className="text-[12px] text-[var(--accent)] hover:underline mt-2">
            {isAr ? `عرض كل القوالب (${PROGRAM_TEMPLATES.length})` : `View all templates (${PROGRAM_TEMPLATES.length})`} →
          </button>
        )}
      </div>

      {/* My Programs */}
      <h2 className="text-[15px] font-semibold mb-3">{isAr ? "برامجي" : "My Programs"}</h2>
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}</div>
      ) : !programs?.length ? (
        <EmptyState icon="📋" title={isAr ? "لا توجد برامج بعد" : "No programs yet"} description={isAr ? "أنشئ برنامجك الأول أو استخدم قالباً جاهزاً" : "Create your first program or use a template"} action={{ label: isAr ? "إنشاء برنامج" : "Create Program", onClick: () => {} }} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(programs as any[]).map((prog: any) => (
            <Card key={prog.id} hover>
              <h3 className="font-semibold text-[14px] mb-2">{prog.title}</h3>
              <div className="flex gap-2 mb-2">
                {prog.goal && <Badge variant="info">{prog.goal}</Badge>}
                {prog.level && <Badge variant="muted">{prog.level}</Badge>}
                {prog.isTemplate && <Badge variant="accent">{isAr ? "قالب" : "Template"}</Badge>}
              </div>
              <p className="text-[12px] text-[var(--text-muted)]">
                {prog.durationWeeks} {isAr ? "أسبوع" : "weeks"} · {prog._count?.weeks ?? 0} {isAr ? "أسبوع مُنشأ" : "weeks created"}
              </p>
            </Card>
          ))}
        </div>
      )}

      {/* Template Preview Modal */}
      <Modal open={!!previewTemplate} onClose={() => setPreviewTemplate(null)} title={previewTemplate ? (isAr ? previewTemplate.nameAr : previewTemplate.nameEn) : ""} size="lg">
        {previewTemplate && (
          <div>
            <div className="flex gap-2 mb-4">
              <Badge variant="info">{isAr ? previewTemplate.goalAr : previewTemplate.goal}</Badge>
              <Badge variant="muted">{isAr ? previewTemplate.levelAr : previewTemplate.level}</Badge>
              <Badge variant="accent">{previewTemplate.daysPerWeek} {isAr ? "أيام/أسبوع" : "days/wk"}</Badge>
            </div>
            <p className="text-[13px] text-[var(--text-secondary)] mb-4">{isAr ? previewTemplate.description.ar : previewTemplate.description.en}</p>
            <div className="space-y-3 mb-6 max-h-[300px] overflow-auto">
              {previewTemplate.days.map((day, i) => (
                <Card key={i} padding="sm">
                  <p className="font-semibold text-[13px] mb-2">{isAr ? day.nameAr : day.nameEn}</p>
                  <div className="space-y-1">
                    {day.exercises.map((ex, j) => (
                      <p key={j} className="text-[12px] text-[var(--text-muted)]">
                        {j + 1}. {isAr ? ex.nameAr : ex.nameEn} — {ex.sets}×{ex.reps} ({ex.rest}s)
                      </p>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
            <Link href="/coach/builder">
              <Button className="w-full">{isAr ? "استخدام هذا القالب" : "Use This Template"} →</Button>
            </Link>
          </div>
        )}
      </Modal>

      {/* All Templates Modal */}
      <Modal open={showTemplates} onClose={() => setShowTemplates(false)} title={isAr ? "مكتبة القوالب" : "Template Library"} size="lg">
        <div className="space-y-3 max-h-[60vh] overflow-auto">
          {PROGRAM_TEMPLATES.map(t => (
            <Card key={t.id} hover padding="sm" className="cursor-pointer" onClick={() => { setShowTemplates(false); setPreviewTemplate(t); }}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">💪</span>
                <div className="flex-1">
                  <p className="font-semibold text-[13px]">{isAr ? t.nameAr : t.nameEn}</p>
                  <div className="flex gap-1.5 mt-1">
                    <Badge variant="info">{isAr ? t.goalAr : t.goal}</Badge>
                    <Badge variant="muted">{t.daysPerWeek} {isAr ? "أيام" : "days"}</Badge>
                    <Badge variant="muted">{t.durationWeeks} {isAr ? "أسبوع" : "wks"}</Badge>
                  </div>
                </div>
                <span className="text-[var(--accent)]">→</span>
              </div>
            </Card>
          ))}
        </div>
      </Modal>
    </div>
  );
}
