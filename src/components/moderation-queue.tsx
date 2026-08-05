"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  async function act(
    id: string,
    action: "approve" | "reject" | "takedown",
  ) {
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
    if (refreshing) return;
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch("/api/recommendations?queue=moderation");
      const data = (await res.json()) as {
        error?: string;
        items?: PendingReleaseRow[];
      };
      if (!res.ok) throw new Error(data.error || "刷新失败");
      setItems(data.items ?? []);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "刷新失败");
    } finally {
      setRefreshing(false);
    }
  }

  const pendingItems = items.filter((i) => i.status === "pending");
  const liveItems = items.filter((i) => i.status === "published");

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-white/55">
          荐专默认上架；这里浏览新内容，有问题再下架。
          {pendingItems.length > 0
            ? ` · 遗留待审 ${pendingItems.length}`
            : ""}
          {liveItems.length > 0 ? ` · 近期上架 ${liveItems.length}` : ""}
        </p>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/[0.05] px-4 py-2 text-[13px] text-white/75 transition hover:border-white/30 hover:bg-white/[0.09] hover:text-white disabled:opacity-55"
        >
          <RefreshIcon spin={refreshing} />
          {refreshing ? "刷新中…" : "刷新"}
        </button>
      </div>

      {error ? (
        <div className="mb-5 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100/90">
          {error}
        </div>
      ) : null}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 px-4 py-16 text-center">
          <p className="text-sm text-white/55">暂无新上架与待审</p>
          <Link
            href="/explore"
            className="mt-5 inline-block text-sm text-[#ff8fb3] hover:underline"
          >
            回优质发行 →
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-5">
          {items.map((item) => {
            const recs =
              item.recommendations?.length
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
                  : [];
            const busy = busyId === item.release_id;
            const isPending = item.status === "pending";

            return (
              <li
                key={item.release_id}
                className="flex flex-col rounded-2xl border border-white/12 bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:p-5"
              >
                <div className="flex gap-4">
                  <Link
                    href={`/explore/${item.release_id}`}
                    className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-white/[0.04] ring-1 ring-white/10 sm:h-28 sm:w-28"
                  >
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
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/explore/${item.release_id}`}
                        className="truncate text-base font-medium text-white hover:underline sm:text-[17px]"
                      >
                        {item.title}
                      </Link>
                      <span
                        className={
                          isPending
                            ? "rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-100 ring-1 ring-amber-400/30"
                            : "rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10px] text-emerald-100/90 ring-1 ring-emerald-400/25"
                        }
                      >
                        {isPending ? "遗留待审" : "已上架"}
                      </span>
                      {item.rec_count > 1 ? (
                        <span className="rounded-full bg-[#ff6b9e]/12 px-2 py-0.5 text-[10px] text-[#ffb3cc] ring-1 ring-[#ff6b9e]/25">
                          {item.rec_count} 条推荐
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-white/60">
                      {item.artists.join(" / ")}
                    </p>
                    <p className="mt-2 text-[12px] text-white/38">
                      {new Date(item.created_at).toLocaleString("zh-CN")}
                    </p>
                    {item.netease_url ? (
                      <a
                        href={item.netease_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1.5 inline-flex text-[12px] text-[#ff8fb3] hover:underline"
                      >
                        网易云 →
                      </a>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 flex-1 space-y-2.5">
                  {recs.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-white/12 px-3 py-3 text-sm text-white/45">
                      暂无推荐理由
                    </p>
                  ) : (
                    recs.map((rec, idx) => (
                      <div
                        key={`${item.release_id}-rec-${idx}`}
                        className="rounded-xl border border-white/10 bg-black/25 px-3.5 py-3"
                      >
                        <p className="text-[12px] text-white/50">
                          推荐人{" "}
                          <span className="font-medium text-white/75">
                            {rec.user_name}
                          </span>
                        </p>
                        <p className="mt-1.5 text-sm leading-relaxed text-white/82">
                          {rec.reason}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
                  {isPending ? (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void act(item.release_id, "approve")}
                        className="rounded-full bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-100 ring-1 ring-emerald-400/35 transition hover:bg-emerald-500/28 disabled:opacity-50"
                      >
                        {busy ? "…" : "通过上架"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void act(item.release_id, "reject")}
                        className="rounded-full bg-rose-500/12 px-4 py-2 text-sm text-rose-100/90 ring-1 ring-rose-400/25 transition hover:bg-rose-500/18 disabled:opacity-50"
                      >
                        拒绝
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void act(item.release_id, "takedown")}
                      className="rounded-full bg-rose-500/12 px-4 py-2 text-sm text-rose-100/90 ring-1 ring-rose-400/25 transition hover:bg-rose-500/18 disabled:opacity-50"
                    >
                      {busy ? "…" : "下架"}
                    </button>
                  )}
                  <Link
                    href={`/explore/${item.release_id}`}
                    className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/65 transition hover:border-white/30 hover:text-white"
                  >
                    前台查看
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function RefreshIcon({ spin }: { spin?: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={spin ? "animate-spin" : undefined}
    >
      <path
        d="M19.5 12a7.5 7.5 0 1 1-2.1-5.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M19.5 5v4.5H15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
