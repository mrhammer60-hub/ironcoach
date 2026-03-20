import React from "react";
import { cn } from "../utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({
  label,
  error,
  hint,
  className,
  ...props
}: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[11.5px] font-medium text-[#7878a0]">
          {label}
        </label>
      )}
      <input
        className={cn(
          "w-full bg-[#1a1a26] border border-[rgba(255,255,255,0.10)] rounded-[9px]",
          "px-3 py-[10px] text-[13.5px] text-[#e8e8f2] font-[Tajawal,sans-serif]",
          "outline-none transition-colors placeholder:text-[#4a4a6a]",
          "focus:border-[#c8f135]",
          error && "border-[#ff4f7b] focus:border-[#ff4f7b]",
          className,
        )}
        {...props}
      />
      {error && <p className="text-[11px] text-[#ff4f7b]">{error}</p>}
      {hint && !error && <p className="text-[11px] text-[#4a4a6a]">{hint}</p>}
    </div>
  );
}
