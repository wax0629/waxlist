"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Release } from "@/lib/releases/types";

export function ReleaseCard({
  release,
  isOwner,
}: {
  release: Release;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [loved, setLoved] = useState(release.owner_loved);
  const [busy, setBusy] = useState(false);

  async function toggleLove(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isOwner || busy) return;
    setBusy(true);
    const next = !loved;
    setLoved(next); // optimistic
    try {
      const res = await fetch(`/api/releases/${release.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner_loved: next }),
      });
      if (!res.ok) {
        setLoved(!next);
        const data = (await res.json()) as { error?: string };
        console.error(data.error);
      } else {
        router.refresh();
      }
    } catch {
      setLoved(!next);
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

        {/* 站主爱听标签：仅红心点亮时展示 */}
        {loved ? (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-lg shadow-rose-500/30">
            站主爱听
          </span>
        ) : null}

        {/* 红心：所有人可见状态；仅站主可点 */}
        <button
          type="button"
          onClick={toggleLove}
          disabled={!isOwner || busy}
          title={
            isOwner
              ? loved
                ? "取消站主爱听"
                : "标记为站主爱听"
              : loved
                ? "站主爱听"
                : "仅站主可标记"
          }
          className={
            isOwner
              ? "absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/45 text-lg backdrop-blur-sm transition hover:scale-105 hover:bg-black/60"
              : "absolute right-2 top-2 z-10 flex h-9 w-9 cursor-default items-center justify-center rounded-full border border-white/10 bg-black/35 text-lg backdrop-blur-sm"
          }
          aria-label={loved ? "站主爱听" : "红心"}
        >
          <span
            className={
              loved
                ? "text-rose-400 drop-shadow-[0_0_6px_rgba(251,113,133,0.8)]"
                : "text-white/40"
            }
          >
            {loved ? "♥" : "♡"}
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
