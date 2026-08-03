"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppRail } from "@/components/app-rail";
import { BeatCard } from "@/components/beat-card";
import { ChatHero } from "@/components/chat-hero";
import { EmptyResults } from "@/components/empty-results";
import { ResultSkeleton } from "@/components/result-skeleton";
import { SearchMeta } from "@/components/search-meta";
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
      intent?: SearchIntent;
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
        intent: m.intent,
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

  const latestShortlist = useMemo(() => {
    for (let i = turns.length - 1; i >= 0; i--) {
      const t = turns[i];
      if (t.kind === "assistant" && t.candidates && t.candidates.length > 0) {
        return {
          candidates: t.candidates,
          intent_summary: t.intent_summary,
          queries_used: t.queries_used,
        };
      }
    }
    return null;
  }, [turns]);

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
      if (data.messages?.length) setTurns(toTurns(data.messages));
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
      setInput("");
      setError(null);
      setLastFailedText(null);
      setLoading(true);
      loadingRef.current = true;
      setTurns((prev) => [
        ...prev,
        { kind: "user", id: `local-${Date.now()}`, content: displayText },
      ]);

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
        if (!res.ok) throw new Error(data.error || `请求失败 (${res.status})`);

        setSessionId(data.session_id);
        localStorage.setItem(SESSION_KEY, data.session_id);
        setLastStatus(data.status);

        const warn =
          data.warnings?.length ? `\n\n（${data.warnings.join(" ")}）` : "";
        const candidates = data.candidates ?? [];
        setTurns((prev) => [
          ...prev,
          {
            kind: "assistant",
            id: `asst-${Date.now()}`,
            content: `${data.assistant_message}${warn}`,
            candidates,
            intent_summary: data.intent_summary,
            queries_used: data.queries_used,
            intent: data.intent,
            empty: candidates.length === 0,
          },
        ]);
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
    <div className="flex min-h-dvh flex-1 text-[var(--cream)]">
      <AppRail onNewChat={newChat} showNewChat={!isFresh} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col px-3 pb-3 pt-3 sm:px-4 sm:pb-4 sm:pt-3.5 md:px-5 md:pb-5 md:pt-4">
        {/* Top nav — outside liquid glass panes */}
        <header className="mb-3 flex shrink-0 items-center justify-between gap-3 px-0.5 sm:mb-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="md:hidden">
              <p className="font-display text-[14px] font-semibold text-white">
                Beat Hunter
              </p>
              <p className="text-[10px] text-white/40">找伴奏 · Beta</p>
            </div>
            <div className="touri-pills max-md:hidden">
              <span className="touri-pill touri-pill-active">✨ AI Chat</span>
              <span className="touri-pill cursor-not-allowed opacity-50">
                🎵 精选
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            {lastStatus ? (
              <span
                className={
                  lastStatus === "ok"
                    ? "rounded-full border border-emerald-300/25 bg-transparent px-2.5 py-1 text-[11px] font-medium text-emerald-200"
                    : lastStatus === "degraded"
                      ? "rounded-full border border-amber-300/25 bg-transparent px-2.5 py-1 text-[11px] font-medium text-amber-100"
                      : "rounded-full border border-rose-300/25 bg-transparent px-2.5 py-1 text-[11px] font-medium text-rose-100"
                }
              >
                {lastStatus === "ok"
                  ? "就绪"
                  : lastStatus === "degraded"
                    ? "降级"
                    : "错误"}
              </span>
            ) : null}
            {/* Circular glass user card — profile page later */}
            <Link
              href="/about"
              className="user-orb"
              title="用户（即将上线）"
              aria-label="用户中心"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <circle
                  cx="12"
                  cy="9"
                  r="3.2"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="M5.5 19c1.2-3 3.4-4.5 6.5-4.5s5.3 1.5 6.5 4.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </Link>
          </div>
        </header>

        {/* Two liquid-glass panes under nav — ~52:48 (right a bit wider) */}
        <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row lg:gap-4">
          {/* LEFT: chat glass card */}
          <section className="liquid-glass flex min-h-0 min-w-0 flex-1 flex-col lg:flex-[11]">
            {!isFresh ? (
              <div className="flex shrink-0 items-center justify-end border-b border-white/[0.08] px-3.5 py-2.5 sm:px-4">
                <button
                  type="button"
                  onClick={newChat}
                  className="rounded-full border border-white/15 bg-transparent px-3.5 py-1.5 text-[12px] font-medium text-white/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] transition hover:border-white/30 hover:text-white"
                >
                  + 新会话
                </button>
              </div>
            ) : null}
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
            {restoring && <p className="text-xs text-white/40">恢复会话…</p>}

            {isFresh && (
              <ChatHero
                suggestions={SUGGESTIONS}
                disabled={loading}
                onPick={(s) => void sendMessage(s)}
              />
            )}

            {turns.map((t) =>
              t.kind === "user" ? (
                <div key={t.id} className="flex justify-end">
                  <div className="touri-user-bubble max-w-[92%] rounded-2xl rounded-br-md px-3.5 py-2.5 text-[13.5px] leading-relaxed">
                    {t.content}
                  </div>
                </div>
              ) : (
                <div key={t.id} className="space-y-2.5">
                  <div className="glass-frame rounded-2xl rounded-bl-md px-3.5 py-3 text-[13.5px] leading-relaxed text-white/85">
                    {t.content}
                  </div>
                  <SearchMeta
                    intentSummary={t.intent_summary}
                    queriesUsed={t.queries_used}
                    intent={t.intent}
                    disabled={loading}
                    onRefine={(msg) => void sendMessage(msg)}
                  />
                  {t.candidates && t.candidates.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
                      {t.candidates.map((b, i) => (
                        <BeatCard key={b.id} beat={b} index={i} />
                      ))}
                    </div>
                  ) : null}
                  {t.empty ? (
                    <EmptyResults
                      onRetry={() => {
                        const prevUser = [...turns]
                          .reverse()
                          .find((x) => x.kind === "user");
                        if (prevUser?.kind === "user") {
                          void sendMessage(prevUser.content);
                        }
                      }}
                      onNewDirection={newChat}
                    />
                  ) : null}
                </div>
              ),
            )}

            {loading && (
              <div className="flex items-center gap-2 text-[12px] text-[#ff8fb3]">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff6b9e]/50" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-gradient-to-br from-[#ff6b9e] to-[#9b51e0]" />
                </span>
                {loadingHint}
              </div>
            )}

            {error && (
              <div className="glass-panel rounded-2xl border-rose-300/25 px-4 py-3">
                <p className="text-[13px] font-medium text-rose-200">请求失败</p>
                <p className="mt-1 text-[12px] text-white/55">{error}</p>
                {lastFailedText ? (
                  <button
                    type="button"
                    className="mt-3 min-h-10 rounded-xl bg-rose-400/20 px-4 text-[12px] font-semibold text-rose-50"
                    onClick={() => void sendMessage(lastFailedText)}
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
            className="border-t border-white/[0.1] bg-transparent p-3 sm:p-4"
          >
            <div className="touri-input-shell">
              <div className="touri-input-inner flex items-end gap-2 px-3 py-2.5 sm:px-4">
                <textarea
                  ref={composerRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={2}
                  placeholder="✨ 描述气质，或粘贴 YouTube 链接…"
                  className="max-h-36 min-h-[40px] flex-1 resize-none bg-transparent py-1.5 text-[16px] text-white placeholder:text-white/40 focus:outline-none sm:text-[14px]"
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
                  className="touri-send mb-0.5"
                  aria-label="发送"
                >
                  {loading ? (
                    <span className="text-[13px]">…</span>
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M12 19V5M12 5l-6 6M12 5l6 6"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <p className="mt-2 px-1 text-[10px] text-white/35">
              试听参考 · 商用以源站为准
            </p>
          </form>
          </section>

          {/* RIGHT: discover glass card — ~48% */}
          <aside className="liquid-glass hidden min-h-0 min-w-0 flex-col lg:flex lg:flex-[10]">
            <div className="flex items-end justify-between gap-3 border-b border-white/[0.08] px-4 py-3.5">
              <div>
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-[#ff8fb3]/90">
                  Discover
                </p>
                <h2 className="mt-0.5 font-display text-[1.1rem] font-semibold tracking-tight text-white">
                  伴奏发现
                </h2>
              </div>
              {latestShortlist ? (
                <span className="glass mb-0.5 rounded-full px-2.5 py-1 font-mono text-[10px] font-medium text-[#ff8fb3]">
                  {latestShortlist.candidates.length} picks
                </span>
              ) : null}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3.5 py-4">
              {loading && !latestShortlist ? (
                <ResultSkeleton label={loadingHint} />
              ) : latestShortlist ? (
                <div className="space-y-4">
                  {latestShortlist.intent_summary ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="glass rounded-full px-3 py-1.5 text-[11px] text-white/70">
                        {latestShortlist.intent_summary}
                      </span>
                    </div>
                  ) : null}

                  <div className="grid grid-cols-2 gap-3">
                    {latestShortlist.candidates.map((b, i) => (
                      <BeatCard key={b.id} beat={b} index={i} />
                    ))}
                  </div>

                  {latestShortlist.queries_used?.length ? (
                    <div className="pt-1">
                      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">
                        Search strategy
                      </p>
                      <ul className="flex flex-wrap gap-1.5">
                        {latestShortlist.queries_used.map((q) => (
                          <li
                            key={q}
                            className="glass rounded-full px-2.5 py-1 font-mono text-[10px] text-white/60"
                            title={q}
                          >
                            {q}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="flex h-full min-h-[280px] flex-col items-center justify-center px-6 text-center">
                  <p className="font-display text-[1rem] font-semibold text-white/90">
                    等待短名单
                  </p>
                  <p className="mt-2 max-w-[14rem] text-[12px] leading-relaxed text-white/45">
                    左侧描述需求后，这里会列出统一样式的可试听结果。
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
