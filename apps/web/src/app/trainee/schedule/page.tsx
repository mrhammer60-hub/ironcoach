"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, Badge, ProgressBar, SkeletonCard, EmptyState } from "@/components/ui";
import { api } from "../../../../lib/api";
import { useTranslation } from "@/hooks/useTranslation";

const DAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getWeekDates(): Date[] {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - dayOfWeek);
  sunday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function calculateWeekNumber(startsOn: string): number {
  const start = new Date(startsOn);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  return Math.max(1, Math.ceil(diffMs / (7 * 86400000)));
}


export default function SchedulePage() {
  const { t, lang } = useTranslation();
  const isAr = lang === "ar";
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch today's workout data (includes assignment + day info)
  const { data: todayData, isLoading: todayLoading } = useQuery({
    queryKey: ["workouts", "today"],
    queryFn: () => api.get<any>("/workout-logs/today"),
  });

  // Fetch past workout logs
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ["workouts", "logs", "me"],
    queryFn: () => api.get<any>("/workout-logs/me"),
  });

  const assignment = todayData?.assignment;
  const program = assignment?.program ?? assignment?.workoutProgram;
  const weekDates = useMemo(() => getWeekDates(), []);
  const currentWeek = assignment?.startsOn ? calculateWeekNumber(assignment.startsOn) : 1;

  // Build a set of program day numbers (1-7 mapping to day of week in the cycle)
  const programDays = useMemo(() => {
    if (!program?.days) return [];
    return program.days;
  }, [program]);

  // Training days count per week
  const trainingDaysPerWeek = programDays.length || 0;

  // Build a map of completed workout dates from logs
  const completedDates = useMemo(() => {
    const logs = Array.isArray(logsData) ? logsData : logsData?.logs ?? logsData?.data ?? [];
    const dateSet = new Map<string, any>();
    logs.forEach((log: any) => {
      if (log.completedAt || log.status === "COMPLETED") {
        const d = new Date(log.completedAt || log.createdAt);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        dateSet.set(key, log);
      }
    });
    return dateSet;
  }, [logsData]);

  // Determine which days in the current week are training days
  // Use program day cycle: dayNumber maps to specific day of week based on startsOn
  const weekSchedule = useMemo(() => {
    return weekDates.map((date) => {
      const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const isToday = isSameDay(date, today);
      const isPast = date < today && !isToday;
      const isFuture = date > today;
      const completed = completedDates.has(dayKey);

      // Determine if this is a training day from the program
      let isTrainingDay = false;
      let dayInfo: any = null;

      if (assignment?.startsOn && programDays.length > 0) {
        const start = new Date(assignment.startsOn);
        start.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((date.getTime() - start.getTime()) / 86400000);
        if (diffDays >= 0) {
          const cycleDayIndex = diffDays % (program?.durationDays || programDays.length || 7);
          const matchingDay = programDays.find(
            (d: any) => (d.dayNumber - 1) === cycleDayIndex
          );
          if (matchingDay) {
            isTrainingDay = true;
            dayInfo = matchingDay;
          }
        }
      }

      // For today, use todayData for more accurate info
      if (isToday && todayData?.day) {
        isTrainingDay = true;
        dayInfo = todayData.day;
      }

      return {
        date,
        dayOfWeek: date.getDay(),
        isToday,
        isPast,
        isFuture,
        isTrainingDay,
        dayInfo,
        completed,
        missed: isPast && isTrainingDay && !completed,
      };
    });
  }, [weekDates, today, completedDates, assignment, programDays, todayData, program]);

  // Recent completed sessions (last 5)
  const recentSessions = useMemo(() => {
    const logs = Array.isArray(logsData) ? logsData : logsData?.logs ?? logsData?.data ?? [];
    return logs
      .filter((log: any) => log.completedAt || log.status === "COMPLETED")
      .sort((a: any, b: any) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime())
      .slice(0, 5);
  }, [logsData]);

  // Completion rate for the week
  const weekStats = useMemo(() => {
    const trainingCount = weekSchedule.filter((d) => d.isTrainingDay && (d.isPast || d.isToday)).length;
    const completedCount = weekSchedule.filter((d) => d.isTrainingDay && d.completed).length;
    return { trainingCount, completedCount };
  }, [weekSchedule]);

  if (todayLoading) {
    return (
      <div className="space-y-5 max-w-[440px] mx-auto">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  // No program assigned
  if (!assignment) {
    return (
      <div className="max-w-[440px] mx-auto">
        <h1 className="text-[20px] font-bold mb-5">{t("schedule.title")}</h1>
        <EmptyState
          icon="📋"
          title={t("schedule.noProgram")}
          description={t("schedule.noProgramDesc")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-[440px] mx-auto">
      {/* Page Header */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)]">
          {today.toLocaleDateString(isAr ? "ar-SA" : "en-US", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <h1 className="text-[22px] font-bold tracking-tight mt-0.5">{t("schedule.weeklySchedule")}</h1>
      </div>

      {/* Program Info Strip */}
      <Card padding="sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-lg">📋</span>
            <div className="min-w-0">
              <h2 className="text-[14px] font-bold truncate">
                {isAr ? (program?.nameAr || program?.name || program?.title) : (program?.nameEn || program?.name || program?.title) || (isAr ? "برنامج التمارين" : "Workout Program")}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="info">
                  {t("schedule.currentWeek")} {currentWeek}
                </Badge>
                <span className="text-[11px] text-[var(--text-muted)]">
                  {trainingDaysPerWeek} {t("schedule.trainingDays")} {t("schedule.perWeek")}
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* Weekly completion bar */}
        {weekStats.trainingCount > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-1">
              <span>{isAr ? "إنجاز الأسبوع" : "Week progress"}</span>
              <span>{weekStats.completedCount}/{weekStats.trainingCount}</span>
            </div>
            <ProgressBar
              value={weekStats.completedCount}
              max={weekStats.trainingCount}
              color="var(--success)"
            />
          </div>
        )}
      </Card>

      {/* Weekly Calendar View */}
      <Card>
        <div className="grid grid-cols-7 gap-1">
          {weekSchedule.map((day, i) => {
            const exerciseCount = day.dayInfo?.exercises?.length ?? day.dayInfo?._count?.exercises ?? 0;
            const focusArea = day.dayInfo?.focusArea || day.dayInfo?.title;

            return (
              <div
                key={i}
                className={`flex flex-col items-center gap-1.5 py-2.5 px-0.5 rounded-xl transition-all ${
                  day.isToday
                    ? "ring-2 ring-[var(--accent)] ring-offset-1 ring-offset-[var(--bg-base)] bg-[var(--accent-muted)]"
                    : day.isFuture
                    ? "opacity-40"
                    : ""
                }`}
              >
                {/* Day name */}
                <span className={`text-[9px] font-medium ${day.isToday ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}`}>
                  {isAr ? DAYS_AR[day.dayOfWeek] : DAYS_EN[day.dayOfWeek]}
                </span>

                {/* Day number */}
                <span className={`text-[11px] font-semibold ${day.isToday ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"}`}>
                  {day.date.getDate()}
                </span>

                {/* Status indicator */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold ${
                    day.completed
                      ? "bg-[var(--success-muted)] text-[var(--success)]"
                      : day.missed
                      ? "bg-[var(--error-muted)] text-[var(--error)]"
                      : day.isToday && day.isTrainingDay
                      ? "bg-[var(--accent)] text-[#0d0d12]"
                      : day.isTrainingDay
                      ? "bg-[var(--info-muted)] text-[var(--info)]"
                      : "bg-[var(--bg-input)] text-[var(--text-muted)]"
                  }`}
                >
                  {day.completed ? "\u2713" : day.missed ? "\u2717" : day.isTrainingDay ? "\uD83C\uDFCB" : "\u2015"}
                </div>

                {/* Training day info (muscle focus) */}
                {day.isTrainingDay && (
                  <div className="text-center">
                    <p className="text-[8px] leading-tight text-[var(--text-muted)] max-w-[52px] truncate">
                      {focusArea
                        ? focusArea.split(",")[0]?.trim()
                        : exerciseCount > 0
                        ? `${exerciseCount} ${isAr ? "تمارين" : "ex"}`
                        : ""}
                    </p>
                    {exerciseCount > 0 && focusArea && (
                      <p className="text-[7px] text-[var(--text-muted)] mt-0.5">
                        {exerciseCount} {t("schedule.exercises")}
                      </p>
                    )}
                  </div>
                )}

              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-[var(--border)]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--success)]" />
            <span className="text-[10px] text-[var(--text-muted)]">{t("schedule.completed")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--error)]" />
            <span className="text-[10px] text-[var(--text-muted)]">{t("schedule.missed")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--bg-input)]" />
            <span className="text-[10px] text-[var(--text-muted)]">{t("schedule.restDay")}</span>
          </div>
        </div>
      </Card>

      {/* Recent Workout History */}
      <div>
        <h2 className="text-[15px] font-bold mb-3">{t("schedule.recentHistory")}</h2>
        {logsLoading ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : recentSessions.length === 0 ? (
          <EmptyState
            icon="🏋️"
            title={t("schedule.noHistory")}
            description={t("schedule.noHistoryDesc")}
          />
        ) : (
          <div className="space-y-2.5">
            {recentSessions.map((session: any, i: number) => {
              const sessionDate = new Date(session.completedAt || session.createdAt);
              const dayTitle =
                session.workoutDay?.title ||
                session.day?.title ||
                (isAr ? `يوم ${session.workoutDay?.dayNumber || ""}` : `Day ${session.workoutDay?.dayNumber || ""}`);
              const duration = session.durationMinutes || session.duration || 0;
              const rating = session.difficultyRating || session.rating || 0;

              return (
                <Card key={session.id || i} padding="sm" hover>
                  <div className="flex items-center gap-3">
                    {/* Date badge */}
                    <div className="flex flex-col items-center justify-center bg-[var(--bg-input)] rounded-lg px-2.5 py-1.5 min-w-[48px]">
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {isAr ? DAYS_AR[sessionDate.getDay()] : DAYS_EN[sessionDate.getDay()]}
                      </span>
                      <span className="text-[16px] font-bold text-[var(--text-primary)]">
                        {sessionDate.getDate()}
                      </span>
                      <span className="text-[9px] text-[var(--text-muted)]">
                        {sessionDate.toLocaleDateString(isAr ? "ar-SA" : "en-US", { month: "short" })}
                      </span>
                    </div>

                    {/* Session info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[13px] font-semibold truncate">{dayTitle}</h3>
                      <div className="flex items-center gap-2.5 mt-1">
                        {duration > 0 && (
                          <span className="text-[11px] text-[var(--text-muted)]">
                            \u23F1 {duration} {t("schedule.minutes")}
                          </span>
                        )}
                        {rating > 0 && (
                          <span className="text-[11px]">
                            {Array.from({ length: 5 }, (_, j) => (
                              <span key={j} className={j < rating ? "text-[var(--warning)]" : "text-[var(--text-muted)] opacity-30"}>
                                \u2B50
                              </span>
                            ))}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Completed badge */}
                    <Badge variant="success">{t("schedule.completed")}</Badge>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
