"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@ironcoach/ui";
import { authApi } from "../../../../../lib/api";
import { useBrand } from "../../../../../components/branded/brand-provider";

export default function BrandedLoginPage() {
  const brand = useBrand();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await authApi.login({ email, password });
      document.cookie = `ironcoach_access=${result.accessToken};path=/;max-age=${15 * 60}`;
      router.push("/trainee/today");
    } catch (err: any) {
      setError(err?.error?.message || "بيانات الدخول غير صحيحة");
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
          تسجيل الدخول
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="البريد الإلكتروني"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="كلمة المرور"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            {loading ? "جاري التحميل..." : "تسجيل الدخول"}
          </button>
        </form>
      </div>
    </div>
  );
}
