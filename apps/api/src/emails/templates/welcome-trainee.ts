import { emailLayout, ctaButton, heading, paragraph } from "../email-layout";

export function welcomeTrainee(props: { firstName: string; coachName: string; signupUrl: string }) {
  return {
    subject: "وصلتك دعوة من مدربك على IronCoach 💪",
    html: emailLayout(`
      ${heading(`أهلاً ${props.firstName}!`)}
      ${paragraph(`دعاك المدرب <strong>${props.coachName}</strong> للانضمام إلى IronCoach.`)}
      ${ctaButton("اكمل تسجيلك", props.signupUrl)}
      ${paragraph("ما يمكنك فعله:")}
      ${paragraph("💪 تمارين مخصصة لك")}
      ${paragraph("🥗 خطط تغذية دقيقة")}
      ${paragraph("💬 تواصل مباشر مع مدربك")}
    `),
  };
}
