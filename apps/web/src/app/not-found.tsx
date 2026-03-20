export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0d0d12] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="font-[Syne] text-8xl font-bold text-[#1a1a26] mb-4 select-none">
          404
        </div>
        <h1 className="text-xl font-bold text-[#e8e8f2] mb-3">
          الصفحة غير موجودة
        </h1>
        <p className="text-[#7878a0] text-sm mb-6">
          الرابط الذي تبحث عنه غير موجود أو تم نقله.
        </p>
        <a
          href="/"
          className="inline-flex px-5 py-2.5 bg-[#c8f135] text-[#0d0d12] rounded-[9px] font-semibold text-sm"
        >
          العودة للرئيسية
        </a>
      </div>
    </div>
  );
}
