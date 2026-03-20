"use client";
import React, { useId } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export function Input({ label, error, hint, icon, className = "", id, ...props }: InputProps) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={inputId} className="text-[11.5px] font-medium text-[var(--text-secondary)]">{label}</label>}
      <div className="relative">
        {icon && <span className="absolute start-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">{icon}</span>}
        <input
          id={inputId}
          className={`w-full input-base px-3 py-[10px] text-[13.5px] ${icon ? "ps-9" : ""} ${error ? "!border-[var(--error)]" : ""} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-[11px] text-[var(--error)]">{error}</p>}
      {hint && !error && <p className="text-[11px] text-[var(--text-muted)]">{hint}</p>}
    </div>
  );
}
