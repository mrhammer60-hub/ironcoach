import { emailLayout, ctaButton, heading, paragraph } from "../email-layout";

export function subscriptionConfirmed(props: {
  firstName: string;
  planName: string;
  price: string;
  maxTrainees: number;
  renewalDate: string;
  dashboardUrl: string;
}) {
  return {
    subject: `اشتراكك مفعّل ✅ — IronCoach ${props.planName}`,
    html: emailLayout(`
      ${heading("اشتراكك مفعّل!")}
      ${paragraph(`مرحباً ${props.firstName}، تم تفعيل خطة <strong>${props.planName}</strong> بنجاح.`)}
      ${paragraph(`💰 السعر: ${props.price}/شهر`)}
      ${paragraph(`👥 الحد الأقصى للمتدربين: ${props.maxTrainees}`)}
      ${paragraph(`📅 تاريخ التجديد التالي: ${props.renewalDate}`)}
      ${ctaButton("ابدأ الآن", props.dashboardUrl)}
      ${paragraph("يمكنك إلغاء الاشتراك في أي وقت من إعدادات الفوترة.")}
    `),
  };
}
