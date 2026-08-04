"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LikeIcon } from "@/components/action-icons";
import type { TrackRow } from "@/lib/tracks/store";

export function TrackRecommendList({
  releaseId,
  initialTracks,
  loggedIn,
  /** Inside a parent panel: no extra chrome / nested scroll cap */
  embedded = false,
}: {
  releaseId: string;
  initialTracks: TrackRow[];
  loggedIn: boolean;
  embedded?: boolean;
}) {
  const router = useRouter();
  const [tracks, setTracks] = useState(initialTracks);
  const [busy, setBusy] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  async function reloadFromNetease() {
    setLoadingList(true);
    setListError(null);
    try {
      const res = await fetch(`/api/releases/${releaseId}/tracks`, {
        method: "POST",
      });
      const data = (await res.json()) as {
        error?: string;
        tracks?: TrackRow[];
      };
      if (!res.ok) throw new Error(data.error || "解析失败");
      setTracks(data.tracks ?? []);
      router.refresh();
    } catch (err) {
      setListError(err instanceof Error ? err.message : "解析失败");
    } finally {
      setLoadingList(false);
    }
  }

  async function toggle(trackName: string) {
    if (!loggedIn) {
      router.push(`/login?callbackUrl=/explore/${releaseId}`);
      return;
    }
    if (busy) return;
    setBusy(trackName);

    const snapshot = tracks;
    setTracks((prev) =>
      prev.map((t) =>
        t.name === trackName
          ? {
              ...t,
              recommended_by_me: !t.recommended_by_me,
              recommend_count: t.recommended_by_me
                ? Math.max(0, t.recommend_count - 1)
                : t.recommend_count + 1,
            }
          : t,
      ),
    );

    try {
      const res = await fetch(`/api/releases/${releaseId}/tracks/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track: trackName }),
      });
      const data = (await res.json()) as {
        error?: string;
        recommended?: boolean;
        count?: number;
      };
      if (!res.ok) throw new Error(data.error || "失败");
      setTracks((prev) =>
        prev.map((t) =>
          t.name === trackName
            ? {
                ...t,
                recommended_by_me: Boolean(data.recommended),
                recommend_count:
                  typeof data.count === "number"
                    ? data.count
                    : t.recommend_count,
              }
            : t,
        ),
      );
    } catch {
      setTracks(snapshot);
    } finally {
      setBusy(null);
    }
  }

  if (!tracks.length) {
    return (
      <div
        className={
          embedded
            ? "px-2 py-10 text-center"
            : "mt-4 rounded-2xl border border-dashed border-white/20 px-4 py-8 text-center"
        }
      >
        {listError ? (
          <p className="text-xs text-rose-300">{listError}</p>
        ) : (
          <p className="text-sm text-white/50">暂无曲目</p>
        )}
        <button
          type="button"
          disabled={loadingList}
          onClick={() => void reloadFromNetease()}
          className="mt-4 rounded-full border border-white/25 px-4 py-1.5 text-sm text-white/80 hover:border-white/45 disabled:opacity-50"
        >
          {loadingList ? "加载中…" : "加载曲目"}
        </button>
      </div>
    );
  }

  const list = (
    <ul
      className={
        embedded
          ? "divide-y divide-white/10"
          : "glass-rim mt-4 max-h-[calc(10*2.75rem)] divide-y divide-white/10 overflow-y-auto overscroll-contain rounded-2xl"
      }
    >
      {tracks.map((t) => (
        <li
          key={`${t.index}-${t.name}`}
          className="flex items-center gap-3 px-1 py-2.5 sm:px-2"
        >
          <span className="w-7 shrink-0 text-right font-mono text-xs tabular-nums text-white/40">
            {String(t.index + 1).padStart(2, "0")}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm text-white/90">
            {t.name}
          </span>
          <span
            className={
              t.recommend_count > 0
                ? "min-w-[1.5rem] shrink-0 text-right text-xs tabular-nums text-sky-200/90"
                : "min-w-[1.5rem] shrink-0 text-right text-xs tabular-nums text-white/45"
            }
            title="推荐数"
          >
            {t.recommend_count}
          </span>
          <button
            type="button"
            disabled={busy === t.name}
            onClick={() => void toggle(t.name)}
            title={
              !loggedIn
                ? "登录后点赞推荐"
                : t.recommended_by_me
                  ? "取消点赞"
                  : "点赞推荐"
            }
            className={
              t.recommended_by_me
                ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-500/20 p-0 text-base ring-1 ring-sky-400/40 transition hover:bg-sky-500/30 disabled:opacity-50"
                : "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/18 bg-transparent p-0 text-base transition hover:border-sky-400/35 hover:bg-white/5 disabled:opacity-50"
            }
            aria-label={t.recommended_by_me ? "取消点赞" : "点赞推荐"}
          >
            <LikeIcon filled={t.recommended_by_me} />
          </button>
        </li>
      ))}
      {!loggedIn ? (
        <li className="px-2 py-2 text-center text-xs text-white/45">
          <Link
            href={`/login?callbackUrl=/explore/${releaseId}`}
            className="text-[#ff8fb3] hover:underline"
          >
            登录
          </Link>
          后可点赞推荐曲目
        </li>
      ) : null}
    </ul>
  );

  if (embedded) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {list}
        </div>
        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-white/10 pt-2">
          {listError ? (
            <p className="mr-auto text-xs text-rose-300">{listError}</p>
          ) : null}
          <button
            type="button"
            disabled={loadingList}
            onClick={() => void reloadFromNetease()}
            className="text-xs text-white/40 hover:text-white/70 disabled:opacity-50"
          >
            {loadingList ? "同步中…" : "重新同步"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {list}
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          disabled={loadingList}
          onClick={() => void reloadFromNetease()}
          className="text-xs text-white/40 hover:text-white/70 disabled:opacity-50"
        >
          {loadingList ? "同步中…" : "重新同步曲目"}
        </button>
      </div>
      {listError ? (
        <p className="mt-1 text-right text-xs text-rose-300">{listError}</p>
      ) : null}
    </div>
  );
}
