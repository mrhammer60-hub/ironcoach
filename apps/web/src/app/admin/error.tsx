"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="p-6 flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-sm">
        <div className="text-4xl mb-4">🔧</div>
        <h2 className="text-base font-bold mb-2">خطأ في تحميل البيانات</h2>
        <p className="text-[#7878a0] text-sm mb-4">{error.message}</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-[#c8f135] text-[#0d0d12] rounded-[9px] font-semibold text-sm"
        >
          إعادة المحاولة
        </button>
      </div>
    </div>
  );
}
