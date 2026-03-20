"use client";

import Link from "next/link";
import { useBrand } from "../../../../components/branded/brand-provider";

export default function BrandedLandingPage() {
  const brand = useBrand();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        {brand.logoUrl ? (
          <img
            src={brand.logoUrl}
            alt={brand.orgName}
            className="w-16 h-16 rounded-full mx-auto mb-4 object-cover"
          />
        ) : (
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold"
            style={{ backgroundColor: brand.brandColor, color: "#0d0d12" }}
          >
            {brand.orgName[0]}
          </div>
        )}

        <h1 className="text-2xl font-bold mb-2">
          مرحباً في {brand.orgName}
        </h1>
        <p className="text-[#7878a0] text-sm mb-8">
          منصة التدريب الاحترافية
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="w-full py-3 rounded-[9px] font-semibold text-[14px] text-center"
            style={{ backgroundColor: brand.brandColor, color: "#0d0d12" }}
          >
            تسجيل الدخول
          </Link>
          <Link
            href="/accept-invite"
            className="w-full py-3 border border-[rgba(255,255,255,0.10)] text-[#7878a0] rounded-[9px] text-[14px] text-center hover:bg-[#1c1c28] transition-colors"
          >
            لدي دعوة
          </Link>
        </div>

        <p className="text-[11px] text-[#4a4a6a] mt-8">
          Powered by{" "}
          <a href="https://ironcoach.com" className="text-[#c8f135]">
            IronCoach
          </a>
        </p>
      </div>
    </div>
  );
}
