"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/ironcoach_access=([^;]*)/);
  return match ? match[1] : null;
}

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const token = getToken();

  useEffect(() => {
    if (!token) return;

    const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    socketRef.current = io(`${url}/chat`, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  const joinConversation = useCallback((convoId: string) => {
    socketRef.current?.emit("join_conversation", { convoId });
  }, []);

  const sendTyping = useCallback((convoId: string) => {
    socketRef.current?.emit("typing", { convoId });
  }, []);

  const onMessage = useCallback((handler: (msg: any) => void) => {
    socketRef.current?.on("message_received", handler);
    return () => { socketRef.current?.off("message_received", handler); };
  }, []);

  const onTyping = useCallback((handler: (data: { userId: string }) => void) => {
    socketRef.current?.on("user_typing", handler);
    return () => { socketRef.current?.off("user_typing", handler); };
  }, []);

  return {
    joinConversation,
    sendTyping,
    onMessage,
    onTyping,
    connected: !!socketRef.current?.connected,
  } as {
    joinConversation: (convoId: string) => void;
    sendTyping: (convoId: string) => void;
    onMessage: (handler: (msg: any) => void) => (() => void) | undefined;
    onTyping: (handler: (data: { userId: string }) => void) => (() => void) | undefined;
    connected: boolean;
  };
}
