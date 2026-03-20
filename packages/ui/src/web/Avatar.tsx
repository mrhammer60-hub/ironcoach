import React from "react";
import { cn } from "../utils";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const sizes = {
    sm: "w-7 h-7 text-[10px]",
    md: "w-9 h-9 text-[12px]",
    lg: "w-12 h-12 text-[14px]",
  };

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          "rounded-full object-cover",
          sizes[size],
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-[#1c1c28] border border-[rgba(255,255,255,0.10)] flex items-center justify-center font-semibold text-[#7878a0]",
        sizes[size],
        className,
      )}
    >
      {initials}
    </div>
  );
}
