import { emailLayout, ctaButton, heading, paragraph } from "../email-layout";

export function welcomeCoach(props: { firstName: string; dashboardUrl: string }) {
  return {
    subject: "مرحباً بك في IronCoach 🏋️ — ابدأ رحلتك الاحترافية",
    html: emailLayout(`
      ${heading(`أهلاً ${props.firstName}، حساب مدربك جاهز!`)}
      ${paragraph("مرحباً بك في IronCoach — منصتك لإدارة متدربيك باحترافية.")}
      ${ctaButton("ادخل للوحة التحكم", props.dashboardUrl)}
      ${paragraph("<strong>ابدأ بثلاث خطوات:</strong>")}
      ${paragraph("1️⃣ أضف متدربيك عبر الدعوات")}
      ${paragraph("2️⃣ ابنِ برامج التدريب والتغذية")}
      ${paragraph("3️⃣ تابع تقدمهم أسبوعياً")}
    `),
  };
}
