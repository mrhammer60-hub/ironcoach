# Prompt 11 — Expo Mobile App

> **Paste CLAUDE.md first, then this prompt.**
> **Prerequisite:** Steps 01–10 complete.

---

## Task

Build the Expo SDK 51 React Native mobile app. Trainee-focused. Offline-first for workout logging.

---

## Navigation Structure

```
apps/mobile/app/
  (auth)/
    _layout.tsx
    login.tsx
    register.tsx
    set-password.tsx      ← invited trainee sets password
  (tabs)/
    _layout.tsx           ← bottom tab navigator (5 tabs)
    index.tsx             ← Today (home)
    workout.tsx           ← Workout session
    nutrition.tsx         ← Meal plan
    progress.tsx          ← Charts + measurements
    chat.tsx              ← Coach DM
  workout-session.tsx     ← Full-screen session (no tabs)
  exercise-detail.tsx     ← Full-screen exercise + video
```

---

## Bottom Tabs

| Tab | Icon | Label |
|-----|------|-------|
| Today | 🏠 | اليوم |
| Workout | 💪 | تمريني |
| Nutrition | 🥗 | تغذيتي |
| Progress | 📈 | تقدمي |
| Chat | 💬 | مدربي |

Hide tab bar when on `workout-session.tsx` and `exercise-detail.tsx`.

---

## Today Screen (`index.tsx`)

- Greeting: "مرحباً [name] 👋"
- Streak counter (top left): flame emoji + number
- **Today's workout card**: tap → push to `workout-session`
  - Day name, exercise count, estimated duration
  - Progress bar (0% if not started)
  - Large "ابدأ التمرين" button
- **Macro ring strip** (4 small SVG rings):
  - Calories (amber), Protein (sky), Carbs (violet), Fat (lime)
  - Current consumed vs target
- **Next meal card**: meal name, time, macros
- Pull-to-refresh

---

## Workout Session (`workout-session.tsx`)

Full-screen. Status bar hidden. No bottom tabs.

**Header** (sticky, 56px):
- ← back (with confirmation dialog if session active)
- Day title (center)
- Timer counts up (amber, monospace font)
- Progress: "X/Y" + thin bar

**Body**: `ScrollView` or `FlatList` of exercise cards.

**Each exercise card** (collapsed = 56px, expanded = full):

Collapsed state (done):
```
✓ [emoji] بنش بريس · 4×8-12
```

Active state (expanded):
- Name + muscle badge
- Video thumbnail (16:9, `expo-av`, autoplay muted)
- Tap → `exercise-detail.tsx` (full-screen video + instructions)
- **Set rows** (each row = one `View`):
  ```
  [1]  [reps TextInput]  [weight TextInput]  [✓ TouchableOpacity]
  ```
  - `TextInput` keyboard: `keyboardType="numeric"`
  - Font size: 20px bold
  - Min touch target: 44×44pt
  - `✓` button: 44×44pt circle, turns teal on tap
- **Rest timer** (appears after ✓):
  - Full-width amber strip below set row
  - Countdown from `restSeconds`
  - `Vibration.vibrate(500)` on complete
  - "تخطي" button

**Auto-advance**: after all sets ✓ → collapse card, scroll to + expand next.

**Finish button**: full-width, lime green, `position: bottom`. Appears after last exercise done.
On tap → rating modal (1-5 stars + optional note) → log to API → confetti animation → navigate back.

---

## Offline-First Workout Logging

```typescript
// lib/offline-queue.ts
import { MMKV } from 'react-native-mmkv'

const storage = new MMKV({ id: 'workout-queue' })

interface QueuedLog {
  workoutLogId: string
  sets: SetData[]
  timestamp: number
}

export function queueLog(log: QueuedLog) {
  const queue = getQueue()
  queue.push(log)
  storage.set('queue', JSON.stringify(queue))
}

export async function syncQueue(api: ApiClient) {
  const queue = getQueue()
  for (const item of queue) {
    try {
      await api.put(`/workout-logs/${item.workoutLogId}/sets`, { sets: item.sets })
      removeFromQueue(item.workoutLogId)
    } catch { break }
  }
}
```

- Cache today's workout data with MMKV on load
- On set tap: save to MMKV immediately (optimistic)
- On app foreground: call `syncQueue`
- Show "جاري المزامنة..." indicator during sync

---

## Notifications

```typescript
// lib/notifications.ts
import * as Notifications from 'expo-notifications'

export async function registerPushToken(api: ApiClient) {
  const { status } = await Notifications.requestPermissionsAsync()
  if (status !== 'granted') return
  const token = await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig?.extra?.eas?.projectId
  })
  await api.post('/notifications/tokens', {
    token: token.data,
    platform: Platform.OS
  })
}
```

Handle incoming notifications:
- App foreground: show in-app banner
- App background/killed: system notification → tap → navigate to relevant screen

---

## i18n

```typescript
// lib/i18n.ts
import { I18nManager } from 'react-native'
import * as Localization from 'expo-localization'

const isArabic = Localization.locale.startsWith('ar')
if (isArabic && !I18nManager.isRTL) {
  I18nManager.forceRTL(true)
  // Restart app
}
```

Fonts:
- Arabic: Tajawal (loaded via `expo-font`, weights 400/500/700)
- English: Syne (700) + Plus Jakarta Sans (400/500)

---

## Key Libraries

```json
{
  "expo-router": "~3.5.0",
  "expo-av": "~14.0.0",
  "expo-notifications": "~0.28.0",
  "expo-secure-store": "~13.0.0",
  "expo-font": "~12.0.0",
  "expo-localization": "~15.0.0",
  "react-native-mmkv": "^2.12.0",
  "react-native-reanimated": "~3.10.0",
  "react-native-gesture-handler": "~2.16.0",
  "@tanstack/react-query": "^5.0.0",
  "zustand": "^4.5.0",
  "socket.io-client": "^4.7.0"
}
```

---

## Output Requirements

- Workout session works fully offline (MMKV queue)
- Rest timer fires `Vibration.vibrate` on complete
- Push token registered on app launch
- RTL layout correct for Arabic
- All screens navigable from bottom tabs
