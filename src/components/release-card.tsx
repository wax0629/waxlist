"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { HeartIcon } from "@/components/action-icons";
import { StarsDisplay } from "@/components/star-rating";
import { formatReleasedAt } from "@/lib/releases/format";
import { hasFriendTag } from "@/lib/releases/friend-tag";
import type { Release } from "@/lib/releases/types";

export function ReleaseCard({
  release,
  /** 当前用户是否已收藏 */
  initialFavorited = false,
  /** 是否已登录（未登录点红心去登录） */
  loggedIn = false,
}: {
  release: Release;
  initialFavorited?: boolean;
  loggedIn?: boolean;
}) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [ownerLoved, setOwnerLoved] = useState(release.owner_loved);
  const [busy, setBusy] = useState(false);

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

  return (
    <Link
      href={`/explore/${release.id}`}
      className="glass-rim group relative block overflow-hidden rounded-2xl transition hover:border-white/50"
    >
      <div className="relative aspect-square bg-white/[0.04]">
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

        {/* 站主爱听：封面左上角斜向下角标 */}
        {ownerLoved ? (
          <div
            className="pointer-events-none absolute left-0 top-0 z-10 h-[4.5rem] w-[4.5rem] overflow-hidden rounded-tl-2xl"
            aria-label="站主爱听"
          >
            <span
              className="absolute left-[-38%] top-[18%] w-[140%] rotate-[-45deg] bg-gradient-to-r from-rose-600 via-rose-500 to-pink-500 py-[3px] text-center text-[9px] font-bold tracking-wide text-white shadow-[0_2px_8px_rgba(244,63,94,0.45)]"
            >
              站主爱听
            </span>
          </div>
        ) : null}

        {/* 友情：封面右上角粉胶囊 */}
        {hasFriendTag(release.tags) ? (
          <span
            className="pointer-events-none absolute right-2 top-2 z-10 rounded-full border border-pink-200/50 bg-gradient-to-r from-[#ff6b9e] via-[#ff8fb3] to-[#f0abfc] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white shadow-[0_4px_14px_-2px_rgba(255,107,158,0.55)]"
            aria-label="友情"
            title="友情"
          >
            友情
          </span>
        ) : null}
      </div>
      {/* 文案区：左专辑名/艺人（原间距），右红心相对整块文案垂直居中 */}
      <div className="flex items-center gap-2 p-2.5">
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-white">
            {release.title}
          </p>
          <p className="truncate text-[11px] text-white/65">
            {release.artists.join(" / ")}
          </p>
          {formatReleasedAt(release.released_at) ? (
            <p className="truncate text-[10px] tabular-nums text-white/40">
              {formatReleasedAt(release.released_at)}
            </p>
          ) : null}
          <div className="flex items-center gap-1 pt-0.5">
            <StarsDisplay
              score={
                release.rating_count && release.rating_avg != null
                  ? release.rating_avg
                  : 0
              }
              size={12}
            />
            <span className="text-[10px] tabular-nums text-white/45">
              {release.rating_count && release.rating_avg != null
                ? release.rating_avg.toFixed(1)
                : "0.0"}
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
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/[0.06] p-0 text-[15px] leading-none transition hover:border-rose-400/40 hover:bg-rose-500/10 disabled:opacity-60"
          aria-label={favorited ? "已收藏" : "收藏"}
        >
          <HeartIcon filled={favorited} />
        </button>
      </div>
    </Link>
  );
}
