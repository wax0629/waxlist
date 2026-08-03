"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BeatCard } from "@/components/beat-card";
import { SearchMeta } from "@/components/search-meta";
import { SiteHeader } from "@/components/site-header";
import type { BeatCandidate, ChatMessage, SearchIntent } from "@/lib/types";

const SESSION_KEY = "beat-hunter-session-id";

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "你好，我是 Beat Hunter。用自然语言描述想要的伴奏，或粘贴 YouTube 参考曲链接。\n\n我会先理解需求，再生成多路伴奏域检索词并筛选短名单——不是简单套一层 YouTube 搜索。",
  created_at: new Date().toISOString(),
};

const SUGGESTIONS = [
  "适合女声的慢热 R&B，鼓别太抢",
  "偏暗一点的 trap soul type beat",
  "再快一点，旋律再抓耳一些",
];

const LOADING_HINTS = [
  "理解需求…",
  "生成伴奏域检索词…",
  "多路检索 YouTube…",
  "过滤排序短名单…",
];

interface ChatApiResponse {
  session_id: string;
  assistant_message: string;
  candidates: BeatCandidate[];
  status: string;
  warnings?: string[];
  intent?: SearchIntent;
  intent_summary?: string;
  queries_used?: string[];
  error?: string;
}

export function ChatClient() {
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHint, setLoadingHint] = useState(LOADING_HINTS[0]);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [lastStatus, setLastStatus] = useState<string | null>(null);
  const [lastFailedText, setLastFailedText] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const refBootstrapped = useRef(false);
  const loadingRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!loading) return;
    let i = 0;
    setLoadingHint(LOADING_HINTS[0]);
    const t = setInterval(() => {
      i = (i + 1) % LOADING_HINTS.length;
      setLoadingHint(LOADING_HINTS[i]);
    }, 1600);
    return () => clearInterval(t);
  }, [loading]);

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
      // ignore
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
      setLastFailedText(null);
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
          intent_summary: data.intent_summary,
          queries_used: data.queries_used,
          intent: data.intent,
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "网络错误";
        setError(msg);
        setLastFailedText(displayText);
        setLastStatus("error");
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            content: `出了点问题：${msg}。可点下方重试。`,
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

  const showSuggestions = messages.length <= 1 && !loading && !restoring;

  return (
    <div className="flex min-h-dvh flex-1 flex-col text-zinc-100">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-6 pt-4 md:px-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            {lastStatus ? (
              <span
                className={
                  lastStatus === "ok"
                    ? "rounded-full bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-300/90 ring-1 ring-emerald-500/20"
                    : lastStatus === "degraded"
                      ? "rounded-full bg-amber-500/10 px-2.5 py-1 font-medium text-amber-200/90 ring-1 ring-amber-500/20"
                      : "rounded-full bg-red-500/10 px-2.5 py-1 font-medium text-red-300/90 ring-1 ring-red-500/20"
                }
              >
                {lastStatus === "ok"
                  ? "检索正常"
                  : lastStatus === "degraded"
                    ? "降级模式"
                    : "出错"}
              </span>
            ) : (
              <span className="text-zinc-600">策略检索 · 伴奏短名单</span>
            )}
            {sessionId ? (
              <span className="hidden text-zinc-600 sm:inline">
                {sessionId.slice(0, 8)}…
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={newChat}
            className="rounded-lg px-2 py-1 text-[11px] text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-200"
          >
            新会话
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto pb-3">
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
                    ? "max-w-[min(85%,28rem)] rounded-2xl rounded-br-md bg-gradient-to-br from-violet-500 to-violet-700 px-4 py-2.5 text-[13px] leading-relaxed text-white shadow-lg shadow-violet-950/50"
                    : "w-full max-w-[95%] space-y-2.5"
                }
              >
                {m.role === "assistant" ? (
                  <>
                    <div className="rounded-2xl rounded-bl-md border border-white/[0.07] bg-white/[0.035] px-4 py-3 text-[13px] leading-relaxed text-zinc-200 whitespace-pre-wrap shadow-lg shadow-black/20 backdrop-blur-md">
                      {m.content}
                    </div>
                    <SearchMeta
                      intentSummary={m.intent_summary}
                      queriesUsed={m.queries_used}
                    />
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
            <div className="space-y-2">
              <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                试试这样问
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={loading}
                    onClick={() => void sendMessage(s)}
                    className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 py-1.5 text-left text-[12px] text-zinc-400 transition hover:border-violet-400/30 hover:bg-violet-500/10 hover:text-zinc-200"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {loading && (
            <div className="flex items-center gap-2 text-xs text-violet-300/80">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400/40" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-400/80" />
              </span>
              <span className="animate-pulse">{loadingHint}</span>
            </div>
          )}
          {error && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs">
              <p className="text-red-300/90">{error}</p>
              {lastFailedText ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void sendMessage(lastFailedText)}
                  className="rounded-lg bg-red-500/15 px-2.5 py-1 font-medium text-red-200/90 transition hover:bg-red-500/25"
                >
                  重试上一条
                </button>
              ) : null}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={onSend}
          className="sticky bottom-0 mt-auto rounded-2xl border border-white/[0.08] bg-[#0c0c12]/85 p-2 shadow-2xl shadow-black/60 ring-1 ring-white/[0.04] backdrop-blur-xl"
        >
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={2}
              placeholder="描述气质，或粘贴参考曲链接…"
              className="min-h-[52px] flex-1 resize-none bg-transparent px-3 py-2.5 text-[13px] text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
              onKeyDown={(e) => {
                if (e.nativeEvent.isComposing || e.keyCode === 229) return;
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void onSend(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="mb-1 shrink-0 rounded-xl bg-gradient-to-b from-violet-400 to-violet-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-violet-950/50 transition hover:from-violet-300 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-35"
            >
              {loading ? "…" : "发送"}
            </button>
          </div>
          <p className="px-3 pb-1 text-[10px] leading-relaxed text-zinc-600">
            结果仅供试听参考，商用请以源站授权为准。Enter 发送 · Shift+Enter 换行
          </p>
        </form>
      </main>
    </div>
  );
}
