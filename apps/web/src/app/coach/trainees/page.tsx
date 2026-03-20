"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Badge, Avatar, EmptyState, Skeleton, Modal, Card } from "@/components/ui";
import { api } from "../../../../lib/api";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/components/shared/Toast";
import Link from "next/link";

export default function TraineesPage() {
  const { t, lang } = useTranslation();
  const isAr = lang === "ar";
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [showInvite, setShowInvite] = useState(false);
  const [invite, setInvite] = useState({ firstName: "", lastName: "", email: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["coach", "trainees", search],
    queryFn: () => api.get<any>("/trainers/trainees", { params: { search: search || undefined, limit: 20 } }),
    staleTime: 2 * 60 * 1000, // 2 min — trainee list changes occasionally
  });

  const inviteMutation = useMutation({
    mutationFn: () => api.post("/trainers/trainees/invite", invite),
    onSuccess: () => {
      setShowInvite(false);
      setInvite({ firstName: "", lastName: "", email: "" });
      queryClient.invalidateQueries({ queryKey: ["coach", "trainees"] });
    },
    onError: (err: any) => toast("error", err?.error?.message || (isAr ? "فشل إرسال الدعوة" : "Failed to send invite")),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">{t("nav.myTrainees")}</h1>
        <Button onClick={() => setShowInvite(true)}>+ {t("coach.inviteTrainee")}</Button>
      </div>

      <Input placeholder={t("common.search")} value={search} onChange={(e) => setSearch(e.target.value)} icon={<span>🔍</span>} className="mb-4 max-w-sm" />

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : data?.items?.length === 0 ? (
        <EmptyState icon="👥" title={t("empty.trainees")} description={t("empty.trainees.desc")} action={{ label: t("coach.inviteTrainee"), onClick: () => setShowInvite(true) }} />
      ) : (
        <div className="space-y-2">
          {data?.items?.map((trainee: any) => (
            <Link key={trainee.id} href={`/coach/trainees/${trainee.id}`}>
              <Card hover className="flex items-center gap-4">
                <Avatar name={`${trainee.user.firstName} ${trainee.user.lastName}`} src={trainee.user.avatarUrl} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[14px]">{trainee.user.firstName} {trainee.user.lastName}</p>
                  <p className="text-[12px] text-[var(--text-muted)]">{trainee.user.email}</p>
                </div>
                {trainee.goal && <Badge variant="accent">{t(`muscle.${trainee.goal}` as any) || trainee.goal}</Badge>}
                <span className="text-[var(--text-muted)] text-[12px]">
                  {trainee.currentWeightKg ? `${Number(trainee.currentWeightKg)} kg` : "—"}
                </span>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      <Modal open={showInvite} onClose={() => setShowInvite(false)} title={t("coach.inviteTrainee")}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label={t("auth.firstName")} value={invite.firstName} onChange={(e) => setInvite({ ...invite, firstName: e.target.value })} />
            <Input label={t("auth.lastName")} value={invite.lastName} onChange={(e) => setInvite({ ...invite, lastName: e.target.value })} />
          </div>
          <Input label={t("auth.email")} type="email" value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} />
          <p className="text-[12px] text-[var(--text-muted)]">
            {isAr ? "سيتلقى المتدرب رابط دعوة على إيميله" : "Trainee will receive an invite link via email"}
          </p>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => setShowInvite(false)} className="flex-1">{t("common.cancel")}</Button>
            <Button onClick={() => inviteMutation.mutate()} loading={inviteMutation.isPending} disabled={!invite.email || !invite.firstName} className="flex-1">
              {t("coach.sendInvite")} →
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
