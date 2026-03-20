"use client";

import { useTranslation } from "@/hooks/useTranslation";
import { useUser } from "@/hooks/useUser";
import { NotificationBell } from "./NotificationBell";
import { Avatar } from "@/components/ui";
import { useToast } from "./Toast";

interface TopBarProps {
  extra?: React.ReactNode;
}

export function TopBar({ extra }: TopBarProps) {
  const { t, lang, toggleLang, theme, toggleTheme } = useTranslation();
  const { toast } = useToast();
  const { user, fullName } = useUser();
  const isAr = lang === "ar";

  const handleLogout = () => {
    document.cookie = "ironcoach_access=;path=/;max-age=0";
    document.cookie = "ironcoach_refresh=;path=/;max-age=0";
    toast("info", t("ui.loggedOut"));
    window.location.href = "/login";
  };

  return (
    <header className="h-[58px] border-b border-[var(--border)] bg-[var(--bg-card)] flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        {extra}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-secondary)]" aria-label={theme === "dark" ? t("ui.lightMode") : t("ui.darkMode")}>
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
        <button onClick={toggleLang} className="px-2.5 py-1 rounded-lg hover:bg-[var(--bg-hover)] transition-colors text-[12px] font-semibold text-[var(--text-secondary)]" aria-label={t("ui.toggleLang")}>
          {lang === "ar" ? "EN" : "عربي"}
        </button>
        <NotificationBell />
        {fullName && (
          <div className="flex items-center gap-2 ms-1 group relative">
            <Avatar name={fullName} src={user?.avatarUrl} size="sm" />
            <span className="text-[12px] text-[var(--text-secondary)] hidden md:block">{fullName}</span>
            {/* Dropdown */}
            <div className="absolute top-full end-0 mt-1 hidden group-hover:block z-50">
              <div className="card p-1 min-w-[140px] shadow-lg mt-2">
                <p className="px-3 py-2 text-[11px] text-[var(--text-muted)] truncate">{user?.email}</p>
                <button onClick={handleLogout} className="w-full text-start px-3 py-2 text-[12px] text-[var(--error)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors">
                  {t("auth.logout")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
