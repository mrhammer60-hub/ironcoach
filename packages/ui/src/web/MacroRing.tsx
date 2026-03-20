import React from "react";

interface MacroRingProps {
  value: number;
  target: number;
  color: string;
  label: string;
  unit?: string;
  size?: number;
}

export function MacroRing({
  value,
  target,
  color,
  label,
  unit = "g",
  size = 64,
}: MacroRingProps) {
  const r = size / 2 - 6;
  const circumference = 2 * Math.PI * r;
  const pct = target > 0 ? Math.min(value / target, 1) : 0;
  const offset = circumference * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          style={{ transform: "rotate(-90deg)" }}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--color-ink4,#222232)"
            strokeWidth={5}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-[11px] font-bold font-[Syne,sans-serif]"
            style={{ color }}
          >
            {value}
          </span>
        </div>
      </div>
      <span className="text-[10px] text-[#4a4a6a] uppercase tracking-wide">
        {label}
      </span>
      <span className="text-[11px] font-semibold">
        {target}
        {unit}
      </span>
    </div>
  );
}
