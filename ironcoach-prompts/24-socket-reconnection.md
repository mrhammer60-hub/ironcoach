# Prompt 24 — Socket.io Reconnection & Message Sync

> **Paste CLAUDE.md first, then this prompt.**
> **Prerequisite:** Step 09 complete (chat module exists), Step 20 complete (API client exists).
> **أضفه بعد الخطوة 20.**

---

## Problem

المستخدم ينقطع عن الإنترنت لدقيقتين.
بدون reconnection logic:
- الرسائل المُرسَلة أثناء الانقطاع تضيع
- الرسائل الواردة أثناء الانقطاع لا تظهر
- الـ UI يبقى "متصل" رغم انقطاع الاتصال

---

## Part A: Socket Client — `apps/web/lib/socket.ts`

```typescript
import { io, Socket } from 'socket.io-client'
import { tokenStore } from './api'

type SocketStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting'

class SocketManager {
  private socket: Socket | null = null
  private status: SocketStatus = 'disconnected'
  private statusListeners: Set<(s: SocketStatus) => void> = new Set()
  private lastConnectedAt: Date | null = null

  connect(): Socket {
    if (this.socket?.connected) return this.socket

    this.setStatus('connecting')

    this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      namespace: '/chat',
      auth: async (cb) => {
        // Always use fresh access token
        const token = await tokenStore.getAccessToken()
        cb({ token })
      },
      // Reconnection settings
      reconnection: true,
      reconnectionAttempts: Infinity,     // keep trying forever
      reconnectionDelay: 1_000,           // start with 1s
      reconnectionDelayMax: 30_000,       // max 30s between attempts
      randomizationFactor: 0.3,           // add jitter to avoid thundering herd
      timeout: 10_000,
      transports: ['websocket', 'polling'], // fallback to polling if websocket fails
    })

    this.socket.on('connect', () => {
      this.setStatus('connected')
      this.lastConnectedAt = new Date()
      // Sync missed messages after reconnect
      this.syncMissedMessages()
    })

    this.socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') {
        // Server forced disconnect (e.g. token expired) — don't auto-reconnect
        this.setStatus('disconnected')
        this.socket?.connect() // re-auth and reconnect
      } else {
        // Network issue — socket will auto-reconnect
        this.setStatus('reconnecting')
      }
    })

    this.socket.on('connect_error', (err) => {
      if (err.message === 'unauthorized') {
        // Token expired — refresh and retry
        this.handleAuthError()
      }
      this.setStatus('reconnecting')
    })

    this.socket.on('reconnect', (attemptNumber) => {
      this.setStatus('connected')
      this.syncMissedMessages()
    })

    return this.socket
  }

  private async handleAuthError(): Promise<void> {
    // Force token refresh — BaseApiClient handles this
    // Then update socket auth and reconnect
    const newToken = await tokenStore.getAccessToken()
    if (this.socket) {
      this.socket.auth = { token: newToken }
      this.socket.connect()
    }
  }

  private async syncMissedMessages(): Promise<void> {
    if (!this.lastConnectedAt) return
    // Emit event to server requesting messages since last connection
    const since = this.lastConnectedAt.toISOString()
    this.socket?.emit('sync_since', { since })
  }

  disconnect(): void {
    this.socket?.disconnect()
    this.socket = null
    this.setStatus('disconnected')
  }

  getSocket(): Socket | null { return this.socket }
  getStatus(): SocketStatus { return this.status }

  onStatusChange(cb: (s: SocketStatus) => void): () => void {
    this.statusListeners.add(cb)
    return () => this.statusListeners.delete(cb)
  }

  private setStatus(s: SocketStatus): void {
    this.status = s
    this.statusListeners.forEach(cb => cb(s))
  }
}

export const socketManager = new SocketManager()
export const useSocketStatus = () => {
  // React hook that subscribes to status changes
}
```

---

## Part B: Server-Side Sync Handler

### أضف لـ `apps/api/src/chat/chat.gateway.ts`

```typescript
@SubscribeMessage('sync_since')
async handleSyncSince(
  client: AuthenticatedSocket,
  data: { since: string }
): Promise<void> {
  const since = new Date(data.since)
  const userId = client.data.user.sub

  // Find all conversations this user is in
  const participations = await this.prisma.conversationParticipant.findMany({
    where: { userId },
    select: { conversationId: true, lastReadAt: true },
  })

  // For each conversation, fetch messages since disconnection
  for (const p of participations) {
    const missed = await this.prisma.message.findMany({
      where: {
        conversationId: p.conversationId,
        createdAt: { gt: since },
        senderUserId: { not: userId },  // don't re-send own messages
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    })

    if (missed.length > 0) {
      // Send missed messages directly to this client (not broadcast)
      client.emit('missed_messages', {
        conversationId: p.conversationId,
        messages: missed,
      })
    }
  }
}
```

---

## Part C: Offline Message Queue (Web)

### `apps/web/lib/offline-message-queue.ts`

```typescript
interface QueuedMessage {
  tempId: string         // client-generated UUID for optimistic UI
  convoId: string
  content: string
  mediaUrl?: string
  mediaType?: string
  queuedAt: Date
}

class OfflineMessageQueue {
  private queue: QueuedMessage[] = []

  enqueue(msg: Omit<QueuedMessage, 'queuedAt'>): void {
    this.queue.push({ ...msg, queuedAt: new Date() })
    // Persist to sessionStorage as backup
    sessionStorage.setItem('msg_queue', JSON.stringify(this.queue))
  }

  async flush(socket: Socket): Promise<void> {
    if (this.queue.length === 0) return
    const toSend = [...this.queue]
    this.queue = []
    sessionStorage.removeItem('msg_queue')

    for (const msg of toSend) {
      socket.emit('send_message', {
        convoId: msg.convoId,
        content: msg.content,
        mediaUrl: msg.mediaUrl,
        mediaType: msg.mediaType,
        tempId: msg.tempId,          // server echoes this back for reconciliation
      })
      // Small delay between queued messages to avoid flood
      await new Promise(r => setTimeout(r, 100))
    }
  }

  restore(): void {
    const saved = sessionStorage.getItem('msg_queue')
    if (saved) this.queue = JSON.parse(saved)
  }

  get length(): number { return this.queue.length }
}

export const offlineQueue = new OfflineMessageQueue()
```

---

## Part D: React Hook — `useChat`

### `apps/web/hooks/useChat.ts`

```typescript
export function useChat(convoId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [status, setStatus] = useState<SocketStatus>('disconnected')
  const [isTyping, setIsTyping] = useState(false)
  const socket = socketManager.getSocket()

  // Load initial messages
  const { data } = useQuery({
    queryKey: queryKeys.chat.messages(convoId),
    queryFn: () => chatApi.messages(convoId),
  })

  useEffect(() => {
    if (data?.items) setMessages(data.items.reverse())
  }, [data])

  useEffect(() => {
    if (!socket) return

    socket.emit('join_conversation', { convoId })

    // Real-time messages
    const onMessage = (msg: Message) => {
      setMessages(prev => {
        // Reconcile with optimistic message if tempId matches
        const withoutOptimistic = prev.filter(m => m.tempId !== msg.tempId)
        return [...withoutOptimistic, msg]
      })
      // Mark as read if window focused
      if (document.hasFocus()) {
        socket.emit('read_messages', { convoId })
      }
    }

    // Missed messages after reconnect
    const onMissed = (data: { conversationId: string; messages: Message[] }) => {
      if (data.conversationId !== convoId) return
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id))
        const newMsgs = data.messages.filter(m => !existingIds.has(m.id))
        return [...prev, ...newMsgs].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
      })
    }

    const onTyping = ({ userId }: { userId: string }) => {
      // Only show typing indicator for other user
      if (userId !== currentUserId) {
        setIsTyping(true)
        // Auto-clear after 3s if no more typing events
        clearTimeout(typingTimer)
        typingTimer = setTimeout(() => setIsTyping(false), 3000)
      }
    }

    socket.on('message_received', onMessage)
    socket.on('missed_messages', onMissed)
    socket.on('user_typing', onTyping)

    return () => {
      socket.off('message_received', onMessage)
      socket.off('missed_messages', onMissed)
      socket.off('user_typing', onTyping)
    }
  }, [socket, convoId])

  const sendMessage = useCallback((content: string) => {
    if (!socket?.connected) {
      // Queue for when reconnected
      const tempId = crypto.randomUUID()
      setMessages(prev => [...prev, {
        id: tempId, tempId, content,
        senderUserId: currentUserId,
        createdAt: new Date().toISOString(),
        isOptimistic: true,
      } as Message])
      offlineQueue.enqueue({ tempId, convoId, content })
      return
    }

    const tempId = crypto.randomUUID()
    // Optimistic update
    setMessages(prev => [...prev, {
      id: tempId, tempId, content,
      senderUserId: currentUserId,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    } as Message])

    socket.emit('send_message', { convoId, content, tempId })
  }, [socket, convoId])

  // Flush queue when reconnected
  useEffect(() => {
    const unsub = socketManager.onStatusChange((s) => {
      setStatus(s)
      if (s === 'connected' && offlineQueue.length > 0) {
        offlineQueue.flush(socket!)
      }
    })
    return unsub
  }, [socket])

  return { messages, sendMessage, isTyping, status }
}
```

---

## Part E: Connection Status UI Component

### `apps/web/components/shared/ConnectionBanner.tsx`

```tsx
export function ConnectionBanner() {
  const status = useSocketStatus()

  if (status === 'connected') return null

  const messages = {
    connecting:    { text: 'جاري الاتصال...', color: 'amber' },
    reconnecting:  { text: 'إعادة الاتصال...', color: 'amber' },
    disconnected:  { text: 'غير متصل — الرسائل ستُرسَل عند عودة الاتصال', color: 'rose' },
  }

  const { text, color } = messages[status] ?? messages.disconnected

  return (
    <div className={`fixed top-14 left-0 right-0 z-50 py-2 px-4 text-center text-sm font-medium
      ${color === 'amber' ? 'bg-amber-500/20 text-amber-400 border-b border-amber-500/30' : ''}
      ${color === 'rose'  ? 'bg-rose-500/20  text-rose-400  border-b border-rose-500/30'  : ''}
    `}>
      {status === 'reconnecting' && <span className="inline-block animate-spin ml-2">↻</span>}
      {text}
    </div>
  )
}
```

---

## Part F: Mobile Reconnection — `apps/mobile/lib/socket.ts`

```typescript
import { AppState } from 'react-native'

// Re-connect when app comes to foreground
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    if (!socket.connected) socket.connect()
    // Sync missed messages
    socket.emit('sync_since', { since: lastConnectedAt.toISOString() })
  }
  if (state === 'background') {
    // Don't disconnect — keep alive for push notifications
    // Socket will auto-disconnect after ~60s of background anyway
  }
})
```

---

## Output Requirements

- App disconnects → banner shows "إعادة الاتصال"
- App reconnects → missed messages load automatically
- Message sent while offline → queued → delivered on reconnect
- Optimistic message replaced by real message on server confirm (no duplicates)
- `sync_since` only returns messages user hasn't seen (not own sent messages)
- Mobile: reconnects when app returns to foreground
