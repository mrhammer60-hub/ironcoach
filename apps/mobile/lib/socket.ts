import { io, Socket } from "socket.io-client";
import { AppState } from "react-native";
import * as SecureStore from "expo-secure-store";

const KEYS = {
  ACCESS: "ironcoach_access_token",
};

let socket: Socket | null = null;
let lastConnectedAt: Date | null = null;

export function connectSocket(): Socket {
  if (socket?.connected) return socket;

  socket = io(process.env.EXPO_PUBLIC_SOCKET_URL!, {
    path: "/socket.io",
    auth: async (cb: (data: { token: string | null }) => void) => {
      const token = await SecureStore.getItemAsync(KEYS.ACCESS);
      cb({ token });
    },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 30_000,
    randomizationFactor: 0.3,
    timeout: 10_000,
    transports: ["websocket"],
  });

  socket.on("connect", () => {
    lastConnectedAt = new Date();
    syncMissedMessages();
  });

  socket.io.on("reconnect", () => {
    lastConnectedAt = new Date();
    syncMissedMessages();
  });

  return socket;
}

function syncMissedMessages(): void {
  if (!lastConnectedAt || !socket) return;
  socket.emit("sync_since", {
    since: lastConnectedAt.toISOString(),
  });
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function getSocket(): Socket | null {
  return socket;
}

// Reconnect when app returns to foreground
AppState.addEventListener("change", (state) => {
  if (state === "active" && socket && !socket.connected) {
    socket.connect();
  }
});
