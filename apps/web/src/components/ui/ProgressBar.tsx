"use client";
import React from "react";

interface ProgressBarProps { value: number; max?: number; color?: string; showLabel?: boolean; className?: string; }

export function ProgressBar({ value, max = 100, color, showLabel, className = "" }: ProgressBarProps) {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 h-2 bg-[var(--bg-input)] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${pct}%`, backgroundColor: color || "var(--accent)" }} />
      </div>
      {showLabel && <span className="text-[11px] font-medium text-[var(--text-secondary)] min-w-[32px] text-end">{pct}%</span>}
    </div>
  );
}
