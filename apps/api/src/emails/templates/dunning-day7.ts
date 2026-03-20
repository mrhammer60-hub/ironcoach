import { emailLayout, ctaButton, heading, paragraph, COLORS } from "../email-layout";

export function dunningDay7(props: { firstName: string; billingUrl: string }) {
  return {
    subject: "🚨 سيُوقف حسابك غداً — IronCoach",
    html: emailLayout(`
      ${heading("تنبيه عاجل: سيُوقف حسابك غداً")}
      <p style="margin:12px 0;padding:16px;background:rgba(255,79,123,0.15);border:1px solid rgba(255,79,123,0.3);border-radius:8px;color:${COLORS.danger};font-size:15px;font-weight:600;">
        سيُوقف وصولك ومتدربيك غداً إذا لم تُحدّث بيانات الدفع.
      </p>
      ${paragraph(`${props.firstName}، يرجى تحديث بيانات الدفع فوراً للحفاظ على حسابك.`)}
      ${ctaButton("تحديث الدفع الآن", props.billingUrl)}
    `),
  };
}
