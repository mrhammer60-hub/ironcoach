"use client";
import React from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  iconBg?: string;
  trend?: { value: number; label?: string };
  sparkline?: React.ReactNode;
  className?: string;
}

export function StatCard({ label, value, icon, iconBg, trend, sparkline, className = "" }: StatCardProps) {
  const trendPositive = trend && trend.value > 0;
  const trendNegative = trend && trend.value < 0;

  return (
    <div className={`card p-5 animate-fadeIn ${className}`}>
      <div className="flex items-start justify-between mb-3">
        {icon && (
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
            style={{ background: iconBg || "var(--bg-elevated)" }}
          >
            {icon}
          </div>
        )}
        {trend && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            trendPositive ? "bg-[var(--success-muted)] text-[var(--success)]" :
            trendNegative ? "bg-[var(--error-muted)] text-[var(--error)]" :
            "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
          }`}>
            {trendPositive ? "\u2191" : trendNegative ? "\u2193" : "\u2192"} {Math.abs(trend.value)}%{trend.label ? ` ${trend.label}` : ""}
          </span>
        )}
      </div>
      <div className="text-3xl font-bold font-display tracking-tight leading-none mb-1 tabular-nums">{value}</div>
      <div className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-medium mt-2">{label}</div>
      {sparkline && <div className="mt-3">{sparkline}</div>}
    </div>
  );
}
