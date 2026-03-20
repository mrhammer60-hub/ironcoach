"use client";

import { useState, useEffect, createContext, useContext, useCallback } from "react";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((type: ToastType, message: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const STYLES: Record<ToastType, string> = {
    success: "bg-[var(--success-muted)] text-[var(--success)] border-[var(--success)]",
    error: "bg-[var(--error-muted)] text-[var(--error)] border-[var(--error)]",
    info: "bg-[var(--info-muted)] text-[var(--info)] border-[var(--info)]",
    warning: "bg-[var(--warning-muted)] text-[var(--warning)] border-[var(--warning)]",
  };

  const ICONS: Record<ToastType, string> = { success: "✅", error: "❌", info: "ℹ️", warning: "⚠️" };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 end-4 z-[100] flex flex-col gap-2 pointer-events-none" aria-live="polite" aria-atomic="true" role="status">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-[10px] border text-[13px] font-medium shadow-lg animate-slideIn max-w-sm ${STYLES[t.type]}`}
          >
            <span>{ICONS[t.type]}</span>
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              className="opacity-60 hover:opacity-100 text-current"
            >✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
