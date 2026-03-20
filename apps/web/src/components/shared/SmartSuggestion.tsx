"use client";

import { Card, Button } from "@/components/ui";

interface SmartSuggestionProps {
  type?: "info" | "warning" | "success";
  message: string;
  action?: { label: string; onClick: () => void };
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function SmartSuggestion({ type = "info", message, action, dismissible, onDismiss }: SmartSuggestionProps) {
  const styles = {
    info: "bg-[var(--info-muted)] border-[var(--info)] text-[var(--info)]",
    warning: "bg-[var(--warning-muted)] border-[var(--warning)] text-[var(--warning)]",
    success: "bg-[var(--success-muted)] border-[var(--success)] text-[var(--success)]",
  };

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-[9px] border text-[13px] ${styles[type]} animate-fadeIn`}>
      <span className="text-base mt-0.5">🤖</span>
      <div className="flex-1">
        <p className="leading-relaxed">{message}</p>
        {action && (
          <Button size="sm" variant="ghost" onClick={action.onClick} className="mt-2 !text-current !border-current">
            {action.label}
          </Button>
        )}
      </div>
      {dismissible && onDismiss && (
        <button onClick={onDismiss} className="text-current opacity-60 hover:opacity-100">✕</button>
      )}
    </div>
  );
}
