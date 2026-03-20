"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, Avatar, EmptyState, Badge } from "@/components/ui";
import { api } from "../../../../lib/api";
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/components/shared/Toast";
import { useSocket } from "@/hooks/useSocket";

function getUserIdFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  try {
    const match = document.cookie.match(/ironcoach_access=([^;]*)/);
    if (!match) return null;
    return JSON.parse(atob(match[1].split(".")[1])).sub;
  } catch { return null; }
}

export default function ChatPage() {
  const { t, lang } = useTranslation();
  const isAr = lang === "ar";
  const [activeConvo, setActiveConvo] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { joinConversation, onMessage } = useSocket();
  const myUserId = getUserIdFromCookie();

  const { data: conversations } = useQuery({
    queryKey: ["chat", "conversations"],
    queryFn: () => api.get<any[]>("/chat/conversations"),
    staleTime: 30 * 1000, // 30s — messages change frequently
  });

  const { data: messages } = useQuery({
    queryKey: ["chat", "messages", activeConvo],
    queryFn: () => activeConvo ? api.get<any>(`/chat/${activeConvo}/messages`) : null,
    enabled: !!activeConvo,
    refetchInterval: 15000, // Fallback; primary via socket
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Socket.io real-time
  useEffect(() => {
    if (!activeConvo) return;
    joinConversation(activeConvo);
    const unsub = onMessage((msg: any) => {
      queryClient.setQueryData(["chat", "messages", activeConvo], (old: any) => {
        if (!old) return old;
        const exists = old.items?.some((m: any) => m.id === msg.id);
        if (exists) return old;
        return { ...old, items: [...(old.items ?? []), msg] };
      });
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
    });
    return unsub;
  }, [activeConvo, joinConversation, onMessage, queryClient]);

  // Mark messages as read when selecting a conversation
  useEffect(() => {
    if (!activeConvo) return;
    api.put(`/chat/${activeConvo}/read`, {}).then(() => {
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
    }).catch(() => {});
  }, [activeConvo, queryClient]);

  const handleSend = async () => {
    if (!input.trim() || !activeConvo) return;
    try {
      await api.post(`/chat/${activeConvo}/messages`, { body: input.trim() });
      setInput("");
      queryClient.invalidateQueries({ queryKey: ["chat", "messages", activeConvo] });
      queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
    } catch {
      toast("error", isAr ? "فشل إرسال الرسالة" : "Failed to send message");
    }
  };

  return (
    <div className="flex h-[calc(100vh-130px)] gap-0">
      {/* Conversation List */}
      <div className={`${activeConvo ? "hidden md:block" : "w-full md:w-[280px]"} md:w-[280px] shrink-0 border-e border-[var(--border)] overflow-auto`}>
        <div className="p-4">
          <h3 className="text-[15px] font-semibold">{t("nav.messages")}</h3>
        </div>
        {!(conversations as any[])?.length ? (
          <p className="text-[12px] text-[var(--text-muted)] text-center py-8">{isAr ? "لا توجد محادثات" : "No conversations"}</p>
        ) : (
          (conversations as any[]).map((convo: any) => (
            <button key={convo.id} onClick={() => setActiveConvo(convo.id)} className={`w-full text-start flex items-center gap-3 p-3 transition-colors ${activeConvo === convo.id ? "bg-[var(--accent-muted)]" : "hover:bg-[var(--bg-hover)]"}`}>
              <Avatar name={convo.participant?.name || ""} src={convo.participant?.avatarUrl} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium truncate">{convo.participant?.name}</p>
                <p className="text-[11px] text-[var(--text-muted)] truncate">{convo.lastMessage?.body || ""}</p>
              </div>
              {convo.unreadCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[var(--accent)] text-[var(--accent-text)] text-[10px] font-bold flex items-center justify-center">{convo.unreadCount}</span>
              )}
            </button>
          ))
        )}
      </div>

      {/* Chat Window */}
      <div className={`flex-1 flex flex-col ${!activeConvo ? "hidden md:flex" : ""}`}>
        {activeConvo ? (
          <>
            {/* Header with back button */}
            <div className="md:hidden p-3 border-b border-[var(--border)]">
              <button onClick={() => setActiveConvo(null)} className="text-sm text-[var(--accent)]">← {isAr ? "رجوع" : "Back"}</button>
            </div>
            {/* Messages */}
            <div className="flex-1 overflow-auto p-4 space-y-3">
              {[...((messages as any)?.items ?? [])].reverse().map((msg: any) => {
                const isMe = msg.senderUserId === myUserId;
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div>
                      <div className={`max-w-[70%] px-3 py-2 rounded-xl text-[13px] ${isMe ? "bg-[var(--accent)] text-[var(--accent-text)]" : "bg-[var(--bg-input)] text-[var(--text-primary)]"}`}>
                        {msg.body}
                      </div>
                      <p className={`text-[10px] text-[var(--text-muted)] mt-1 ${isMe ? "text-end" : "text-start"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString(isAr ? "ar" : "en", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            {/* Input */}
            <div className="p-3 border-t border-[var(--border)] flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={isAr ? "اكتب رسالتك..." : "Type a message..."}
                className="flex-1 input-base px-3 py-2 text-[13px]"
              />
              <button onClick={handleSend} disabled={!input.trim()} className="px-4 py-2 bg-[var(--accent)] text-[var(--accent-text)] rounded-lg font-semibold text-[13px] disabled:opacity-50">
                {isAr ? "إرسال" : "Send"}
              </button>
            </div>
          </>
        ) : (
          <EmptyState icon="💬" title={isAr ? "اختر محادثة" : "Select a conversation"} description={isAr ? "اختر متدرباً من القائمة للبدء" : "Pick a trainee from the list"} />
        )}
      </div>
    </div>
  );
}
