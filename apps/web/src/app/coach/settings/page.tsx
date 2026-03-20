"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Input, Button, Toggle, Badge, ProgressBar, Select } from "@/components/ui";
import { api, billingApi } from "../../../../lib/api";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/components/shared/Toast";
import { useUser } from "@/hooks/useUser";

const TABS = [
  { key: "profile", ar: "الملف الشخصي", en: "Profile" },
  { key: "brand", ar: "البراند", en: "Branding" },
  { key: "notifications", ar: "الإشعارات", en: "Notifications" },
  { key: "subscription", ar: "الاشتراك", en: "Subscription" },
];

export default function SettingsPage() {
  const { t, lang } = useTranslation();
  const isAr = lang === "ar";
  const [activeTab, setActiveTab] = useState("profile");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useUser();

  // Profile state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  // Branding state
  const [orgName, setOrgName] = useState("");

  const { data: org } = useQuery({ queryKey: ["org", "me"], queryFn: () => api.get<any>("/organizations/me") });
  const { data: prefs } = useQuery({ queryKey: ["notifications", "prefs"], queryFn: () => api.get<any>("/notifications/preferences"), staleTime: 30 * 1000 });

  // Initialize profile fields from user data
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName ?? "");
      setLastName(user.lastName ?? "");
    }
  }, [user]);

  // Initialize org name from org data
  useEffect(() => {
    if (org) {
      setOrgName(org.name ?? "");
    }
  }, [org]);

  const profileMutation = useMutation({
    mutationFn: () => api.put("/auth/me", { firstName, lastName, phone: phone || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      toast("success", isAr ? "تم حفظ الملف الشخصي" : "Profile saved");
    },
    onError: () => {
      toast("error", isAr ? "حدث خطأ" : "Failed to save profile");
    },
  });

  const brandMutation = useMutation({
    mutationFn: () => api.put("/organizations/me", { name: orgName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org", "me"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      toast("success", isAr ? "تم حفظ البراند" : "Branding saved");
    },
    onError: () => {
      toast("error", isAr ? "حدث خطأ" : "Failed to save branding");
    },
  });

  const prefsMutation = useMutation({
    mutationFn: (data: Record<string, boolean>) => api.put("/notifications/preferences", data),
  });

  const togglePref = (key: string, value: boolean) => {
    prefsMutation.mutate({ [key]: value });
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">{t("nav.settings")}</h1>

      <div className="flex gap-1 border-b border-[var(--border)] mb-6">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors ${activeTab === tab.key ? "border-[var(--accent)] text-[var(--accent)]" : "border-transparent text-[var(--text-muted)]"}`}>
            {isAr ? tab.ar : tab.en}
          </button>
        ))}
      </div>

      <div className="max-w-lg animate-fadeIn">
        {activeTab === "profile" && (
          <Card className="space-y-4">
            <Input label={t("auth.firstName")} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <Input label={t("auth.lastName")} value={lastName} onChange={(e) => setLastName(e.target.value)} />
            <Input label={t("auth.email")} value={user?.email ?? ""} disabled hint={isAr ? "لا يمكن تغيير البريد" : "Email cannot be changed"} />
            <Input label={isAr ? "رقم الهاتف" : "Phone"} value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Button onClick={() => profileMutation.mutate()} disabled={profileMutation.isPending}>
              {profileMutation.isPending ? (isAr ? "جاري الحفظ..." : "Saving...") : t("common.save")}
            </Button>
          </Card>
        )}

        {activeTab === "brand" && (
          <Card className="space-y-4">
            <Input label={isAr ? "اسم المنظمة" : "Organization Name"} value={orgName} onChange={(e) => setOrgName(e.target.value)} />
            <Input label={isAr ? "النطاق الفرعي" : "Subdomain"} value={org?.slug ?? ""} disabled hint={`${org?.slug ?? ""}.ironcoach.com`} />
            <Button onClick={() => brandMutation.mutate()} disabled={brandMutation.isPending}>
              {brandMutation.isPending ? (isAr ? "جاري الحفظ..." : "Saving...") : t("common.save")}
            </Button>
          </Card>
        )}

        {activeTab === "notifications" && prefs && (
          <div className="space-y-4">
            <Card>
              <h3 className="text-[14px] font-semibold mb-4">{isAr ? "إشعارات Push" : "Push Notifications"}</h3>
              <div className="space-y-3">
                <Toggle checked={prefs.pushMessageReceived} onChange={(v) => togglePref("pushMessageReceived", v)} label={isAr ? "رسائل المتدربين" : "Trainee messages"} />
                <Toggle checked={prefs.pushWorkoutCompleted} onChange={(v) => togglePref("pushWorkoutCompleted", v)} label={isAr ? "إتمام التمارين" : "Workout completed"} />
                <Toggle checked={prefs.pushCheckinReceived} onChange={(v) => togglePref("pushCheckinReceived", v)} label={isAr ? "تسجيلات الوصول" : "Check-ins received"} />
              </div>
            </Card>
            <Card>
              <h3 className="text-[14px] font-semibold mb-4">{isAr ? "البريد الإلكتروني" : "Email"}</h3>
              <div className="space-y-3">
                <Toggle checked={prefs.emailWeeklySummary} onChange={(v) => togglePref("emailWeeklySummary", v)} label={isAr ? "ملخص أسبوعي" : "Weekly summary"} />
                <Toggle checked={prefs.emailPaymentFailed} onChange={() => {}} label={isAr ? "تنبيهات الفواتير" : "Payment alerts"} />
              </div>
            </Card>
            <Card>
              <h3 className="text-[14px] font-semibold mb-4">{isAr ? "ساعات الهدوء" : "Quiet Hours"}</h3>
              <Toggle checked={prefs.quietHoursEnabled} onChange={(v) => togglePref("quietHoursEnabled", v)} label={isAr ? "تفعيل ساعات الهدوء" : "Enable quiet hours"} />
              {prefs.quietHoursEnabled && (
                <div className="flex gap-3 mt-3">
                  <Input label={isAr ? "من" : "From"} defaultValue={prefs.quietHoursStart} className="w-24" />
                  <Input label={isAr ? "إلى" : "To"} defaultValue={prefs.quietHoursEnd} className="w-24" />
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === "subscription" && org && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">{org.subscription?.plan?.name ?? "—"}</h3>
                <p className="text-[13px] text-[var(--text-muted)]">${org.subscription?.plan?.maxTrainees ?? 0} {isAr ? "متدرب كحد أقصى" : "max trainees"}</p>
              </div>
              <Badge variant={org.subscription?.status === "ACTIVE" ? "success" : "error"}>{org.subscription?.status ?? "—"}</Badge>
            </div>
            <ProgressBar value={org.stats?.seatsUsed ?? 0} max={org.subscription?.plan?.maxTrainees ?? 1} showLabel color="var(--accent)" className="mb-4" />
            <p className="text-[12px] text-[var(--text-muted)] mb-4">
              {org.stats?.seatsUsed ?? 0} / {org.subscription?.plan?.maxTrainees ?? 0} {isAr ? "متدرب" : "trainees"}
            </p>
            <div className="flex gap-3">
              <Button size="sm" onClick={async () => {
                try {
                  const res = await billingApi.createCheckout("GROWTH");
                  if (res.url) window.location.href = res.url;
                } catch (err: any) { alert(err?.error?.message || "Error"); }
              }}>{isAr ? "ترقية الخطة" : "Upgrade Plan"}</Button>
              <Button size="sm" variant="ghost" onClick={async () => {
                try {
                  const res = await billingApi.portal();
                  if (res.url) window.location.href = res.url;
                } catch (err: any) { alert(err?.error?.message || "Error"); }
              }}>{isAr ? "إدارة الاشتراك" : "Manage Subscription"}</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
