import React from "react";
import { cn } from "../utils";
import { Badge } from "./Badge";

interface WorkoutCardProps {
  title: string;
  exerciseCount: number;
  duration?: string;
  difficulty?: string;
  status?: "active" | "completed" | "paused";
  onClick?: () => void;
  className?: string;
}

const STATUS_MAP = {
  active: { variant: "lime" as const, label: "Active" },
  completed: { variant: "teal" as const, label: "Completed" },
  paused: { variant: "amber" as const, label: "Paused" },
};

export function WorkoutCard({
  title,
  exerciseCount,
  duration,
  difficulty,
  status = "active",
  onClick,
  className,
}: WorkoutCardProps) {
  const statusInfo = STATUS_MAP[status];

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-[#13131c] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-4 cursor-pointer hover:border-[rgba(255,255,255,0.12)] transition-colors",
        className,
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-[14px] font-semibold text-[#e8e8f2]">{title}</h4>
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
      </div>
      <div className="flex items-center gap-4 text-[12px] text-[#7878a0]">
        <span>{exerciseCount} exercises</span>
        {duration && <span>{duration}</span>}
        {difficulty && <span>{difficulty}</span>}
      </div>
    </div>
  );
}
