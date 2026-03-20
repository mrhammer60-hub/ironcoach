"use client";
import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "bordered" | "clickable" | "highlighted";
  padding?: "sm" | "md" | "lg" | "none";
  hover?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function Card({ children, className = "", variant = "default", padding = "md", hover, style, onClick }: CardProps) {
  // Backward compat: hover=true maps to elevated variant
  const resolvedVariant = hover && variant === "default" ? "elevated" : variant;
  const pads = { none: "", sm: "p-3", md: "p-5", lg: "p-7" };
  const variants: Record<string, string> = {
    default: "card",
    elevated: "card shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-base",
    bordered: "bg-transparent border-2 border-[var(--border-strong)] rounded-lg",
    clickable: "card shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-base cursor-pointer focus-visible:shadow-focus",
    highlighted: "card border-[var(--border-accent)] shadow-sm",
  };

  return (
    <div
      className={`${variants[resolvedVariant]} ${pads[padding]} animate-fadeIn ${className}`}
      style={style}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}
