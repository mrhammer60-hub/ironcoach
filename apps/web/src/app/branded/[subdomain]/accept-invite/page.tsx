"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@ironcoach/ui";
import { authApi } from "../../../../../lib/api";
import { useBrand } from "../../../../../components/branded/brand-provider";

export default function BrandedAcceptInvitePage() {
  const brand = useBrand();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("رابط الدعوة غير صالح");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await authApi.acceptInvite({
        token,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
      });
      document.cookie = `ironcoach_access=${result.accessToken};path=/;max-age=${15 * 60}`;
      router.push("/trainee/today");
    } catch (err: any) {
      setError(err?.error?.message || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1
          className="text-2xl font-bold text-center mb-2"
          style={{ color: brand.brandColor }}
        >
          {brand.orgName}
        </h1>
        <p className="text-center text-[#7878a0] text-sm mb-8">
          قبول الدعوة وإنشاء حسابك
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="الاسم الأول"
              value={form.firstName}
              onChange={(e) => update("firstName", e.target.value)}
              required
            />
            <Input
              label="اسم العائلة"
              value={form.lastName}
              onChange={(e) => update("lastName", e.target.value)}
              required
            />
          </div>
          <Input
            label="كلمة المرور"
            type="password"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            hint="8 أحرف على الأقل، حرف كبير ورقم"
            required
          />

          {error && (
            <p className="text-[#ff4f7b] text-[13px] text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-[9px] font-semibold text-[14px] disabled:opacity-50"
            style={{ backgroundColor: brand.brandColor, color: "#0d0d12" }}
          >
            {loading ? "جاري التحميل..." : "قبول الدعوة"}
          </button>
        </form>
      </div>
    </div>
  );
}
