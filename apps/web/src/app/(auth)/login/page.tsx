"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { authApi } from "../../../../lib/api";
import { useTranslation } from "@/hooks/useTranslation";

export default function LoginPage() {
  const router = useRouter();
  const { t, lang, toggleLang, toggleTheme, theme } = useTranslation();
  const isAr = lang === "ar";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await authApi.login({ email, password });
      const role = result.user.role;
      if (role === "ADMIN") router.push("/admin/dashboard");
      else if (role === "TRAINEE") router.push("/trainee/today");
      else router.push("/coach/dashboard");
    } catch (err: any) {
      setError(err?.error?.message || t("auth.invalidCredentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Controls */}
      <div className="fixed top-4 end-4 flex gap-2 z-50">
        <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]">
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
        <button onClick={toggleLang} className="px-2.5 py-1 rounded-lg hover:bg-[var(--bg-hover)] text-xs font-semibold text-[var(--text-secondary)]">
          {lang === "ar" ? "EN" : "عربي"}
        </button>
      </div>

      {/* Left — Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10">
            <h1 className="text-2xl font-bold mb-1">
              <span className="text-[var(--accent)]">IRON</span>COACH
            </h1>
            <h2 className="text-xl font-semibold mt-6 font-arabic-heading">
              {isAr ? "مرحباً بعودتك" : "Welcome back"}
            </h2>
            <p className="text-[var(--text-muted)] text-sm mt-1">
              {isAr ? "سجل دخولك للوصول إلى لوحة التحكم" : "Sign in to access your dashboard"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label={t("auth.email")} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="coach@example.com" required />
            <Input label={t("auth.password")} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />

            {error && (
              <div className="bg-[var(--error-muted)] text-[var(--error)] text-sm px-4 py-2.5 rounded-md">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} size="lg" className="w-full">
              {t("auth.login")}
            </Button>

            <div className="flex justify-between text-xs text-[var(--text-muted)] pt-2">
              <a href="/forgot-password" className="hover:text-[var(--accent)] transition-colors">{t("auth.forgotPassword")}</a>
              <a href="/register" className="hover:text-[var(--accent)] transition-colors">{t("auth.newAccount")}</a>
            </div>
          </form>
        </div>
      </div>

      {/* Right — Visual (desktop only) */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1c1c24 0%, #09090b 100%)" }}>
        <div className="max-w-md text-center px-12">
          <div className="w-20 h-20 rounded-2xl bg-[var(--accent)] flex items-center justify-center text-3xl font-bold text-[var(--accent-text)] mx-auto mb-8">
            IC
          </div>
          <h3 className="text-2xl font-bold mb-4 font-arabic-heading">
            {isAr ? "منصة التدريب الرياضي الاحترافية" : "Professional Coaching Platform"}
          </h3>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-8">
            {isAr
              ? "أدر متدربيك، ابنِ برامجهم، وتابع تقدمهم — كل ذلك في منصة واحدة مصممة للمدربين العرب"
              : "Manage trainees, build programs, and track progress — all in one platform designed for coaches"}
          </p>

          <div className="space-y-3 text-start">
            {[
              { icon: "🏋️", text: isAr ? "320 تمرين بالعربية" : "320 exercises in Arabic" },
              { icon: "📊", text: isAr ? "متابعة تقدم ذكية بالذكاء الاصطناعي" : "AI-powered progress tracking" },
              { icon: "💬", text: isAr ? "محادثات فورية مع المتدربين" : "Real-time trainee messaging" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                <span className="text-lg">{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-12 p-5 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-start">
            <p className="text-sm italic text-[var(--text-secondary)] leading-relaxed">
              {isAr
                ? "\"IronCoach وفّر عليّ 12 ساعة أسبوعياً من العمل الإداري\""
                : "\"IronCoach saved me 12 hours per week of admin work\""}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-3">
              — {isAr ? "أحمد، مدرب لياقة في الرياض" : "Ahmed, fitness coach in Riyadh"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
