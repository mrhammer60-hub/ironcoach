import { emailLayout, heading, paragraph, mutedText, COLORS } from "../email-layout";

export function accountSuspended(props: { firstName: string; reason?: string }) {
  return {
    subject: "تم تعليق حسابك على IronCoach",
    html: emailLayout(`
      ${heading("تم تعليق حسابك")}
      ${paragraph(`مرحباً ${props.firstName}، تم تعليق حسابك على IronCoach.`)}
      ${props.reason ? `<p style="margin:12px 0;padding:12px;background:rgba(255,79,123,0.1);border-radius:8px;color:${COLORS.danger};font-size:14px;">السبب: ${props.reason}</p>` : ""}
      ${paragraph("لن يتمكن متدربوك من الوصول حتى يتم رفع التعليق.")}
      ${mutedText("للاستفسار: support@ironcoach.com")}
    `),
  };
}
