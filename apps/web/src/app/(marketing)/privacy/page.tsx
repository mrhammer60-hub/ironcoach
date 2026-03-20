import type { Metadata } from "next";

export const metadata: Metadata = { title: "سياسة الخصوصية | IronCoach" };
export const dynamic = "force-static";

export default function PrivacyPage() {
  return (
    <div className="py-20 px-6">
      <div className="max-w-2xl mx-auto prose prose-invert">
        <h1 className="text-2xl font-bold mb-6">سياسة الخصوصية</h1>
        <p className="text-[#7878a0] text-sm mb-4">
          آخر تحديث: مارس 2026
        </p>

        <h2 className="text-lg font-semibold mt-8 mb-3">البيانات التي نجمعها</h2>
        <ul className="text-[14px] text-[#b0b0c8] space-y-2 list-disc pr-5">
          <li>بيانات الحساب: الاسم، البريد الإلكتروني، رقم الهاتف</li>
          <li>بيانات اللياقة: الوزن، القياسات، صور التقدم، سجلات التمارين</li>
          <li>بيانات التغذية: سجلات الوجبات، الأهداف الغذائية</li>
          <li>بيانات الفوترة: تتم معالجتها عبر Stripe ولا نخزن بيانات البطاقة</li>
        </ul>

        <h2 className="text-lg font-semibold mt-8 mb-3">كيف نستخدم البيانات</h2>
        <ul className="text-[14px] text-[#b0b0c8] space-y-2 list-disc pr-5">
          <li>تقديم خدمة التدريب والتغذية</li>
          <li>التواصل بين المدرب والمتدرب</li>
          <li>تحسين الخدمة وتجربة المستخدم</li>
          <li>إرسال إشعارات مهمة (يمكن التحكم بها من الإعدادات)</li>
        </ul>

        <h2 className="text-lg font-semibold mt-8 mb-3">حماية البيانات</h2>
        <p className="text-[14px] text-[#b0b0c8]">
          نستخدم تشفير SSL/TLS لنقل البيانات. كلمات المرور مشفرة بـ bcrypt.
          الملفات مخزنة في Cloudflare R2 مع وصول محدود بالتوقيع.
        </p>

        <h2 className="text-lg font-semibold mt-8 mb-3">حقوقك</h2>
        <ul className="text-[14px] text-[#b0b0c8] space-y-2 list-disc pr-5">
          <li>طلب نسخة من بياناتك</li>
          <li>طلب حذف حسابك وبياناتك</li>
          <li>تعديل بياناتك الشخصية في أي وقت</li>
        </ul>

        <h2 className="text-lg font-semibold mt-8 mb-3">التواصل</h2>
        <p className="text-[14px] text-[#b0b0c8]">
          لأي استفسار حول الخصوصية:{" "}
          <a href="mailto:privacy@ironcoach.com" className="text-[#c8f135]">
            privacy@ironcoach.com
          </a>
        </p>
      </div>
    </div>
  );
}
