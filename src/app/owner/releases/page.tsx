"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { FormEvent, useEffect, useState } from "react";
import { AppRail } from "@/components/app-rail";
import { BackLink } from "@/components/back-link";
import type { Release } from "@/lib/releases/types";

export default function OwnerReleasesPage() {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<Release[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [neteaseUrl, setNeteaseUrl] = useState("");
  const [title, setTitle] = useState("");
  const [artists, setArtists] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [note, setNote] = useState("");
  const [tags, setTags] = useState("");
  const [type, setType] = useState<"album" | "ep" | "single" | "other">(
    "album",
  );
  const [sortOrder, setSortOrder] = useState("0");
  const [friend, setFriend] = useState(false);

  const isOwner = session?.user?.role === "owner";

  async function load() {
    const res = await fetch("/api/releases?source=owner&status=all");
    if (!res.ok) return;
    const data = (await res.json()) as { items: Release[] };
    setItems(data.items ?? []);
  }

  useEffect(() => {
    if (isOwner) void load();
  }, [isOwner]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch("/api/releases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "owner",
          status: "published",
          title,
          artists: artists
            .split(/[,，、]/)
            .map((s) => s.trim())
            .filter(Boolean),
          type,
          netease_url: neteaseUrl || undefined,
          cover_url: coverUrl || undefined,
          curatorial_note: note || undefined,
          tags: (() => {
            const base = tags
              .split(/[,，、\s]+/)
              .map((s) => s.trim())
              .filter(Boolean);
            if (friend && !base.includes("友情")) base.push("友情");
            return base;
          })(),
          sort_order: Number(sortOrder) || 0,
        }),
      });
      const data = (await res.json()) as { error?: string; release?: Release };
      if (!res.ok) throw new Error(data.error || "保存失败");
      setOk(`已发布：${data.release?.title}`);
      setTitle("");
      setArtists("");
      setCoverUrl("");
      setNote("");
      setNeteaseUrl("");
      setTags("");
      setFriend(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center text-white/50">
        加载…
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex min-h-dvh flex-1 text-white">
        <AppRail />
        <main className="mx-auto max-w-md flex-1 px-4 py-16 text-center">
          <p>请先以站主账号登录。</p>
          <Link href="/login?callbackUrl=/owner/releases" className="mt-4 inline-block text-[#ff8fb3]">
            去登录 →
          </Link>
        </main>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="flex min-h-dvh flex-1 text-white">
        <AppRail />
        <main className="mx-auto max-w-md flex-1 px-4 py-16 text-center text-white/60">
          仅站主可管理爱听。当前角色：{session.user.role}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-1 text-white">
      <AppRail />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
        <BackLink href="/explore" label="返回优质发行" />
        <h1 className="mt-4 font-display text-2xl font-semibold">添加专辑</h1>
        <p className="mt-2 text-sm text-white/50">
          发布到优质发行列表。任何登录用户都可点红心进「我的红心」；你作为站主点红心后，该专会显示「站主爱听」标签。
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <Field label="网易云链接">
            <input
              value={neteaseUrl}
              onChange={(e) => setNeteaseUrl(e.target.value)}
              placeholder="https://music.163.com/#/album?id=..."
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-transparent px-3 py-2.5 text-white outline-none focus:border-white/35"
            />
          </Field>
          <Field label="标题 *">
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-transparent px-3 py-2.5 text-white outline-none focus:border-white/35"
            />
          </Field>
          <Field label="艺人 *（逗号分隔）">
            <input
              required
              value={artists}
              onChange={(e) => setArtists(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-transparent px-3 py-2.5 text-white outline-none focus:border-white/35"
            />
          </Field>
          <Field label="封面图 URL（手填）">
            <input
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://..."
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-transparent px-3 py-2.5 text-white outline-none focus:border-white/35"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="类型">
              <select
                value={type}
                onChange={(e) =>
                  setType(e.target.value as typeof type)
                }
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#121212] px-3 py-2.5 text-white outline-none focus:border-white/35"
              >
                <option value="album">专辑</option>
                <option value="ep">EP</option>
                <option value="single">单曲</option>
                <option value="other">其他</option>
              </select>
            </Field>
            <Field label="排序（小数在前）">
              <input
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-transparent px-3 py-2.5 text-white outline-none focus:border-white/35"
              />
            </Field>
          </div>
          <Field label="标签（逗号分隔）">
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="underground, trap"
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-transparent px-3 py-2.5 text-white outline-none focus:border-white/35"
            />
          </Field>
          <Field label="我为什么爱听 *">
            <textarea
              required
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1.5 w-full resize-y rounded-xl border border-white/15 bg-transparent px-3 py-2.5 text-white outline-none focus:border-white/35"
            />
          </Field>
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
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          {ok ? <p className="text-sm text-emerald-300">{ok}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="glass-btn glass-btn-block px-5 py-2.5 text-sm font-semibold"
          >
            {loading ? "保存中…" : "发布到优质发行"}
          </button>
        </form>

        <section className="mt-12">
          <h2 className="font-display text-lg font-semibold">我添加的</h2>
          <ul className="mt-3 space-y-2">
            {items.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-3 py-2 text-sm"
              >
                <span className="truncate">
                  {r.title}
                  <span className="text-white/40"> · {r.artists.join("/")}</span>
                </span>
                <Link
                  href={`/explore/${r.id}`}
                  className="shrink-0 text-white/55 hover:text-white"
                >
                  查看
                </Link>
              </li>
            ))}
            {items.length === 0 ? (
              <li className="text-sm text-white/40">暂无</li>
            ) : null}
          </ul>
        </section>
      </main>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm text-white/70">
      {label}
      {children}
    </label>
  );
}
