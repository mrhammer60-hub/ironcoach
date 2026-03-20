"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import { useUser } from "@/hooks/useUser";
import { TopBar } from "@/components/shared/TopBar";
import { CommandPalette } from "@/components/shared/CommandPalette";
import { Avatar, ProgressBar } from "@/components/ui";

const NAV_GROUPS = [
  { label: { ar: "الرئيسية", en: "MAIN" }, items: [{ href: "/coach/dashboard", key: "nav.dashboard" as const, icon: "📊" }] },
  { label: { ar: "التدريب", en: "COACHING" }, items: [
    { href: "/coach/trainees", key: "nav.myTrainees" as const, icon: "👥" },
    { href: "/coach/builder", key: "nav.programs" as const, icon: "📋" },
    { href: "/coach/nutrition", key: "nav.nutrition" as const, icon: "🥗" },
    { href: "/coach/exercises", key: "nav.exercises" as const, icon: "💪" },
    { href: "/coach/calculator", key: "nav.calculator" as const, icon: "🧮" },
  ]},
  { label: { ar: "التواصل", en: "ENGAGE" }, items: [
    { href: "/coach/checkins", key: "nav.progress" as const, icon: "📈" },
    { href: "/coach/chat", key: "nav.messages" as const, icon: "💬" },
  ]},
  { label: { ar: "الحساب", en: "ACCOUNT" }, items: [{ href: "/coach/settings", key: "nav.settings" as const, icon: "⚙️" }] },
];

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t, lang } = useTranslation();
  const { user, fullName, orgName } = useUser();
  const isAr = lang === "ar";
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sidebar-collapsed") === "true";
  });

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  };

  return (
    <div className="flex min-h-screen">
      <a href="#main-content" className="skip-to-content">
        {isAr ? "تخطى إلى المحتوى الرئيسي" : "Skip to main content"}
      </a>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static fixed top-0 start-0 bottom-0 z-50 ${collapsed ? "w-[68px]" : "w-[260px]"} bg-[var(--bg-card)] border-e border-[var(--border)] flex flex-col shrink-0 transition-all duration-200`}>
        <div className={`${collapsed ? "px-2 pt-4 pb-3" : "px-5 pt-6 pb-4"} flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center text-[var(--accent-text)] text-xs font-bold shrink-0">IC</div>
            {!collapsed && (
              <span className="text-base font-bold tracking-tight">
                <span className="text-[var(--accent)]">IRON</span><span className="text-[var(--text-primary)]">COACH</span>
              </span>
            )}
          </div>
          <button onClick={toggleCollapse} className="hidden lg:flex p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] text-xs" aria-label="Toggle sidebar">
            {collapsed ? "→" : "←"}
          </button>
        </div>

        {!collapsed && (
          <div className="mx-4 mb-4 px-3 py-2.5 bg-[var(--bg-input)] rounded-lg">
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-[var(--text-muted)]">{isAr ? "المتدربون" : "Trainees"}</span>
              <span className="font-mono font-semibold">12 / 50</span>
            </div>
            <ProgressBar value={12} max={50} color="var(--accent)" />
          </div>
        )}

        <nav className="flex-1 px-3 overflow-auto">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi} className="mb-4">
              {!collapsed && (
                <p className="text-[9px] uppercase tracking-[0.15em] text-[var(--text-muted)] font-semibold px-3 mb-1.5">
                  {isAr ? group.label.ar : group.label.en}
                </p>
              )}
              {group.items.map(item => {
                const active = pathname?.startsWith(item.href);
                return (
                  <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)} title={collapsed ? t(item.key) : undefined} className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 mb-0.5 ${active ? "bg-[var(--accent-muted)] text-[var(--accent)] border-s-2 border-[var(--accent)]" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"}`}>
                    <span className="text-[15px] w-5 text-center shrink-0">{item.icon}</span>{!collapsed && t(item.key)}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={`${collapsed ? "px-2" : "px-4"} py-4 border-t border-[var(--border)] space-y-3`}>
          {!collapsed && (
            <button
              onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
              className="w-full flex items-center justify-between px-3 py-2 bg-[var(--bg-input)] rounded-lg text-xs text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              <span>🔍 {isAr ? "بحث سريع..." : "Quick search..."}</span>
              <kbd className="text-[10px] px-1.5 py-0.5 bg-[var(--bg-hover)] rounded border border-[var(--border)]">⌘K</kbd>
            </button>
          )}
          <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
            <Avatar name={fullName || "Coach"} src={user?.avatarUrl} size="sm" />
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{fullName || "Coach"}</p>
                <p className="text-[10px] text-[var(--text-muted)] truncate">{orgName || user?.email || ""}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar extra={
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]">
            <span className="text-lg">&#9776;</span>
          </button>
        } />
        <main id="main-content" className="flex-1 overflow-auto bg-[var(--bg-base)]"><div className="max-w-[1200px] mx-auto p-6">{children}</div></main>
      </div>
      <CommandPalette />
    </div>
  );
}
