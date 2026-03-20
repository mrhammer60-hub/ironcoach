"use client";
import React from "react";

type BadgeVariant = "accent" | "success" | "error" | "warning" | "info" | "muted";

const STYLES: Record<BadgeVariant, string> = {
  accent: "bg-[var(--accent-muted)] text-[var(--accent)] border-[var(--accent-muted)]",
  success: "bg-[var(--success-muted)] text-[var(--success)] border-[var(--success-muted)]",
  error: "bg-[var(--error-muted)] text-[var(--error)] border-[var(--error-muted)]",
  warning: "bg-[var(--warning-muted)] text-[var(--warning)] border-[var(--warning-muted)]",
  info: "bg-[var(--info-muted)] text-[var(--info)] border-[var(--info-muted)]",
  muted: "bg-[var(--bg-input)] text-[var(--text-secondary)] border-[var(--border)]",
};

export function Badge({ variant = "muted", children }: { variant?: BadgeVariant; children: React.ReactNode }) {
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${STYLES[variant]}`}>{children}</span>;
}
