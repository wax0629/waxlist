"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BeatCard } from "@/components/beat-card";
import { SiteHeader } from "@/components/site-header";
import type { BeatCandidate, ChatMessage } from "@/lib/types";

const SESSION_KEY = "beat-hunter-session-id";

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "你好，我是 Beat Hunter。用自然语言描述想要的伴奏，或粘贴 YouTube 参考曲链接，我会收成可试听短名单。\n\n试试：「适合女声的慢热 R&B，鼓别太抢」",
  created_at: new Date().toISOString(),
};

const SUGGESTIONS = [
  "适合女声的慢热 R&B，鼓别太抢",
  "偏暗一点的 trap soul type beat",
  "再快一点，旋律再抓耳一些",
];

interface ChatApiResponse {
  session_id: string;
  assistant_message: string;
  candidates: BeatCandidate[];
  status: string;
  warnings?: string[];
  error?: string;
}

export function ChatClient() {
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [lastStatus, setLastStatus] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const refBootstrapped = useRef(false);
  const loadingRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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

  const sendMessage = useCallback(
    async (text: string, opts?: { refUrl?: string }) => {
      const trimmed = text.trim();
      const refUrl = opts?.refUrl?.trim();
      if ((!trimmed && !refUrl) || loadingRef.current) return;

      const displayText = trimmed || `参考：${refUrl}`;
      const optimisticUser: ChatMessage = {
        id: `local-${Date.now()}`,
        role: "user",
        content: displayText,
        created_at: new Date().toISOString(),
      };

      setInput("");
      setError(null);
      setLoading(true);
      loadingRef.current = true;
      setMessages((prev) => [...prev, optimisticUser]);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            message: trimmed || undefined,
            ref_url: refUrl,
          }),
        });
        const data = (await res.json()) as ChatApiResponse;
        if (!res.ok) {
          throw new Error(data.error || `请求失败 (${res.status})`);
        }

        setSessionId(data.session_id);
        localStorage.setItem(SESSION_KEY, data.session_id);
        setLastStatus(data.status);

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

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "网络错误";
        setError(msg);
        setLastStatus("error");
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
        loadingRef.current = false;
      }
    },
    [sessionId],
  );

  // Deep-link: /chat?ref_url=...
  useEffect(() => {
    if (restoring || refBootstrapped.current) return;
    const refUrl = searchParams.get("ref_url") || searchParams.get("ref");
    if (!refUrl) return;
    refBootstrapped.current = true;
    void sendMessage(`请根据这首参考曲找相近气质的伴奏：${refUrl}`, {
      refUrl,
    });
  }, [restoring, searchParams, sendMessage]);

  async function onSend(e?: React.FormEvent | React.KeyboardEvent) {
    e?.preventDefault();
    await sendMessage(input);
  }

  function newChat() {
    localStorage.removeItem(SESSION_KEY);
    setSessionId(null);
    setMessages([WELCOME]);
    setError(null);
    setLastStatus(null);
    setInput("");
  }

  const showSuggestions =
    messages.length <= 1 && !loading && !restoring;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#0b0b12] text-zinc-100">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-4 pt-6 md:px-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[11px] text-zinc-500">
            {lastStatus ? (
              <span
                className={
                  lastStatus === "ok"
                    ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-300/90"
                    : lastStatus === "degraded"
                      ? "rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-200/90"
                      : "rounded-full bg-red-500/15 px-2 py-0.5 text-red-300/90"
                }
              >
                {lastStatus === "ok"
                  ? "Agent 正常"
                  : lastStatus === "degraded"
                    ? "降级模式"
                    : "出错"}
              </span>
            ) : (
              <span className="text-zinc-600">找伴奏</span>
            )}
            {sessionId ? (
              <span className="text-zinc-600">会话 {sessionId.slice(0, 8)}…</span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={newChat}
            className="text-[11px] text-zinc-400 underline-offset-2 hover:text-zinc-200 hover:underline"
          >
            新会话
          </button>
        </div>

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
                        {m.candidates.map((b, i) => (
                          <BeatCard key={b.id} beat={b} index={i} />
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
          {showSuggestions && (
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={loading}
                  onClick={() => void sendMessage(s)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-left text-xs text-zinc-300 transition hover:border-violet-400/40 hover:bg-white/10"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          {loading && (
            <div className="space-y-1">
              <p className="text-xs text-zinc-500 animate-pulse">
                正在猎取伴奏（Agent + 检索可能需要十几秒）…
              </p>
            </div>
          )}
          {error && <p className="text-xs text-red-400/90">{error}</p>}
          <div ref={bottomRef} />
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
              {loading ? "…" : "发送"}
            </button>
          </div>
          <p className="px-3 pb-1 text-[11px] text-zinc-500">
            结果仅供试听参考，商用请以源站授权为准。
          </p>
        </form>
      </main>
    </div>
  );
}
