import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "IronCoach — منصة التدريب الرياضي الاحترافية",
  description: "أدر متدربيك، ابنِ برامجهم، وتابع تقدمهم — منصة التدريب العربية الأولى لمدربي اللياقة البدنية",
  keywords: ["تدريب رياضي", "كوتش", "لياقة بدنية", "fitness coach", "gym management"],
  openGraph: {
    title: "IronCoach",
    description: "منصة التدريب الرياضي الاحترافية",
    type: "website",
    locale: "ar_SA",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const lang = cookieStore.get("ironcoach_lang")?.value || "ar";
  const theme = cookieStore.get("ironcoach_theme")?.value || "dark";
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <html lang={lang} dir={dir} data-theme={theme} suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Syne:wght@700;800&family=Tajawal:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[var(--bg-base)] text-[var(--text-primary)] antialiased min-h-screen transition-colors duration-200">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
