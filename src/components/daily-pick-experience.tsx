"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HeartIcon } from "@/components/action-icons";
import { RatingPanel } from "@/components/rating-panel";
import type { DailyPickPayload } from "@/lib/releases/daily-pick";
import { formatReleasedAt } from "@/lib/releases/format";

export function DailyPickExperience({
  initial,
  loggedIn,
  interactionsEnabled,
  initialFavorited,
  initialMineScore,
}: {
  initial: DailyPickPayload;
  loggedIn: boolean;
  interactionsEnabled: boolean;
  initialFavorited: boolean;
  initialMineScore: number | null;
}) {
  const router = useRouter();
  const [pick, setPick] = useState(initial);
  const [opened, setOpened] = useState(false);
  const [favorited, setFavorited] = useState(initialFavorited);
  const [mineScore, setMineScore] = useState<number | null>(initialMineScore);
  const [busyHeart, setBusyHeart] = useState(false);
  const [busyNext, setBusyNext] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** 本轮已开过的，再开时尽量避开 */
  const [seen, setSeen] = useState<string[]>([initial.release.id]);
  const [round, setRound] = useState(0);

  const loadNext = useCallback(async () => {
    setBusyNext(true);
    setError(null);
    try {
      const qs =
        seen.length > 0
          ? `?exclude=${encodeURIComponent(seen.join(","))}`
          : "";
      const res = await fetch(`/api/releases/daily${qs}`);
      const data = (await res.json()) as DailyPickPayload & {
        error?: string;
      };
      if (!res.ok) throw new Error(data.error || "加载失败");

      let nextFavorited = false;
      let nextMineScore: number | null = null;
      if (loggedIn) {
        const [favoriteRes, ratingRes] = await Promise.all([
          fetch(`/api/releases/${data.release.id}/favorite`),
          interactionsEnabled
            ? fetch(`/api/releases/${data.release.id}/rate`)
            : Promise.resolve(null),
        ]);
        if (favoriteRes.ok) {
          const favoriteData = (await favoriteRes.json()) as {
            favorited?: boolean;
          };
          nextFavorited = Boolean(favoriteData.favorited);
        }
        if (ratingRes?.ok) {
          const ratingData = (await ratingRes.json()) as {
            score?: number | null;
          };
          nextMineScore = ratingData.score ?? null;
        }
      }

      setPick(data);
      setSeen((prev) => {
        const next = [...prev, data.release.id];
        // 池子开完一轮后清空，允许再循环随机
        if (next.length >= data.pool_size) return [data.release.id];
        return next;
      });
      setOpened(false);
      setFavorited(nextFavorited);
      setMineScore(nextMineScore);
      setRound((n) => n + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setBusyNext(false);
    }
  }, [interactionsEnabled, loggedIn, seen]);

  async function toggleHeart() {
    if (busyHeart) return;
    if (!loggedIn) {
      router.push(
        `/login?callbackUrl=${encodeURIComponent("/explore/today")}`,
      );
      return;
    }
    setBusyHeart(true);
    const next = !favorited;
    setFavorited(next);
    try {
      const res = await fetch(`/api/releases/${pick.release.id}/favorite`, {
        method: "POST",
      });
      const data = (await res.json()) as {
        error?: string;
        favorited?: boolean;
      };
      if (!res.ok) {
        setFavorited(!next);
        setError(data.error || "收藏失败");
      } else if (typeof data.favorited === "boolean") {
        setFavorited(data.favorited);
      }
    } catch {
      setFavorited(!next);
      setError("收藏失败");
    } finally {
      setBusyHeart(false);
    }
  }

  const r = pick.release;
  const artists = r.artists.join(" / ");
  const releaseDate = formatReleasedAt(r.released_at);

  return (
    <div className="mx-auto w-full max-w-4xl px-0.5">
      {/* 页顶文案可以有；黑胶本体不放字 */}
      <div className="text-center">
        <h1 className="font-display text-[1.45rem] font-semibold tracking-tight text-white sm:text-3xl">
          专辑盲盒
        </h1>
        <p className="mt-1.5 text-[13px] text-white/60 sm:mt-2 sm:text-sm">
          {pick.day.replace(/-/g, ".")}
          {!opened ? " · 点黑胶开封" : ""}
        </p>
      </div>

      <div className="mx-auto mt-6 w-full max-w-[880px] sm:mt-8">
        <AnimatePresence mode="wait">
          {!opened ? (
            <motion.button
              key={`vinyl-${round}`}
              type="button"
              onClick={() => setOpened(true)}
              aria-label="开封"
              title="点击开封"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.2 } }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="relative mx-auto block aspect-square w-[calc(100%-2px)] outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-black md:w-[calc(50%-1px)]"
            >
              {/* 纯黑胶：无封面、无文字 */}
              <span
                className="absolute inset-0 rounded-full shadow-[0_20px_50px_-12px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.06)]"
                style={{
                  background: `
                    radial-gradient(circle at 38% 32%, rgba(255,255,255,0.14) 0%, transparent 28%),
                    radial-gradient(circle at 50% 50%, #1a1a1c 0%, #1a1a1c 6%, #0c0c0e 6.2%, #0c0c0e 14%, #141416 14.2%, #141416 22%, #0a0a0b 22.2%, #0a0a0b 38%, #121214 38.2%, #121214 52%, #080809 52.2%, #080809 68%, #101012 68.2%, #101012 82%, #050506 82.2%, #050506 100%)
                  `,
                }}
                aria-hidden
              />
              <span
                className="pointer-events-none absolute inset-[8%] rounded-full opacity-40"
                style={{
                  background: `
                    repeating-radial-gradient(
                      circle at center,
                      transparent 0px,
                      transparent 3px,
                      rgba(255,255,255,0.035) 3px,
                      rgba(255,255,255,0.035) 4px
                    )
                  `,
                }}
                aria-hidden
              />
              <span className="absolute left-1/2 top-1/2 h-[14%] w-[14%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-[#030304] shadow-[inset_0_1px_2px_rgba(255,255,255,0.08)]" />
            </motion.button>
          ) : (
            <motion.div
              key={`open-${r.id}-${round}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="glass-rim relative grid overflow-hidden rounded-2xl md:aspect-[2/1] md:grid-cols-2"
            >
              <div className="relative aspect-square w-full bg-black md:aspect-auto md:h-full">
                {r.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.cover_url}
                    alt={`${r.title} 专辑封面`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-white/45">
                    无封面
                  </div>
                )}
                <span
                  className="pointer-events-none absolute inset-y-0 right-0 hidden w-8 bg-gradient-to-l from-black/60 to-transparent md:block"
                  aria-hidden
                />
              </div>

              <div
                className="pointer-events-none absolute inset-y-2 left-1/2 z-20 hidden w-8 -translate-x-1/2 md:block"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.68) 38%, rgba(255,255,255,0.08) 49%, rgba(255,255,255,0.18) 50%, rgba(0,0,0,0.64) 58%, transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(to bottom, transparent, #000 4%, #000 96%, transparent)",
                  maskImage:
                    "linear-gradient(to bottom, transparent, #000 4%, #000 96%, transparent)",
                }}
                aria-hidden
              >
                <span className="absolute inset-y-[3%] left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-white/25 to-transparent shadow-[0_0_5px_rgba(255,255,255,0.12)]" />
              </div>

              <div
                className="flex min-w-0 flex-col border-t border-white/10 p-4 md:min-h-0 md:overflow-y-auto md:overscroll-contain md:border-t-0 md:py-5 md:pr-5 md:pl-7 md:[scrollbar-gutter:stable]"
                style={{
                  background:
                    "linear-gradient(100deg, rgba(255,255,255,0.045) 0%, rgba(5,5,6,0.34) 17%, rgba(5,5,6,0.3) 100%)",
                }}
              >
                <div className="flex min-h-8 items-center justify-between gap-3">
                  {r.owner_loved ? (
                    <span className="rounded-full bg-rose-400/10 px-2.5 py-1 text-[10px] font-medium text-[#ffc2d6] ring-1 ring-inset ring-[#ff6b9e]/35">
                      站主爱听
                    </span>
                  ) : (
                    <span className="text-[10px] text-white/35">今日开盒</span>
                  )}
                  <button
                    type="button"
                    disabled={busyHeart}
                    onClick={() => void toggleHeart()}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/[0.06] transition hover:border-rose-400/40 hover:bg-rose-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/60 disabled:opacity-60"
                    aria-label={favorited ? "已收藏" : "收藏"}
                  >
                    <HeartIcon filled={favorited} />
                  </button>
                </div>

                <div className="mt-4 min-w-0">
                  <h2 className="text-balance font-display text-xl font-semibold leading-tight tracking-tight text-white">
                    {r.title}
                  </h2>
                  <p className="mt-1.5 truncate text-[13px] text-white/65">
                    {artists}
                  </p>
                  {releaseDate ? (
                    <p className="mt-2 text-[11px] tabular-nums text-white/45">
                      发行于 {releaseDate}
                    </p>
                  ) : (
                    <p className="mt-2 text-[11px] text-white/35">
                      发行日期暂未收录
                    </p>
                  )}
                </div>

                <div className="mt-5 border-t border-white/10 pt-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-[11px] font-medium text-white/70">
                      {interactionsEnabled ? "给这张专辑打分" : "专辑评分"}
                    </p>
                    <span className="text-[10px] text-white/40">1–10 分</span>
                  </div>
                  <RatingPanel
                    key={r.id}
                    releaseId={r.id}
                    initialAvg={r.rating_avg ?? 0}
                    initialCount={r.rating_count ?? 0}
                    initialMine={mineScore}
                    loggedIn={loggedIn}
                    canRate={interactionsEnabled}
                    callbackUrl="/explore/today"
                    compact
                  />
                </div>

                {pick.quote ? (
                  <blockquote className="mt-5 border-t border-white/10 pt-4 text-[12px] leading-relaxed text-white/70">
                    <p className="text-pretty">
                      「{pick.quote.reason}」
                    </p>
                    <footer className="mt-1.5 text-[10px] text-white/40">
                      — {pick.quote.user_name}
                    </footer>
                  </blockquote>
                ) : null}

                <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
                  <Link
                    href={`/explore/${r.id}`}
                    className="glass-btn inline-flex px-4 py-2.5 text-sm font-medium"
                  >
                    去听这张 →
                  </Link>
                  <button
                    type="button"
                    disabled={busyNext || pick.pool_size <= 1}
                    onClick={() => void loadNext()}
                    className="rounded-full border border-white/15 px-4 py-2.5 text-sm text-white/70 transition hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:opacity-40"
                  >
                    {busyNext ? "…" : "再开一张"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error ? (
        <p className="mt-4 text-center text-sm text-rose-300/90">{error}</p>
      ) : null}
    </div>
  );
}
