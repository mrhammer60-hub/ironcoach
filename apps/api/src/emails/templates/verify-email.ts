import { emailLayout, ctaButton, heading, paragraph, mutedText } from "../email-layout";

export function verifyEmail(props: { firstName: string; verifyUrl: string }) {
  return {
    subject: "تأكيد بريدك الإلكتروني — IronCoach",
    html: emailLayout(`
      ${heading("تأكيد البريد الإلكتروني")}
      ${paragraph(`مرحباً ${props.firstName}، يرجى تأكيد بريدك الإلكتروني.`)}
      ${ctaButton("تأكيد البريد", props.verifyUrl)}
      ${mutedText("هذا الرابط صالح لمدة 24 ساعة.")}
    `),
  };
}
