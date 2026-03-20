import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IronCoach — منصة التدريب الاحترافية",
  description:
    "منصة SaaS للمدربين الرياضيين — بناء برامج، خطط تغذية، وتتبع تقدم المتدربين.",
};

export const dynamic = "force-static";

const STATS = [
  { value: "+500", label: "مدرب نشط" },
  { value: "+12,000", label: "متدرب" },
  { value: "4.9★", label: "تقييم" },
];

const FEATURES = [
  { icon: "💪", title: "بناء البرامج", desc: "باني سحب وإفلات · مكتبة 80+ تمرين" },
  { icon: "🥗", title: "خطط التغذية", desc: "ماكرو تلقائي · 5 وجبات يومية" },
  { icon: "📈", title: "تتبع التقدم", desc: "رسوم بيانية · قياسات أسبوعية" },
  { icon: "💬", title: "تواصل مباشر", desc: "Chat فوري · إشعارات فورية" },
  { icon: "📱", title: "تطبيق للمتدرب", desc: "iOS & Android · دعم Offline" },
  { icon: "⚡", title: "توفير الوقت", desc: "80% أقل وقت إداري" },
];

const STEPS = [
  { num: "1", title: "سجّل واختر خطتك", desc: "في أقل من 5 دقائق" },
  { num: "2", title: "أضف متدربيك وابنِ برامجهم", desc: "مكتبة تمارين جاهزة وبناء سهل" },
  { num: "3", title: "تابع وتواصل", desc: "تقارير تلقائية وchat مدمج" },
];

const TESTIMONIALS = [
  { quote: "IronCoach وفّر عليّ 10 ساعات أسبوعياً", name: "أحمد", location: "مدرب في الرياض", trainees: 45 },
  { quote: "أخيراً منصة عربية احترافية", name: "سارة", location: "مدربة في دبي", trainees: 28 },
  { quote: "متدربيني أكثر التزاماً منذ استخدمت IronCoach", name: "خالد", location: "مدرب في الكويت", trainees: 60 },
];

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="py-24 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
          منصة التدريب الاحترافية
          <br />
          <span className="text-[#c8f135]">للمدربين المميزين</span>
        </h1>
        <p className="text-[#7878a0] text-lg max-w-xl mx-auto mb-8 leading-relaxed">
          أدِر متدربيك، ابنِ برامجهم، وتابع تقدمهم — كل شيء في مكان واحد.
        </p>
        <div className="flex gap-3 justify-center mb-6">
          <Link
            href="/register"
            className="px-6 py-3 bg-[#c8f135] text-[#0d0d12] rounded-[9px] font-bold text-[15px] hover:bg-[#d4ff40] transition-colors"
          >
            ابدأ مجاناً
          </Link>
          <Link
            href="/features"
            className="px-6 py-3 border border-[rgba(255,255,255,0.10)] text-[#7878a0] rounded-[9px] text-[15px] hover:bg-[#1c1c28] transition-colors"
          >
            شاهد كيف يعمل
          </Link>
        </div>
        <div className="flex gap-6 justify-center text-[13px] text-[#4a4a6a]">
          <span>✓ لا يوجد بطاقة ائتمان</span>
          <span>✓ إلغاء في أي وقت</span>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-[rgba(255,255,255,0.06)] py-6">
        <div className="max-w-4xl mx-auto flex justify-around">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl font-bold text-[#c8f135]">{s.value}</p>
              <p className="text-[12px] text-[#7878a0]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <h2 className="text-2xl font-bold text-center mb-12">
          كل ما يحتاجه المدرب المحترف
        </h2>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-[#13131c] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-6 hover:border-[rgba(200,241,53,0.2)] transition-colors"
            >
              <span className="text-3xl mb-3 block">{f.icon}</span>
              <h3 className="font-semibold text-[15px] mb-2">{f.title}</h3>
              <p className="text-[13px] text-[#7878a0] leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-[#0a0a14]">
        <h2 className="text-2xl font-bold text-center mb-12">
          كيف يعمل؟
        </h2>
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row gap-8 justify-center">
          {STEPS.map((s) => (
            <div key={s.num} className="flex-1 text-center">
              <div className="w-12 h-12 rounded-full bg-[rgba(200,241,53,0.1)] text-[#c8f135] text-xl font-bold flex items-center justify-center mx-auto mb-4">
                {s.num}
              </div>
              <h3 className="font-semibold text-[15px] mb-2">{s.title}</h3>
              <p className="text-[13px] text-[#7878a0]">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6">
        <h2 className="text-2xl font-bold text-center mb-12">
          ماذا يقول المدربون؟
        </h2>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="bg-[#13131c] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-6"
            >
              <p className="text-[14px] mb-4 leading-relaxed">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="text-[12px] text-[#7878a0]">
                <p className="font-semibold text-[#e8e8f2]">{t.name}</p>
                <p>
                  {t.location} · {t.trainees} متدرب
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-lg mx-auto bg-[#13131c] border border-[rgba(200,241,53,0.2)] rounded-[20px] p-10">
          <h2 className="text-2xl font-bold mb-3">
            ابدأ رحلتك المهنية اليوم
          </h2>
          <p className="text-[#7878a0] text-sm mb-6">
            جرّب IronCoach مجاناً لـ 14 يوم — لا حاجة لبطاقة ائتمان
          </p>
          <Link
            href="/register"
            className="inline-flex px-8 py-3 bg-[#c8f135] text-[#0d0d12] rounded-[9px] font-bold text-[15px] hover:bg-[#d4ff40] transition-colors"
          >
            ابدأ مجاناً الآن
          </Link>
        </div>
      </section>
    </div>
  );
}
