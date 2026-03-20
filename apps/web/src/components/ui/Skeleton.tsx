"use client";

interface SkeletonProps {
  className?: string;
  variant?: "default" | "text" | "heading" | "circle";
}

export function Skeleton({ className = "", variant = "default" }: SkeletonProps) {
  const variants: Record<string, string> = {
    default: "rounded-md",
    text: "h-4 rounded",
    heading: "h-7 rounded",
    circle: "rounded-full",
  };
  return <div className={`animate-shimmer ${variants[variant]} ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="card p-5 space-y-3 animate-fadeIn">
      <div className="flex items-center gap-3">
        <Skeleton variant="circle" className="w-10 h-10" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-2/3" />
          <Skeleton variant="text" className="w-1/3" />
        </div>
      </div>
      <Skeleton variant="text" className="w-full" />
      <Skeleton variant="text" className="w-4/5" />
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="card p-5 space-y-3 animate-fadeIn">
      <div className="flex items-center justify-between">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <Skeleton variant="text" className="w-12" />
      </div>
      <Skeleton variant="heading" className="w-20" />
      <Skeleton variant="text" className="w-24" />
      <Skeleton className="w-20 h-8 rounded" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex gap-4 items-center py-3">
      <Skeleton variant="circle" className="w-8 h-8 shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" className="w-1/3" />
        <Skeleton variant="text" className="w-1/4" />
      </div>
      <Skeleton variant="text" className="w-16 shrink-0" />
    </div>
  );
}
