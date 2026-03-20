"use client";

import { useState, useRef, useEffect } from "react";

interface InlineEditProps {
  value: string;
  onSave: (val: string) => Promise<void>;
  type?: string;
  className?: string;
}

export function InlineEdit({ value, onSave, type = "text", className = "" }: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setVal(value); }, [value]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const handleSave = async () => {
    if (val === value) { setEditing(false); return; }
    setSaving(true);
    try {
      await onSave(val);
    } catch { setVal(value); }
    setSaving(false);
    setEditing(false);
  };

  if (!editing) {
    return (
      <span
        onClick={() => setEditing(true)}
        className={`cursor-pointer hover:bg-[var(--bg-hover)] px-1.5 py-0.5 rounded group inline-flex items-center gap-1 transition-colors ${className}`}
      >
        {value || "—"}
        <svg className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </span>
    );
  }

  return (
    <input
      ref={inputRef}
      type={type}
      value={val}
      onChange={e => setVal(e.target.value)}
      onBlur={handleSave}
      onKeyDown={e => {
        if (e.key === "Enter") handleSave();
        if (e.key === "Escape") { setVal(value); setEditing(false); }
      }}
      disabled={saving}
      className={`bg-[var(--bg-input)] border border-[var(--accent)] rounded-lg px-2 py-0.5 text-sm outline-none min-w-[80px] ${className}`}
    />
  );
}
