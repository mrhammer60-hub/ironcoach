import { emailLayout, ctaButton, heading, paragraph, mutedText, COLORS } from "../email-layout";

export function paymentFailed(props: { firstName: string; billingUrl: string }) {
  return {
    subject: "⚠️ فشل سداد اشتراكك — IronCoach",
    html: emailLayout(`
      ${heading("فشل سداد الاشتراك")}
      ${paragraph(`مرحباً ${props.firstName}، لم نتمكن من خصم رسوم الاشتراك.`)}
      <p style="margin:12px 0;padding:12px;background:rgba(255,79,123,0.1);border-radius:8px;color:${COLORS.danger};font-size:14px;">
        سيتوقف الوصول خلال 7 أيام إذا لم يُحل الأمر.
      </p>
      ${ctaButton("تحديث بيانات الدفع", props.billingUrl)}
    `),
  };
}
