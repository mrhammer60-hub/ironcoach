import Link from "next/link";

export default function BillingCancelPage() {
  return (
    <div className="py-20 px-6 text-center">
      <div className="text-6xl mb-6">😔</div>
      <h1 className="text-2xl font-bold mb-3">تم إلغاء العملية</h1>
      <p className="text-[#7878a0] text-sm mb-8 max-w-md mx-auto">
        لم يتم خصم أي مبلغ. يمكنك المحاولة مرة أخرى في أي وقت.
      </p>
      <Link
        href="/pricing"
        className="inline-flex px-6 py-3 border border-[rgba(255,255,255,0.10)] text-[#7878a0] rounded-[9px] text-[15px] hover:bg-[#1c1c28]"
      >
        العودة للأسعار
      </Link>
    </div>
  );
}
