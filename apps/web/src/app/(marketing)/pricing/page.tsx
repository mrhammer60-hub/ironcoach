"use client";

import { useState } from "react";
import Link from "next/link";

const PLANS = [
  {
    name: "Starter",
    nameAr: "المبتدئ",
    monthly: 60,
    yearly: 50,
    trainees: 20,
    features: ["20 متدرب نشط", "باني برامج التدريب", "خطط التغذية", "تتبع التقدم", "Chat مع المتدربين"],
    popular: false,
  },
  {
    name: "Growth",
    nameAr: "النمو",
    monthly: 100,
    yearly: 83,
    trainees: 50,
    features: ["كل ما في Starter", "50 متدرب نشط", "تحليلات متقدمة", "قوالب وجبات مخصصة", "دعم أولوية", "تقارير PDF"],
    popular: true,
  },
  {
    name: "Pro",
    nameAr: "الاحترافي",
    monthly: 200,
    yearly: 167,
    trainees: 150,
    features: ["كل ما في Growth", "150 متدرب نشط", "White-label كامل", "وصول API", "مدربون مساعدون", "دعم مخصص"],
    popular: false,
  },
];

const FAQ = [
  { q: "هل يوجد نسخة تجريبية مجانية؟", a: "نعم، 14 يوم مجاناً بدون بطاقة ائتمان." },
  { q: "هل يمكنني تغيير الخطة لاحقاً؟", a: "نعم، في أي وقت مع حساب فرق التكلفة تلقائياً." },
  { q: "هل البيانات محفوظة عند إلغاء الاشتراك؟", a: "نعم، لمدة 30 يوم بعد الإلغاء." },
  { q: "هل التطبيق متاح بالعربية؟", a: "نعم، عربي وإنجليزي بدعم كامل لـ RTL." },
];

export default function PricingPage() {
  const [yearly, setYearly] = useState(false);

  return (
    <div className="py-20 px-6">
      <h1 className="text-3xl font-bold text-center mb-3">الأسعار</h1>
      <p className="text-center text-[#7878a0] mb-8">اختر الخطة المناسبة لحجم عملك</p>

      {/* Toggle */}
      <div className="flex items-center justify-center gap-3 mb-12">
        <span className={`text-sm ${!yearly ? "text-[#e8e8f2]" : "text-[#7878a0]"}`}>شهري</span>
        <button
          onClick={() => setYearly(!yearly)}
          className={`w-12 h-6 rounded-full relative transition-colors ${yearly ? "bg-[#c8f135]" : "bg-[#1c1c28]"}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${yearly ? "right-0.5" : "right-6"}`} />
        </button>
        <span className={`text-sm ${yearly ? "text-[#e8e8f2]" : "text-[#7878a0]"}`}>
          سنوي <span className="text-[#c8f135] text-[11px]">وفّر 20%</span>
        </span>
      </div>

      {/* Plans */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`bg-[#13131c] rounded-[16px] p-6 relative ${
              plan.popular
                ? "border-2 border-[#c8f135]"
                : "border border-[rgba(255,255,255,0.06)]"
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#c8f135] text-[#0d0d12] text-[11px] font-bold rounded-full">
                الأكثر شعبية
              </span>
            )}
            <h3 className="text-lg font-bold mb-1">{plan.nameAr}</h3>
            <p className="text-[12px] text-[#7878a0] mb-4">{plan.name}</p>
            <div className="mb-6">
              <span className="text-3xl font-bold">${yearly ? plan.yearly : plan.monthly}</span>
              <span className="text-[#7878a0] text-sm">/شهر</span>
            </div>
            <ul className="space-y-2.5 mb-6">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-[13px]">
                  <span className="text-[#c8f135] mt-0.5">✓</span>
                  <span className="text-[#b0b0c8]">{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className={`block text-center py-2.5 rounded-[9px] font-semibold text-[14px] transition-colors ${
                plan.popular
                  ? "bg-[#c8f135] text-[#0d0d12] hover:bg-[#d4ff40]"
                  : "border border-[rgba(255,255,255,0.10)] text-[#7878a0] hover:bg-[#1c1c28]"
              }`}
            >
              ابدأ بـ {plan.nameAr}
            </Link>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto mt-20">
        <h2 className="text-xl font-bold text-center mb-8">الأسئلة الشائعة</h2>
        <div className="space-y-4">
          {FAQ.map((item) => (
            <div
              key={item.q}
              className="bg-[#13131c] border border-[rgba(255,255,255,0.06)] rounded-xl p-4"
            >
              <h3 className="font-semibold text-[14px] mb-2">{item.q}</h3>
              <p className="text-[13px] text-[#7878a0]">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
