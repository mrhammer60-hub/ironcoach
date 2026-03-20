import React from "react";
import { cn } from "../utils";

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger" | "teal";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-[9px] font-semibold transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none font-[Tajawal,sans-serif]";

  const variants = {
    primary:
      "bg-[#c8f135] text-[#0d0d12] hover:bg-[#d4ff40] active:scale-[0.98]",
    ghost:
      "bg-transparent text-[#7878a0] border border-[rgba(255,255,255,0.10)] hover:bg-[#1c1c28] hover:text-[#e8e8f2]",
    danger:
      "bg-[rgba(255,79,123,0.12)] text-[#ff4f7b] border border-[rgba(255,79,123,0.2)] hover:bg-[rgba(255,79,123,0.2)]",
    teal:
      "bg-[rgba(45,232,200,0.12)] text-[#2de8c8] border border-[rgba(45,232,200,0.2)] hover:bg-[rgba(45,232,200,0.2)]",
  };

  const sizes = {
    sm: "px-3 py-[5px] text-[12px]",
    md: "px-4 py-2 text-[13px]",
    lg: "px-6 py-3 text-[15px]",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  );
}
