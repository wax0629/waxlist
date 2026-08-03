"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
      {/* Travel-dashboard style: icon rail + chat + discovery */}
      <AppRail onNewChat={newChat} showNewChat={!isFresh} />

      <div className="flex min-w-0 flex-1 flex-col lg:flex-row">
        {/* CENTER: AI chat */}
        <section className="glass flex min-h-0 min-w-0 flex-1 flex-col rounded-none border-y-0 border-l-0 lg:max-w-[440px] xl:max-w-[480px]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 md:hidden">
            <div>
              <p className="font-display text-[14px] font-semibold text-white">
                Beat Hunter
              </p>
              <p className="text-[10px] text-white/40">找伴奏 · Beta</p>
            </div>
            {!isFresh ? (
              <button
                type="button"
                onClick={newChat}
                className="rounded-full px-3 py-1.5 text-[12px] text-white/50"
              >
                新会话
              </button>
            ) : null}
          </div>

          <div className="hidden items-center justify-between border-b border-white/10 px-5 py-3.5 md:flex">
            <div>
              <h1 className="font-display text-[14px] font-semibold tracking-tight text-white">
                AI 伴奏助手
              </h1>
              <p className="mt-0.5 text-[11px] text-white/40">
                描述需求 · 策略检索 · 短名单
              </p>
            </div>
            {lastStatus ? (
              <span
                className={
                  lastStatus === "ok"
                    ? "rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-medium text-emerald-200 ring-1 ring-emerald-300/20"
                    : lastStatus === "degraded"
                      ? "rounded-full bg-amber-400/15 px-2.5 py-1 text-[11px] font-medium text-amber-100 ring-1 ring-amber-300/20"
                      : "rounded-full bg-rose-400/15 px-2.5 py-1 text-[11px] font-medium text-rose-100 ring-1 ring-rose-300/20"
                }
              >
                {lastStatus === "ok"
                  ? "就绪"
                  : lastStatus === "degraded"
                    ? "降级"
                    : "错误"}
              </span>
            ) : null}
          </div>

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
                  <div className="max-w-[92%] rounded-2xl rounded-br-md border border-white/25 bg-gradient-to-br from-white/90 to-sky-100/85 px-3.5 py-2.5 text-[13.5px] leading-relaxed text-slate-900 shadow-[0_8px_32px_-12px_rgba(125,211,252,0.45)] backdrop-blur-md">
                    {t.content}
                  </div>
                </div>
              ) : (
                <div key={t.id} className="space-y-2.5">
                  <div className="glass-panel rounded-2xl rounded-bl-md px-3.5 py-3 text-[13.5px] leading-relaxed text-white/85">
                    {t.content}
                  </div>
                  <SearchMeta
                    intentSummary={t.intent_summary}
                    queriesUsed={t.queries_used}
                  />
                  {t.candidates && t.candidates.length > 0 ? (
                    <div className="grid gap-3 lg:hidden">
                      {t.candidates.map((b, i) => (
                        <BeatCard
                          key={b.id}
                          beat={b}
                          index={i}
                          featured={i === 0}
                        />
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
              <div className="flex items-center gap-2 text-[12px] text-sky-100/80">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-300/50" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-300" />
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
            className="border-t border-white/10 bg-white/[0.03] p-3 backdrop-blur-2xl sm:p-4"
          >
            <div className="glass-strong rounded-[1.25rem] p-2 focus-within:border-white/30 focus-within:shadow-[0_0_0_3px_rgba(165,180,252,0.15)]">
              <div className="flex items-end gap-2">
                <textarea
                  ref={composerRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={2}
                  placeholder="描述气质，或粘贴 YouTube 链接…"
                  className="max-h-36 min-h-[48px] flex-1 resize-none bg-transparent px-3 py-2.5 text-[16px] text-white placeholder:text-white/35 focus:outline-none sm:text-[13.5px]"
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
                  className="mb-1 min-h-11 shrink-0 rounded-xl bg-gradient-to-b from-white to-sky-100 px-4 font-display text-[13px] font-semibold text-slate-900 shadow-[0_10px_30px_-10px_rgba(186,230,253,0.55)] disabled:opacity-35"
                >
                  {loading ? "…" : "发送"}
                </button>
              </div>
            </div>
            <p className="mt-2 px-1 text-[10px] text-white/35">
              试听参考 · 商用以源站为准
            </p>
          </form>
        </section>

        <aside className="relative hidden min-h-0 min-w-0 flex-1 flex-col lg:flex">
          <div className="relative flex items-end justify-between gap-4 border-b border-white/10 bg-white/[0.03] px-6 py-4 backdrop-blur-xl xl:px-8">
            <div>
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-sky-200/60">
                Discover
              </p>
              <h2 className="mt-1 font-display text-[1.35rem] font-semibold tracking-tight text-white">
                伴奏发现
              </h2>
              <p className="mt-1 max-w-md text-[12px] text-white/45">
                极光玻璃卡片 · 策略排序后的可试听短名单
              </p>
            </div>
            {latestShortlist ? (
              <span className="glass mb-1 rounded-full px-3 py-1 font-mono text-[11px] font-medium text-sky-100">
                {latestShortlist.candidates.length} picks
              </span>
            ) : null}
          </div>

          <div className="relative min-h-0 flex-1 overflow-y-auto px-5 py-5 xl:px-8 xl:py-6">
            {loading && !latestShortlist ? (
              <ResultSkeleton label={loadingHint} />
            ) : latestShortlist ? (
              <div className="space-y-5">
                {latestShortlist.intent_summary ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="glass rounded-full px-3 py-1.5 text-[11px] text-white/70">
                      {latestShortlist.intent_summary}
                    </span>
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
                  {latestShortlist.candidates.map((b, i) => (
                    <BeatCard
                      key={b.id}
                      beat={b}
                      index={i}
                      featured={i === 0}
                    />
                  ))}
                </div>

                {latestShortlist.queries_used?.length ? (
                  <div className="pt-2">
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">
                      Search strategy
                    </p>
                    <ul className="flex flex-wrap gap-1.5">
                      {latestShortlist.queries_used.map((q) => (
                        <li
                          key={q}
                          className="glass rounded-full px-3 py-1 font-mono text-[10px] text-white/60"
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
              <div className="glass-panel flex h-full min-h-[320px] flex-col items-center justify-center rounded-[1.75rem] border-dashed px-10 text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-cyan-300/20 via-violet-300/20 to-fuchsia-300/15 ring-1 ring-white/15">
                  <span className="font-display text-2xl text-white/90">♪</span>
                </div>
                <p className="font-display text-[1.2rem] font-semibold text-white/90">
                  极光玻璃 · 伴奏发现
                </p>
                <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-white/45">
                  左侧对话后，这里铺开磨砂玻璃短名单——柔和极光作底，卡片透出层次。
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
