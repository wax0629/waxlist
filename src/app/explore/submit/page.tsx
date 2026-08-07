"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useRef, useState } from "react";
import { AppRail } from "@/components/app-rail";
import { BackLink } from "@/components/back-link";
import { CATALOG_REGIONS, type CatalogRegion } from "@/lib/releases/catalog";
import {
  formatSelectedTracks,
  TrackSelectList,
} from "@/components/track-select-list";

type ReleaseType = "album" | "ep" | "single" | "other";

interface ResolvedMeta {
  netease_id: string;
  netease_url: string;
  title: string;
  artists: string[];
  cover_url?: string;
  type: ReleaseType;
  tracks: string[];
  company?: string;
}

export default function SubmitReleasePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [neteaseUrl, setNeteaseUrl] = useState("");
  const [title, setTitle] = useState("");
  const [artists, setArtists] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [reason, setReason] = useState("");
  const [trackList, setTrackList] = useState<string[]>([]);
  const [selectedTrackIdx, setSelectedTrackIdx] = useState<number[]>([]);
  const [type, setType] = useState<ReleaseType>("album");
  const [regions, setRegions] = useState<CatalogRegion[]>([]);
  const [udg, setUdg] = useState(false);
  const [meta, setMeta] = useState<ResolvedMeta | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  /** Owner: attach pink 友情 badge (mixing clients etc.) */
  const [friend, setFriend] = useState(false);
  const lastResolved = useRef("");
  const isOwner = session?.user?.role === "owner";

  const resolveUrl = useCallback(async (url: string) => {
    const trimmed = url.trim();
    if (
      !trimmed ||
      !/163cn\.tv|163\.com|music\.163|^\d+$|专辑|分享/i.test(trimmed)
    ) {
      return;
    }
    if (trimmed === lastResolved.current) return;

    setResolving(true);
    setResolveError(null);
    try {
      const res = await fetch("/api/netease/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = (await res.json()) as {
        error?: string;
        meta?: ResolvedMeta;
      };
      if (!res.ok || !data.meta) {
        throw new Error(data.error || "解析失败");
      }
      const m = data.meta;
      lastResolved.current = trimmed;
      setMeta(m);
      setTitle(m.title);
      setArtists(m.artists.join("，"));
      setCoverUrl(m.cover_url || "");
      setType(m.type);
      setTrackList(m.tracks ?? []);
      setSelectedTrackIdx([]); // user picks picks intentionally
      if (m.netease_url) {
        setNeteaseUrl(m.netease_url);
        lastResolved.current = m.netease_url;
      }
    } catch (err) {
      setMeta(null);
      setTrackList([]);
      setSelectedTrackIdx([]);
      setResolveError(err instanceof Error ? err.message : "解析失败");
    } finally {
      setResolving(false);
    }
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          netease_url: neteaseUrl,
          title: title.trim(),
          artists: artists
            .split(/[,，、]/)
            .map((s) => s.trim())
            .filter(Boolean),
          cover_url: coverUrl || undefined,
          type,
          reason,
          tracks: formatSelectedTracks(trackList, selectedTrackIdx),
          regions,
          udg,
          ...(isOwner && friend ? { friend: true } : {}),
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        message?: string;
        release_id?: string;
        status?: "pending" | "published";
      };
      if (!res.ok) throw new Error(data.error || "提交失败");
      setOk(data.message || "提交成功");
      if (data.status === "published" && data.release_id) {
        setTimeout(() => router.push(`/explore/${data.release_id}`), 800);
      }
      setNeteaseUrl("");
      setTitle("");
      setArtists("");
      setCoverUrl("");
      setReason("");
      setTrackList([]);
      setSelectedTrackIdx([]);
      setFriend(false);
      setRegions([]);
      setUdg(false);
      setMeta(null);
      lastResolved.current = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交失败");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center text-white/68">
        加载…
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex min-h-dvh flex-1 text-white">
        <AppRail />
        <main className="mx-auto max-w-md flex-1 px-4 py-16 text-center">
          <p>推荐专辑需要登录。</p>
          <Link
            href="/login?callbackUrl=/explore/submit"
            className="mt-4 inline-block text-[#ff8fb3]"
          >
            去登录 →
          </Link>
        </main>
      </div>
    );
  }

  const inputCls =
    "mt-1.5 w-full rounded-xl border border-white/28 bg-transparent px-3 py-2.5 text-white outline-none focus:border-white/35";

  return (
    <div className="flex min-h-dvh flex-1 text-white">
      <AppRail />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8 sm:px-6">
        <BackLink href="/explore" label="返回优质发行" />
        <h1 className="mt-4 font-display text-2xl font-semibold">推荐专辑</h1>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block text-sm text-white/70">
            网易云链接 *
            <div className="mt-1.5 flex gap-2">
              <input
                required
                value={neteaseUrl}
                onChange={(e) => {
                  setNeteaseUrl(e.target.value);
                  setResolveError(null);
                }}
                onBlur={() => void resolveUrl(neteaseUrl)}
                onPaste={(e) => {
                  const text = e.clipboardData.getData("text");
                  if (text) {
                    // Let paste apply, then resolve
                    setTimeout(() => void resolveUrl(text), 0);
                  }
                }}
                placeholder="网易云链接或手机分享短链 163cn.tv/…"
                className={`${inputCls} mt-0 flex-1`}
              />
              <button
                type="button"
                disabled={resolving || !neteaseUrl.trim()}
                onClick={() => {
                  lastResolved.current = "";
                  void resolveUrl(neteaseUrl);
                }}
                className="shrink-0 rounded-xl border border-white/20 px-3 py-2 text-sm text-white/80 hover:border-white/40 disabled:opacity-50"
              >
                {resolving ? "解析中…" : "解析"}
              </button>
            </div>
          </label>

          {resolveError ? (
            <p className="text-sm text-rose-300">{resolveError}</p>
          ) : null}

          {meta || coverUrl || title ? (
            <div className="flex gap-3 rounded-2xl border border-white/24 bg-white/[0.03] p-3">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-white/[0.06]">
                {coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-white/30">
                    无封面
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-white">
                  {title || "—"}
                </p>
                <p className="truncate text-sm text-white/68">
                  {artists || "—"}
                </p>
                {meta?.company ? (
                  <p className="mt-1 text-xs text-white/35">{meta.company}</p>
                ) : null}
                {resolving ? (
                  <p className="mt-1 text-xs text-[#ff8fb3]">
                    正在拉取网易云信息…
                  </p>
                ) : meta ? (
                  <p className="mt-1 text-xs text-emerald-300/80">
                    已自动填充，可改字段后提交
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          <label className="block text-sm text-white/70">
            标题 *
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className="block text-sm text-white/70">
            艺人 *（逗号分隔）
            <input
              required
              value={artists}
              onChange={(e) => setArtists(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className="block text-sm text-white/70">
            封面图 URL
            <input
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="自动填充，可改"
              className={inputCls}
            />
          </label>
          <label className="block text-sm text-white/70">
            类型
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ReleaseType)}
              className={`${inputCls} bg-[#121212]`}
            >
              <option value="album">专辑</option>
              <option value="ep">EP</option>
              <option value="single">单曲</option>
              <option value="other">其他</option>
            </select>
          </label>
          <fieldset className="block text-sm text-white/70">
            <legend>地区（可多选，可留空）</legend>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CATALOG_REGIONS.map((region) => {
                const selected = regions.includes(region.key);
                return (
                  <button
                    key={region.key}
                    type="button"
                    aria-pressed={selected}
                    onClick={() =>
                      setRegions((current) =>
                        selected
                          ? current.filter((value) => value !== region.key)
                          : [...current, region.key],
                      )
                    }
                    className={
                      selected
                        ? "min-h-11 rounded-xl bg-[#ff6b9e]/18 px-3 text-[13px] text-[#ffc2d6] ring-1 ring-[#ff6b9e]/35"
                        : "min-h-11 rounded-xl border border-white/15 px-3 text-[13px] text-white/60 hover:border-white/30 hover:text-white"
                    }
                  >
                    {region.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-white/40">
              目前网易云数据没有稳定的地区字段，无法可靠判断时请留空，由后台补录。
            </p>
          </fieldset>
          <fieldset className="block text-sm text-white/70">
            <legend>风格（可选）</legend>
            <button
              type="button"
              aria-pressed={udg}
              onClick={() => setUdg((current) => !current)}
              className={
                udg
                  ? "mt-2 min-h-11 rounded-xl bg-[#ff6b9e]/18 px-4 text-[13px] font-medium text-[#ffc2d6] ring-1 ring-[#ff6b9e]/35"
                  : "mt-2 min-h-11 rounded-xl border border-white/15 px-4 text-[13px] text-white/60 hover:border-white/30 hover:text-white"
              }
            >
              UDG
            </button>
            <p className="mt-2 text-[12px] leading-relaxed text-white/40">
              勾选后，这张专辑上架时会同时进入 UDG 专区。
            </p>
          </fieldset>
          <label className="block text-sm text-white/70">
            推荐理由（可选）
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="想说的话可以写在这里，也可以留空"
              maxLength={2000}
              className={`${inputCls} resize-y`}
            />
            <span className="mt-1.5 block text-[12px] leading-relaxed text-white/40">
              不填写也能正常推荐。
            </span>
          </label>

          <div className="block text-sm text-white/70">
            <span>推荐曲目（可选，勾选你想推的歌）</span>
            <TrackSelectList
              tracks={trackList}
              selected={selectedTrackIdx}
              onChange={setSelectedTrackIdx}
              disabled={resolving}
            />
          </div>

          {isOwner ? (
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-pink-300/25 bg-gradient-to-r from-[#ff6b9e]/10 via-[#ff8fb3]/08 to-[#f0abfc]/10 px-3.5 py-3">
              <input
                type="checkbox"
                checked={friend}
                onChange={(e) => setFriend(e.target.checked)}
                className="h-4 w-4 shrink-0 rounded border-pink-300/50 accent-[#ff6b9e]"
              />
              <span
                className={
                  friend
                    ? "rounded-full border border-pink-200/40 bg-gradient-to-r from-[#ff6b9e] via-[#ff8fb3] to-[#f0abfc] px-2.5 py-0.5 text-[11px] font-semibold text-white"
                    : "rounded-full border border-pink-300/25 px-2.5 py-0.5 text-[11px] font-semibold text-pink-200/50"
                }
              >
                友情
              </span>
            </label>
          ) : null}

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          {ok ? <p className="text-sm text-emerald-300">{ok}</p> : null}

          <button
            type="submit"
            disabled={loading || resolving}
            className="glass-btn glass-btn-block px-5 py-2.5 text-sm font-semibold"
          >
            {loading ? "提交中…" : "提交推荐"}
          </button>
        </form>
      </main>
    </div>
  );
}
