import { emailLayout, ctaButton, heading, paragraph } from "../email-layout";

export function subscriptionExpiring(props: {
  firstName: string;
  expiryDate: string;
  renewUrl: string;
}) {
  return {
    subject: "اشتراكك ينتهي خلال 3 أيام — IronCoach",
    html: emailLayout(`
      ${heading("اشتراكك ينتهي قريباً")}
      ${paragraph(`مرحباً ${props.firstName}، اشتراكك ينتهي في <strong>${props.expiryDate}</strong>.`)}
      ${paragraph("جدّد الآن للحفاظ على وصولك ومتدربيك.")}
      ${ctaButton("تجديد الاشتراك", props.renewUrl)}
    `),
  };
}
