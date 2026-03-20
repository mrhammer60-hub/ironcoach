import { emailLayout, ctaButton, heading, paragraph, mutedText } from "../email-layout";

export function inviteTrainee(props: { coachName: string; inviteUrl: string }) {
  return {
    subject: `دعوة للانضمام إلى ${props.coachName} على IronCoach`,
    html: emailLayout(`
      ${heading("دعوة للانضمام كمتدرب")}
      ${paragraph(`دعاك <strong>${props.coachName}</strong> للانضمام كمتدرب على IronCoach.`)}
      ${ctaButton("قبول الدعوة", props.inviteUrl)}
      ${mutedText("هذه الدعوة صالحة لمدة 7 أيام.")}
    `),
  };
}
