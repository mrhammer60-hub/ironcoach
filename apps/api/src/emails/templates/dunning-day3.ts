import { emailLayout, ctaButton, heading, paragraph } from "../email-layout";

export function dunningDay3(props: { firstName: string; billingUrl: string }) {
  return {
    subject: "تذكير: تجديد اشتراكك IronCoach",
    html: emailLayout(`
      ${heading("تذكير بتحديث بيانات الدفع")}
      ${paragraph(`مرحباً ${props.firstName}، لا يزال اشتراكك معلقاً بسبب مشكلة في الدفع.`)}
      ${paragraph("متبقي 4 أيام قبل إيقاف الوصول.")}
      ${ctaButton("تحديث بيانات الدفع", props.billingUrl)}
    `),
  };
}
