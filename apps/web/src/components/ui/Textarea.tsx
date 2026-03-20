"use client";
import React, { useId } from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string; error?: string; maxChars?: number;
}

export function Textarea({ label, error, maxChars, className = "", value, id, ...props }: TextareaProps) {
  const autoId = useId();
  const textareaId = id || autoId;
  const charCount = typeof value === "string" ? value.length : 0;
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={textareaId} className="text-[11.5px] font-medium text-[var(--text-secondary)]">{label}</label>}
      <textarea id={textareaId} className={`w-full input-base px-3 py-[10px] text-[13.5px] resize-none ${error ? "!border-[var(--error)]" : ""} ${className}`} value={value} {...props} />
      <div className="flex justify-between">
        {error && <p className="text-[11px] text-[var(--error)]">{error}</p>}
        {maxChars && <p className={`text-[11px] ms-auto ${charCount > maxChars ? "text-[var(--error)]" : "text-[var(--text-muted)]"}`}>{charCount}/{maxChars}</p>}
      </div>
    </div>
  );
}
