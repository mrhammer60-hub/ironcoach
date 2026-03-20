import React from "react";
import { cn } from "../utils";

interface MealCardProps {
  mealName: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  items?: string[];
  className?: string;
}

export function MealCard({
  mealName,
  calories,
  proteinG,
  carbsG,
  fatsG,
  items,
  className,
}: MealCardProps) {
  return (
    <div
      className={cn(
        "bg-[#13131c] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-4",
        className,
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[14px] font-semibold text-[#e8e8f2]">
          {mealName}
        </h4>
        <span className="text-[13px] font-bold text-[#c8f135]">
          {calories} kcal
        </span>
      </div>
      <div className="flex items-center gap-4 text-[11px] text-[#7878a0] mb-2">
        <span>
          P: <b className="text-[#2de8c8]">{proteinG}g</b>
        </span>
        <span>
          C: <b className="text-[#ffb040]">{carbsG}g</b>
        </span>
        <span>
          F: <b className="text-[#ff4f7b]">{fatsG}g</b>
        </span>
      </div>
      {items && items.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {items.map((item) => (
            <span
              key={item}
              className="text-[10px] bg-[rgba(255,255,255,0.04)] text-[#7878a0] px-2 py-0.5 rounded-full"
            >
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
