# Prompt 10 — Next.js Web App

> **Paste CLAUDE.md first, then this prompt.**
> **Prerequisite:** Steps 01–09 complete. Full API running.

---

## Task

Build the complete Next.js 14 App Router web application.

---

## App Structure

```
apps/web/
  app/
    (auth)/
      login/page.tsx
      register/page.tsx
      forgot-password/page.tsx
      reset-password/[token]/page.tsx
    (coach)/
      layout.tsx                  ← sidebar + topbar
      dashboard/page.tsx
      trainees/page.tsx
      trainees/[id]/page.tsx      ← tabs: overview, workout, nutrition, progress, chat
      trainees/[id]/builder/page.tsx  ← assign workout to this trainee
      builder/page.tsx            ← standalone workout builder
      nutrition/page.tsx
      exercises/page.tsx
      chat/page.tsx
      checkins/page.tsx
      analytics/page.tsx
      settings/page.tsx
    (trainee)/
      layout.tsx                  ← mobile-first, bottom tabs
      today/page.tsx
      workout/page.tsx            ← active session (distraction-free)
      schedule/page.tsx
      nutrition/page.tsx
      progress/page.tsx
      chat/page.tsx
    (admin)/
      layout.tsx
      dashboard/page.tsx
      coaches/page.tsx
      revenue/page.tsx
      exercises/page.tsx
      settings/page.tsx
  middleware.ts
  components/
    coach/
    trainee/
    shared/
  hooks/
  lib/
    api.ts          ← typed API client (fetch wrapper)
    socket.ts       ← Socket.io client singleton
    auth.ts         ← token storage + refresh logic
  i18n/
    ar.json
    en.json
```

---

## `middleware.ts`

- Read JWT from cookie `ironcoach_access`
- Decode (no verify — verify happens on API)
- Redirect based on `role`:
  - TRAINER/OWNER → `/coach/dashboard`
  - TRAINEE → `/trainee/today`
  - ADMIN → `/admin/dashboard`
- Unauthenticated → `/login`
- Protect all `(coach)/*`, `(trainee)/*`, `(admin)/*` routes

---

## Auth Pages

**`/login`**: email + password form → `POST /auth/login` → store tokens in httpOnly cookies → redirect
**`/register`**: multi-step form (step 1: name/email/password, step 2: choose plan → Stripe checkout)
**`/forgot-password`**: email form → success state
**`/reset-password/[token]`**: new password form

All forms: React Hook Form + Zod from `packages/shared`.

---

## Coach: Workout Builder (`/coach/builder`)

This is the **most important coach screen**. Must be fast and intuitive.

**Layout**: two-column, full viewport height minus topbar.

**Left panel — Exercise Library (300px)**:
- Search input (debounced 300ms)
- Muscle group pills filter
- Scrollable exercise list
- Each item: emoji/thumbnail + name + muscle + difficulty badge
- Click → instantly adds to current day
- Hover → shows green ➕ button

**Right panel — Plan Builder**:
- Plan name input (large, editable inline)
- Trainee selector dropdown
- **Quick Presets bar** (one-click fills day):
  - Push: Bench Press + Incline DB + Cable Fly + Dips + Shoulder Press + Lateral Raise + Tricep Pushdown
  - Pull: Pull Up + Lat Pulldown + Cable Row + Face Pull + Barbell Curl + Hammer Curl
  - Legs: Squat + Leg Press + Romanian DL + Leg Curl + Calf Raise
  - Upper / Full Body presets
- Day tabs (scrollable): each shows exercise count badge
- Add Day button (dashed)
- Exercise rows (dnd-kit drag-to-reorder):
  - Drag handle + exercise number + name + muscle tag + delete button
  - Click to expand: **inline params grid**
    - Sets: number stepper (- / value / +)
    - Reps: text input (e.g. "8-12" or "10")
    - Rest: number stepper in seconds
    - Tempo: text input (e.g. "3-1-2-0")
    - RPE: optional 1-10 stepper
    - Notes: optional text
  - Params change auto-save (debounced 500ms)
- Drop zone at bottom: dashed border, click or drag to add

**Auto-save**: `localStorage` every change, sync to API on explicit "Save" click.

---

## Trainee: Workout Session (`/trainee/workout`)

This is the **most important trainee screen**. Zero clutter.

**Full-screen, no sidebar during active session.**

**Header** (sticky):
- Back button (warns if session in progress)
- Day name
- Session timer (counts up, green → amber after 60 min)
- Progress: "3/7 تمارين" with thin progress bar

**Exercise list**: one card per exercise, collapses to summary when done.

**Active exercise card** (expanded):
- Exercise emoji + name (large)
- Subtitle: muscle group + sets×reps spec
- Video thumbnail → tap to fullscreen (expo-av on mobile; HTML5 video on web)
- **Set logger**:
  - Column headers: # | تكرارات | وزن | ✓
  - Each row: set number | reps input (number) | weight input (number, kg) | green checkmark
  - Inputs: large font (20px), tap-friendly, numeric keyboard
  - Checkmark: tap → turns teal, triggers rest timer
- **Rest timer** (appears after each set check):
  - Amber background strip
  - Countdown from exercise's `restSeconds`
  - Skip button
  - Vibration on complete (web: `navigator.vibrate(200)`)
- After all sets checked → card collapses with ✓ header, next card expands automatically

**Finish button**: appears after last exercise completed. Full-width lime green. Emoji celebration.

---

## Real-time Chat (`/coach/chat`)

- Socket.io client from `lib/socket.ts`
- Conversation list (left panel, 260px): avatar + name + preview + unread badge
- Message window (right): bubble chat, typing indicator, media attachments
- Input: textarea (Enter to send, Shift+Enter for newline), send button, attach button
- Optimistic updates: message appears immediately, confirmed on `message_received` echo

---

## i18n

- `next-intl` with `[locale]` routing: `/ar/...` and `/en/...`
- Default locale: `ar`
- RTL: `<html dir="rtl">` when locale is `ar`
- Fonts:
  - Arabic: IBM Plex Sans Arabic (300, 400, 500, 700)
  - English: Syne (headings, 600/700) + Plus Jakarta Sans (body, 400/500)

---

## State & Data Fetching

- **TanStack Query** for all API calls: keys, stale times, optimistic updates
- **Zustand** for: auth state, current organization, socket connection state
- `lib/api.ts`: typed fetch client with automatic token refresh (retry once on 401)

---

## Output Requirements

- Middleware correctly redirects by role
- Builder preset fills day with correct exercises on one click
- Session screen: rest timer auto-starts after each set checkmark
- Arabic RTL layout works correctly
- Dark mode only (CSS variables)
