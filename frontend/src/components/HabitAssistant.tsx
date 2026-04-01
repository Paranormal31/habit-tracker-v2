"use client";

import { useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";

type Habit = {
  id: string;
  name: string;
  time: string | null;
  order: number;
  streak: number;
  streakFreezeDate: string | null;
  isFrozenToday: boolean;
  createdAt: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

type HabitAssistantProps = {
  onHabitsUpdated: (habits: Habit[]) => void;
};

type ChatDebug = {
  enabled?: boolean;
  nodeEnv?: string;
  hasGroqApiKey?: boolean;
  groqModel?: string;
  requestOrigin?: string | null;
  requestHost?: string | null;
  groqStatus?: number;
  groqStatusText?: string;
};

export function HabitAssistant({ onHabitsUpdated }: HabitAssistantProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState<ChatDebug | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "I can manage your habits. Try: add yoga at 06:30, rename Morning Coffee to Black Coffee, or set Gym to 18:00."
    }
  ]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    setSending(true);
    setMessages((prev) => [...prev, { role: "user", text }]);

    try {
      const result = await apiFetch<{ reply: string; habits: Habit[]; debug?: ChatDebug }>("/api/chat", {
        method: "POST",
        json: { message: text, debug: debugMode }
      });
      setMessages((prev) => [...prev, { role: "assistant", text: result.reply }]);
      setDebugInfo(result.debug ?? null);
      onHabitsUpdated(result.habits);
    } catch (err) {
      const errorText = err instanceof Error ? err.message : "Chat failed";
      setMessages((prev) => [...prev, { role: "assistant", text: `Error: ${errorText}` }]);
      if (err instanceof ApiError && err.data && typeof err.data === "object") {
        const maybeDebug = (err.data as { debug?: ChatDebug }).debug;
        setDebugInfo(maybeDebug ?? null);
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {open ? (
        <div className="fixed bottom-5 right-5 z-50 w-[340px] rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--bg-card)] shadow-2xl">
          <div className="flex items-center justify-between border-b border-[color:var(--border-subtle)] px-3 py-2">
            <div className="text-sm font-semibold">Habit Assistant</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDebugMode((v) => !v)}
                className={`rounded-md px-2 py-1 text-xs ${
                  debugMode
                    ? "bg-[color:var(--accent)] text-black"
                    : "text-[color:var(--text-muted)] hover:bg-[color:var(--bg-surface)]"
                }`}
              >
                Debug {debugMode ? "On" : "Off"}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-1 text-xs text-[color:var(--text-muted)] hover:bg-[color:var(--bg-surface)]"
              >
                Close
              </button>
            </div>
          </div>

          <div className="h-72 space-y-2 overflow-y-auto px-3 py-3">
            {messages.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "ml-auto bg-[color:var(--accent)] text-black"
                    : "bg-[color:var(--bg-surface)] text-[color:var(--text-primary)]"
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>

          {debugMode && debugInfo ? (
            <div className="mx-3 mb-2 rounded-md border border-[color:var(--border-subtle)] bg-[color:var(--bg-surface)] p-2 text-[11px] text-[color:var(--text-secondary)]">
              <div>env: {debugInfo.nodeEnv ?? "unknown"}</div>
              <div>hasGroqApiKey: {String(Boolean(debugInfo.hasGroqApiKey))}</div>
              <div>groqModel: {debugInfo.groqModel ?? "unknown"}</div>
              <div>origin: {debugInfo.requestOrigin ?? "none"}</div>
              <div>host: {debugInfo.requestHost ?? "none"}</div>
              {typeof debugInfo.groqStatus === "number" ? (
                <div>
                  groqHttp: {debugInfo.groqStatus} {debugInfo.groqStatusText ?? ""}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="border-t border-[color:var(--border-subtle)] p-3">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    void sendMessage();
                  }
                }}
                placeholder="Tell me what to change..."
                className="h-10 flex-1 rounded-md border border-[color:var(--border-default)] bg-[color:var(--bg-surface)] px-3 text-sm text-[color:var(--text-primary)] outline-none focus:border-[color:var(--accent)]/60"
              />
              <button
                onClick={() => {
                  void sendMessage();
                }}
                disabled={sending}
                className="h-10 rounded-md bg-[color:var(--accent)] px-3 text-sm font-semibold text-black disabled:opacity-60"
              >
                {sending ? "..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 rounded-full bg-[color:var(--accent)] px-4 py-3 text-sm font-semibold text-black shadow-xl"
      >
        Chat
      </button>
    </>
  );
}
