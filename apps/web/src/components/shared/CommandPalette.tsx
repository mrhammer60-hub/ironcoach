"use client";

import { useState, useEffect } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { t, lang } = useTranslation();
  const isAr = lang === "ar";

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName))) {
        e.preventDefault();
        setOpen(o => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const go = (path: string) => { router.push(path); setOpen(false); };

  const commands = [
    { label: isAr ? "لوحة التحكم" : "Dashboard", icon: "📊", action: () => go("/coach/dashboard") },
    { label: isAr ? "المتدربون" : "Trainees", icon: "👥", action: () => go("/coach/trainees") },
    { label: isAr ? "البرامج" : "Programs", icon: "📋", action: () => go("/coach/builder") },
    { label: isAr ? "التغذية" : "Nutrition", icon: "🥗", action: () => go("/coach/nutrition") },
    { label: isAr ? "التمارين" : "Exercises", icon: "💪", action: () => go("/coach/exercises") },
    { label: isAr ? "المحادثات" : "Chat", icon: "💬", action: () => go("/coach/chat") },
    { label: isAr ? "حاسبة السعرات" : "Calculator", icon: "🧮", action: () => go("/coach/calculator") },
    { label: isAr ? "الإعدادات" : "Settings", icon: "⚙️", action: () => go("/coach/settings") },
    { label: isAr ? "بناء برنامج جديد" : "New Program", icon: "➕", action: () => go("/coach/builder") },
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
      <div onClick={e => e.stopPropagation()}>
        <Command className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl w-[min(560px,calc(100vw-32px))] overflow-hidden" onKeyDown={e => { if (e.key === "Escape") setOpen(false); }}>
          <Command.Input
            placeholder={isAr ? "ابحث عن أي شيء..." : "Search anything..."}
            className="w-full bg-transparent border-b border-[var(--border)] px-5 py-4 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none text-[15px]"
            autoFocus
          />
          <Command.List className="max-h-[320px] overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center text-[var(--text-muted)] text-[13px]">
              {isAr ? "لا توجد نتائج" : "No results"}
            </Command.Empty>
            {commands.map(cmd => (
              <Command.Item
                key={cmd.label}
                onSelect={cmd.action}
                className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer text-[var(--text-primary)] text-[13px] data-[selected=true]:bg-[var(--bg-hover)] transition-colors"
              >
                <span className="text-lg">{cmd.icon}</span>
                <span>{cmd.label}</span>
              </Command.Item>
            ))}
          </Command.List>
          <div className="border-t border-[var(--border)] px-4 py-2 text-[10px] text-[var(--text-muted)] flex items-center gap-4">
            <span>↑↓ {isAr ? "تنقل" : "navigate"}</span>
            <span>↵ {isAr ? "اختيار" : "select"}</span>
            <span>esc {isAr ? "إغلاق" : "close"}</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
