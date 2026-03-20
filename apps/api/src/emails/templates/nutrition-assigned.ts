import { emailLayout, ctaButton, heading, paragraph } from "../email-layout";

export function nutritionAssigned(props: {
  firstName: string;
  planTitle: string;
  calories: number;
  viewUrl: string;
}) {
  return {
    subject: "وصلتك خطة غذائية جديدة 🥗",
    html: emailLayout(`
      ${heading("خطة غذائية جديدة!")}
      ${paragraph(`مرحباً ${props.firstName}، وصلتك خطة غذائية جديدة.`)}
      ${paragraph(`🥗 الخطة: <strong>${props.planTitle}</strong>`)}
      ${paragraph(`🔥 السعرات المستهدفة: ${props.calories} سعرة/يوم`)}
      ${ctaButton("عرض الخطة", props.viewUrl)}
    `),
  };
}
