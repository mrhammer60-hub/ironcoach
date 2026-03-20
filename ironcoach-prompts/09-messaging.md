# Prompt 09 — Messaging & Notifications

> **Paste CLAUDE.md first, then this prompt.**
> **Prerequisite:** Steps 01–08 complete.

---

## Task

Build Socket.io real-time chat and the notification system.

---

## Part A: Chat Module

### `apps/api/src/chat/`

#### REST Endpoints

All: `JwtAuthGuard` + `OrganizationGuard`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/chat/conversations` | List conversations for current user |
| GET | `/chat/:convoId/messages` | Paginated history (cursor-based) |
| POST | `/chat/:convoId/messages` | REST fallback send |
| PUT | `/chat/:convoId/read` | Mark all as read, update `lastReadAt` |
| POST | `/chat/upload` | Presigned R2 URL for media → returns CDN URL |
| GET | `/chat/support` | Coach: get or create SUPPORT conversation with admin |

**GET `/chat/conversations`** returns:
```typescript
Array<{
  id, type,
  participant: { id, name, avatarUrl, role },
  lastMessage: { body, mediaType, sentAt, isRead },
  unreadCount: number
}>
```

**GET `/chat/:convoId/messages`** query: `cursor?` (message ID), `limit` (default 30)
Returns messages in descending order (newest first) with cursor for next page.

#### Socket.io Gateway

**`apps/api/src/chat/chat.gateway.ts`**

```typescript
@WebSocketGateway({ cors: { origin: env.CORS_ORIGINS }, namespace: '/chat' })
```

**`handleConnection(client)`**:
1. Extract JWT from `client.handshake.auth.token`
2. Verify JWT → reject with `WsException('unauthorized')` if invalid
3. Attach `user` to `client.data`
4. Load all conversation IDs for this user
5. Join rooms: `conversation:{convoId}` for each

**Events — Client → Server:**

`join_conversation` — `{ convoId: string }`
- Verify user is a participant → `WsException` if not
- Join room `conversation:{convoId}`

`send_message` — `{ convoId: string, content?: string, mediaUrl?: string, mediaType?: MediaType }`
- Verify user is participant
- Save `Message` to DB
- Emit `message_received` to room `conversation:{convoId}` (excluding sender)
- Check if recipient has active socket → if not, send push via `NotificationService`
- Emit `message_received` back to sender for confirmation

`typing` — `{ convoId: string }`
- Emit `user_typing` to room (excluding sender): `{ convoId, userId, firstName }`

`read_messages` — `{ convoId: string }`
- Update `ConversationParticipant.lastReadAt = now`
- Set `Message.isRead = true` for all unread messages from other party
- Emit `messages_read` to room: `{ convoId, userId, readAt }`

**Redis Pub/Sub for scaling:**
```typescript
import { createAdapter } from '@socket.io/redis-adapter'
// In chat.module.ts: attach adapter using redis client from config
```

---

## Part B: Notifications Module

### `apps/api/src/notifications/`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/notifications` | Paginated list for current user |
| PUT | `/notifications/read-all` | Mark all read |
| PUT | `/notifications/:id/read` | Mark one read |
| POST | `/notifications/tokens` | Register/update push token |

#### `NotificationService`

```typescript
async send(params: {
  userId: string
  organizationId: string
  type: NotificationType
  title: string
  body: string
  dataJson?: Record<string, unknown>
}): Promise<void>
```

Implementation:
1. Save `Notification` row to DB
2. Find `PushToken` rows for `userId`
3. If tokens exist: call Expo Push API
4. Expo batch: up to 100 messages per request

**Expo Push API call:**
```typescript
const messages = tokens.map(t => ({
  to: t.token,
  title: params.title,
  body: params.body,
  data: params.dataJson ?? {},
  sound: 'default',
}))
// POST https://exp.host/--/api/v2/push/send
// Header: Authorization: Bearer {env.EXPO_ACCESS_TOKEN}
```

Handle `DeviceNotRegistered` receipts → delete stale push tokens.

#### Trigger Locations (call `NotificationService.send` from these services)

| Trigger | Service | Recipients | Message |
|---------|---------|------------|---------|
| Session completed | `WorkoutLogsService.complete` | Trainer | `"{name} أتم تمرين {day} 🎯"` |
| Program assigned | `WorkoutProgramsService.assign` | Trainee | `"وصلك برنامج تدريبي جديد 💪"` |
| Nutrition assigned | `NutritionService.assign` | Trainee | `"وصلتك خطة غذائية جديدة 🥗"` |
| Message received (offline) | `ChatGateway.send_message` | Recipient | `"{senderName}: {preview}"` |
| Payment failed | `BillingService.webhookHandler` | Coach | `"فشل سداد الاشتراك ⚠️"` |

#### Scheduled Jobs (BullMQ)

**`apps/api/src/notifications/jobs/checkin-reminder.job.ts`**
- Runs every Monday at 8:00 AM (cron: `0 8 * * 1`)
- Sends to all active trainees: "حان وقت تسجيل قياساتك الأسبوعية 📏"

**`apps/api/src/notifications/jobs/subscription-reminder.job.ts`**
- Runs daily at 9:00 AM
- Finds subscriptions expiring in exactly 3 days
- Sends email + push to coach

---

## Files Required

```
apps/api/src/chat/
  chat.module.ts
  chat.controller.ts
  chat.service.ts
  chat.gateway.ts
  dto/send-message.dto.ts
  dto/get-messages.dto.ts

apps/api/src/notifications/
  notifications.module.ts
  notifications.controller.ts
  notifications.service.ts
  expo-push.service.ts
  jobs/
    checkin-reminder.job.ts
    subscription-reminder.job.ts
  dto/register-token.dto.ts
```

---

## Output Requirements

- Socket.io gateway rejects unauthenticated connections
- Redis adapter configured for horizontal scaling
- Push notification sent when recipient is offline
- Scheduled jobs registered in BullMQ
