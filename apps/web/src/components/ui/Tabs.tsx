"use client";

import React from "react";

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  size?: "sm" | "md";
}

export function Tabs({ tabs, active, onChange, size = "md" }: TabsProps) {
  const sizes = { sm: "px-3 py-2 text-xs", md: "px-4 py-2.5 text-sm" };
  return (
    <div className="flex border-b border-[var(--border)] overflow-x-auto" role="tablist">
      {tabs.map(tab => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={`${sizes[size]} font-medium whitespace-nowrap transition-colors duration-fast flex items-center gap-2 -mb-px ${
            active === tab.id
              ? "text-[var(--accent)] border-b-2 border-[var(--accent)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] border-b-2 border-transparent"
          }`}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
