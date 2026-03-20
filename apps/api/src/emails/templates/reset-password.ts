import { emailLayout, ctaButton, heading, paragraph, mutedText } from "../email-layout";

export function resetPassword(props: { firstName: string; resetUrl: string }) {
  return {
    subject: "إعادة تعيين كلمة المرور — IronCoach",
    html: emailLayout(`
      ${heading("إعادة تعيين كلمة المرور")}
      ${paragraph(`مرحباً ${props.firstName}، طلبت إعادة تعيين كلمة المرور.`)}
      ${ctaButton("إعادة تعيين كلمة المرور", props.resetUrl)}
      ${mutedText("هذا الرابط صالح لمدة ساعة واحدة.")}
      ${mutedText("إذا لم تطلب هذا، تجاهل هذا الإيميل.")}
    `),
  };
}
