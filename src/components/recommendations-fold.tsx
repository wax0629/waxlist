"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import type { RecommendationPublic } from "@/lib/recommendations/types";

export function RecommendationsFold({
  items,
  /** 卡片底部：我也要推荐 / 表单 */
  footer,
}: {
  items: RecommendationPublic[];
  footer?: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const first = items[0];
  const rest = items.slice(1);

  return (
    <div className="glass-rim mt-1.5 overflow-hidden rounded-2xl">
      {first ? (
        <article className="px-4 py-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/55">
            <span className="font-medium text-white/85">{first.user_name}</span>
            {first.is_first ? (
              <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-100/90">
                首推
              </span>
            ) : null}
            <time dateTime={first.created_at}>
              {new Date(first.created_at).toLocaleDateString("zh-CN")}
            </time>
          </div>
          {first.reason.trim() ? (
            <p className="mt-2 text-sm leading-relaxed text-white/85">
              {first.reason}
            </p>
          ) : (
            <p className="mt-2 text-sm text-white/50">推荐了这张专辑</p>
          )}
          {first.tracks ? (
            <p className="mt-2 text-xs text-white/50">
              推荐曲目：{first.tracks.replace(/\n/g, "、")}
            </p>
          ) : null}
        </article>
      ) : (
        <p className="px-4 py-3 text-sm text-white/50">
          还没有人推荐，来当第一位吧。
        </p>
      )}

      {rest.length > 0 ? (
        <div className="border-t border-white/10 px-4 py-2.5">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-sm text-white/55 transition hover:text-white/85"
          >
            {open
              ? "收起其他推荐"
              : `还有 ${rest.length} 条推荐，展开查看`}
            <span className="ml-1 opacity-70">{open ? "▴" : "▾"}</span>
          </button>
          {open ? (
            <ul className="mt-3 space-y-2 pb-1">
              {rest.map((rec) => (
                <li
                  key={rec.id}
                  className="rounded-xl border border-white/12 bg-white/[0.03] px-3 py-2.5"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs text-white/50">
                    <span className="font-medium text-white/75">
                      {rec.user_name}
                    </span>
                    <time dateTime={rec.created_at}>
                      {new Date(rec.created_at).toLocaleDateString("zh-CN")}
                    </time>
                  </div>
                  {rec.reason.trim() ? (
                    <p className="mt-1.5 text-sm leading-relaxed text-white/80">
                      {rec.reason}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-sm text-white/45">
                      推荐了这张专辑
                    </p>
                  )}
                  {rec.tracks ? (
                    <p className="mt-1 text-xs text-white/45">
                      推荐曲目：{rec.tracks.replace(/\n/g, "、")}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {footer ? (
        <div className="border-t border-white/12 px-4 py-3">{footer}</div>
      ) : null}
    </div>
  );
}

export function RecommendFooter({
  releaseId,
  alreadyRecd,
  loggedIn,
  loginHref,
  form,
}: {
  releaseId: string;
  alreadyRecd: boolean;
  loggedIn: boolean;
  loginHref: string;
  form: ReactNode;
}) {
  void releaseId;
  if (!loggedIn) {
    return (
      <p className="text-sm text-white/55">
        <Link href={loginHref} className="text-[#ff8fb3] hover:underline">
          登录
        </Link>
        后推荐
      </p>
    );
  }
  if (alreadyRecd) {
    return null;
  }
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-white/80">我也要推荐</p>
      {form}
    </div>
  );
}
