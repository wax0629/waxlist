"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PendingReleaseRow } from "@/lib/recommendations/types";

export function ModerationQueue({
  initialItems,
}: {
  initialItems: PendingReleaseRow[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function act(id: string, action: "approve" | "reject") {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/moderation/releases/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "操作失败");
      setItems((prev) => prev.filter((x) => x.release_id !== id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败");
    } finally {
      setBusyId(null);
    }
  }

  async function refresh() {
    setError(null);
    try {
      const res = await fetch("/api/recommendations?queue=pending");
      const data = (await res.json()) as {
        error?: string;
        items?: PendingReleaseRow[];
      };
      if (!res.ok) throw new Error(data.error || "刷新失败");
      setItems(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "刷新失败");
    }
  }

  return (
    <div>
      <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-full border border-white/28 px-3 py-1 text-xs text-white/78 hover:border-white/30"
        >
          刷新
        </button>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-rose-300">{error}</p>
      ) : null}

      <ul className="mt-8 space-y-4">
        {items.map((item) => (
          <li
            key={item.release_id}
            className="glass-rim rounded-2xl bg-white/[0.02] p-4"
          >
            <div className="flex gap-3">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white/[0.04]">
                {item.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.cover_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-white/25">
                    无封面
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-white">{item.title}</p>
                  {item.type ? (
                    <span className="rounded-full border border-white/24 px-2 py-0.5 font-mono text-[10px] uppercase text-white/58">
                      {item.type}
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-white/68">
                  {item.artists.join(" / ")}
                </p>
                <p className="mt-1 text-xs text-white/35">
                  提交于{" "}
                  {new Date(item.created_at).toLocaleString("zh-CN")}
                  {item.rec_count > 1
                    ? ` · ${item.rec_count} 条推荐`
                    : null}
                </p>
                {item.netease_url ? (
                  <a
                    href={item.netease_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-xs text-[#ff8fb3] hover:underline"
                  >
                    在网易云打开 →
                  </a>
                ) : null}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {(item.recommendations?.length
                ? item.recommendations
                : item.first_reason
                  ? [
                      {
                        user_name: item.first_user_name || "用户",
                        reason: item.first_reason,
                        tracks: item.first_tracks,
                        created_at: item.created_at,
                      },
                    ]
                  : []
              ).map((rec, idx) => (
                <div
                  key={`${item.release_id}-rec-${idx}`}
                  className="rounded-xl border border-white/16 bg-black/20 px-3 py-2.5"
                >
                  <p className="text-xs text-white/62">
                    推荐人：
                    <span className="text-white/70">{rec.user_name}</span>
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/80">
                    {rec.reason}
                  </p>
                  {rec.tracks ? (
                    <ul className="mt-2 space-y-0.5 border-t border-white/16 pt-2">
                      {rec.tracks
                        .split(/[\n,，]/)
                        .map((t) => t.trim())
                        .filter(Boolean)
                        .map((t) => (
                          <li
                            key={t}
                            className="text-xs text-white/68 before:mr-1.5 before:text-white/25 before:content-['·']"
                          >
                            {t}
                          </li>
                        ))}
                    </ul>
                  ) : null}
                </div>
              ))}
              {!item.first_reason &&
              !(item.recommendations && item.recommendations.length) ? (
                <p className="text-sm text-white/58">暂无推荐理由</p>
              ) : null}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busyId === item.release_id}
                onClick={() => void act(item.release_id, "approve")}
                className="rounded-full bg-emerald-500/20 px-4 py-1.5 text-sm text-emerald-200 ring-1 ring-emerald-400/30 disabled:opacity-50"
              >
                {busyId === item.release_id ? "处理中…" : "通过上架"}
              </button>
              <button
                type="button"
                disabled={busyId === item.release_id}
                onClick={() => void act(item.release_id, "reject")}
                className="rounded-full bg-rose-500/15 px-4 py-1.5 text-sm text-rose-200 ring-1 ring-rose-400/25 disabled:opacity-50"
              >
                拒绝
              </button>
            </div>
          </li>
        ))}
        {items.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-white/24 px-4 py-12 text-center">
            <p className="text-sm text-white/50">暂无待审</p>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
