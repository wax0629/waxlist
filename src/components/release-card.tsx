"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { HeartIcon } from "@/components/action-icons";
import { StarsPicker, scoreToStars } from "@/components/star-rating";
import { formatReleasedAt } from "@/lib/releases/format";
import { hasFriendTag } from "@/lib/releases/friend-tag";
import type { Release } from "@/lib/releases/types";

/** 单行标题；溢出时悬停整张卡横向滚出全文 */
function ScrollTitle({ text }: { text: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const [overflow, setOverflow] = useState(0);

  const measure = useCallback(() => {
    const wrap = wrapRef.current;
    const el = textRef.current;
    if (!wrap || !el) return;
    setOverflow(Math.max(0, el.scrollWidth - wrap.clientWidth));
  }, [text]);

  useEffect(() => {
    measure();
    const wrap = wrapRef.current;
    if (!wrap || typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const ro = new ResizeObserver(() => measure());
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [measure]);

  const durationSec =
    overflow > 0 ? Math.min(14, Math.max(2.5, overflow / 28)) : 0.2;

  return (
    <div ref={wrapRef} className="min-w-0 overflow-hidden">
      <p
        ref={textRef}
        title={text}
        className={[
          "h-full whitespace-nowrap text-[13px] font-semibold leading-[1.25rem] text-white",
          "transition-transform ease-linear",
          overflow > 0 ? "group-hover:-translate-x-[var(--scroll-x)]" : "",
        ].join(" ")}
        style={
          {
            "--scroll-x": `${overflow}px`,
            transitionDuration: `${durationSec}s`,
          } as CSSProperties
        }
      >
        {text}
      </p>
    </div>
  );
}

export function ReleaseCard({
  release,
  /** 当前用户是否已收藏 */
  initialFavorited = false,
  /** 是否已登录（未登录点红心/评分去登录） */
  loggedIn = false,
  /** 我的评分 1–10，未评 null */
  initialMineScore = null,
}: {
  release: Release;
  initialFavorited?: boolean;
  loggedIn?: boolean;
  initialMineScore?: number | null;
}) {
  const router = useRouter();
  const href = `/explore/${release.id}`;
  const [favorited, setFavorited] = useState(initialFavorited);
  const [ownerLoved, setOwnerLoved] = useState(release.owner_loved);
  const [busy, setBusy] = useState(false);
  const [avg, setAvg] = useState<number | null>(
    release.rating_count && release.rating_avg != null
      ? release.rating_avg
      : null,
  );
  const [count, setCount] = useState(release.rating_count ?? 0);
  const [mine, setMine] = useState<number | null>(initialMineScore);
  const [hover, setHover] = useState<number | null>(null);
  const [rateBusy, setRateBusy] = useState(false);

  useEffect(() => {
    setFavorited(initialFavorited);
  }, [initialFavorited]);

  useEffect(() => {
    setMine(initialMineScore);
  }, [initialMineScore]);

  useEffect(() => {
    setOwnerLoved(release.owner_loved);
    setAvg(
      release.rating_count && release.rating_avg != null
        ? release.rating_avg
        : null,
    );
    setCount(release.rating_count ?? 0);
  }, [release.owner_loved, release.rating_avg, release.rating_count]);

  async function toggleHeart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    if (!loggedIn) {
      router.push(`/login?callbackUrl=/explore`);
      return;
    }
    setBusy(true);
    const next = !favorited;
    setFavorited(next);
    try {
      const res = await fetch(`/api/releases/${release.id}/favorite`, {
        method: "POST",
      });
      const data = (await res.json()) as {
        error?: string;
        favorited?: boolean;
        owner_loved?: boolean;
      };
      if (!res.ok) {
        setFavorited(!next);
        console.error(data.error);
      } else {
        if (typeof data.favorited === "boolean") setFavorited(data.favorited);
        if (typeof data.owner_loved === "boolean")
          setOwnerLoved(data.owner_loved);
        router.refresh();
      }
    } catch {
      setFavorited(!next);
    } finally {
      setBusy(false);
    }
  }

  async function rate(score: number) {
    if (!loggedIn) {
      router.push(`/login?callbackUrl=/explore`);
      return;
    }
    if (rateBusy) return;
    setRateBusy(true);
    try {
      const res = await fetch(`/api/releases/${release.id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score }),
      });
      const data = (await res.json()) as {
        error?: string;
        score?: number;
        rating_avg?: number | null;
        rating_count?: number;
      };
      if (!res.ok) throw new Error(data.error || "评分失败");
      setMine(data.score ?? score);
      if (typeof data.rating_avg === "number") setAvg(data.rating_avg);
      else if (data.rating_avg === null) setAvg(null);
      if (typeof data.rating_count === "number") setCount(data.rating_count);
    } catch (err) {
      console.error(err);
    } finally {
      setRateBusy(false);
    }
  }

  // 旁侧数字：悬停分 / 我的分 / 均分；没分显示 0.0；一律一位小数
  const scoreLabel = (
    hover != null
      ? hover
      : mine != null
        ? mine
        : avg != null && count > 0
          ? avg
          : 0
  ).toFixed(1);

  const scoreTitle =
    hover != null
      ? `打 ${hover} 分`
      : mine != null
        ? `我的 ${scoreToStars(mine).toFixed(1)} 星 · 均分 ${avg != null && count > 0 ? avg.toFixed(1) : "0.0"}`
        : count > 0
          ? `${count} 人评 · 均分 ${avg?.toFixed(1) ?? "0.0"} · 点击星星评分`
          : "点击星星评分（半星=1分）";

  const dateText = formatReleasedAt(release.released_at);

  return (
    // 不用整卡 Link，避免按钮嵌套在 <a> 里导致点星也进详情
    <article className="glass-rim group relative overflow-hidden rounded-2xl transition hover:border-white/50">
      <Link
        href={href}
        className="relative block aspect-square bg-white/[0.04] outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b9e]/50"
      >
        {release.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={release.cover_url}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-white/45">
            无封面
          </div>
        )}

        {ownerLoved ? (
          <div
            className="pointer-events-none absolute left-0 top-0 z-10 h-[4.5rem] w-[4.5rem] overflow-hidden rounded-tl-2xl"
            aria-label="站主爱听"
          >
            <span className="absolute left-[-38%] top-[18%] w-[140%] rotate-[-45deg] bg-gradient-to-r from-rose-600 via-rose-500 to-pink-500 py-[3px] text-center text-[9px] font-bold tracking-wide text-white shadow-[0_2px_8px_rgba(244,63,94,0.45)]">
              站主爱听
            </span>
          </div>
        ) : null}

        {hasFriendTag(release.tags) ? (
          <span
            className="pointer-events-none absolute right-2 top-2 z-10 rounded-full border border-pink-200/50 bg-gradient-to-r from-[#ff6b9e] via-[#ff8fb3] to-[#f0abfc] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white shadow-[0_4px_14px_-2px_rgba(255,107,158,0.55)]"
            aria-label="友情"
            title="友情"
          >
            友情
          </span>
        ) : null}
      </Link>

      {/*
        文案区：左文右心；红心在整块 meta 区垂直居中
      */}
      <div className="flex items-center gap-1.5 p-2.5">
        <div className="min-w-0 flex-1">
          <Link href={href} className="block min-w-0 outline-none">
            <div className="h-[1.25rem] min-w-0">
              <ScrollTitle text={release.title} />
            </div>
            <p
              className="mt-0.5 h-[1.125rem] truncate text-[11px] leading-[1.125rem] text-white/65"
              title={release.artists.join(" / ")}
            >
              {release.artists.join(" / ") || "—"}
            </p>
            <p className="mt-0.5 h-3.5 truncate text-[10px] tabular-nums leading-[0.875rem] text-white/40">
              {dateText || "\u00a0"}
            </p>
          </Link>
          <div
            className="mt-1 flex h-4 min-w-0 items-center gap-1"
            role="group"
            aria-label="评分"
            title={scoreTitle}
          >
            <StarsPicker
              value={mine}
              hover={hover}
              onHover={setHover}
              onPick={(s) => void rate(s)}
              disabled={rateBusy}
              size={14}
            />
            <span
              className={[
                "shrink-0 text-[10px] tabular-nums leading-none",
                hover != null || mine != null
                  ? "text-amber-200/90"
                  : scoreLabel === "0.0"
                    ? "text-white/35"
                    : "text-white/45",
              ].join(" ")}
            >
              {scoreLabel}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleHeart}
          disabled={busy}
          title={
            favorited
              ? "取消收藏"
              : loggedIn
                ? "收藏进我的红心"
                : "登录后收藏"
          }
          className="flex h-8 w-8 shrink-0 touch-manipulation items-center justify-center self-center rounded-full border border-white/20 bg-white/[0.06] p-0 text-[15px] leading-none transition active:scale-95 hover:border-rose-400/40 hover:bg-rose-500/10 disabled:opacity-60"
          aria-label={favorited ? "已收藏" : "收藏"}
        >
          <HeartIcon filled={favorited} />
        </button>
      </div>
    </article>
  );
}
