"use client";

import { useCallback, useEffect, useState } from "react";
import { BeatCard } from "@/components/beat-card";
import { SiteHeader } from "@/components/site-header";
import type { BeatCandidate, ChatMessage } from "@/lib/types";

const SESSION_KEY = "beat-hunter-session-id";

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "你好，我是 Beat Hunter。描述想要的伴奏气质，或粘贴 YouTube 参考曲链接，我会帮你收成可试听短名单。\n\n已接 Agent tool-calling（需 XAI_API_KEY）+ YouTube 检索（需 YOUTUBE_API_KEY）；缺 key 会自动降级。",
  created_at: new Date().toISOString(),
};

interface ChatApiResponse {
  session_id: string;
  assistant_message: string;
  candidates: BeatCandidate[];
  status: string;
  warnings?: string[];
  error?: string;
}

export default function ChatPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(true);

  const restoreSession = useCallback(async () => {
    try {
      const stored =
        typeof window !== "undefined"
          ? localStorage.getItem(SESSION_KEY)
          : null;
      if (!stored) {
        setRestoring(false);
        return;
      }
      const res = await fetch(`/api/session/${stored}`);
      if (!res.ok) {
        localStorage.removeItem(SESSION_KEY);
        setRestoring(false);
        return;
      }
      const data = (await res.json()) as {
        id: string;
        messages: ChatMessage[];
      };
      setSessionId(data.id);
      if (data.messages?.length) {
        setMessages([WELCOME, ...data.messages]);
      }
    } catch {
      // ignore restore errors
    } finally {
      setRestoring(false);
    }
  }, []);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  async function onSend(e?: React.FormEvent | React.KeyboardEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const optimisticUser: ChatMessage = {
      id: `local-${Date.now()}`,
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };

    setInput("");
    setError(null);
    setLoading(true);
    setMessages((prev) => [...prev, optimisticUser]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          message: text,
        }),
      });
      const data = (await res.json()) as ChatApiResponse;
      if (!res.ok) {
        throw new Error(data.error || `请求失败 (${res.status})`);
      }

      setSessionId(data.session_id);
      localStorage.setItem(SESSION_KEY, data.session_id);

      const warn =
        data.warnings && data.warnings.length
          ? `\n\n（${data.warnings.join(" ")}）`
          : "";

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: "assistant",
        content: `${data.assistant_message}${warn}`,
        created_at: new Date().toISOString(),
        candidates: data.candidates ?? [],
      };

      // Replace optimistic user+pending with server-aligned pair:
      // keep optimistic user text; append assistant only
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "网络错误";
      setError(msg);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `出了点问题：${msg}。请稍后再试。`,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#0b0b12] text-zinc-100">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-4 pt-6 md:px-6">
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto">
          {restoring && (
            <p className="text-xs text-zinc-500">恢复会话…</p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={
                m.role === "user" ? "flex justify-end" : "flex justify-start"
              }
            >
              <div
                className={
                  m.role === "user"
                    ? "max-w-[85%] rounded-2xl rounded-br-md bg-violet-600/90 px-4 py-2.5 text-sm text-white shadow-lg shadow-violet-900/30"
                    : "max-w-[95%] space-y-3"
                }
              >
                {m.role === "assistant" ? (
                  <>
                    <div className="rounded-2xl rounded-bl-md border border-white/10 bg-white/5 px-4 py-2.5 text-sm leading-relaxed text-zinc-200 whitespace-pre-wrap backdrop-blur-md">
                      {m.content}
                    </div>
                    {m.candidates && m.candidates.length > 0 && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {m.candidates.map((b) => (
                          <BeatCard key={b.id} beat={b} />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  m.content
                )}
              </div>
            </div>
          ))}
          {loading && (
            <p className="text-xs text-zinc-500 animate-pulse">正在猎取伴奏…</p>
          )}
          {error && (
            <p className="text-xs text-red-400/90">{error}</p>
          )}
        </div>

        <form
          onSubmit={onSend}
          className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-2 shadow-xl shadow-black/40 backdrop-blur-md"
        >
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={2}
              placeholder="描述气质，或粘贴参考曲链接…"
              className="min-h-[48px] flex-1 resize-none bg-transparent px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void onSend(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="mb-1 shrink-0 rounded-xl bg-violet-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              发送
            </button>
          </div>
          <p className="px-3 pb-1 text-[11px] text-zinc-500">
            结果仅供试听参考，商用请以源站授权为准。
            {sessionId ? (
              <span className="ml-2 text-zinc-600">
                会话 {sessionId.slice(0, 8)}…
              </span>
            ) : null}
          </p>
        </form>
      </main>
    </div>
  );
}
