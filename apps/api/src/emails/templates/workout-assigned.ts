import { emailLayout, ctaButton, heading, paragraph } from "../email-layout";

export function workoutAssigned(props: {
  firstName: string;
  programTitle: string;
  coachName: string;
  durationWeeks: number;
  viewUrl: string;
}) {
  return {
    subject: "وصلك برنامج تدريبي جديد 💪",
    html: emailLayout(`
      ${heading("برنامج تدريبي جديد!")}
      ${paragraph(`مرحباً ${props.firstName}، أضاف لك المدرب <strong>${props.coachName}</strong> برنامجاً جديداً.`)}
      ${paragraph(`📋 البرنامج: <strong>${props.programTitle}</strong>`)}
      ${paragraph(`📅 المدة: ${props.durationWeeks} أسابيع`)}
      ${ctaButton("عرض البرنامج", props.viewUrl)}
    `),
  };
}
