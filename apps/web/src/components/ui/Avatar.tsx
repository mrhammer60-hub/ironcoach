"use client";

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  status?: "online" | "offline" | "away";
  className?: string;
}

const SIZES = {
  xs: "w-6 h-6 text-[9px]",
  sm: "w-8 h-8 text-[11px]",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-xl",
};

const STATUS_COLORS = {
  online: "bg-[var(--success)]",
  offline: "bg-[var(--text-muted)]",
  away: "bg-[var(--warning)]",
};

export function Avatar({ name, src, size = "md", status, className = "" }: AvatarProps) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      {src ? (
        <img src={src} alt={name} className={`${SIZES[size]} rounded-full object-cover`} />
      ) : (
        <div className={`${SIZES[size]} rounded-full bg-[var(--bg-elevated)] text-[var(--text-secondary)] flex items-center justify-center font-semibold`}>
          {initials}
        </div>
      )}
      {status && (
        <span className={`absolute bottom-0 end-0 w-2.5 h-2.5 rounded-full border-2 border-[var(--bg-card)] ${STATUS_COLORS[status]}`} />
      )}
    </div>
  );
}
