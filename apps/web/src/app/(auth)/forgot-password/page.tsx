"use client";

import { useState } from "react";
import { Button, Input, Card } from "@/components/ui";
import { api } from "../../../../lib/api";
import { useTranslation } from "@/hooks/useTranslation";

export default function ForgotPasswordPage() {
  const { t, lang } = useTranslation();
  const isAr = lang === "ar";
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email }, { skipAuth: true });
      setSent(true);
    } finally { setLoading(false); }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="text-center max-w-sm p-8">
          <p className="text-4xl mb-4">📧</p>
          <h2 className="text-lg font-semibold mb-2">{t("auth.resetSent")}</h2>
          <p className="text-[var(--text-muted)] text-sm mb-4">
            {isAr ? "إذا كان البريد مسجلاً، ستصلك رسالة لإعادة التعيين" : "If the email is registered, you'll receive a reset link"}
          </p>
          <a href="/login" className="text-[var(--accent)] text-sm">{t("auth.login")}</a>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-sm p-8">
        <h1 className="text-xl font-bold text-center mb-2">{t("auth.forgotPassword")}</h1>
        <p className="text-center text-[var(--text-muted)] text-sm mb-6">
          {isAr ? "أدخل بريدك وسنرسل لك رابط إعادة التعيين" : "Enter your email for a reset link"}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t("auth.email")} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Button type="submit" loading={loading} className="w-full">
            {isAr ? "إرسال الرابط" : "Send Link"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
