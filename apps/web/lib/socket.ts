import { io, Socket } from "socket.io-client";
import { tokenStore } from "./api";

export type SocketStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting";

class SocketManager {
  private socket: Socket | null = null;
  private status: SocketStatus = "disconnected";
  private statusListeners: Set<(s: SocketStatus) => void> = new Set();
  private lastConnectedAt: Date | null = null;

  connect(): Socket {
    if (this.socket?.connected) return this.socket;

    this.setStatus("connecting");

    this.socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      path: "/socket.io",
      auth: async (cb: (data: { token: string | null }) => void) => {
        const token = await tokenStore.getAccessToken();
        cb({ token });
      },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 30_000,
      randomizationFactor: 0.3,
      timeout: 10_000,
      transports: ["websocket", "polling"],
    });

    this.socket.on("connect", () => {
      this.setStatus("connected");
      this.lastConnectedAt = new Date();
      this.syncMissedMessages();
    });

    this.socket.on("disconnect", (reason) => {
      if (reason === "io server disconnect") {
        this.setStatus("disconnected");
        this.socket?.connect();
      } else {
        this.setStatus("reconnecting");
      }
    });

    this.socket.on("connect_error", (err) => {
      if (err.message === "unauthorized") {
        this.handleAuthError();
      }
      this.setStatus("reconnecting");
    });

    this.socket.io.on("reconnect", () => {
      this.setStatus("connected");
      this.lastConnectedAt = new Date();
      this.syncMissedMessages();
    });

    return this.socket;
  }

  private async handleAuthError(): Promise<void> {
    const newToken = await tokenStore.getAccessToken();
    if (this.socket) {
      this.socket.auth = { token: newToken };
      this.socket.connect();
    }
  }

  private syncMissedMessages(): void {
    if (!this.lastConnectedAt || !this.socket) return;
    this.socket.emit("sync_since", {
      since: this.lastConnectedAt.toISOString(),
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.setStatus("disconnected");
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  getStatus(): SocketStatus {
    return this.status;
  }

  onStatusChange(cb: (s: SocketStatus) => void): () => void {
    this.statusListeners.add(cb);
    return () => this.statusListeners.delete(cb);
  }

  private setStatus(s: SocketStatus): void {
    this.status = s;
    this.statusListeners.forEach((cb) => cb(s));
  }
}

export const socketManager = new SocketManager();
