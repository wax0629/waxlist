"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BeatCard } from "@/components/beat-card";
import { ChatHero } from "@/components/chat-hero";
import { EmptyResults } from "@/components/empty-results";
import { ResultSkeleton } from "@/components/result-skeleton";
import { SearchMeta } from "@/components/search-meta";
import { SiteHeader } from "@/components/site-header";
import type { BeatCandidate, ChatMessage, SearchIntent } from "@/lib/types";

const SESSION_KEY = "beat-hunter-session-id";

const SUGGESTIONS = [
  "适合女声的慢热 R&B，鼓别太抢",
  "udg type beat，偏暗一点",
  "偏暗 trap soul，适合写词",
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

type Turn =
  | { kind: "user"; id: string; content: string }
  | {
      kind: "assistant";
      id: string;
      content: string;
      candidates?: BeatCandidate[];
      intent_summary?: string;
      queries_used?: string[];
      empty?: boolean;
    };

function toTurns(messages: ChatMessage[]): Turn[] {
  const out: Turn[] = [];
  for (const m of messages) {
    if (m.role === "user") {
      out.push({ kind: "user", id: m.id, content: m.content });
    } else if (m.role === "assistant") {
      const empty =
        Array.isArray(m.candidates) &&
        m.candidates.length === 0 &&
        !m.content.includes("出了点问题");
      out.push({
        kind: "assistant",
        id: m.id,
        content: m.content,
        candidates: m.candidates,
        intent_summary: m.intent_summary,
        queries_used: m.queries_used,
        empty: empty || undefined,
      });
    }
  }
  return out;
}

export function ChatClient() {
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
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
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const isFresh = turns.length === 0 && !loading && !restoring;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, loading, error]);

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
        setTurns(toTurns(data.messages));
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
      const userTurn: Turn = {
        kind: "user",
        id: `local-${Date.now()}`,
        content: displayText,
      };

      setInput("");
      setError(null);
      setLastFailedText(null);
      setLoading(true);
      loadingRef.current = true;
      setTurns((prev) => [...prev, userTurn]);

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

        const candidates = data.candidates ?? [];
        const assistantTurn: Turn = {
          kind: "assistant",
          id: `asst-${Date.now()}`,
          content: `${data.assistant_message}${warn}`,
          candidates,
          intent_summary: data.intent_summary,
          queries_used: data.queries_used,
          empty: candidates.length === 0,
        };

        setTurns((prev) => [...prev, assistantTurn]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "网络错误";
        setError(msg);
        setLastFailedText(displayText);
        setLastStatus("error");
        setTurns((prev) => [
          ...prev,
          {
            kind: "assistant",
            id: `err-${Date.now()}`,
            content: `出了点问题：${msg}`,
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
    setTurns([]);
    setError(null);
    setLastStatus(null);
    setLastFailedText(null);
    setInput("");
    composerRef.current?.focus();
  }

  return (
    <div className="flex min-h-dvh flex-1 flex-col text-zinc-100">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-4 md:px-6 md:pt-4">
        {/* Status bar — compact on mobile */}
        <div className="mb-2 flex items-center justify-between gap-2 sm:mb-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-[11px]">
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
                    ? "降级"
                    : "出错"}
              </span>
            ) : isFresh ? (
              <span className="text-zinc-600">准备就绪</span>
            ) : (
              <span className="text-zinc-600">进行中</span>
            )}
          </div>
          {!isFresh ? (
            <button
              type="button"
              onClick={newChat}
              className="min-h-9 shrink-0 rounded-lg px-2.5 text-[12px] text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-200"
            >
              新会话
            </button>
          ) : null}
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain pb-3">
          {restoring && (
            <p className="text-xs text-zinc-500">恢复会话…</p>
          )}

          {/* 1. First-screen product narrative */}
          {isFresh && (
            <ChatHero
              suggestions={SUGGESTIONS}
              disabled={loading}
              onPick={(s) => void sendMessage(s)}
            />
          )}

          {/* Conversation */}
          {turns.map((t) =>
            t.kind === "user" ? (
              <div key={t.id} className="flex justify-end">
                <div className="max-w-[min(88%,22rem)] rounded-2xl rounded-br-md bg-gradient-to-br from-violet-500 to-violet-700 px-3.5 py-2.5 text-[13px] leading-relaxed text-white shadow-lg shadow-violet-950/40 sm:max-w-[min(85%,28rem)] sm:px-4">
                  {t.content}
                </div>
              </div>
            ) : (
              <div key={t.id} className="flex w-full justify-start">
                <div className="w-full max-w-full space-y-2.5 sm:max-w-[95%]">
                  <div className="rounded-2xl rounded-bl-md border border-white/[0.07] bg-white/[0.035] px-3.5 py-3 text-[13px] leading-relaxed text-zinc-200 whitespace-pre-wrap shadow-lg shadow-black/20 backdrop-blur-md sm:px-4">
                    {t.content}
                  </div>
                  <SearchMeta
                    intentSummary={t.intent_summary}
                    queriesUsed={t.queries_used}
                  />
                  {/* 3. Empty results state */}
                  {t.empty ? (
                    <EmptyResults
                      onRetry={
                        lastFailedText
                          ? undefined
                          : () => {
                              const prevUser = [...turns]
                                .reverse()
                                .find((x) => x.kind === "user");
                              if (prevUser && prevUser.kind === "user") {
                                void sendMessage(prevUser.content);
                              }
                            }
                      }
                      onNewDirection={newChat}
                    />
                  ) : null}
                  {t.candidates && t.candidates.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-2">
                      {t.candidates.map((b, i) => (
                        <BeatCard key={b.id} beat={b} index={i} />
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ),
          )}

          {/* 3. Loading skeleton */}
          {loading && <ResultSkeleton label={loadingHint} />}

          {/* 3. Error state */}
          {error && (
            <div className="flex flex-col gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[13px] font-medium text-red-200/95">请求失败</p>
                <p className="mt-0.5 text-[12px] text-red-300/70">{error}</p>
              </div>
              {lastFailedText ? (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void sendMessage(lastFailedText)}
                  className="min-h-10 shrink-0 rounded-xl bg-red-500/20 px-4 py-2 text-[12px] font-semibold text-red-100 transition hover:bg-red-500/30"
                >
                  重试上一条
                </button>
              ) : null}
            </div>
          )}

          <div ref={bottomRef} className="h-px shrink-0" />
        </div>

        {/* Composer — mobile safe area + thumb reach */}
        <form
          onSubmit={onSend}
          className="sticky bottom-0 z-20 mt-auto border border-white/[0.08] bg-[#0c0c12]/90 p-2 shadow-2xl shadow-black/60 ring-1 ring-white/[0.04] backdrop-blur-xl rounded-2xl sm:p-2.5"
        >
          <div className="flex items-end gap-2">
            <textarea
              ref={composerRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={2}
              placeholder="描述气质，或粘贴 YouTube 链接…"
              className="max-h-32 min-h-[48px] flex-1 resize-none bg-transparent px-2.5 py-2.5 text-[16px] text-zinc-100 placeholder:text-zinc-600 focus:outline-none sm:min-h-[52px] sm:px-3 sm:text-[13px]"
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
              className="mb-0.5 min-h-11 min-w-[4.5rem] shrink-0 rounded-xl bg-gradient-to-b from-violet-400 to-violet-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-violet-950/50 transition hover:from-violet-300 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-35 sm:min-h-10 sm:min-w-0 sm:px-5"
            >
              {loading ? "…" : "发送"}
            </button>
          </div>
          <p className="px-2.5 pb-0.5 text-[10px] leading-relaxed text-zinc-600 sm:px-3">
            试听参考 · 商用以源站为准
            <span className="hidden sm:inline">
              {" "}
              · Enter 发送 · Shift+Enter 换行
            </span>
          </p>
        </form>
      </main>
    </div>
  );
}
