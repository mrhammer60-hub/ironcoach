"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import { useUser } from "@/hooks/useUser";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { Avatar } from "@/components/ui";

const TABS = [
  { href: "/trainee/today", key: "trainee.today" as const, icon: "🏠" },
  { href: "/trainee/workout", key: "trainee.myWorkout" as const, icon: "💪" },
  { href: "/trainee/nutrition", key: "trainee.myNutrition" as const, icon: "🥗" },
  { href: "/trainee/progress", key: "trainee.myProgress" as const, icon: "📈" },
  { href: "/trainee/chat", key: "trainee.myCoach" as const, icon: "💬" },
];

export default function TraineeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t, toggleLang, toggleTheme, theme, lang } = useTranslation();
  const { fullName } = useUser();

  // Full-screen: workout session and onboarding — no chrome
  if (pathname === "/trainee/workout" || pathname === "/trainee/onboarding") {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top header */}
      <header className="h-[56px] border-b border-[var(--border)] bg-[var(--bg-card)] flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-bold">
            <span className="text-[var(--accent)]">IRON</span>
            <span className="text-[var(--text-primary)]">COACH</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={toggleTheme} className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] text-[14px]">
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <button onClick={toggleLang} className="px-2 py-1 rounded-lg hover:bg-[var(--bg-hover)] text-[11px] font-semibold text-[var(--text-secondary)]">
            {lang === "ar" ? "EN" : "عر"}
          </button>
          <NotificationBell />
          <Link href="/trainee/profile">
            <Avatar name={fullName || "T"} size="sm" />
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto pb-20">
        <div className="max-w-[440px] mx-auto p-4">{children}</div>
      </main>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 start-0 end-0 bg-[var(--bg-card)] border-t border-[var(--border)] flex justify-around py-1 px-2 z-40 safe-area-inset-bottom">
        {TABS.map((tab) => {
          const active = pathname === tab.href || (tab.href === "/trainee/today" && pathname === "/trainee");
          return (
            <Link key={tab.href} href={tab.href} className="flex flex-col items-center gap-0.5 py-1.5 px-2 min-w-[52px] transition-colors relative">
              {/* Active indicator dot */}
              {active && <span className="absolute -top-1 w-1 h-1 rounded-full bg-[var(--accent)]" />}
              <span className={`text-[18px] transition-transform ${active ? "scale-110" : ""}`}>{tab.icon}</span>
              <span className={`text-[10px] font-medium ${active ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}`}>
                {t(tab.key)}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
