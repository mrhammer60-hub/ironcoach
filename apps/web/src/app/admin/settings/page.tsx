"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, Badge, Button } from "@/components/ui";
import { api } from "../../../../lib/api";
import { useTranslation } from "@/hooks/useTranslation";

const TABS = [
  { key: "system", ar: "النظام", en: "System" },
  { key: "plans", ar: "الخطط", en: "Plans" },
  { key: "payments", ar: "بوابات الدفع", en: "Payments" },
  { key: "integrations", ar: "التكاملات", en: "Integrations" },
];

export default function AdminSettingsPage() {
  const { lang } = useTranslation();
  const isAr = lang === "ar";
  const [tab, setTab] = useState("system");

  const { data: health } = useQuery({
    queryKey: ["admin", "health"],
    queryFn: () => api.get<any>("/admin/system/health"),
    refetchInterval: 30000,
  });

  return (
    <div>
      <h1 className="text-[22px] font-bold tracking-tight mb-6">{isAr ? "الإعدادات" : "Settings"}</h1>

      <div className="flex gap-1 border-b border-[var(--border)] mb-6">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors ${tab === t.key ? "border-[var(--accent)] text-[var(--accent)]" : "border-transparent text-[var(--text-muted)]"}`}>
            {isAr ? t.ar : t.en}
          </button>
        ))}
      </div>

      {/* System Health */}
      {tab === "system" && (
        <div className="space-y-4 max-w-2xl animate-fadeIn">
          <h3 className="text-[15px] font-semibold mb-4">{isAr ? "حالة الخدمات" : "Service Status"}</h3>
          <ServiceCard name={isAr ? "قاعدة البيانات" : "Database"} detail="PostgreSQL" status={health?.postgres} />
          <ServiceCard name="Redis" detail="Cache & Queues" status={health?.redis} />
          <ServiceCard name={isAr ? "خادم API" : "API Server"} detail="Port 3001" status="ok" />
          <ServiceCard name="Stripe" detail={isAr ? "بوابة الدفع" : "Payment Gateway"} status={health?.stripe} />
          <ServiceCard name={isAr ? "البريد الإلكتروني" : "Email"} detail="Resend" status={undefined} warning={isAr ? "غير مُهيأ" : "Not configured"} />
          <ServiceCard name={isAr ? "التخزين" : "Storage"} detail="Cloudflare R2" status={undefined} warning={isAr ? "غير مُهيأ" : "Not configured"} />
        </div>
      )}

      {/* Plans */}
      {tab === "plans" && (
        <div className="grid grid-cols-3 gap-4 animate-fadeIn">
          <PlanCard name="Starter" nameAr="المبتدئ" price={60} trainees={20} color="var(--info)" isAr={isAr} />
          <PlanCard name="Growth" nameAr="النمو" price={100} trainees={50} color="var(--accent)" featured isAr={isAr} />
          <PlanCard name="Pro" nameAr="الاحترافي" price={200} trainees={150} color="var(--warning)" isAr={isAr} />
        </div>
      )}

      {/* Payments */}
      {tab === "payments" && (
        <div className="space-y-4 max-w-2xl animate-fadeIn">
          <Card className="flex items-center gap-4">
            <span className="text-3xl">💳</span>
            <div className="flex-1">
              <div className="flex items-center gap-2"><h4 className="font-semibold">Stripe</h4><Badge variant="success">{isAr ? "نشط" : "Active"}</Badge></div>
              <p className="text-[12px] text-[var(--text-muted)] mt-1">sk_test_****</p>
            </div>
            <Badge variant="warning">{isAr ? "وضع الاختبار" : "Test Mode"}</Badge>
          </Card>
          <Card className="flex items-center gap-4 opacity-60">
            <span className="text-3xl">🍎</span>
            <div className="flex-1"><h4 className="font-semibold">Apple Pay</h4><p className="text-[12px] text-[var(--text-muted)]">{isAr ? "مدعوم عبر Stripe" : "Via Stripe"}</p></div>
            <Badge variant="muted">{isAr ? "قريباً" : "Coming Soon"}</Badge>
          </Card>
          <Card className="flex items-center gap-4 opacity-60">
            <span className="text-3xl">🏦</span>
            <div className="flex-1"><h4 className="font-semibold">MADA / STC Pay</h4><p className="text-[12px] text-[var(--text-muted)]">{isAr ? "بوابات الدفع السعودية" : "Saudi payment gateways"}</p></div>
            <Badge variant="muted">{isAr ? "قريباً" : "Coming Soon"}</Badge>
          </Card>
        </div>
      )}

      {/* Integrations */}
      {tab === "integrations" && (
        <div className="space-y-4 max-w-2xl animate-fadeIn">
          <Card className="flex items-center gap-4">
            <span className="text-3xl">🍎</span>
            <div className="flex-1"><h4 className="font-semibold">USDA FoodData Central</h4><p className="text-[12px] text-[var(--text-muted)]">{isAr ? "قاعدة بيانات الأطعمة — 1M+ طعام" : "Food database — 1M+ foods"}</p></div>
            <Badge variant="success">{isAr ? "مُفعّل" : "Active"}</Badge>
          </Card>
          <Card className="flex items-center gap-4">
            <span className="text-3xl">📧</span>
            <div className="flex-1"><h4 className="font-semibold">Resend (Email)</h4><p className="text-[12px] text-[var(--text-muted)]">{isAr ? "إرسال البريد الإلكتروني" : "Email delivery"}</p></div>
            <Badge variant="warning">{isAr ? "غير مُهيأ" : "Not Configured"}</Badge>
          </Card>
          <Card className="flex items-center gap-4">
            <span className="text-3xl">📱</span>
            <div className="flex-1"><h4 className="font-semibold">Expo Push</h4><p className="text-[12px] text-[var(--text-muted)]">{isAr ? "إشعارات التطبيق" : "Mobile push notifications"}</p></div>
            <Badge variant="warning">{isAr ? "غير مُهيأ" : "Not Configured"}</Badge>
          </Card>
          <Card className="flex items-center gap-4">
            <span className="text-3xl">☁️</span>
            <div className="flex-1"><h4 className="font-semibold">Cloudflare R2</h4><p className="text-[12px] text-[var(--text-muted)]">{isAr ? "رفع الصور والفيديوهات" : "Image and video storage"}</p></div>
            <Badge variant="warning">{isAr ? "غير مُهيأ" : "Not Configured"}</Badge>
          </Card>
        </div>
      )}
    </div>
  );
}

function ServiceCard({ name, detail, status, warning }: { name: string; detail: string; status?: string; warning?: string }) {
  const ok = status === "ok";
  return (
    <Card className="flex items-center gap-4">
      <div className={`w-3 h-3 rounded-full ${ok ? "bg-[var(--success)]" : warning ? "bg-[var(--warning)]" : "bg-[var(--text-muted)]"}`} />
      <div className="flex-1">
        <p className="text-[13px] font-medium">{name}</p>
        <p className="text-[11px] text-[var(--text-muted)]">{detail}</p>
      </div>
      <Badge variant={ok ? "success" : warning ? "warning" : "muted"}>
        {ok ? "✓ متصل" : warning || "—"}
      </Badge>
    </Card>
  );
}

function PlanCard({ name, nameAr, price, trainees, color, featured, isAr }: any) {
  return (
    <Card className={`text-center ${featured ? `border-2` : ""}`} style={featured ? { borderColor: color } : {}}>
      <h3 className="text-[16px] font-bold mb-1">{isAr ? nameAr : name}</h3>
      <p className="text-[36px] font-bold font-[Syne,sans-serif]" style={{ color }}>${price}</p>
      <p className="text-[12px] text-[var(--text-muted)] mb-4">{isAr ? "/شهر" : "/month"}</p>
      <p className="text-[13px]">{trainees} {isAr ? "متدرب" : "trainees"}</p>
    </Card>
  );
}
