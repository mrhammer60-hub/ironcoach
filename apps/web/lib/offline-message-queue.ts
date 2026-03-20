import type { Socket } from "socket.io-client";

interface QueuedMessage {
  tempId: string;
  convoId: string;
  content: string;
  mediaUrl?: string;
  mediaType?: string;
  queuedAt: string;
}

const STORAGE_KEY = "ironcoach_msg_queue";

class OfflineMessageQueue {
  private queue: QueuedMessage[] = [];

  constructor() {
    this.restore();
  }

  enqueue(msg: Omit<QueuedMessage, "queuedAt">): void {
    this.queue.push({ ...msg, queuedAt: new Date().toISOString() });
    this.persist();
  }

  async flush(socket: Socket): Promise<void> {
    if (this.queue.length === 0) return;
    const toSend = [...this.queue];
    this.queue = [];
    this.persist();

    for (const msg of toSend) {
      socket.emit("send_message", {
        convoId: msg.convoId,
        content: msg.content,
        mediaUrl: msg.mediaUrl,
        mediaType: msg.mediaType,
        tempId: msg.tempId,
      });
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  private persist(): void {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch {}
  }

  private restore(): void {
    if (typeof window === "undefined") return;
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) this.queue = JSON.parse(saved);
    } catch {}
  }

  get length(): number {
    return this.queue.length;
  }
}

export const offlineQueue = new OfflineMessageQueue();
