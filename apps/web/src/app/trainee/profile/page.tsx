"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Input, Button, Toggle, Badge, Avatar, SkeletonCard } from "@/components/ui";
import { api } from "../../../../lib/api";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/components/shared/Toast";

const TABS = [
  { key: "info", ar: "بياناتي", en: "My Info" },
  { key: "notifications", ar: "الإشعارات", en: "Notifications" },
  { key: "security", ar: "الأمان", en: "Security" },
  { key: "about", ar: "حول", en: "About" },
];

export default function TraineeProfilePage() {
  const { lang } = useTranslation();
  const isAr = lang === "ar";
  const [tab, setTab] = useState("info");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Info tab state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  // Security tab state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["trainees", "me"],
    queryFn: () => api.get<any>("/trainees/me"),
  });

  // Initialize info fields from profile
  useEffect(() => {
    if (profile) {
      setFirstName(profile.user?.firstName ?? "");
      setLastName(profile.user?.lastName ?? "");
      setPhone(profile.user?.phone ?? "");
    }
  }, [profile]);

  const { data: prefs } = useQuery({
    queryKey: ["notifications", "prefs"],
    queryFn: () => api.get<any>("/notifications/preferences"),
    enabled: tab === "notifications",
  });

  const prefsMutation = useMutation({
    mutationFn: (data: Record<string, boolean>) => api.put("/notifications/preferences", data),
  });

  const infoMutation = useMutation({
    mutationFn: () => api.put("/trainees/me", { firstName, lastName, phone }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainees", "me"] });
      toast("success", isAr ? "تم حفظ التغييرات" : "Changes saved");
    },
    onError: () => {
      toast("error", isAr ? "فشل حفظ التغييرات" : "Failed to save changes");
    },
  });

  const passwordMutation = useMutation({
    mutationFn: () => api.post("/auth/reset-password", { currentPassword, newPassword }),
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast("success", isAr ? "تم تحديث كلمة المرور" : "Password updated");
    },
    onError: () => {
      toast("info", isAr ? "قريباً" : "Coming soon");
    },
  });

  const handleUpdatePassword = () => {
    if (newPassword !== confirmPassword) {
      toast("error", isAr ? "كلمات المرور غير متطابقة" : "Passwords do not match");
      return;
    }
    if (!currentPassword || !newPassword) {
      toast("error", isAr ? "يرجى ملء جميع الحقول" : "Please fill all fields");
      return;
    }
    passwordMutation.mutate();
  };

  const handleLogoutAll = () => {
    if (!confirm(isAr ? "هل أنت متأكد من تسجيل الخروج من كل الأجهزة؟" : "Are you sure you want to logout from all devices?")) return;
    document.cookie = "ironcoach_access=;path=/;max-age=0";
    document.cookie = "ironcoach_refresh=;path=/;max-age=0";
    window.location.href = "/login";
  };

  if (isLoading) return <SkeletonCard />;

  return (
    <div className="max-w-[440px] mx-auto">
      {/* Profile header */}
      <div className="text-center mb-6">
        <Avatar name={`${profile?.user?.firstName ?? ""} ${profile?.user?.lastName ?? ""}`} src={profile?.user?.avatarUrl} size="lg" />
        <h1 className="text-[18px] font-bold mt-3">{profile?.user?.firstName} {profile?.user?.lastName}</h1>
        <p className="text-[12px] text-[var(--text-muted)]">{profile?.user?.email}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border)] mb-4 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-3 py-2 text-[12px] font-medium border-b-2 whitespace-nowrap transition-colors ${tab === t.key ? "border-[var(--accent)] text-[var(--accent)]" : "border-transparent text-[var(--text-muted)]"}`}>
            {isAr ? t.ar : t.en}
          </button>
        ))}
      </div>

      {/* Info tab */}
      {tab === "info" && (
        <Card className="space-y-4 animate-fadeIn">
          <Input label={isAr ? "الاسم الأول" : "First Name"} value={firstName} onChange={e => setFirstName(e.target.value)} />
          <Input label={isAr ? "اسم العائلة" : "Last Name"} value={lastName} onChange={e => setLastName(e.target.value)} />
          <Input label={isAr ? "الجوال" : "Phone"} value={phone} onChange={e => setPhone(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label={isAr ? "الوزن (كجم)" : "Weight (kg)"} value={profile?.currentWeightKg ? String(Number(profile.currentWeightKg)) : ""} disabled />
            <Input label={isAr ? "الطول (سم)" : "Height (cm)"} value={profile?.heightCm ? String(Number(profile.heightCm)) : ""} disabled />
          </div>
          <Button className="w-full" onClick={() => infoMutation.mutate()} disabled={infoMutation.isPending}>{infoMutation.isPending ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ التغييرات" : "Save Changes")}</Button>
        </Card>
      )}

      {/* Notifications tab */}
      {tab === "notifications" && prefs && (
        <div className="space-y-3 animate-fadeIn">
          <Card>
            <h3 className="text-[14px] font-semibold mb-3">{isAr ? "التذكيرات" : "Reminders"}</h3>
            <div className="space-y-3">
              <Toggle checked={prefs.pushDailyWorkoutReminder} onChange={v => prefsMutation.mutate({ pushDailyWorkoutReminder: v })} label={isAr ? "تذكير التمرين اليومي" : "Daily workout reminder"} />
              <Toggle checked={prefs.pushWeeklyReminder} onChange={v => prefsMutation.mutate({ pushWeeklyReminder: v })} label={isAr ? "تذكير الوزن الأسبوعي" : "Weekly weight reminder"} />
              <Toggle checked={prefs.pushMessageReceived} onChange={v => {}} label={isAr ? "رسائل المدرب (لا يمكن إيقافها)" : "Coach messages (cannot disable)"} />
            </div>
          </Card>
          <Card>
            <h3 className="text-[14px] font-semibold mb-3">{isAr ? "ساعات الهدوء" : "Quiet Hours"}</h3>
            <Toggle checked={prefs.quietHoursEnabled} onChange={v => prefsMutation.mutate({ quietHoursEnabled: v })} label={isAr ? "تفعيل ساعات الهدوء" : "Enable quiet hours"} />
          </Card>
        </div>
      )}

      {/* Security tab */}
      {tab === "security" && (
        <Card className="space-y-4 animate-fadeIn">
          <Input label={isAr ? "كلمة المرور الحالية" : "Current Password"} type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
          <Input label={isAr ? "كلمة المرور الجديدة" : "New Password"} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          <Input label={isAr ? "تأكيد كلمة المرور" : "Confirm Password"} type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          <Button className="w-full" onClick={handleUpdatePassword} disabled={passwordMutation.isPending}>{passwordMutation.isPending ? (isAr ? "جاري التحديث..." : "Updating...") : (isAr ? "تحديث كلمة المرور" : "Update Password")}</Button>
          <div className="border-t border-[var(--border)] pt-4">
            <Button variant="danger" className="w-full" onClick={handleLogoutAll}>{isAr ? "تسجيل الخروج من كل الأجهزة" : "Logout All Devices"}</Button>
          </div>
        </Card>
      )}

      {/* About tab */}
      {tab === "about" && (
        <Card className="animate-fadeIn">
          <div className="space-y-3 text-[13px]">
            <div className="flex justify-between"><span className="text-[var(--text-muted)]">{isAr ? "الإصدار" : "Version"}</span><span>1.0.0</span></div>
            <div className="flex justify-between"><span className="text-[var(--text-muted)]">{isAr ? "المنصة" : "Platform"}</span><span>IronCoach</span></div>
            <div className="border-t border-[var(--border)] pt-3 space-y-2">
              <a href="/privacy" className="block text-[var(--accent)] text-[12px]">{isAr ? "سياسة الخصوصية" : "Privacy Policy"}</a>
              <a href="#" className="block text-[var(--accent)] text-[12px]">{isAr ? "شروط الاستخدام" : "Terms of Service"}</a>
              <a href="mailto:support@ironcoach.com" className="block text-[var(--accent)] text-[12px]">{isAr ? "تواصل معنا" : "Contact Us"}</a>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
