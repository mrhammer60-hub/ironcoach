const COLORS = {
  primary: "#c8f135",
  background: "#0d0d12",
  surface: "#13131c",
  text: "#e8e8f2",
  textMuted: "#7878a0",
  danger: "#ff4f7b",
  success: "#2de8c8",
};

const FONT =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export function emailLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background-color:${COLORS.background};font-family:${FONT};direction:rtl;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.background};">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:${COLORS.surface};border-radius:16px;overflow:hidden;">
        <!-- Logo -->
        <tr><td style="padding:32px 32px 16px;text-align:center;">
          <span style="font-size:24px;font-weight:700;color:${COLORS.primary};">IronCoach</span>
        </td></tr>
        <!-- Content -->
        <tr><td style="padding:0 32px 32px;color:${COLORS.text};font-size:15px;line-height:1.7;">
          ${content}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
          <p style="margin:0;font-size:12px;color:${COLORS.textMuted};">
            IronCoach — منصة التدريب الاحترافية
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function ctaButton(text: string, url: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr><td align="center">
      <a href="${url}" style="display:inline-block;padding:12px 32px;background-color:${COLORS.primary};color:#0d0d12;font-weight:700;font-size:15px;text-decoration:none;border-radius:9px;">
        ${text}
      </a>
    </td></tr>
  </table>`;
}

export function heading(text: string): string {
  return `<h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:${COLORS.text};">${text}</h2>`;
}

export function paragraph(text: string): string {
  return `<p style="margin:0 0 12px;color:${COLORS.text};font-size:15px;line-height:1.7;">${text}</p>`;
}

export function mutedText(text: string): string {
  return `<p style="margin:0 0 12px;color:${COLORS.textMuted};font-size:13px;">${text}</p>`;
}

export { COLORS };
