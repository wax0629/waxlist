"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  scoreToStars,
  StarsDisplay,
  StarsPicker,
} from "@/components/star-rating";
import type { CommentPublic } from "@/lib/comments/store";

export function CommentSection({
  releaseId,
  initialComments,
  initialMineScore,
  loggedIn,
}: {
  releaseId: string;
  initialComments: CommentPublic[];
  initialMineScore?: number | null;
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [score, setScore] = useState<number | null>(initialMineScore ?? null);
  const [hover, setHover] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!loggedIn) {
      router.push(`/login?callbackUrl=/explore/${releaseId}`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/releases/${releaseId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body,
          score: score ?? undefined,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        comment?: CommentPublic;
      };
      if (!res.ok) throw new Error(data.error || "发表失败");
      if (data.comment) {
        setComments((prev) => [data.comment!, ...prev]);
      }
      setBody("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "发表失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-10 border-t border-white/18 pt-8">
      <h2 className="font-display text-lg font-semibold">
        评论
        {comments.length > 0 ? (
          <span className="ml-2 text-sm font-normal text-white/50">
            {comments.length}
          </span>
        ) : null}
      </h2>

      {loggedIn ? (
        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-white/50">你的评分</span>
            <StarsPicker
              value={score}
              hover={hover}
              onHover={setHover}
              onPick={setScore}
              disabled={loading}
              size={24}
            />
            <span className="text-xs tabular-nums text-white/40">
              {hover != null
                ? `${scoreToStars(hover).toFixed(1)} 星`
                : score != null
                  ? `${scoreToStars(score).toFixed(1)} 星`
                  : "可选"}
            </span>
          </div>
          <textarea
            required
            minLength={2}
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="写下你的听感…"
            className="w-full resize-y rounded-xl border border-white/20 bg-transparent px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/40"
          />
          {error ? <p className="text-xs text-rose-300">{error}</p> : null}
          <button
            type="submit"
            disabled={loading || body.trim().length < 2}
            className="touri-grad rounded-full px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "发布中…" : "发布评论"}
          </button>
        </form>
      ) : (
        <p className="mt-4 text-sm text-white/55">
          <Link
            href={`/login?callbackUrl=/explore/${releaseId}`}
            className="text-[#ff8fb3] hover:underline"
          >
            登录
          </Link>
          后评论
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {comments.map((c) => (
          <li
            key={c.id}
            className="rounded-2xl border border-white/12 bg-white/[0.03] px-4 py-3"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/50">
              <span className="font-medium text-white/80">{c.user_name}</span>
              {c.score != null ? (
                <span className="inline-flex items-center gap-1">
                  <StarsDisplay score={c.score} size={12} />
                  <span className="tabular-nums text-white/45">
                    {scoreToStars(c.score).toFixed(1)}
                  </span>
                </span>
              ) : null}
              <time dateTime={c.created_at}>
                {new Date(c.created_at).toLocaleString("zh-CN", {
                  year: "numeric",
                  month: "numeric",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
              {c.ip_masked ? (
                <span className="text-white/35">IP {c.ip_masked}</span>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-white/85">
              {c.body}
            </p>
          </li>
        ))}
        {comments.length === 0 ? (
          <li className="text-sm text-white/45">还没有评论。</li>
        ) : null}
      </ul>
    </section>
  );
}
