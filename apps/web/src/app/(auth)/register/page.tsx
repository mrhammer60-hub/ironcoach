"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { authApi } from "../../../../lib/api";
import { useTranslation } from "@/hooks/useTranslation";

export default function RegisterPage() {
  const router = useRouter();
  const { t, lang, toggleLang, toggleTheme, theme } = useTranslation();
  const isAr = lang === "ar";
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const u = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.register(form);
      router.push("/coach/dashboard");
    } catch (err: any) {
      setError(err?.error?.message || (isAr ? "حدث خطأ" : "An error occurred"));
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
              {isAr ? "إنشاء حساب جديد" : "Create your account"}
            </h2>
            <p className="text-[var(--text-muted)] text-sm mt-1">
              {isAr ? "ابدأ إدارة متدربيك باحترافية" : "Start managing your trainees professionally"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label={t("auth.firstName")} value={form.firstName} onChange={(e) => u("firstName", e.target.value)} required />
              <Input label={t("auth.lastName")} value={form.lastName} onChange={(e) => u("lastName", e.target.value)} required />
            </div>
            <Input label={t("auth.email")} type="email" value={form.email} onChange={(e) => u("email", e.target.value)} placeholder="coach@example.com" required />
            <Input label={t("auth.password")} type="password" value={form.password} onChange={(e) => u("password", e.target.value)} hint={isAr ? "8 أحرف، حرف كبير ورقم" : "8 chars, uppercase + digit"} required />

            {error && (
              <div className="bg-[var(--error-muted)] text-[var(--error)] text-sm px-4 py-2.5 rounded-md">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} size="lg" className="w-full">
              {t("auth.register")}
            </Button>

            <p className="text-center text-xs text-[var(--text-muted)] pt-2">
              {t("auth.hasAccount")} <a href="/login" className="text-[var(--accent)] hover:underline transition-colors">{t("auth.login")}</a>
            </p>
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
            {isAr ? "انضم إلى مئات المدربين" : "Join hundreds of coaches"}
          </h3>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-8">
            {isAr
              ? "بناء برامج تدريبية، تخطيط التغذية، ومتابعة التقدم — كل ذلك في مكان واحد"
              : "Build training programs, plan nutrition, and track progress — all in one place"}
          </p>

          <div className="space-y-3 text-start">
            {[
              { icon: "⚡", text: isAr ? "إعداد في دقائق — لا حاجة لبطاقة ائتمان" : "Setup in minutes — no credit card needed" },
              { icon: "🏋️", text: isAr ? "320 تمرين جاهز بالعربية" : "320 exercises ready in Arabic" },
              { icon: "🤖", text: isAr ? "ذكاء اصطناعي لبناء البرامج والتغذية" : "AI-powered program & nutrition generation" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                <span className="text-lg">{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-12 flex items-center justify-center gap-6 text-[var(--text-muted)] text-xs">
            <span>🔒 {isAr ? "بياناتك محمية" : "Data secured"}</span>
            <span>🌍 {isAr ? "عربي + إنجليزي" : "Arabic + English"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
