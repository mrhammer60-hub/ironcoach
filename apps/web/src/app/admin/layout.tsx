"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import { useUser } from "@/hooks/useUser";
import { TopBar } from "@/components/shared/TopBar";
import { Avatar } from "@/components/ui";

const NAV_GROUPS = [
  {
    label: { ar: "الرئيسية", en: "MAIN" },
    items: [
      { href: "/admin/dashboard", key: "nav.dashboard" as const, icon: "📊" },
    ],
  },
  {
    label: { ar: "الإدارة", en: "MANAGEMENT" },
    items: [
      { href: "/admin/coaches", key: "nav.coaches" as const, icon: "🏋️" },
      { href: "/admin/trainees", key: "nav.allTrainees" as const, icon: "👥" },
    ],
  },
  {
    label: { ar: "المحتوى", en: "CONTENT" },
    items: [
      { href: "/admin/exercises", key: "nav.exercises" as const, icon: "💪" },
      { href: "/admin/foods", key: "nav.foods" as const, icon: "🥗" },
      { href: "/admin/media", key: "nav.media" as const, icon: "🖼️" },
    ],
  },
  {
    label: { ar: "المالية", en: "FINANCE" },
    items: [
      { href: "/admin/revenue", key: "nav.revenue" as const, icon: "💳" },
      { href: "/admin/reports", key: "nav.reports" as const, icon: "📊" },
    ],
  },
  {
    label: { ar: "التواصل", en: "ENGAGE" },
    items: [
      { href: "/admin/support", key: "nav.support" as const, icon: "💬" },
      { href: "/admin/announcements", key: "nav.announcements" as const, icon: "📢" },
    ],
  },
  {
    label: { ar: "النظام", en: "SYSTEM" },
    items: [
      { href: "/admin/feature-flags", key: "nav.featureFlags" as const, icon: "🚩" },
      { href: "/admin/audit-logs", key: "nav.auditLogs" as const, icon: "📋" },
      { href: "/admin/settings", key: "nav.settings" as const, icon: "⚙️" },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t, lang } = useTranslation();
  const { user, fullName } = useUser();
  const isAr = lang === "ar";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static fixed top-0 start-0 bottom-0 z-50 w-[260px] bg-[var(--bg-card)] border-e border-[var(--border)] flex flex-col shrink-0 transition-transform duration-200`}>
        {/* Logo */}
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--error)] flex items-center justify-center text-white text-[12px] font-bold">IC</div>
            <div>
              <span className="text-[16px] font-bold tracking-tight">
                <span className="text-[var(--error)]">IRON</span>
                <span className="text-[var(--text-primary)]">COACH</span>
              </span>
              <p className="text-[9px] uppercase tracking-[0.15em] text-[var(--text-muted)]">Platform Admin</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 overflow-auto">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi} className="mb-4">
              <p className="text-[9px] uppercase tracking-[0.15em] text-[var(--text-muted)] font-semibold px-3 mb-1.5">
                {isAr ? group.label.ar : group.label.en}
              </p>
              {group.items.map((item) => {
                const active = pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 mb-0.5 ${
                      active
                        ? "bg-[var(--accent-muted)] text-[var(--accent)] border-s-2 border-[var(--accent)]"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                    }`}
                  >
                    <span className="text-[15px] w-5 text-center">{item.icon}</span>
                    {t(item.key)}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User card */}
        <div className="px-4 py-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-3">
            <Avatar name={fullName || "Admin"} src={user?.avatarUrl} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium truncate">{fullName || "Admin"}</p>
              <p className="text-[10px] text-[var(--text-muted)] truncate">{user?.email || ""}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar extra={
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]">
            <span className="text-lg">&#9776;</span>
          </button>
        } />
        <main className="flex-1 overflow-auto bg-[var(--bg-base)]">
          <div className="max-w-[1200px] mx-auto p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
