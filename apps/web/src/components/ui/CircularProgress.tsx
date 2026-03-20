"use client";

import React from "react";

interface CircularProgressProps {
  value: number;
  size?: "sm" | "md" | "lg";
  color?: string;
  trackColor?: string;
  strokeWidth?: number;
  children?: React.ReactNode;
  label?: string;
}

const SIZES = { sm: 48, md: 64, lg: 96 };

export function CircularProgress({
  value,
  size = "md",
  color = "var(--accent)",
  trackColor = "var(--border)",
  strokeWidth = 3,
  children,
  label,
}: CircularProgressProps) {
  const px = SIZES[size];
  const radius = (px - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(Math.max(value, 0), 100) / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: px, height: px }}>
        <svg width={px} height={px} className="-rotate-90">
          <circle
            cx={px / 2}
            cy={px / 2}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={px / 2}
            cy={px / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-slow"
          />
        </svg>
        {children && (
          <div className="absolute inset-0 flex items-center justify-center">
            {children}
          </div>
        )}
      </div>
      {label && <span className="text-xs text-[var(--text-muted)]">{label}</span>}
    </div>
  );
}
