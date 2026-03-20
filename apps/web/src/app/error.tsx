"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0d0d12] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-6">⚠️</div>
        <h1 className="text-xl font-bold text-[#e8e8f2] mb-3">
          حدث خطأ غير متوقع
        </h1>
        <p className="text-[#7878a0] text-sm mb-6 leading-relaxed">
          نعتذر عن هذا الخطأ. تم إبلاغ الفريق التقني تلقائياً.
          {error.digest && (
            <span className="block mt-2 font-mono text-xs text-[#4a4a6a]">
              رمز الخطأ: {error.digest}
            </span>
          )}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-[#c8f135] text-[#0d0d12] rounded-[9px] font-semibold text-sm"
          >
            إعادة المحاولة
          </button>
          <a
            href="/"
            className="px-4 py-2 border border-[rgba(255,255,255,0.10)] text-[#7878a0] rounded-[9px] text-sm"
          >
            الصفحة الرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}
