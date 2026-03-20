import React from "react";
import { cn } from "../utils";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  trend = "neutral",
  icon,
  className,
}: StatCardProps) {
  const trendColors = {
    up: "text-[#2de8c8]",
    down: "text-[#ff4f7b]",
    neutral: "text-[#7878a0]",
  };

  return (
    <div
      className={cn(
        "bg-[#13131c] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-5",
        className,
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11.5px] font-medium text-[#7878a0] uppercase tracking-wide">
          {label}
        </span>
        {icon && <span className="text-[#4a4a6a]">{icon}</span>}
      </div>
      <div className="text-[24px] font-bold text-[#e8e8f2] font-[Syne,sans-serif]">
        {value}
      </div>
      {change && (
        <span className={cn("text-[11px] font-medium mt-1", trendColors[trend])}>
          {change}
        </span>
      )}
    </div>
  );
}
