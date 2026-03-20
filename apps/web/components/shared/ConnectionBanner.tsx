"use client";

import React from "react";
import { useSocketStatus } from "../../hooks/useSocketStatus";

const STATUS_CONFIG = {
  connecting: {
    text: "جاري الاتصال...",
    className:
      "bg-[rgba(255,176,64,0.15)] text-[#ffb040] border-b border-[rgba(255,176,64,0.3)]",
  },
  reconnecting: {
    text: "إعادة الاتصال...",
    className:
      "bg-[rgba(255,176,64,0.15)] text-[#ffb040] border-b border-[rgba(255,176,64,0.3)]",
  },
  disconnected: {
    text: "غير متصل — الرسائل ستُرسَل عند عودة الاتصال",
    className:
      "bg-[rgba(255,79,123,0.15)] text-[#ff4f7b] border-b border-[rgba(255,79,123,0.3)]",
  },
};

export function ConnectionBanner() {
  const status = useSocketStatus();

  if (status === "connected") return null;

  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.disconnected;

  return (
    <div
      className={`fixed top-14 left-0 right-0 z-50 py-2 px-4 text-center text-sm font-medium ${config.className}`}
    >
      {status === "reconnecting" && (
        <span className="inline-block animate-spin ml-2">↻</span>
      )}
      {config.text}
    </div>
  );
}
