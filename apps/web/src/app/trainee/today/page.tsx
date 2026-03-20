"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, Button, SkeletonCard, EmptyState, ProgressBar, Badge, Avatar } from "@/components/ui";
import { api } from "../../../../lib/api";
import { useTranslation } from "@/hooks/useTranslation";
import Link from "next/link";

const QUOTES = [
  { ar: "النجاح يبدأ بخطوة واحدة 💪", en: "Success starts with one step 💪" },
  { ar: "كل جلسة تمرين استثمار في نفسك", en: "Every workout is an investment in yourself" },
  { ar: "الجسم يتحمل ما يتحمله العقل", en: "Your body can handle what your mind believes" },
  { ar: "الاستمرارية أهم من الكمال", en: "Consistency beats perfection" },
  { ar: "لا تتوقف حتى تفتخر بنفسك", en: "Don't stop until you're proud" },
  { ar: "الألم المؤقت يصنع الإنجاز الدائم", en: "Temporary pain creates lasting achievement" },
  { ar: "أنت أقوى مما تظن", en: "You're stronger than you think" },
  { ar: "كل يوم فرصة جديدة", en: "Every day is a new opportunity" },
];

const DAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getGreeting(isAr: boolean) {
  const h = new Date().getHours();
  if (h < 12) return { text: isAr ? "صباح الخير" : "Good morning", icon: "☀️" };
  if (h < 17) return { text: isAr ? "مساء الخير" : "Good afternoon", icon: "🌤️" };
  if (h < 21) return { text: isAr ? "مساء النور" : "Good evening", icon: "🌅" };
  return { text: isAr ? "تصبح على خير" : "Good night", icon: "🌙" };
}

export default function TodayPage() {
  const { t, lang } = useTranslation();
  const isAr = lang === "ar";
  const greeting = getGreeting(isAr);
  const quote = useMemo(() => QUOTES[new Date().getDate() % QUOTES.length], []);
  const today = new Date();
  const dayOfWeek = today.getDay();

  const { data: workout, isLoading: wl } = useQuery({ queryKey: ["workouts", "today"], queryFn: () => api.get<any>("/workout-logs/today") });
  const { data: nutrition, isLoading: nl } = useQuery({ queryKey: ["nutrition", "today"], queryFn: () => api.get<any>("/nutrition/today") });
  const { data: convos } = useQuery({ queryKey: ["chat", "conversations"], queryFn: () => api.get<any[]>("/chat/conversations") });

  const exercises = workout?.day?.exercises ?? [];
  const totalSets = exercises.reduce((s: number, e: any) => s + (e.sets || 0), 0);
  const lastCoachMessage = (convos as any[])?.[0];

  // Weekly calendar strip — sample data (real would come from workout logs)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const diff = i - dayOfWeek;
    return { day: i, isToday: diff === 0, isPast: diff < 0, status: diff < -1 ? "done" : diff === -1 ? "rest" : diff === 0 ? "today" : "upcoming" };
  });

  return (
    <div className="space-y-5 max-w-[440px] mx-auto">
      {/* Header */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)]">
          {today.toLocaleDateString(isAr ? "ar-SA" : "en-US", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <h1 className="text-[24px] font-bold tracking-tight mt-0.5">{greeting.text} {greeting.icon}</h1>
        <p className="text-[12px] text-[var(--text-muted)] mt-1 italic">"{isAr ? quote.ar : quote.en}"</p>
      </div>

      {/* Weekly Calendar Strip */}
      <div className="flex gap-1.5 justify-between">
        {weekDays.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-[9px] text-[var(--text-muted)]">{isAr ? DAYS_AR[d.day] : DAYS_EN[d.day]}</span>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
              d.status === "today" ? "bg-[var(--accent)] text-[#0d0d12] ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg-base)]" :
              d.status === "done" ? "bg-[var(--success-muted)] text-[var(--success)]" :
              d.status === "rest" ? "bg-[var(--bg-input)] text-[var(--text-muted)]" :
              "bg-[var(--bg-input)] text-[var(--text-muted)]"
            }`}>
              {d.status === "done" ? "✓" : d.status === "rest" ? "😴" : d.status === "today" ? "●" : "○"}
            </div>
          </div>
        ))}
      </div>

      {/* Today's Workout Card */}
      <Card className="overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[var(--accent)] via-[var(--info)] to-[var(--accent)]" />
        {wl ? <SkeletonCard /> : workout?.day ? (
          <div className="pt-1">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{t("trainee.todayWorkout")}</p>
                <h2 className="text-[18px] font-bold">{workout.day.title || `${isAr ? "يوم" : "Day"} ${workout.day.dayNumber}`}</h2>
              </div>
              {workout.assignment && (
                <Badge variant="info">{isAr ? `الأسبوع ${Math.ceil((Date.now() - new Date(workout.assignment.startsOn).getTime()) / (7 * 86400000))}` : `Week ${Math.ceil((Date.now() - new Date(workout.assignment.startsOn).getTime()) / (7 * 86400000))}`}</Badge>
              )}
            </div>

            {workout.day.focusArea && (
              <div className="flex gap-1.5 mb-3">{workout.day.focusArea.split(",").map((a: string, i: number) => <Badge key={i} variant="info">{a.trim()}</Badge>)}</div>
            )}

            <div className="flex items-center gap-3 text-[12px] text-[var(--text-muted)] py-3 border-y border-[var(--border)]">
              <span>⏱ ~55 {isAr ? "دقيقة" : "min"}</span>
              <span>•</span>
              <span>{exercises.length} {t("trainee.exercises")}</span>
              <span>•</span>
              <span>{totalSets} {isAr ? "سيت" : "sets"}</span>
            </div>

            {/* Exercise preview */}
            {exercises.length > 0 && (
              <div className="py-3 space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1">{isAr ? "التمارين" : "Exercises"}</p>
                {exercises.slice(0, 4).map((ex: any, i: number) => (
                  <p key={i} className="text-[12px] text-[var(--text-secondary)]">
                    • {isAr ? ex.exercise?.nameAr : ex.exercise?.nameEn} <span className="text-[var(--text-muted)]">{ex.sets}×{ex.reps}</span>
                  </p>
                ))}
                {exercises.length > 4 && <p className="text-[11px] text-[var(--text-muted)]">+{exercises.length - 4} {isAr ? "تمارين أخرى" : "more"}</p>}
              </div>
            )}

            <ProgressBar value={workout.log ? 100 : 0} max={100} className="mb-3" />

            <Link href="/trainee/workout">
              <Button className="w-full text-[15px] py-3.5">
                ▶ {workout.log ? t("trainee.continueWorkout") : t("trainee.startWorkout")}
              </Button>
            </Link>
          </div>
        ) : !workout?.assignment ? (
          <div className="text-center py-8">
            <span className="text-4xl block mb-3">📋</span>
            <p className="text-[15px] font-semibold">{isAr ? "لا يوجد برنامج بعد" : "No program assigned"}</p>
            <p className="text-[12px] text-[var(--text-muted)] mt-1 mb-4">{isAr ? "انتظر مدربك لتعيين برنامجك" : "Wait for your coach to assign a program"}</p>
            <Link href="/trainee/chat"><Button variant="secondary" size="sm">💬 {isAr ? "تواصل مع مدربك" : "Message Coach"}</Button></Link>
          </div>
        ) : (
          <div className="text-center py-8">
            <span className="text-4xl block mb-3">😴</span>
            <p className="text-[15px] font-semibold">{isAr ? "يوم راحة" : "Rest Day"}</p>
            <p className="text-[12px] text-[var(--text-muted)] mt-1">{isAr ? "استرح وتعافَ جيداً لغداً" : "Rest and recover for tomorrow"} 💪</p>
          </div>
        )}
      </Card>

      {/* Nutrition Strip */}
      <Card>
        <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-3">🥗 {t("trainee.todayNutrition")}</p>
        {nl ? <SkeletonCard /> : nutrition?.plan ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[20px] font-bold font-[Syne,sans-serif] text-[var(--accent)]">{nutrition.todayLog?.totalCalories ?? 0}</span>
              <span className="text-[12px] text-[var(--text-muted)]">/ {nutrition.plan.caloriesTarget} kcal</span>
            </div>
            <ProgressBar value={nutrition.todayLog?.totalCalories ?? 0} max={nutrition.plan.caloriesTarget} color="var(--accent)" className="mb-4" />
            <div className="grid grid-cols-3 gap-3">
              <MacroMini label={isAr ? "بروتين" : "Protein"} icon="🥩" current={nutrition.todayLog?.totalProtein ?? 0} target={nutrition.plan.proteinG} color="var(--success)" />
              <MacroMini label={isAr ? "كربو" : "Carbs"} icon="🍚" current={nutrition.todayLog?.totalCarbs ?? 0} target={nutrition.plan.carbsG} color="var(--warning)" />
              <MacroMini label={isAr ? "دهون" : "Fats"} icon="🥑" current={nutrition.todayLog?.totalFats ?? 0} target={nutrition.plan.fatsG} color="var(--error)" />
            </div>
            <Link href="/trainee/nutrition" className="block mt-3 text-center text-[12px] text-[var(--accent)] hover:underline">
              {isAr ? "عرض خطة التغذية الكاملة →" : "View full plan →"}
            </Link>
          </>
        ) : (
          <div className="text-center py-4"><p className="text-[13px] text-[var(--text-muted)]">{t("trainee.noMealPlan")}</p></div>
        )}
      </Card>

      {/* Coach Message */}
      {lastCoachMessage && (
        <Card hover className="flex items-start gap-3">
          <Avatar name={lastCoachMessage.participant?.name || ""} src={lastCoachMessage.participant?.avatarUrl} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[12px] font-semibold">{lastCoachMessage.participant?.name}</p>
              <span className="text-[9px] text-[var(--text-muted)]">{isAr ? "منذ ساعة" : "1h ago"}</span>
            </div>
            <p className="text-[12px] text-[var(--text-muted)] truncate mt-0.5">{lastCoachMessage.lastMessage?.body}</p>
          </div>
          <Link href="/trainee/chat" className="text-[11px] text-[var(--accent)] whitespace-nowrap shrink-0">{isAr ? "رد →" : "Reply →"}</Link>
        </Card>
      )}
    </div>
  );
}

function MacroMini({ label, icon, current, target, color }: { label: string; icon: string; current: number; target: number; color: string }) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  return (
    <div className="text-center">
      <span className="text-sm">{icon}</span>
      <p className="text-[14px] font-bold font-mono mt-0.5" style={{ color }}>{current}g</p>
      <p className="text-[9px] text-[var(--text-muted)]">/ {target}g</p>
      <div className="h-1 bg-[var(--bg-input)] rounded-full overflow-hidden mt-1">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
