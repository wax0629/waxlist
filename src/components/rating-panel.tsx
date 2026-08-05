"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { scoreToStars, StarsDisplay, StarsPicker } from "@/components/star-rating";

export function RatingPanel({
  releaseId,
  initialAvg,
  initialCount,
  initialMine,
  loggedIn,
  callbackUrl,
  compact = false,
}: {
  releaseId: string;
  initialAvg?: number | null;
  initialCount?: number;
  initialMine?: number | null;
  loggedIn: boolean;
  callbackUrl?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [avg, setAvg] = useState<number | null>(initialAvg ?? null);
  const [count, setCount] = useState(initialCount ?? 0);
  const [mine, setMine] = useState<number | null>(initialMine ?? null);
  const [hover, setHover] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(score: number) {
    if (!loggedIn) {
      const returnTo = callbackUrl ?? `/explore/${releaseId}`;
      router.push(`/login?callbackUrl=${encodeURIComponent(returnTo)}`);
      return;
    }
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/releases/${releaseId}/rate`, {
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
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "评分失败");
    } finally {
      setBusy(false);
    }
  }

  const hoverStars = hover != null ? scoreToStars(hover) : null;

  if (compact) {
    return (
      <div>
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5">
          <StarsPicker
            value={mine}
            hover={hover}
            onHover={setHover}
            onPick={(s) => void pick(s)}
            disabled={busy}
            size={20}
          />
          <span className="shrink-0 text-[11px] tabular-nums text-amber-100/80">
            {hover != null
              ? `${hover} 分`
              : mine != null
                ? `我的 ${mine} 分`
                : "点击评分"}
          </span>
          <span className="ml-auto shrink-0 text-[10px] tabular-nums text-white/45">
            {avg != null && count > 0
              ? `均分 ${avg.toFixed(1)} · ${count} 人`
              : "暂无评分"}
          </span>
        </div>
        {error ? <p className="mt-1.5 text-xs text-rose-300">{error}</p> : null}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <StarsDisplay score={avg != null && count > 0 ? avg : 0} size={18} />
        <span className="font-display text-lg font-semibold tabular-nums text-white">
          {avg != null && count > 0 ? avg.toFixed(1) : "0.0"}
        </span>
        {count > 0 ? (
          <span className="text-xs text-white/45">{count} 人评</span>
        ) : null}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <StarsPicker
          value={mine}
          hover={hover}
          onHover={setHover}
          onPick={(s) => void pick(s)}
          disabled={busy}
          size={28}
        />
        {hover != null || mine != null ? (
          <span className="text-xs tabular-nums text-white/50">
            {hover != null
              ? `${hoverStars?.toFixed(1)} 星`
              : `${scoreToStars(mine).toFixed(1)} 星`}
          </span>
        ) : null}
      </div>
      {error ? <p className="mt-1.5 text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
