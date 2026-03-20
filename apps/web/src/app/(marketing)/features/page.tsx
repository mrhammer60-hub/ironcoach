import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "المميزات | IronCoach" };
export const dynamic = "force-static";

const FEATURES = [
  { icon: "💪", title: "باني البرامج التدريبية", desc: "ابنِ برامج أسبوعية مع سحب وإفلات. مكتبة 80+ تمرين جاهزة مع شرح بالعربي والإنجليزي. انسخ قوالب جاهزة وعدّلها." },
  { icon: "🥗", title: "خطط التغذية", desc: "حاسبة سعرات تلقائية (Mifflin-St Jeor). بناء وجبات مع قاعدة بيانات 50+ طعام. ماكرو تلقائي لكل وجبة." },
  { icon: "📈", title: "تتبع التقدم", desc: "قياسات أسبوعية مع رسوم بيانية. صور تقدم (أمامية/جانبية/خلفية). أرقام قياسية تلقائية." },
  { icon: "💬", title: "Chat مدمج", desc: "تواصل فوري مع متدربيك. إشعارات push. مشاركة صور وملفات." },
  { icon: "📱", title: "تطبيق المتدرب", desc: "تطبيق مخصص للمتدرب على iOS وAndroid. تسجيل التمارين مع مؤقت راحة. عرض الخطة الغذائية اليومية." },
  { icon: "💰", title: "إدارة الاشتراكات", desc: "3 خطط مرنة. Stripe مدمج. فواتير تلقائية. تنبيهات تجديد." },
];

export default function FeaturesPage() {
  return (
    <div className="py-20 px-6">
      <h1 className="text-3xl font-bold text-center mb-3">المميزات</h1>
      <p className="text-center text-[#7878a0] mb-12 max-w-lg mx-auto">
        كل الأدوات التي يحتاجها المدرب المحترف في مكان واحد
      </p>
      <div className="max-w-4xl mx-auto space-y-8">
        {FEATURES.map((f) => (
          <div key={f.title} className="flex gap-6 items-start bg-[#13131c] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-6">
            <span className="text-4xl shrink-0">{f.icon}</span>
            <div>
              <h3 className="font-bold text-[16px] mb-2">{f.title}</h3>
              <p className="text-[14px] text-[#7878a0] leading-relaxed">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="text-center mt-12">
        <Link href="/register" className="inline-flex px-8 py-3 bg-[#c8f135] text-[#0d0d12] rounded-[9px] font-bold text-[15px]">
          ابدأ مجاناً
        </Link>
      </div>
    </div>
  );
}
