"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, StatCard, SkeletonCard, Skeleton, Badge, Avatar, EmptyState, Button, Modal, PageTransition } from "@/components/ui";
import { WeightChart } from "@/components/charts";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { api } from "../../../../../lib/api";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/components/shared/Toast";

function downloadCSV(data: any[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map(row => headers.map(h => {
      const val = String(row[h] ?? "").replace(/"/g, '""');
      return val.includes(",") || val.includes('"') || val.includes("\n") ? `"${val}"` : val;
    }).join(","))
  ].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }); // BOM for Arabic support
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function getUserIdFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  try {
    const match = document.cookie.match(/ironcoach_access=([^;]*)/);
    if (!match) return null;
    return JSON.parse(atob(match[1].split(".")[1])).sub;
  } catch { return null; }
}

const TABS = [
  { key: "overview", ar: "نظرة عامة", en: "Overview" },
  { key: "training", ar: "التدريب", en: "Training" },
  { key: "nutrition", ar: "التغذية", en: "Nutrition" },
  { key: "progress", ar: "التقدم", en: "Progress" },
  { key: "chat", ar: "المحادثة", en: "Chat" },
];

export default function TraineeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t, lang } = useTranslation();
  const isAr = lang === "ar";
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [workoutModalOpen, setWorkoutModalOpen] = useState(false);
  const [nutritionModalOpen, setNutritionModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // AI Insights query
  const { data: insights } = useQuery({
    queryKey: ["ai", "insights", id],
    queryFn: () => api.get<any>(`/ai/insights/${id}`),
    enabled: !!id && activeTab === "overview",
    staleTime: 5 * 60 * 1000,
  });

  // AI Workout generation
  const workoutMutation = useMutation({
    mutationFn: () => api.post<any>("/ai/generate-workout", { traineeProfileId: id }),
    onSuccess: () => setWorkoutModalOpen(true),
    onError: () => toast("error", isAr ? "فشل إنشاء البرنامج الذكي" : "Failed to generate AI workout"),
  });

  // AI Nutrition generation
  const nutritionMutation = useMutation({
    mutationFn: () => api.post<any>("/ai/generate-nutrition", { traineeProfileId: id }),
    onSuccess: () => setNutritionModalOpen(true),
    onError: () => toast("error", isAr ? "فشل إنشاء الخطة الغذائية الذكية" : "Failed to generate AI nutrition plan"),
  });

  const { data: trainee, isLoading } = useQuery({
    queryKey: ["coach", "trainees", id],
    queryFn: () => api.get<any>(`/trainers/trainees/${id}`),
    staleTime: 2 * 60 * 1000, // 2 min — trainee data changes occasionally
  });

  const { data: progress } = useQuery({
    queryKey: ["progress", "trainee", id],
    queryFn: () => api.get<any>(`/progress/trainee/${id}`),
    enabled: !!id,
  });

  const handleExportWorkoutHistory = useCallback(async () => {
    if (!trainee) return;
    setExporting(true);
    try {
      const data = await api.get<any[]>(`/workout-logs/trainee/${id}`);
      const logs = Array.isArray(data) ? data : (data as any)?.items ?? [];
      if (!logs.length) {
        toast("error", isAr ? "لا توجد بيانات للتصدير" : "No data to export");
        return;
      }
      const rows = logs.map((log: any) => ({
        Date: log.startedAt ? new Date(log.startedAt).toLocaleDateString("en-CA") : "",
        "Day Title": log.workoutDay?.title ?? "",
        "Duration (min)": log.durationMinutes ?? "",
        Rating: log.difficultyRating ?? "",
        Notes: log.notes ?? "",
      }));
      const firstName = trainee.user?.firstName ?? "trainee";
      const lastName = trainee.user?.lastName ?? "";
      downloadCSV(rows, `${firstName}-${lastName}-workout-history.csv`);
      toast("success", isAr ? "تم تصدير سجل التمارين" : "Workout history exported");
    } catch {
      toast("error", isAr ? "فشل تصدير البيانات" : "Failed to export data");
    } finally {
      setExporting(false);
    }
  }, [trainee, id, isAr, toast]);

  if (isLoading) return <div className="grid grid-cols-2 gap-4">{[1,2,3,4].map(i => <SkeletonCard key={i} />)}</div>;
  if (!trainee) return <EmptyState icon="👤" title={isAr ? "متدرب غير موجود" : "Trainee not found"} />;

  const traineeName = `${trainee.user.firstName} ${trainee.user.lastName}`;

  return (
    <PageTransition>
    <div>
      <Breadcrumb items={[
        { label: t("nav.myTrainees"), href: "/coach/trainees" },
        { label: traineeName },
      ]} />

      {/* Header */}
      <Card className="flex items-center gap-4 mb-6">
        <Avatar name={`${trainee.user.firstName} ${trainee.user.lastName}`} src={trainee.user.avatarUrl} size="lg" />
        <div className="flex-1">
          <h1 className="text-lg font-bold">{trainee.user.firstName} {trainee.user.lastName}</h1>
          <p className="text-[13px] text-[var(--text-muted)]">{trainee.user.email}</p>
          <div className="flex gap-2 mt-1">
            {trainee.goal && <Badge variant="accent">{trainee.goal}</Badge>}
            {trainee.activityLevel && <Badge variant="info">{trainee.activityLevel}</Badge>}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => workoutMutation.mutate()} disabled={workoutMutation.isPending}>
            {workoutMutation.isPending ? (isAr ? "جارٍ..." : "Loading...") : "🤖 " + (isAr ? "اقتراح برنامج ذكي" : "AI Workout")}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => nutritionMutation.mutate()} disabled={nutritionMutation.isPending}>
            {nutritionMutation.isPending ? (isAr ? "جارٍ..." : "Loading...") : "🤖 " + (isAr ? "اقتراح خطة غذائية" : "AI Nutrition")}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleExportWorkoutHistory} disabled={exporting}>
            {exporting ? (isAr ? "⏳ جارٍ التصدير..." : "⏳ Exporting...") : `📥 ${isAr ? "تصدير" : "Export"}`}
          </Button>
          <Button variant="ghost" size="sm">💬 {isAr ? "مراسلة" : "Message"}</Button>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label={isAr ? "الوزن" : "Weight"} value={trainee.currentWeightKg ? `${Number(trainee.currentWeightKg)} kg` : "—"} icon={<span>⚖️</span>} />
        <StatCard label={isAr ? "الطول" : "Height"} value={trainee.heightCm ? `${Number(trainee.heightCm)} cm` : "—"} icon={<span>📏</span>} />
        <StatCard label={isAr ? "الجلسات" : "Sessions"} value={progress?.workoutStats?.totalCompleted ?? 0} icon={<span>💪</span>} />
        <StatCard label={isAr ? "أيام التمرين" : "Training Days"} value={`${trainee.trainingDaysPerWeek ?? 0}/${isAr ? "أسبوع" : "wk"}`} icon={<span>📅</span>} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border)] mb-6 overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key ? "border-[var(--accent)] text-[var(--accent)]" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}>
            {isAr ? tab.ar : tab.en}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fadeIn">
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Smart Insights */}
            {insights && (
              <Card>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-bold text-white shrink-0 ${(insights.retentionScore ?? 0) >= 70 ? "bg-[var(--success)]" : (insights.retentionScore ?? 0) >= 40 ? "bg-[var(--warning)]" : "bg-[var(--error)]"}`}>
                    {insights.retentionScore ?? "—"}
                  </div>
                  <div>
                    <h3 className="text-[14px] font-semibold">{isAr ? "رؤى ذكية" : "Smart Insights"}</h3>
                    <p className="text-[11px] text-[var(--text-muted)]">{isAr ? "درجة الاحتفاظ بالمتدرب" : "Trainee retention score"}</p>
                  </div>
                </div>
                {insights.items?.length > 0 && (
                  <div className="space-y-2">
                    {insights.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-input)]">
                        <span className="text-[18px] shrink-0">{item.icon || "💡"}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px]">{item.message}</p>
                        </div>
                        {item.action && (
                          <Button variant="ghost" size="sm" onClick={() => router.push(item.action.href)}>
                            {item.action.label}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {trainee.calorieCalculations?.[0] && (
              <Card>
                <h3 className="text-[14px] font-semibold mb-3">{isAr ? "السعرات المستهدفة" : "Calorie Targets"}</h3>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div><p className="text-xl font-bold font-mono text-[var(--accent)]">{trainee.calorieCalculations[0].targetCalories}</p><p className="text-[11px] text-[var(--text-muted)]">{t("nutrition.calories")}</p></div>
                  <div><p className="text-xl font-bold font-mono text-[var(--success)]">{trainee.calorieCalculations[0].proteinG}g</p><p className="text-[11px] text-[var(--text-muted)]">{t("nutrition.protein")}</p></div>
                  <div><p className="text-xl font-bold font-mono text-[var(--warning)]">{trainee.calorieCalculations[0].carbsG}g</p><p className="text-[11px] text-[var(--text-muted)]">{t("nutrition.carbs")}</p></div>
                  <div><p className="text-xl font-bold font-mono text-[var(--error)]">{trainee.calorieCalculations[0].fatsG}g</p><p className="text-[11px] text-[var(--text-muted)]">{t("nutrition.fats")}</p></div>
                </div>
              </Card>
            )}
          </div>
        )}
        {activeTab === "training" && <TrainingTab traineeId={id} isAr={isAr} />}
        {activeTab === "nutrition" && <NutritionTab traineeId={id} isAr={isAr} />}
        {activeTab === "progress" && (
          <div className="space-y-4">
            {progress?.weightHistory?.length > 0 ? (
              <Card>
                <h3 className="text-[14px] font-semibold mb-3">{isAr ? "تاريخ الوزن" : "Weight History"}</h3>
                <WeightChart data={progress.weightHistory.slice(0, 12)} isAr={isAr} />
                <div className="mt-3">
                  {progress.weightHistory.slice(0, 6).map((e: any, i: number) => (
                    <div key={i} className="flex justify-between py-2 border-b border-[var(--border)] text-[13px]">
                      <span className="text-[var(--text-muted)]">{new Date(e.date).toLocaleDateString(isAr ? "ar" : "en")}</span>
                      <span className="font-mono font-medium">{e.weightKg} kg</span>
                    </div>
                  ))}
                </div>
              </Card>
            ) : <EmptyState icon="📏" title={isAr ? "لا توجد قياسات" : "No measurements"} />}
          </div>
        )}
        {activeTab === "chat" && <ChatTab traineeId={id} trainee={trainee} isAr={isAr} />}
      </div>

      {/* AI Workout Modal */}
      <Modal open={workoutModalOpen} onClose={() => setWorkoutModalOpen(false)} title={isAr ? "🤖 اقتراح برنامج ذكي" : "🤖 AI Workout Suggestion"} size="lg">
        {workoutMutation.data ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-[15px] font-bold mb-1">{(workoutMutation.data as any).templateName}</h3>
              <p className="text-[13px] text-[var(--text-muted)]">{(workoutMutation.data as any).reasoning}</p>
            </div>
            {(workoutMutation.data as any).days?.map((day: any, di: number) => (
              <Card key={di}>
                <h4 className="text-[13px] font-semibold mb-2">{day.title || `${isAr ? "اليوم" : "Day"} ${di + 1}`}</h4>
                <div className="space-y-1.5">
                  {day.exercises?.map((ex: any, ei: number) => (
                    <div key={ei} className="flex justify-between text-[13px] py-1 border-b border-[var(--border)] last:border-0">
                      <span>{ex.name}</span>
                      <span className="text-[var(--text-muted)] font-mono">{ex.sets}x{ex.reps}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
            <div className="flex gap-3 pt-2">
              <Button variant="primary" size="sm" onClick={() => { setWorkoutModalOpen(false); router.push("/coach/builder"); }}>
                {isAr ? "استخدم في المنشئ" : "Use in Builder"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setWorkoutModalOpen(false)}>
                {isAr ? "إغلاق" : "Close"}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-[13px] text-[var(--text-muted)]">{isAr ? "جارٍ التحميل..." : "Loading..."}</p>
        )}
      </Modal>

      {/* AI Nutrition Modal */}
      <Modal open={nutritionModalOpen} onClose={() => setNutritionModalOpen(false)} title={isAr ? "🤖 اقتراح خطة غذائية" : "🤖 AI Nutrition Plan"} size="lg">
        {nutritionMutation.data ? (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3 text-center">
              <div>
                <p className="text-xl font-bold font-mono text-[var(--accent)]">{(nutritionMutation.data as any).calorieTarget}</p>
                <p className="text-[11px] text-[var(--text-muted)]">{isAr ? "سعرات" : "kcal"}</p>
              </div>
              <div>
                <p className="text-xl font-bold font-mono text-[var(--success)]">{(nutritionMutation.data as any).macros?.proteinG}g</p>
                <p className="text-[11px] text-[var(--text-muted)]">{isAr ? "بروتين" : "Protein"}</p>
              </div>
              <div>
                <p className="text-xl font-bold font-mono text-[var(--warning)]">{(nutritionMutation.data as any).macros?.carbsG}g</p>
                <p className="text-[11px] text-[var(--text-muted)]">{isAr ? "كربوهيدرات" : "Carbs"}</p>
              </div>
              <div>
                <p className="text-xl font-bold font-mono text-[var(--error)]">{(nutritionMutation.data as any).macros?.fatsG}g</p>
                <p className="text-[11px] text-[var(--text-muted)]">{isAr ? "دهون" : "Fats"}</p>
              </div>
            </div>
            {(nutritionMutation.data as any).meals?.map((meal: any, mi: number) => (
              <Card key={mi}>
                <h4 className="text-[13px] font-semibold mb-2">{meal.title || `${isAr ? "وجبة" : "Meal"} ${mi + 1}`}</h4>
                <div className="space-y-1">
                  {meal.foods?.map((food: any, fi: number) => (
                    <p key={fi} className="text-[12px] text-[var(--text-muted)]">• {food.name}{food.amount ? ` — ${food.amount}` : ""}</p>
                  ))}
                </div>
              </Card>
            ))}
            <div className="flex gap-3 pt-2">
              <Button variant="primary" size="sm" onClick={() => { setNutritionModalOpen(false); router.push("/coach/nutrition"); }}>
                {isAr ? "استخدم في منشئ التغذية" : "Use in Nutrition Builder"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setNutritionModalOpen(false)}>
                {isAr ? "إغلاق" : "Close"}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-[13px] text-[var(--text-muted)]">{isAr ? "جارٍ التحميل..." : "Loading..."}</p>
        )}
      </Modal>
    </div>
    </PageTransition>
  );
}

function NutritionTab({ traineeId, isAr }: { traineeId: string; isAr: boolean }) {
  const { data: plans, isLoading } = useQuery({
    queryKey: ["nutrition", "plans", traineeId],
    queryFn: () => api.get<any[]>("/nutrition/plans"),
  });

  // Filter plans for this trainee (or show all if no trainee filter on API)
  const traineePlans = (plans as any[])?.filter((p: any) => p.traineeProfileId === traineeId) ?? [];

  if (isLoading) return <Skeleton className="h-40" />;

  if (!traineePlans.length) {
    return (
      <EmptyState
        icon="🥗"
        title={isAr ? "لا توجد خطة غذائية" : "No meal plan"}
        description={isAr ? "أنشئ خطة غذائية مخصصة لهذا المتدرب" : "Create a custom meal plan for this trainee"}
        action={{ label: isAr ? "إنشاء خطة" : "Create Plan", onClick: () => window.location.href = "/coach/nutrition" }}
      />
    );
  }

  const plan = traineePlans[0];
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex justify-between mb-3">
          <h3 className="font-semibold text-[14px]">{plan.title}</h3>
          <Badge variant="success">{isAr ? "نشط" : "Active"}</Badge>
        </div>
        <p className="text-[28px] font-bold font-[Syne,sans-serif] text-[var(--accent)]">{plan.caloriesTarget} <span className="text-[12px] font-normal text-[var(--text-muted)]">kcal/{isAr ? "يوم" : "day"}</span></p>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="text-center"><p className="text-[16px] font-bold text-[var(--success)]">{plan.proteinG}g</p><p className="text-[10px] text-[var(--text-muted)]">{isAr ? "بروتين" : "Protein"}</p></div>
          <div className="text-center"><p className="text-[16px] font-bold text-[var(--warning)]">{plan.carbsG}g</p><p className="text-[10px] text-[var(--text-muted)]">{isAr ? "كربوهيدرات" : "Carbs"}</p></div>
          <div className="text-center"><p className="text-[16px] font-bold text-[var(--error)]">{plan.fatsG}g</p><p className="text-[10px] text-[var(--text-muted)]">{isAr ? "دهون" : "Fats"}</p></div>
        </div>
      </Card>
    </div>
  );
}

function TrainingTab({ traineeId, isAr }: { traineeId: string; isAr: boolean }) {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["workout-logs", "trainee", traineeId],
    queryFn: () => api.get<any[]>(`/workout-logs/trainee/${traineeId}`),
  });

  if (isLoading) return <Skeleton className="h-40" />;

  const logList = (logs as any[]) ?? [];

  if (!logList.length) {
    return (
      <EmptyState
        icon="📋"
        title={isAr ? "لا توجد جلسات تدريب" : "No training sessions"}
        description={isAr ? "أنشئ برنامج تدريب وخصصه لهذا المتدرب" : "Create a workout program and assign it to this trainee"}
        action={{ label: isAr ? "إنشاء برنامج" : "Create Program", onClick: () => window.location.href = "/coach/builder" }}
      />
    );
  }

  const completedLogs = logList.filter((l: any) => l.completedAt);
  const recentLogs = logList.slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card>
        <h3 className="text-[14px] font-semibold mb-3">{isAr ? "ملخص التدريب" : "Training Summary"}</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xl font-bold font-mono text-[var(--accent)]">{completedLogs.length}</p>
            <p className="text-[11px] text-[var(--text-muted)]">{isAr ? "جلسات مكتملة" : "Completed"}</p>
          </div>
          <div>
            <p className="text-xl font-bold font-mono text-[var(--warning)]">{logList.length - completedLogs.length}</p>
            <p className="text-[11px] text-[var(--text-muted)]">{isAr ? "قيد التنفيذ" : "In Progress"}</p>
          </div>
          <div>
            <p className="text-xl font-bold font-mono text-[var(--success)]">{logList.length}</p>
            <p className="text-[11px] text-[var(--text-muted)]">{isAr ? "إجمالي" : "Total"}</p>
          </div>
        </div>
      </Card>

      {/* Recent Sessions */}
      <Card>
        <h3 className="text-[14px] font-semibold mb-3">{isAr ? "آخر الجلسات" : "Recent Sessions"}</h3>
        <div className="space-y-0">
          {recentLogs.map((log: any) => (
            <div key={log.id} className="flex items-center justify-between py-2.5 border-b border-[var(--border)] last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium truncate">{log.workoutDay?.title || (isAr ? "جلسة تدريب" : "Workout Session")}</p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {new Date(log.startedAt).toLocaleDateString(isAr ? "ar" : "en", { month: "short", day: "numeric" })}
                  {log.workoutDay?.focusArea && ` · ${log.workoutDay.focusArea}`}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {log.durationMinutes && (
                  <span className="text-[12px] font-mono text-[var(--text-muted)]">{log.durationMinutes} {isAr ? "د" : "min"}</span>
                )}
                {log.difficultyRating && (
                  <Badge variant="accent">{log.difficultyRating}/10</Badge>
                )}
                {log.completedAt ? (
                  <Badge variant="success">{isAr ? "مكتمل" : "Done"}</Badge>
                ) : (
                  <Badge variant="warning">{isAr ? "جارٍ" : "Active"}</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ChatTab({ traineeId, trainee, isAr }: { traineeId: string; trainee: any; isAr: boolean }) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const myUserId = getUserIdFromCookie();

  const { data: conversations } = useQuery({
    queryKey: ["chat", "conversations"],
    queryFn: () => api.get<any[]>("/chat/conversations"),
    staleTime: 30 * 1000, // 30s — messages change frequently
  });

  // Find the conversation for this trainee by matching participant userId
  const traineeUserId = trainee?.user?.id || trainee?.userId;
  const convo = (conversations as any[])?.find((c: any) => c.participant?.userId === traineeUserId || c.participant?.id === traineeUserId) ?? null;

  const { data: messages } = useQuery({
    queryKey: ["chat", "messages", convo?.id],
    queryFn: () => convo ? api.get<any>(`/chat/${convo.id}/messages`) : null,
    enabled: !!convo?.id,
    refetchInterval: 5000,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark as read when viewing
  useEffect(() => {
    if (!convo?.id) return;
    api.put(`/chat/${convo.id}/read`, {}).then(() => {
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
    }).catch(() => {});
  }, [convo?.id, queryClient]);

  const handleSend = async () => {
    if (!input.trim() || !convo?.id) return;
    try {
      await api.post(`/chat/${convo.id}/messages`, { body: input.trim() });
      setInput("");
      queryClient.invalidateQueries({ queryKey: ["chat", "messages", convo.id] });
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
    } catch {
      toast("error", isAr ? "فشل إرسال الرسالة" : "Failed to send message");
    }
  };

  if (!convo) {
    return <EmptyState icon="💬" title={isAr ? "لا توجد رسائل بعد" : "No messages yet"} description={isAr ? "ابدأ محادثة من صفحة المحادثات" : "Start a conversation from the chat page"} />;
  }

  const msgList = ((messages as any)?.items ?? []).slice(-10);

  return (
    <Card className="flex flex-col h-[400px]">
      <h3 className="text-[14px] font-semibold pb-3 border-b border-[var(--border)] shrink-0">{isAr ? "المحادثة" : "Conversation"}</h3>

      {/* Messages */}
      <div className="flex-1 overflow-auto py-3 space-y-3">
        {msgList.length === 0 && (
          <p className="text-[12px] text-[var(--text-muted)] text-center py-8">{isAr ? "لا توجد رسائل" : "No messages yet"}</p>
        )}
        {msgList.map((msg: any) => {
          const isMe = msg.senderUserId === myUserId;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div>
                <div className={`max-w-[70%] px-3 py-2 rounded-xl text-[13px] ${isMe ? "bg-[var(--accent)] text-[var(--accent-text)]" : "bg-[var(--bg-input)] text-[var(--text-primary)]"}`}>
                  {msg.body}
                </div>
                <p className={`text-[10px] text-[var(--text-muted)] mt-1 ${isMe ? "text-end" : "text-start"}`}>
                  {new Date(msg.createdAt).toLocaleTimeString(isAr ? "ar" : "en", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="pt-3 border-t border-[var(--border)] flex gap-2 shrink-0">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={isAr ? "اكتب رسالتك..." : "Type a message..."}
          className="flex-1 input-base px-3 py-2 text-[13px]"
        />
        <button onClick={handleSend} disabled={!input.trim()} className="px-4 py-2 bg-[var(--accent)] text-[var(--accent-text)] rounded-lg font-semibold text-[13px] disabled:opacity-50">
          {isAr ? "إرسال" : "Send"}
        </button>
      </div>
    </Card>
  );
}
