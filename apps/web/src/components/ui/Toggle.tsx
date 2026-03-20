"use client";
import React from "react";

interface ToggleProps { checked: boolean; onChange: (v: boolean) => void; label?: string; }

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? "bg-[var(--accent)]" : "bg-[var(--bg-input)]"}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? "start-[22px]" : "start-0.5"}`} />
      </button>
      {label && <span className="text-[13px] text-[var(--text-primary)]">{label}</span>}
    </label>
  );
}
