import React, { useEffect, useCallback } from "react";
import { cn } from "../utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative bg-[#13131c] border border-[rgba(255,255,255,0.08)] rounded-[16px] p-6 w-full max-w-md mx-4 shadow-2xl",
          className,
        )}
      >
        {title && (
          <h2 className="text-[16px] font-semibold text-[#e8e8f2] mb-4">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}
