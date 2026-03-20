import React from "react";
import { cn } from "../utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
}

export function Card({ children, className, padding = "md" }: CardProps) {
  const paddings = {
    sm: "p-3",
    md: "p-5",
    lg: "p-7",
  };

  return (
    <div
      className={cn(
        "bg-[#13131c] border border-[rgba(255,255,255,0.06)] rounded-[14px]",
        paddings[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}
