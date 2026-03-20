"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Badge, Toggle, Skeleton } from "@/components/ui";
import { api } from "../../../../lib/api";
import { useTranslation } from "@/hooks/useTranslation";

const DEMO_FLAGS = [
  { id: "1", key: "chat_enabled", name: "تفعيل المحادثة الفورية", nameEn: "Real-time Chat", isEnabled: true },
  { id: "2", key: "meal_plan_builder", name: "باني خطط التغذية", nameEn: "Meal Plan Builder", isEnabled: true },
  { id: "3", key: "mobile_app", name: "التطبيق المحمول", nameEn: "Mobile App", isEnabled: true },
  { id: "4", key: "pdf_export", name: "تصدير PDF", nameEn: "PDF Export", isEnabled: false },
  { id: "5", key: "ai_suggestions", name: "اقتراحات الذكاء الاصطناعي", nameEn: "AI Suggestions", isEnabled: false, comingSoon: true },
  { id: "6", key: "stripe_payments", name: "بوابة الدفع Stripe", nameEn: "Stripe Payments", isEnabled: true },
  { id: "7", key: "usda_food_search", name: "بحث USDA للأطعمة", nameEn: "USDA Food Search", isEnabled: true },
  { id: "8", key: "apple_pay", name: "Apple Pay", nameEn: "Apple Pay", isEnabled: false, comingSoon: true },
  { id: "9", key: "google_pay", name: "Google Pay", nameEn: "Google Pay", isEnabled: false, comingSoon: true },
];

export default function FeatureFlagsPage() {
  const { lang } = useTranslation();
  const isAr = lang === "ar";
  const queryClient = useQueryClient();

  const { data: apiFlags, isLoading } = useQuery({
    queryKey: ["admin", "feature-flags"],
    queryFn: () => api.get<any[]>("/admin/feature-flags").catch(() => []),
  });

  const flags = (apiFlags && apiFlags.length > 0) ? apiFlags : DEMO_FLAGS;

  const toggleMutation = useMutation({
    mutationFn: ({ id, isEnabled }: { id: string; isEnabled: boolean }) =>
      api.put(`/admin/feature-flags/${id}`, { isEnabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "feature-flags"] }),
  });

  return (
    <div>
      <h1 className="text-[22px] font-bold tracking-tight mb-2">{isAr ? "الميزات" : "Feature Flags"}</h1>
      <p className="text-[13px] text-[var(--text-muted)] mb-8">{isAr ? "تحكم في ميزات المنصة" : "Control platform features"}</p>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <div className="space-y-3 max-w-2xl">
          {(flags as any[]).map((flag: any) => (
            <Card key={flag.id || flag.key} className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[14px] font-medium">{isAr ? (flag.name || flag.nameEn) : (flag.nameEn || flag.name)}</p>
                  {(flag as any).comingSoon && (
                    <Badge variant="info">{isAr ? "قريباً" : "Coming Soon"}</Badge>
                  )}
                </div>
                <p className="text-[11px] text-[var(--text-muted)] font-mono">{flag.key}</p>
              </div>
              <Toggle
                checked={flag.isEnabled}
                onChange={(v) => toggleMutation.mutate({ id: flag.id, isEnabled: v })}
              />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
