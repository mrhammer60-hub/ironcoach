"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, Button, Input } from "@/components/ui";
import { authApi } from "../../../../lib/api";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/components/shared/Toast";

export default function AcceptInvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const { lang } = useTranslation();
  const { toast } = useToast();
  const isAr = lang === "ar";

  const [form, setForm] = useState({ firstName: "", lastName: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const u = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { setError(isAr ? "رابط الدعوة غير صالح" : "Invalid invite link"); return; }
    setError("");
    setLoading(true);

    try {
      await authApi.acceptInvite({ token, password: form.password, firstName: form.firstName, lastName: form.lastName });
      toast("success", isAr ? "تم قبول الدعوة بنجاح!" : "Invite accepted!");
      router.push("/trainee/onboarding");
    } catch (err: any) {
      setError(err?.error?.message || (isAr ? "فشل قبول الدعوة" : "Failed to accept invite"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-sm p-8">
        <div className="text-center mb-6">
          <h1 className="text-[22px] font-bold"><span className="text-[var(--accent)]">IRON</span>COACH</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">{isAr ? "قبول الدعوة" : "Accept Invite"}</p>
        </div>

        {!token ? (
          <div className="text-center py-4">
            <p className="text-[var(--error)] text-[13px]">{isAr ? "رابط الدعوة غير صالح أو منتهي الصلاحية" : "Invalid or expired invite link"}</p>
            <a href="/login" className="text-[var(--accent)] text-[12px] mt-2 block">{isAr ? "تسجيل الدخول" : "Login"}</a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label={isAr ? "الاسم الأول" : "First Name"} value={form.firstName} onChange={e => u("firstName", e.target.value)} required />
              <Input label={isAr ? "اسم العائلة" : "Last Name"} value={form.lastName} onChange={e => u("lastName", e.target.value)} required />
            </div>
            <Input label={isAr ? "كلمة المرور" : "Password"} type="password" value={form.password} onChange={e => u("password", e.target.value)} hint={isAr ? "8 أحرف على الأقل، حرف كبير ورقم" : "8+ chars, uppercase + digit"} required />
            {error && <p className="text-[var(--error)] text-[13px] text-center">{error}</p>}
            <Button type="submit" loading={loading} className="w-full">{isAr ? "قبول الدعوة" : "Accept Invite"} →</Button>
          </form>
        )}
      </Card>
    </div>
  );
}
