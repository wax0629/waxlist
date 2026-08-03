"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
    <div className="flex min-h-dvh flex-1 flex-col text-[var(--cream)]">
      <SiteHeader />

      <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col lg:min-h-0 lg:flex-row">
        {/* LEFT */}
        <section className="flex min-w-0 flex-1 flex-col border-[var(--line)] lg:max-w-[min(48%,680px)] lg:border-r">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-2 text-[12px]">
              {lastStatus ? (
                <span
                  className={
                    lastStatus === "ok"
                      ? "rounded-full bg-[color-mix(in_srgb,var(--ok)_14%,transparent)] px-2.5 py-1 font-medium text-[var(--ok)] ring-1 ring-[color-mix(in_srgb,var(--ok)_25%,transparent)]"
                      : lastStatus === "degraded"
                        ? "rounded-full bg-[color-mix(in_srgb,var(--warn)_14%,transparent)] px-2.5 py-1 font-medium text-[var(--warn)] ring-1 ring-[color-mix(in_srgb,var(--warn)_25%,transparent)]"
                        : "rounded-full bg-[color-mix(in_srgb,var(--danger)_14%,transparent)] px-2.5 py-1 font-medium text-[var(--danger)] ring-1 ring-[color-mix(in_srgb,var(--danger)_25%,transparent)]"
                  }
                >
                  {lastStatus === "ok"
                    ? "检索正常"
                    : lastStatus === "degraded"
                      ? "降级"
                      : "出错"}
                </span>
              ) : (
                <span className="text-[var(--cream-faint)]">对话</span>
              )}
              {sessionId ? (
                <span className="truncate font-mono text-[11px] text-[var(--cream-faint)]">
                  {sessionId.slice(0, 8)}
                </span>
              ) : null}
            </div>
            {!isFresh ? (
              <button
                type="button"
                onClick={newChat}
                className="rounded-full px-3 py-1.5 text-[12px] text-[var(--cream-muted)] transition hover:bg-[var(--gold-dim)] hover:text-[var(--cream)]"
              >
                新会话
              </button>
            ) : null}
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 lg:px-7">
            {restoring && (
              <p className="text-xs text-[var(--cream-faint)]">恢复会话…</p>
            )}

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
                  <div className="max-w-[90%] rounded-[1.25rem] rounded-br-md bg-gradient-to-br from-[var(--gold-soft)] to-[var(--gold)] px-4 py-2.5 text-[14px] leading-relaxed text-[var(--ink)] shadow-[0_10px_28px_-12px_rgba(212,165,116,0.55)] sm:max-w-[85%]">
                    {t.content}
                  </div>
                </div>
              ) : (
                <div key={t.id} className="space-y-3">
                  <div className="rounded-[1.25rem] rounded-bl-md border border-[var(--line)] bg-[var(--ink-elevated)] px-4 py-3.5 text-[14px] leading-relaxed text-[var(--cream-soft)] shadow-[0_1px_0_rgba(243,238,230,0.04)_inset]">
                    {t.content}
                  </div>
                  <SearchMeta
                    intentSummary={t.intent_summary}
                    queriesUsed={t.queries_used}
                  />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
                    {t.candidates?.map((b, i) => (
                      <BeatCard key={b.id} beat={b} index={i} />
                    ))}
                  </div>
                  {t.empty ? (
                    <EmptyResults
                      onRetry={() => {
                        const prevUser = [...turns]
                          .reverse()
                          .find((x) => x.kind === "user");
                        if (prevUser && prevUser.kind === "user") {
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
              <div className="lg:hidden">
                <ResultSkeleton label={loadingHint} />
              </div>
            )}
            {loading && (
              <div className="hidden items-center gap-2 text-[13px] text-[var(--gold-soft)] lg:flex">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--gold)]/40" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--gold)]" />
                </span>
                {loadingHint}
              </div>
            )}

            {error && (
              <div className="flex flex-col gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--danger)_8%,transparent)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[13px] font-medium text-[var(--danger)]">
                    请求失败
                  </p>
                  <p className="mt-0.5 text-[12px] text-[var(--cream-muted)]">
                    {error}
                  </p>
                </div>
                {lastFailedText ? (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void sendMessage(lastFailedText)}
                    className="min-h-10 rounded-xl bg-[color-mix(in_srgb,var(--danger)_18%,transparent)] px-4 text-[12px] font-semibold text-[var(--cream)]"
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
            className="border-t border-[var(--line)] bg-[color-mix(in_srgb,var(--ink)_88%,transparent)] p-3 backdrop-blur-xl sm:p-4"
          >
            <div className="rounded-[1.25rem] border border-[var(--line-strong)] bg-[var(--ink-elevated)] p-2 focus-within:border-[rgba(212,165,116,0.35)] focus-within:shadow-[0_0_0_3px_var(--gold-dim)]">
              <div className="flex items-end gap-2">
                <textarea
                  ref={composerRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={2}
                  placeholder="描述气质，或粘贴 YouTube 参考链接…"
                  className="max-h-36 min-h-[48px] flex-1 resize-none bg-transparent px-3 py-2.5 text-[16px] text-[var(--cream)] placeholder:text-[var(--cream-faint)] focus:outline-none sm:text-[14px]"
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
                  className="mb-1 min-h-11 shrink-0 rounded-xl bg-gradient-to-b from-[var(--gold-soft)] to-[var(--gold)] px-5 font-display text-[13px] font-semibold text-[var(--ink)] shadow-[0_10px_28px_-10px_rgba(212,165,116,0.65)] transition hover:brightness-105 disabled:opacity-35"
                >
                  {loading ? "…" : "发送"}
                </button>
              </div>
            </div>
            <p className="mt-2 px-1 text-[11px] text-[var(--cream-faint)]">
              试听参考 · 商用以源站为准
              <span className="hidden sm:inline">
                {" "}
                · Enter 发送 · Shift+Enter 换行
              </span>
            </p>
          </form>
        </section>

        {/* RIGHT */}
        <aside className="hidden min-h-0 min-w-0 flex-1 flex-col bg-[var(--ink-2)]/40 lg:flex">
          <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-3.5">
            <div>
              <h2 className="font-display text-[14px] font-semibold tracking-tight text-[var(--cream)]">
                本轮短名单
              </h2>
              <p className="mt-0.5 text-[11px] text-[var(--cream-faint)]">
                策略排序后的可试听结果
              </p>
            </div>
            {latestShortlist ? (
              <span className="rounded-full bg-[var(--gold-dim)] px-2.5 py-1 font-mono text-[11px] font-medium text-[var(--gold)] ring-1 ring-[rgba(212,165,116,0.25)]">
                {latestShortlist.candidates.length}
              </span>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 xl:px-7">
            {loading && !latestShortlist ? (
              <ResultSkeleton label={loadingHint} />
            ) : latestShortlist ? (
              <div className="space-y-4">
                {latestShortlist.intent_summary ? (
                  <p className="rounded-2xl border border-[var(--line)] bg-black/25 px-4 py-3 text-[12px] leading-relaxed text-[var(--cream-muted)]">
                    <span className="font-medium text-[var(--gold)]">理解 · </span>
                    {latestShortlist.intent_summary}
                  </p>
                ) : null}
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  {latestShortlist.candidates.map((b, i) => (
                    <BeatCard key={b.id} beat={b} index={i} />
                  ))}
                </div>
                {latestShortlist.queries_used &&
                latestShortlist.queries_used.length > 0 ? (
                  <div className="pt-2">
                    <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--cream-faint)]">
                      Queries
                    </p>
                    <ul className="flex flex-wrap gap-1.5">
                      {latestShortlist.queries_used.map((q) => (
                        <li
                          key={q}
                          className="rounded-lg bg-black/30 px-2.5 py-1 font-mono text-[10px] text-[var(--cream-muted)] ring-1 ring-[var(--line)]"
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
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-[var(--line-strong)] bg-[var(--ink-elevated)]/40 px-8 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--gold-dim)] ring-1 ring-[rgba(212,165,116,0.3)]">
                  <span className="font-display text-lg text-[var(--gold)]">♪</span>
                </div>
                <p className="font-display text-[16px] font-semibold text-[var(--cream-soft)]">
                  短名单会显示在这里
                </p>
                <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-[var(--cream-muted)]">
                  左侧发起检索后，筛选结果铺在此宽栏——告别中间一条窄栏。
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
