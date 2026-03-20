"use client";

import { useEffect, useId } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({ open, onClose, title, size = "md", children, footer }: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizes: Record<string, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={`pointer-events-auto w-full ${sizes[size]} bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-lg animate-scaleIn mx-4`}
        >
          <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
            <h2 id={titleId} className="text-base font-semibold">{title}</h2>
            <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors text-lg" aria-label="Close">{"\u2715"}</button>
          </div>
          <div className="p-5 max-h-[70vh] overflow-auto">{children}</div>
          {footer && <div className="flex justify-end gap-3 p-5 border-t border-[var(--border)]">{footer}</div>}
        </div>
      </div>
    </>
  );
}
