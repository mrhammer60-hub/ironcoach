"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";

export function ConnectionBanner() {
  const [online, setOnline] = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };
    const handleOffline = () => {
      setOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (online && !showReconnected) return null;

  return (
    <div className={`fixed top-0 start-0 end-0 z-[200] text-center py-2 text-[13px] font-medium transition-all ${
      !online
        ? "bg-[var(--error)] text-white"
        : "bg-[var(--success)] text-white"
    }`} role="alert" aria-live="assertive">
      {!online ? `\u274C ${t("ui.offline")}` : `\u2705 ${t("ui.reconnected")}`}
    </div>
  );
}
