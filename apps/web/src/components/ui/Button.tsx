"use client";
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "link";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "start" | "end";
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  icon,
  iconPosition = "start",
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-fast disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] focus-visible:shadow-focus focus-visible:outline-none";
  const variants: Record<string, string> = {
    primary: "bg-[var(--accent)] text-[var(--accent-text)] hover:bg-[var(--accent-hover)] rounded-md",
    secondary: "bg-transparent border border-[var(--border-strong)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded-md",
    ghost: "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] rounded-md",
    danger: "bg-transparent border border-[var(--error)]/30 text-[var(--error)] hover:bg-[var(--error-muted)] rounded-md",
    link: "bg-transparent text-[var(--accent)] hover:underline p-0 h-auto",
  };
  const sizes: Record<string, string> = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  };

  const spinner = (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="8" />
    </svg>
  );

  const iconEl = loading ? spinner : icon;

  return (
    <button
      className={`${base} ${variants[variant]} ${variant !== "link" ? sizes[size] : ""} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {iconEl && iconPosition === "start" && iconEl}
      {children}
      {iconEl && iconPosition === "end" && iconEl}
    </button>
  );
}
