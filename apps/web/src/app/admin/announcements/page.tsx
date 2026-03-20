"use client";

import { useState } from "react";
import { Button, Input } from "@ironcoach/ui";
import { api } from "../../../../lib/api";

const TARGETS = [
  { value: "all_coaches", label: "كل المدربين" },
  { value: "all_trainees", label: "كل المتدربين" },
  { value: "all_users", label: "كل المستخدمين" },
  { value: "plan_STARTER", label: "خطة Starter" },
  { value: "plan_GROWTH", label: "خطة Growth" },
  { value: "plan_PRO", label: "خطة Pro" },
];

export default function AnnouncementsPage() {
  const [form, setForm] = useState({
    target: "all_coaches",
    title: "",
    body: "",
    sendPush: true,
    sendEmail: false,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const update = (field: string, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSend = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post<any>("/admin/announcements", form);
      setResult(res.message);
      setForm({ ...form, title: "", body: "" });
    } catch (err: any) {
      setResult(`خطأ: ${err?.error?.message || "فشل الإرسال"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">إعلان جديد</h1>
      <div className="max-w-lg space-y-4">
        <div>
          <label className="text-[11.5px] font-medium text-[#7878a0] block mb-1.5">
            الجمهور المستهدف
          </label>
          <select
            value={form.target}
            onChange={(e) => update("target", e.target.value)}
            className="w-full bg-[#1a1a26] border border-[rgba(255,255,255,0.10)] rounded-[9px] px-3 py-2.5 text-[13px] text-[#e8e8f2] outline-none"
          >
            {TARGETS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <Input label="العنوان" value={form.title} onChange={(e) => update("title", e.target.value)} />
        <div>
          <label className="text-[11.5px] font-medium text-[#7878a0] block mb-1.5">النص</label>
          <textarea
            value={form.body}
            onChange={(e) => update("body", e.target.value)}
            rows={4}
            className="w-full bg-[#1a1a26] border border-[rgba(255,255,255,0.10)] rounded-[9px] px-3 py-2.5 text-[13px] text-[#e8e8f2] outline-none resize-none"
          />
        </div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" checked={form.sendPush} onChange={(e) => update("sendPush", e.target.checked)} />
            إرسال Push
          </label>
          <label className="flex items-center gap-2 text-[13px]">
            <input type="checkbox" checked={form.sendEmail} onChange={(e) => update("sendEmail", e.target.checked)} />
            إرسال Email
          </label>
        </div>
        <Button onClick={handleSend} loading={loading} className="w-full">
          إرسال الإعلان
        </Button>
        {result && <p className="text-[13px] text-[#2de8c8] text-center">{result}</p>}
      </div>
    </div>
  );
}
