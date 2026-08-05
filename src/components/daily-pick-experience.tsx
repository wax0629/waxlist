"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HeartIcon } from "@/components/action-icons";
import type { DailyPickPayload } from "@/lib/releases/daily-pick";

export function DailyPickExperience({
  initial,
  loggedIn,
  initialFavorited,
}: {
  initial: DailyPickPayload;
  loggedIn: boolean;
  initialFavorited: boolean;
}) {
  const router = useRouter();
  const [pick, setPick] = useState(initial);
  const [opened, setOpened] = useState(false);
  const [favorited, setFavorited] = useState(initialFavorited);
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
      setPick(data);
      setSeen((prev) => {
        const next = [...prev, data.release.id];
        // 池子开完一轮后清空，允许再循环随机
        if (next.length >= data.pool_size) return [data.release.id];
        return next;
      });
      setOpened(false);
      setFavorited(false);
      setRound((n) => n + 1);
      if (loggedIn) {
        const f = await fetch(`/api/releases/${data.release.id}/favorite`);
        if (f.ok) {
          const j = (await f.json()) as { favorited?: boolean };
          setFavorited(Boolean(j.favorited));
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setBusyNext(false);
    }
  }, [loggedIn, seen]);

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

  return (
    <div className="mx-auto w-full max-w-md px-0.5">
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

      <div className="mx-auto mt-6 w-full max-w-[min(100%,360px)] sm:mt-8">
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
              className="relative mx-auto block aspect-square w-full max-w-[300px] outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
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
              className="glass-rim overflow-hidden rounded-2xl"
            >
              <div className="relative aspect-square w-full bg-black">
                {r.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.cover_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-white/45">
                    无封面
                  </div>
                )}
                {r.owner_loved ? (
                  <span className="absolute left-2.5 top-2.5 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-[#ffc2d6] ring-1 ring-[#ff6b9e]/40 backdrop-blur-sm">
                    站主爱听
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-2 border-t border-white/10 bg-black/30 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-white">
                    {r.title}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-white/60">
                    {artists}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busyHeart}
                  onClick={() => void toggleHeart()}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/[0.06] transition hover:border-rose-400/40 hover:bg-rose-500/10 disabled:opacity-60"
                  aria-label={favorited ? "已收藏" : "收藏"}
                >
                  <HeartIcon filled={favorited} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {opened && pick.quote ? (
        <motion.blockquote
          className="mx-auto mt-5 max-w-[min(100%,360px)] border-l-2 border-[#ff6b9e]/45 pl-3 text-[13px] leading-relaxed text-white/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <span className="line-clamp-3">「{pick.quote.reason}」</span>
          <footer className="mt-1 text-[11px] text-white/45">
            — {pick.quote.user_name}
          </footer>
        </motion.blockquote>
      ) : null}

      {error ? (
        <p className="mt-4 text-center text-sm text-rose-300/90">{error}</p>
      ) : null}

      {opened ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link
            href={`/explore/${r.id}`}
            className="glass-btn inline-flex px-5 py-2.5 text-sm font-medium"
          >
            去听这张 →
          </Link>
          <button
            type="button"
            disabled={busyNext || pick.pool_size <= 1}
            onClick={() => void loadNext()}
            className="rounded-full border border-white/15 px-4 py-2.5 text-sm text-white/70 transition hover:border-white/30 hover:text-white disabled:opacity-40"
          >
            {busyNext ? "…" : "再开一张"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
