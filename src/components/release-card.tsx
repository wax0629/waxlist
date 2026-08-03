"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
      className="group relative block overflow-hidden rounded-2xl border border-white/14 transition hover:border-white/30"
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
          <div className="flex h-full items-center justify-center text-xs text-white/25">
            无封面
          </div>
        )}

        {/* 站主爱听：仅当站主把该专加入自己红心时展示 */}
        {ownerLoved ? (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-lg shadow-rose-500/30">
            站主爱听
          </span>
        ) : null}

        {/* 红心：所有人可点 → 个人红心列表；站主点了会额外出「站主爱听」 */}
        <button
          type="button"
          onClick={toggleHeart}
          disabled={busy}
          title={
            favorited
              ? "取消红心（移出我的列表）"
              : loggedIn
                ? "加入我的红心"
                : "登录后收藏"
          }
          className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/45 text-lg backdrop-blur-sm transition hover:scale-105 hover:bg-black/60 disabled:opacity-60"
          aria-label={favorited ? "已收藏" : "收藏"}
        >
          <span
            className={
              favorited
                ? "text-rose-400 drop-shadow-[0_0_6px_rgba(251,113,133,0.8)]"
                : "text-white/50"
            }
          >
            {favorited ? "♥" : "♡"}
          </span>
        </button>
      </div>
      <div className="space-y-0.5 p-2.5">
        <p className="line-clamp-2 text-[13px] font-medium leading-snug text-white">
          {release.title}
        </p>
        <p className="truncate text-[11px] text-white/45">
          {release.artists.join(" / ")}
        </p>
      </div>
    </Link>
  );
}
