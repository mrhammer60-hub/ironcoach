"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Badge, Avatar, Skeleton, EmptyState, Button, Modal, Textarea } from "@/components/ui";
import { api } from "../../../../lib/api";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/components/shared/Toast";

export default function CheckinsPage() {
  const { t, lang } = useTranslation();
  const isAr = lang === "ar";
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selected, setSelected] = useState<any | null>(null);
  const [response, setResponse] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["checkins", "pending"],
    queryFn: () => api.get<any[]>("/progress/checkins/pending"),
    staleTime: 2 * 60 * 1000, // 2 min — checkins change occasionally
  });

  const reviewMutation = useMutation({
    mutationFn: (checkinId: string) =>
      api.put(`/progress/checkins/${checkinId}/review`, { coachResponse: response }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkins"] });
      setSelected(null);
      setResponse("");
      toast("success", isAr ? "تمت المراجعة بنجاح" : "Review sent successfully");
    },
    onError: () => {
      toast("error", isAr ? "فشل إرسال المراجعة" : "Failed to send review");
    },
  });

  const traineeName = (checkin: any) =>
    `${checkin.traineeProfile?.user?.firstName ?? ""} ${checkin.traineeProfile?.user?.lastName ?? ""}`.trim();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">{isAr ? "تسجيلات الوصول" : "Check-ins"}</h1>
          <p className="text-[13px] text-[var(--text-muted)] mt-1">{isAr ? "تسجيلات متدربيك المعلقة" : "Pending trainee check-ins"}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20" />)}</div>
      ) : !(data as any[])?.length ? (
        <EmptyState icon="✅" title={isAr ? "لا توجد تسجيلات معلقة" : "No pending check-ins"} description={isAr ? "كل التسجيلات تمت مراجعتها" : "All check-ins have been reviewed"} />
      ) : (
        <div className="space-y-2">
          {(data as any[]).map((checkin: any) => (
            <Card
              key={checkin.id}
              className="flex items-center gap-4 cursor-pointer hover:border-[var(--accent)] transition-colors"
              onClick={() => { setSelected(checkin); setResponse(checkin.coachResponse ?? ""); }}
            >
              <Avatar name={traineeName(checkin)} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium">{checkin.traineeProfile?.user?.firstName} {checkin.traineeProfile?.user?.lastName}</p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {new Date(checkin.submittedAt).toLocaleDateString(isAr ? "ar" : "en", { day: "numeric", month: "short" })}
                </p>
              </div>
              {checkin.weightKg && (
                <span className="text-[13px] font-mono">{Number(checkin.weightKg)} kg</span>
              )}
              {checkin.sleepScore && (
                <Badge variant={checkin.sleepScore >= 4 ? "success" : checkin.sleepScore >= 2 ? "warning" : "error"}>
                  {isAr ? "نوم" : "Sleep"} {checkin.sleepScore}/5
                </Badge>
              )}
              <Badge variant={checkin.coachResponse ? "success" : "warning"}>
                {checkin.coachResponse
                  ? (isAr ? "تمت المراجعة" : "Reviewed")
                  : (isAr ? "بانتظار المراجعة" : "Pending")}
              </Badge>
            </Card>
          ))}
        </div>
      )}

      {/* Detail / Review Modal */}
      <Modal
        open={!!selected}
        onClose={() => { setSelected(null); setResponse(""); }}
        title={selected ? `${traineeName(selected)} — ${isAr ? "تسجيل الوصول" : "Check-in"}` : ""}
        size="md"
      >
        {selected && (
          <div className="space-y-4">
            {/* Metrics grid */}
            <div className="grid grid-cols-2 gap-3 text-[13px]">
              {selected.weightKg != null && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-[var(--text-muted)]">{isAr ? "الوزن" : "Weight"}</span>
                  <span className="font-medium">{Number(selected.weightKg)} kg</span>
                </div>
              )}
              {selected.waistCm != null && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-[var(--text-muted)]">{isAr ? "محيط الخصر" : "Waist"}</span>
                  <span className="font-medium">{Number(selected.waistCm)} cm</span>
                </div>
              )}
              {selected.sleepScore != null && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-[var(--text-muted)]">{isAr ? "النوم" : "Sleep"}</span>
                  <span className="font-medium">{selected.sleepScore}/5</span>
                </div>
              )}
              {selected.energyScore != null && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-[var(--text-muted)]">{isAr ? "الطاقة" : "Energy"}</span>
                  <span className="font-medium">{selected.energyScore}/5</span>
                </div>
              )}
              {selected.adherenceScore != null && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] text-[var(--text-muted)]">{isAr ? "الالتزام" : "Adherence"}</span>
                  <span className="font-medium">{selected.adherenceScore}/5</span>
                </div>
              )}
            </div>

            {/* Trainee notes */}
            {selected.notes && (
              <div>
                <p className="text-[11px] text-[var(--text-muted)] mb-1">{isAr ? "ملاحظات المتدرب" : "Notes from trainee"}</p>
                <p className="text-[13px] bg-[rgba(255,255,255,0.04)] rounded-[8px] p-3">{selected.notes}</p>
              </div>
            )}

            {/* Coach response */}
            <Textarea
              label={isAr ? "رد المدرب" : "Coach response"}
              placeholder={isAr ? "اكتب ملاحظاتك هنا..." : "Write your feedback here..."}
              rows={4}
              value={response}
              onChange={(e) => setResponse(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => { setSelected(null); setResponse(""); }}
              >
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                onClick={() => reviewMutation.mutate(selected.id)}
                disabled={reviewMutation.isPending || !response.trim()}
              >
                {reviewMutation.isPending
                  ? (isAr ? "جاري الإرسال..." : "Sending...")
                  : (isAr ? "إرسال المراجعة" : "Send Review")}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
