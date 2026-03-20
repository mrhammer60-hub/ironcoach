"use client";
import React, { useEffect, useId } from "react";

interface DrawerProps { open: boolean; onClose: () => void; title?: string; children: React.ReactNode; width?: string; }

export function Drawer({ open, onClose, title, children, width = "max-w-lg" }: DrawerProps) {
  const titleId = useId();
  useEffect(() => { if (open) document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined} className={`ms-auto relative bg-[var(--bg-card)] border-s border-[var(--border)] ${width} w-full h-full overflow-auto animate-slideIn`}>
        <div className="sticky top-0 bg-[var(--bg-card)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between z-10">
          {title && <h2 id={titleId} className="text-[16px] font-semibold">{title}</h2>}
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-lg">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
