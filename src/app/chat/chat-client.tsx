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
    <div className="flex min-h-dvh flex-1 flex-col text-zinc-100">
      <SiteHeader />

      {/* Full-bleed workspace — no skinny center column */}
      <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col lg:min-h-0 lg:flex-row">
        {/* LEFT: conversation */}
        <section className="flex min-w-0 flex-1 flex-col border-white/[0.05] lg:max-w-[min(52%,720px)] lg:border-r">
          <div className="flex items-center justify-between gap-3 border-b border-white/[0.05] px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-2 text-[12px]">
              {lastStatus ? (
                <span
                  className={
                    lastStatus === "ok"
                      ? "rounded-full bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-300/90 ring-1 ring-emerald-500/15"
                      : lastStatus === "degraded"
                        ? "rounded-full bg-amber-500/10 px-2.5 py-1 font-medium text-amber-200/90 ring-1 ring-amber-500/15"
                        : "rounded-full bg-red-500/10 px-2.5 py-1 font-medium text-red-300/90 ring-1 ring-red-500/15"
                  }
                >
                  {lastStatus === "ok"
                    ? "检索正常"
                    : lastStatus === "degraded"
                      ? "降级"
                      : "出错"}
                </span>
              ) : (
                <span className="text-zinc-500">对话</span>
              )}
              {sessionId ? (
                <span className="truncate font-mono text-[11px] text-zinc-600">
                  {sessionId.slice(0, 8)}
                </span>
              ) : null}
            </div>
            {!isFresh ? (
              <button
                type="button"
                onClick={newChat}
                className="rounded-full px-3 py-1.5 text-[12px] text-zinc-500 transition hover:bg-white/[0.05] hover:text-zinc-200"
              >
                新会话
              </button>
            ) : null}
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 lg:px-7">
            {restoring && (
              <p className="text-xs text-zinc-500">恢复会话…</p>
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
                  <div className="max-w-[90%] rounded-[1.25rem] rounded-br-md bg-gradient-to-br from-violet-500/95 to-violet-700 px-4 py-2.5 text-[14px] leading-relaxed text-white shadow-[0_8px_30px_-12px_rgba(91,33,182,0.7)] sm:max-w-[85%]">
                    {t.content}
                  </div>
                </div>
              ) : (
                <div key={t.id} className="space-y-3">
                  <div className="rounded-[1.25rem] rounded-bl-md border border-white/[0.06] bg-white/[0.03] px-4 py-3.5 text-[14px] leading-relaxed text-zinc-200 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] backdrop-blur-md">
                    {t.content}
                  </div>
                  <SearchMeta
                    intentSummary={t.intent_summary}
                    queriesUsed={t.queries_used}
                  />
                  {/* Mobile: show cards under chat; desktop uses right panel */}
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
              <div className="hidden items-center gap-2 text-[13px] text-violet-200/80 lg:flex">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400/40" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-400" />
                </span>
                {loadingHint}
              </div>
            )}

            {error && (
              <div className="flex flex-col gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[13px] font-medium text-red-200">请求失败</p>
                  <p className="mt-0.5 text-[12px] text-red-300/70">{error}</p>
                </div>
                {lastFailedText ? (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void sendMessage(lastFailedText)}
                    className="min-h-10 rounded-xl bg-red-500/20 px-4 text-[12px] font-semibold text-red-100"
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
            className="border-t border-white/[0.05] bg-[#07070c]/80 p-3 backdrop-blur-xl sm:p-4"
          >
            <div className="rounded-[1.25rem] border border-white/[0.08] bg-white/[0.03] p-2 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] ring-1 ring-black/20 focus-within:border-violet-400/25 focus-within:ring-violet-500/10">
              <div className="flex items-end gap-2">
                <textarea
                  ref={composerRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={2}
                  placeholder="描述气质，或粘贴 YouTube 参考链接…"
                  className="max-h-36 min-h-[48px] flex-1 resize-none bg-transparent px-3 py-2.5 text-[16px] text-zinc-100 placeholder:text-zinc-600 focus:outline-none sm:text-[14px]"
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
                  className="mb-1 min-h-11 shrink-0 rounded-xl bg-gradient-to-b from-violet-400 to-violet-600 px-5 text-[13px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(124,58,237,0.7)] transition hover:from-violet-300 hover:to-violet-500 disabled:opacity-35"
                >
                  {loading ? "…" : "发送"}
                </button>
              </div>
            </div>
            <p className="mt-2 px-1 text-[11px] text-zinc-600">
              试听参考 · 商用以源站为准
              <span className="hidden sm:inline">
                {" "}
                · Enter 发送 · Shift+Enter 换行
              </span>
            </p>
          </form>
        </section>

        {/* RIGHT: shortlist panel — uses the empty side of the screen */}
        <aside className="hidden min-h-0 min-w-0 flex-1 flex-col bg-gradient-to-b from-white/[0.02] to-transparent lg:flex">
          <div className="flex items-center justify-between border-b border-white/[0.05] px-6 py-3.5">
            <div>
              <h2 className="text-[13px] font-semibold tracking-tight text-zinc-100">
                本轮短名单
              </h2>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                策略排序后的可试听结果
              </p>
            </div>
            {latestShortlist ? (
              <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[11px] font-medium text-zinc-400 ring-1 ring-white/[0.06]">
                {latestShortlist.candidates.length} 条
              </span>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 xl:px-7">
            {loading && !latestShortlist ? (
              <ResultSkeleton label={loadingHint} />
            ) : latestShortlist ? (
              <div className="space-y-4">
                {latestShortlist.intent_summary ? (
                  <p className="rounded-2xl border border-white/[0.05] bg-black/20 px-4 py-3 text-[12px] leading-relaxed text-zinc-400">
                    <span className="font-medium text-violet-300/80">理解 · </span>
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
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                      本轮检索词
                    </p>
                    <ul className="flex flex-wrap gap-1.5">
                      {latestShortlist.queries_used.map((q) => (
                        <li
                          key={q}
                          className="rounded-lg bg-white/[0.03] px-2.5 py-1 font-mono text-[10px] text-zinc-500 ring-1 ring-white/[0.05]"
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
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-white/[0.08] bg-white/[0.015] px-8 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 ring-1 ring-violet-400/20">
                  <span className="text-lg text-violet-300">♪</span>
                </div>
                <p className="text-[15px] font-medium text-zinc-300">
                  短名单会显示在这里
                </p>
                <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-zinc-560 text-zinc-500">
                  在左侧描述需求或贴参考链接后，筛选后的伴奏卡片会出现在此面板，充分利用宽屏空间。
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
