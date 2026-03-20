"use client";
import React from "react";
import { Button } from "./Button";

interface EmptyStateProps { icon?: string; title: string; description?: string; action?: { label: string; onClick: () => void }; }

export function EmptyState({ icon = "📭", title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3 animate-fadeIn">
      <span className="text-5xl">{icon}</span>
      <h3 className="text-[15px] font-semibold text-[var(--text-secondary)]">{title}</h3>
      {description && <p className="text-[13px] text-[var(--text-muted)] max-w-xs leading-relaxed">{description}</p>}
      {action && <Button onClick={action.onClick} className="mt-2">{action.label}</Button>}
    </div>
  );
}
