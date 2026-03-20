"use client";

import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const { t, lang, toggleLang, theme, toggleTheme } = useTranslation();
  const isAr = lang === "ar";

  return (
    <>
      <nav className="sticky top-0 z-50 bg-[var(--bg-base)]/80 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold">
            <span className="text-[var(--accent)]">IRON</span>COACH
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/features" className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors hidden sm:block">
              {isAr ? "المميزات" : "Features"}
            </Link>
            <Link href="/pricing" className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors hidden sm:block">
              {isAr ? "الأسعار" : "Pricing"}
            </Link>
            <Link href="/login" className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              {t("auth.login")}
            </Link>
            <button onClick={toggleTheme} className="text-[var(--text-muted)]">{theme === "dark" ? "☀️" : "🌙"}</button>
            <button onClick={toggleLang} className="text-[12px] font-semibold text-[var(--text-muted)]">{lang === "ar" ? "EN" : "عربي"}</button>
            <Link href="/register" className="px-4 py-2 bg-[var(--accent)] text-[#0d0d12] rounded-[9px] font-semibold text-[13px] hover:opacity-90 transition-opacity">
              {isAr ? "ابدأ مجاناً" : "Start Free"}
            </Link>
          </div>
        </div>
      </nav>

      <main>{children}</main>

      <footer className="border-t border-[var(--border)] py-12 mt-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="font-bold text-lg"><span className="text-[var(--accent)]">IRON</span>COACH</p>
          <p className="text-[var(--text-muted)] text-[13px] mt-2 mb-4">
            {isAr ? "منصة التدريب الاحترافية للمدربين المميزين" : "Professional coaching platform for elite trainers"}
          </p>
          <p className="text-[11px] text-[var(--text-muted)]">© {new Date().getFullYear()} IronCoach</p>
        </div>
      </footer>
    </>
  );
}
