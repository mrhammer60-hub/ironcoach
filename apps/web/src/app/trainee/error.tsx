"use client";

import { useTranslation } from "@/hooks/useTranslation";

export default function TraineeError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const { t, lang } = useTranslation();
  const isAr = lang === "ar";

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="text-center max-w-sm">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-base font-bold mb-2">
          {isAr ? "خطأ في تحميل البيانات" : "Error loading data"}
        </h2>
        <p className="text-[var(--text-muted)] text-sm mb-4">{error.message}</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-[var(--accent)] text-[var(--accent-text)] rounded-[9px] font-semibold text-sm"
        >
          {t("common.retry")}
        </button>
      </div>
    </div>
  );
}
