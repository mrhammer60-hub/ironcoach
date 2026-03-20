import React from "react";
import { cn } from "../utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("bg-[#1a1a26] rounded-[9px] animate-pulse", className)}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-[#13131c] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-5">
      <Skeleton className="h-4 w-32 mb-4" />
      <Skeleton className="h-8 w-20 mb-2" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

export function SkeletonTableRow() {
  return (
    <tr>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-32" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-5 w-16 rounded-full" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-2 w-20 rounded-full" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-4 w-24" />
      </td>
    </tr>
  );
}
