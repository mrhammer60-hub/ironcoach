"use client";
import React, { useId } from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export function Select({ label, error, options, className = "", id, ...props }: SelectProps) {
  const autoId = useId();
  const selectId = id || autoId;
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={selectId} className="text-[11.5px] font-medium text-[var(--text-secondary)]">{label}</label>}
      <select id={selectId} className={`w-full input-base px-3 py-[10px] text-[13.5px] appearance-none cursor-pointer ${error ? "!border-[var(--error)]" : ""} ${className}`} {...props}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="text-[11px] text-[var(--error)]">{error}</p>}
    </div>
  );
}
