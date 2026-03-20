"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge, Skeleton, EmptyState } from "@ironcoach/ui";
import { api } from "../../../../lib/api";

export default function SupportPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "support"],
    queryFn: () => api.get<any>("/admin/support"),
  });

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">تذاكر الدعم</h1>
      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : data?.items?.length === 0 ? (
        <EmptyState icon="🎫" title="لا توجد تذاكر مفتوحة" />
      ) : (
        <div className="space-y-2">
          {data?.items?.map((ticket: any) => (
            <div key={ticket.id} className="flex items-center gap-4 p-4 bg-[#13131c] border border-[rgba(255,255,255,0.06)] rounded-xl">
              <div className="flex-1">
                <p className="font-medium text-[14px]">{ticket.subject}</p>
                <p className="text-[12px] text-[#7878a0]">
                  {ticket.openedBy?.firstName} {ticket.openedBy?.lastName} · {ticket.openedBy?.email}
                </p>
              </div>
              <Badge variant={ticket.priority === "URGENT" ? "rose" : ticket.priority === "HIGH" ? "amber" : "gray"}>
                {ticket.priority}
              </Badge>
              <Badge variant={ticket.status === "OPEN" ? "amber" : ticket.status === "RESOLVED" ? "lime" : "gray"}>
                {ticket.status}
              </Badge>
              <div className="flex gap-2">
                <button
                  onClick={() => api.put(`/admin/support/${ticket.id}/resolve`).then(() => window.location.reload())}
                  className="text-[12px] text-[#2de8c8] hover:underline"
                >
                  إغلاق
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
