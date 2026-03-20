import React from "react";
import { cn } from "../utils";

type ToastVariant = "success" | "error" | "info" | "warning";

interface ToastProps {
  variant?: ToastVariant;
  message: string;
  visible: boolean;
  onDismiss?: () => void;
}

const TOAST_STYLES: Record<ToastVariant, string> = {
  success:
    "bg-[rgba(45,232,200,0.12)] text-[#2de8c8] border-[rgba(45,232,200,0.2)]",
  error:
    "bg-[rgba(255,79,123,0.12)] text-[#ff4f7b] border-[rgba(255,79,123,0.2)]",
  info: "bg-[rgba(77,184,255,0.12)] text-[#4db8ff] border-[rgba(77,184,255,0.2)]",
  warning:
    "bg-[rgba(255,176,64,0.12)] text-[#ffb040] border-[rgba(255,176,64,0.2)]",
};

export function Toast({
  variant = "info",
  message,
  visible,
  onDismiss,
}: ToastProps) {
  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-[10px] border text-[13px] font-medium shadow-lg transition-all",
        TOAST_STYLES[variant],
      )}
    >
      <span>{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="opacity-60 hover:opacity-100 transition-opacity text-current"
        >
          ✕
        </button>
      )}
    </div>
  );
}
