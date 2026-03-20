# Prompt 16 — Admin Web Portal

> **Paste CLAUDE.md first, then this prompt.**
> **Prerequisite:** Step 10 complete (web app built), Step 13 complete (admin API built).
> **هذا الـ prompt ناقص من الحزمة الأصلية.**

---

## Task

Build the Super Admin portal inside `apps/web/app/(admin)/`.

الأدمن يرى كل شيء عبر المنصة — coaches، revenue، exercises، support.

---

## Pages

### `(admin)/layout.tsx`

- Sidebar مختلف عن الـ coach sidebar
- يحتوي على: Dashboard، Coaches، Revenue، Exercises، Support، Announcements، Feature Flags، Audit Logs، Settings
- Badge على Support يعرض عدد التذاكر المفتوحة
- Header يعرض "Super Admin" badge بلون مميز (أحمر أو ذهبي)
- إذا كان الـ admin يعمل بـ impersonation → شريط تحذير أصفر في الأعلى: "أنت تتصفح كـ {orgName} — [إنهاء الجلسة]"

---

### `(admin)/dashboard/page.tsx`

**4 KPI cards (كبيرة):**
- إجمالي الـ coaches النشطين
- إجمالي المتدربين
- MRR (Monthly Recurring Revenue) بالدولار
- معدل الـ churn هذا الشهر

**جدول: آخر 10 اشتراكات جديدة**
- اسم الـ org، اسم المدرب، الخطة، تاريخ الاشتراك

**توزيع الخطط** (bar chart بسيط أو progress bars):
- Starter X coaches
- Growth Y coaches
- Pro Z coaches

**تنبيهات تحتاج عمل:**
- Orgs في حالة PAST_DUE (سداد متأخر)
- تذاكر دعم مفتوحة منذ أكثر من 48 ساعة

---

### `(admin)/coaches/page.tsx`

**جدول مع:**
- اسم الـ org + اسم المالك + إيميله
- الخطة (badge ملون)
- الحالة (active/suspended/past_due)
- عدد المتدربين / الحد الأقصى
- تاريخ الاشتراك + تاريخ التجديد
- الـ MRR لهذا الـ org

**Actions لكل صف:**
- عرض التفاصيل
- تعليق الحساب (Suspend)
- تسجيل الدخول كـ coach (Impersonate)

**Filters:** status, plan, search

**عند الضغط على Suspend:**
Modal يطلب سبب التعليق → يُرسل email تلقائي للمدرب

**عند الضغط على Impersonate:**
- Modal تأكيد: "ستدخل كـ {orgName} — لمدة ساعة واحدة"
- بعد التأكيد: يُخزن impersonation token في cookie
- يُحوّل لـ `/coach/dashboard` مع شريط تحذير أصفر
- زر "إنهاء الجلسة" يمسح الـ token ويعود للأدمن

---

### `(admin)/coaches/[orgId]/page.tsx`

**تفاصيل كاملة للـ org:**

Tab 1: نظرة عامة
- بيانات الـ org (اسم، subdomain، logo، brand color)
- بيانات الاشتراك (plan, status, next renewal, payment method last4)
- Usage: trainees used / max

Tab 2: المتدربون
- قائمة كل المتدربين مع حالتهم

Tab 3: الاشتراك
- تاريخ الفواتير (تاريخ، مبلغ، status)
- زر: "ترقية الخطة يدوياً" (للأدمن فقط)

Tab 4: سجل النشاط
- AuditLog لهذا الـ org

---

### `(admin)/revenue/page.tsx`

**KPIs كبيرة:**
- MRR الحالي
- ARR المتوقع
- متوسط Revenue Per Coach
- Churn هذا الشهر

**Chart: نمو MRR** (آخر 12 شهر) — bar chart

**جدول: آخر 20 فاتورة**
- org name, amount, date, status

**جدول: فشل السداد**
- orgs في PAST_DUE مع تاريخ الفشل وعدد المحاولات

---

### `(admin)/exercises/page.tsx`

نفس تجربة الـ coach لكن مع صلاحيات إضافية:
- رؤية كل التمارين (global + كل الـ coaches)
- تمييز التمارين الـ "pending approval" (كوتش رفعها وتحتاج مراجعة)
- زر Approve → يجعل التمرين global للجميع
- حذف أي تمرين
- تعديل أي تمرين

---

### `(admin)/support/page.tsx`

**View: inbox**

قائمة التذاكر مع:
- اسم الـ coach
- الموضوع
- الأولوية (badge ملون: URGENT أحمر، HIGH برتقالي، NORMAL رمادي)
- الحالة
- آخر رد ومتى
- زر "رد"، "إغلاق"، "تعيين لـ admin آخر"

**عند الضغط على تذكرة:**
- يفتح thread المحادثة (نفس تجربة الـ chat)
- textarea لكتابة الرد
- زر "إرسال وإغلاق"

---

### `(admin)/announcements/page.tsx`

Form لإرسال إعلان:

```
الجمهور المستهدف: [All Coaches | All Trainees | All Users | Plan: Starter | Plan: Growth | Plan: Pro]
العنوان: [input]
النص: [textarea]
إرسال Push: [toggle]
إرسال Email: [toggle]
عنوان الإيميل: [input - يظهر لو toggle الإيميل مفعّل]

[زر: إرسال]
```

بعد الإرسال: يعرض "جاري الإرسال — 0/234 رسالة" مع progress bar (WebSocket أو polling كل 3 ثواني)

---

### `(admin)/audit-logs/page.tsx`

جدول بـ infinite scroll:
- التاريخ والوقت
- المستخدم (اسم + email)
- الـ org
- Action (badge: CREATE, UPDATE, DELETE, SUSPEND, IMPERSONATE)
- Entity type + ID
- IP address

Filters: action type, org, date range, user

---

### `(admin)/feature-flags/page.tsx`

جدول بسيط:

| الميزة | المفتاح | الحالة | تعديل |
|--------|---------|--------|-------|
| Arabic UI | `ARABIC_UI` | ● مفعّل | toggle |
| AI Suggestions | `AI_WORKOUT_SUGGESTIONS` | ○ معطّل | toggle |
| ... | ... | ... | ... |

Toggle يُحدّث فوراً مع Toast تأكيد.

---

## Output Requirements

- Impersonation flow يعمل end-to-end (token → coach dashboard → back to admin)
- Revenue page تعرض بيانات من Stripe API
- Support inbox مع إمكانية الرد
- Announcement progress bar يعمل
- Audit log مع pagination
