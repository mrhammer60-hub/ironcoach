import Link from "next/link";

export default function BillingSuccessPage() {
  return (
    <div className="py-20 px-6 text-center">
      <div className="text-6xl mb-6">🎉</div>
      <h1 className="text-2xl font-bold mb-3">مرحباً بك في IronCoach!</h1>
      <p className="text-[#7878a0] text-sm mb-8 max-w-md mx-auto">
        اشتراكك فعّال. ابدأ بإضافة متدربيك الآن وبناء برامجهم.
      </p>
      <Link
        href="/coach/dashboard"
        className="inline-flex px-6 py-3 bg-[#c8f135] text-[#0d0d12] rounded-[9px] font-bold text-[15px]"
      >
        اذهب للوحة التحكم ←
      </Link>
    </div>
  );
}
