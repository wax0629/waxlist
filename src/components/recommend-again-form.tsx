"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  formatSelectedTracks,
  TrackSelectList,
} from "@/components/track-select-list";

export function RecommendAgainForm({
  releaseId,
  neteaseUrl,
}: {
  releaseId: string;
  /** When set, load tracklist from NetEase for checkbox pick */
  neteaseUrl?: string | null;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [trackList, setTrackList] = useState<string[]>([]);
  const [selectedTrackIdx, setSelectedTrackIdx] = useState<number[]>([]);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!neteaseUrl) return;
    let cancelled = false;
    setTracksLoading(true);
    void (async () => {
      try {
        const res = await fetch("/api/netease/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: neteaseUrl }),
        });
        const data = (await res.json()) as {
          meta?: { tracks?: string[] };
        };
        if (!cancelled && res.ok && data.meta?.tracks?.length) {
          setTrackList(data.meta.tracks);
          setSelectedTrackIdx([]);
        }
      } catch {
        // optional list — ignore
      } finally {
        if (!cancelled) setTracksLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [neteaseUrl]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          release_id: releaseId,
          reason,
          tracks: formatSelectedTracks(trackList, selectedTrackIdx),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "提交失败");
      setOk(true);
      setReason("");
      setSelectedTrackIdx([]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <textarea
        required
        minLength={4}
        rows={3}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="推荐理由"
        className="w-full resize-y rounded-xl border border-white/28 bg-transparent px-3 py-2 text-sm text-white outline-none focus:border-white/40"
      />

      {tracksLoading ? (
        <p className="text-xs text-white/50">加载可选曲目…</p>
      ) : trackList.length > 0 ? (
        <div className="text-sm text-white/70">
          <span className="text-xs text-white/50">勾选想推的歌（可选）</span>
          <TrackSelectList
            tracks={trackList}
            selected={selectedTrackIdx}
            onChange={setSelectedTrackIdx}
            disabled={loading}
          />
        </div>
      ) : null}

      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
      {ok ? <p className="text-xs text-emerald-300">推荐已发布</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="glass-btn px-5 py-2 text-sm font-medium"
      >
        {loading ? "发布中…" : "发布推荐"}
      </button>
    </form>
  );
}
