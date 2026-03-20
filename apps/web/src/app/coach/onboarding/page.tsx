"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Card, Button, Input, Textarea } from "@/components/ui";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/components/shared/Toast";
import { orgApi } from "../../../../lib/api";

const SPECIALIZATIONS = [
  { value: "bodybuilding", ar: "بناء عضلات", en: "Bodybuilding", icon: "💪" },
  { value: "weight-loss", ar: "فقدان الوزن", en: "Weight Loss", icon: "🔥" },
  { value: "general", ar: "الرياضة العامة", en: "General Fitness", icon: "🏃" },
  { value: "powerlifting", ar: "باور ليفتينغ", en: "Powerlifting", icon: "🏋️" },
];

const EXPERIENCE = [
  { value: "<1", ar: "أقل من سنة", en: "Less than 1 year" },
  { value: "1-3", ar: "1-3 سنوات", en: "1-3 years" },
  { value: "3-5", ar: "3-5 سنوات", en: "3-5 years" },
  { value: "5+", ar: "5+ سنوات", en: "5+ years" },
];

const BRAND_COLORS = ["#c8f135", "#2de8c8", "#4db8ff", "#ff4f7b", "#ffb040", "#9b7dff"];

export default function CoachOnboardingPage() {
  const router = useRouter();
  const { lang } = useTranslation();
  const { toast } = useToast();
  const isAr = lang === "ar";
  const [step, setStep] = useState(1);
  const TOTAL = 7;

  const [form, setForm] = useState({
    phone: "", specialization: "", experience: "",
    brandName: "", brandColor: BRAND_COLORS[0], bio: "",
    instagram: "", inviteEmail: "", inviteName: "",
  });
  const u = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {};
      if (form.brandName.trim()) payload.name = form.brandName.trim();
      if (form.brandColor) payload.brandColor = form.brandColor;
      if (Object.keys(payload).length > 0) {
        await orgApi.update(payload);
      }
    },
    onSuccess: () => {
      toast("success", isAr ? "تم حفظ الإعدادات بنجاح" : "Settings saved successfully");
      router.push("/coach/dashboard");
    },
    onError: () => {
      toast("error", isAr ? "حدث خطأ أثناء الحفظ" : "Failed to save settings");
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="flex gap-1 mb-6">
          {Array.from({ length: TOTAL }, (_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < step ? "bg-[var(--accent)]" : "bg-[var(--bg-input)]"}`} />
          ))}
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <Card className="text-center animate-fadeIn">
            <div className="text-5xl mb-4">🎉</div>
            <h1 className="text-[22px] font-bold mb-2">{isAr ? "مرحباً في IronCoach!" : "Welcome to IronCoach!"}</h1>
            <p className="text-[14px] text-[var(--text-secondary)] mb-6 leading-relaxed">
              {isAr ? "ابدأ إعداد حسابك — 5 دقائق فقط" : "Set up your account — just 5 minutes"}
            </p>
            <Button onClick={() => setStep(2)} className="w-full text-[15px] py-3">{isAr ? "ابدأ" : "Start"} →</Button>
          </Card>
        )}

        {/* Step 2: Personal Info */}
        {step === 2 && (
          <Card className="animate-fadeIn">
            <h2 className="text-[16px] font-bold mb-4">{isAr ? "معلوماتك الشخصية" : "Personal Info"}</h2>
            <div className="space-y-4">
              <Input label={isAr ? "رقم الجوال" : "Phone"} value={form.phone} onChange={e => u("phone", e.target.value)} placeholder="+966 5XX XXX XXXX" />
              <div>
                <p className="text-[11.5px] font-medium text-[var(--text-secondary)] mb-2">{isAr ? "التخصص" : "Specialization"}</p>
                <div className="grid grid-cols-2 gap-2">
                  {SPECIALIZATIONS.map(s => (
                    <button key={s.value} onClick={() => u("specialization", s.value)} className={`p-3 rounded-[9px] text-start text-[13px] transition-colors ${form.specialization === s.value ? "bg-[var(--accent-muted)] border-2 border-[var(--accent)]" : "bg-[var(--bg-input)] border border-[var(--border)]"}`}>
                      <span className="text-xl block mb-1">{s.icon}</span>
                      {isAr ? s.ar : s.en}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11.5px] font-medium text-[var(--text-secondary)] mb-2">{isAr ? "سنوات الخبرة" : "Experience"}</p>
                <div className="flex gap-2">
                  {EXPERIENCE.map(e => (
                    <button key={e.value} onClick={() => u("experience", e.value)} className={`flex-1 py-2 rounded-[9px] text-[12px] font-medium transition-colors ${form.experience === e.value ? "bg-[var(--accent)] text-[#0d0d12]" : "bg-[var(--bg-input)] text-[var(--text-muted)]"}`}>
                      {isAr ? e.ar : e.en}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">←</Button>
                <Button onClick={() => setStep(3)} className="flex-1">{isAr ? "التالي" : "Next"} →</Button>
              </div>
            </div>
          </Card>
        )}

        {/* Step 3: Branding */}
        {step === 3 && (
          <Card className="animate-fadeIn">
            <h2 className="text-[16px] font-bold mb-4">{isAr ? "بناء هوية برندك" : "Build Your Brand"} 🎨</h2>
            <div className="space-y-4">
              <Input label={isAr ? "اسم البراند" : "Brand Name"} value={form.brandName} onChange={e => u("brandName", e.target.value)} placeholder="Ahmed Fitness" />
              <div>
                <p className="text-[11.5px] font-medium text-[var(--text-secondary)] mb-2">{isAr ? "لون البراند" : "Brand Color"}</p>
                <div className="flex gap-2">
                  {BRAND_COLORS.map(c => (
                    <button key={c} onClick={() => u("brandColor", c)} className={`w-9 h-9 rounded-full transition-transform ${form.brandColor === c ? "scale-125 ring-2 ring-offset-2 ring-[var(--text-primary)]" : "hover:scale-110"}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <Textarea label={isAr ? "نبذة عنك" : "Bio"} value={form.bio} onChange={e => u("bio", e.target.value)} rows={3} maxChars={150} placeholder={isAr ? "مدرب لياقة معتمد متخصص في..." : "Certified fitness trainer specializing in..."} />
              <Input label="Instagram" value={form.instagram} onChange={e => u("instagram", e.target.value)} placeholder="@ahmed_fitness" />
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setStep(2)} className="flex-1">←</Button>
                <Button onClick={() => setStep(4)} className="flex-1">{isAr ? "التالي" : "Next"} →</Button>
              </div>
            </div>
          </Card>
        )}

        {/* Step 4: Invite First Trainee */}
        {step === 4 && (
          <Card className="animate-fadeIn">
            <h2 className="text-[16px] font-bold mb-2">{isAr ? "دعوة أول متدرب" : "Invite First Trainee"} 👥</h2>
            <p className="text-[12px] text-[var(--text-muted)] mb-4">{isAr ? "أضف أول متدرب لتجربة النظام" : "Add your first trainee to try the system"}</p>
            <div className="space-y-4">
              <Input label={isAr ? "اسم المتدرب" : "Trainee Name"} value={form.inviteName} onChange={e => u("inviteName", e.target.value)} />
              <Input label={isAr ? "البريد الإلكتروني" : "Email"} type="email" value={form.inviteEmail} onChange={e => u("inviteEmail", e.target.value)} />
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setStep(3)} className="flex-1">←</Button>
                <Button variant="ghost" onClick={() => setStep(5)} className="flex-1">{isAr ? "تخطي" : "Skip"}</Button>
                <Button onClick={() => setStep(5)} className="flex-1">{isAr ? "دعوة" : "Invite"} →</Button>
              </div>
            </div>
          </Card>
        )}

        {/* Step 5: Feature Tour */}
        {step === 5 && (
          <Card className="animate-fadeIn">
            <h2 className="text-[16px] font-bold mb-4">{isAr ? "ميزاتك" : "Your Features"} ✨</h2>
            <div className="space-y-3 mb-6">
              {[
                { icon: "📊", ar: "لوحة تحكم ذكية لمتابعة كل متدربيك", en: "Smart dashboard to track all trainees" },
                { icon: "💪", ar: "باني برامج بقوالب جاهزة", en: "Program builder with ready templates" },
                { icon: "🥗", ar: "حاسبة سعرات وخطط تغذية تلقائية", en: "Auto calorie calculator & meal plans" },
                { icon: "💬", ar: "محادثات فورية مع المتدربين", en: "Real-time chat with trainees" },
                { icon: "📈", ar: "تقارير تقدم تلقائية بالرسوم البيانية", en: "Auto progress reports with charts" },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <span className="text-xl">{f.icon}</span>
                  <p className="text-[13px]">{isAr ? f.ar : f.en}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(4)} className="flex-1">←</Button>
              <Button onClick={() => setStep(6)} className="flex-1">{isAr ? "التالي" : "Next"} →</Button>
            </div>
          </Card>
        )}

        {/* Step 6: Checklist */}
        {step === 6 && (
          <Card className="animate-fadeIn">
            <h2 className="text-[16px] font-bold mb-2">{isAr ? "خطواتك التالية" : "Next Steps"} 📝</h2>
            <p className="text-[12px] text-[var(--text-muted)] mb-4">{isAr ? "أكمل هذه الخطوات للبدء" : "Complete these to get started"}</p>
            <div className="space-y-2 mb-6">
              {[
                { done: !!form.phone, ar: "أضف صورتك الشخصية", en: "Add profile photo" },
                { done: !!form.inviteEmail, ar: "دعوة أول متدرب", en: "Invite first trainee" },
                { done: false, ar: "إنشاء برنامجك الأول", en: "Create first program" },
                { done: false, ar: "إعداد خطة غذائية نموذجية", en: "Set up sample meal plan" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-[13px]">
                  <span>{item.done ? "✅" : "⬜"}</span>
                  <span className={item.done ? "line-through text-[var(--text-muted)]" : ""}>{isAr ? item.ar : item.en}</span>
                </div>
              ))}
            </div>
            <Button variant="ghost" onClick={() => setStep(5)} className="w-full mb-2">←</Button>
            <Button onClick={() => setStep(7)} className="w-full">{isAr ? "التالي" : "Next"} →</Button>
          </Card>
        )}

        {/* Step 7: Done */}
        {step === 7 && (
          <Card className="text-center animate-fadeIn">
            <div className="text-6xl mb-4">🚀</div>
            <h1 className="text-[22px] font-bold mb-2">{isAr ? "أنت جاهز!" : "You're Ready!"}</h1>
            <p className="text-[14px] text-[var(--text-secondary)] mb-6">
              {isAr ? "تم إعداد حسابك بنجاح. ابدأ ببناء برنامجك الأول!" : "Account setup complete. Start building your first program!"}
            </p>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="w-full text-[15px] py-3">
              {saveMutation.isPending ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "الذهاب للوحة التحكم" : "Go to Dashboard")} →
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
