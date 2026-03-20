"use client";

import { useState, useEffect, useCallback } from "react";
import translations, { type Lang, type TranslationKey } from "../lib/i18n/translations";

function getInitialLang(): Lang {
  if (typeof window === "undefined") return "ar";
  const stored = localStorage.getItem("ironcoach_lang") as Lang | null;
  if (stored === "ar" || stored === "en") return stored;
  return "ar";
}

function getInitialTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem("ironcoach_theme") as "dark" | "light" | null;
  if (stored === "dark" || stored === "light") return stored;
  if (window.matchMedia?.("(prefers-color-scheme: light)").matches) return "light";
  return "dark";
}

export function useTranslation() {
  const [lang, setLangState] = useState<Lang>(getInitialLang);
  const [theme, setThemeState] = useState<"dark" | "light">(getInitialTheme);

  const isRTL = lang === "ar";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    localStorage.setItem("ironcoach_lang", lang);
    document.cookie = `ironcoach_lang=${lang};path=/;max-age=${365 * 24 * 60 * 60}`;
  }, [lang, isRTL]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("ironcoach_theme", theme);
    document.cookie = `ironcoach_theme=${theme};path=/;max-age=${365 * 24 * 60 * 60}`;
  }, [theme]);

  const t = useCallback(
    (key: TranslationKey): string => {
      const entry = translations[key];
      if (!entry) return key;
      return entry[lang] || entry.ar || key;
    },
    [lang],
  );

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const toggleLang = useCallback(() => setLangState((prev) => (prev === "ar" ? "en" : "ar")), []);

  const setTheme = useCallback((t: "dark" | "light") => setThemeState(t), []);
  const toggleTheme = useCallback(() => setThemeState((prev) => (prev === "dark" ? "light" : "dark")), []);

  return { t, lang, setLang, toggleLang, isRTL, theme, setTheme, toggleTheme };
}
