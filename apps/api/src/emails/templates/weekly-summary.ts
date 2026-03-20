import { emailLayout, ctaButton, heading, paragraph, mutedText } from "../email-layout";

export function weeklySummary(props: {
  firstName: string;
  completedSessions: number;
  expectedSessions: number;
  inactiveTrainees: string[];
  pendingCheckins: number;
  dashboardUrl: string;
}) {
  const inactiveList = props.inactiveTrainees.length > 0
    ? props.inactiveTrainees.map((name) => `• ${name}`).join("<br/>")
    : "لا يوجد — ممتاز! 🎉";

  return {
    subject: "ملخص أسبوعك — IronCoach 📊",
    html: emailLayout(`
      ${heading(`ملخص أسبوعك، ${props.firstName}`)}
      ${paragraph(`✅ الجلسات المكتملة: <strong>${props.completedSessions}</strong> من ${props.expectedSessions}`)}
      ${paragraph(`📋 تسجيلات وصول تنتظر المراجعة: <strong>${props.pendingCheckins}</strong>`)}
      ${paragraph("<strong>المتدربون غير النشطين (4+ أيام):</strong>")}
      ${paragraph(inactiveList)}
      ${ctaButton("اذهب للوحة التحكم", props.dashboardUrl)}
    `),
  };
}
