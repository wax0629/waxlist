"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  CATALOG_REGIONS,
  type CatalogRegion,
} from "@/lib/releases/catalog";

export interface CategoryReleaseRow {
  id: string;
  title: string;
  artists: string[];
  cover_url?: string;
  released_at?: string;
  regions: CatalogRegion[];
}

export function AdminCategoryPanel({
  initialItems,
}: {
  initialItems: CategoryReleaseRow[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [unknownOnly, setUnknownOnly] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const visible = useMemo(
    () => (unknownOnly ? items.filter((item) => item.regions.length === 0) : items),
    [items, unknownOnly],
  );
  const classified = items.filter((item) => item.regions.length > 0).length;
  const coverage = items.length === 0 ? 0 : Math.round((classified / items.length) * 100);
  const selectedVisible = visible.filter((item) => selected.has(item.id));
  const allVisibleSelected =
    visible.length > 0 && selectedVisible.length === visible.length;

  function toggleSelected(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    setSelected((current) => {
      const next = new Set(current);
      if (allVisibleSelected) {
        for (const item of visible) next.delete(item.id);
      } else {
        for (const item of visible) next.add(item.id);
      }
      return next;
    });
  }

  async function saveRegions(ids: string[], regions: CatalogRegion[]) {
    if (busy || ids.length === 0) return;
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch("/api/admin/releases/regions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, regions }),
      });
      const data = (await res.json()) as { error?: string; count?: number };
      if (!res.ok) throw new Error(data.error || "地区更新失败");
      setItems((current) =>
        current.map((item) =>
          ids.includes(item.id) ? { ...item, regions } : item,
        ),
      );
      setSelected((current) => {
        const next = new Set(current);
        for (const id of ids) next.delete(id);
        return next;
      });
      setOk(`已更新 ${data.count ?? ids.length} 张专辑`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "地区更新失败");
    } finally {
      setBusy(false);
    }
  }

  function toggleRowRegion(item: CategoryReleaseRow, region: CatalogRegion) {
    const regions = item.regions.includes(region)
      ? item.regions.filter((value) => value !== region)
      : [...item.regions, region];
    void saveRegions([item.id], regions);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
        <div className="min-w-[220px] flex-1">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <p className="text-white/70">
              已分类 <span className="font-medium text-white">{classified}</span> / {items.length}
            </p>
            <span className="tabular-nums text-white/45">{coverage}%</span>
          </div>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-label="地区分类覆盖率"
            aria-valuenow={coverage}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-[#ff7aa8] transition-[width]"
              style={{ width: `${coverage}%` }}
            />
          </div>
          <p className="mt-2 text-[12px] text-white/40">
            覆盖率达到 90% 后，前台会开放地区筛选。
          </p>
        </div>
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-white/12 px-3 text-[13px] text-white/65">
          <input
            type="checkbox"
            checked={unknownOnly}
            onChange={(event) => setUnknownOnly(event.target.checked)}
            className="h-4 w-4 accent-[#ff7aa8]"
          />
          只看待分类
        </label>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100/90">
          {error}
        </div>
      ) : null}
      {ok ? (
        <div className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100/90">
          {ok}
        </div>
      ) : null}

      <div className="mt-5 flex min-h-11 flex-wrap items-center gap-2">
        <label className="mr-1 inline-flex min-h-11 cursor-pointer items-center gap-2 text-[13px] text-white/60">
          <input
            type="checkbox"
            checked={allVisibleSelected}
            onChange={toggleAllVisible}
            className="h-4 w-4 accent-[#ff7aa8]"
          />
          全选当前 {visible.length} 张
        </label>
        {selected.size > 0 ? (
          <>
            <span className="text-[12px] text-white/40">批量设为</span>
            {CATALOG_REGIONS.map((region) => (
              <button
                key={region.key}
                type="button"
                disabled={busy}
                onClick={() => void saveRegions([...selected], [region.key])}
                className="min-h-11 rounded-xl border border-white/15 px-3 text-[13px] text-white/70 transition hover:border-[#ff8fb3]/50 hover:text-white disabled:opacity-45"
              >
                {region.label}
              </button>
            ))}
            <button
              type="button"
              disabled={busy}
              onClick={() => void saveRegions([...selected], [])}
              className="min-h-11 rounded-xl border border-white/10 px-3 text-[13px] text-white/45 disabled:opacity-45"
            >
              清空地区
            </button>
          </>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <div className="mt-5 border-t border-dashed border-white/15 py-16 text-center">
          <p className="text-sm text-white/55">
            {unknownOnly ? "所有在架专辑都已分类" : "暂无在架专辑"}
          </p>
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-white/[0.07] border-y border-white/10">
          {visible.map((item) => (
            <li key={item.id} className="flex gap-3 py-4 sm:gap-4">
              <label className="flex min-h-14 cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={selected.has(item.id)}
                  onChange={() => toggleSelected(item.id)}
                  className="h-4 w-4 accent-[#ff7aa8]"
                  aria-label={`选择 ${item.title}`}
                />
              </label>
              <Link
                href={`/explore/${item.id}`}
                className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-white/[0.05] ring-1 ring-white/10 sm:h-16 sm:w-16"
              >
                {item.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.cover_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center text-[9px] text-white/25">
                    无封面
                  </span>
                )}
              </Link>
              <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between sm:gap-5">
                <div className="min-w-0">
                  <Link
                    href={`/explore/${item.id}`}
                    className="block truncate text-sm font-medium text-white hover:underline"
                  >
                    {item.title}
                  </Link>
                  <p className="mt-0.5 truncate text-[12px] text-white/48">
                    {item.artists.join(" / ")}
                  </p>
                  <p className="mt-1 text-[11px] tabular-nums text-white/32">
                    {item.released_at
                      ? new Date(item.released_at).toLocaleDateString("zh-CN")
                      : "发行日期未知"}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5 sm:mt-0 sm:shrink-0 sm:justify-end">
                  {CATALOG_REGIONS.map((region) => {
                    const active = item.regions.includes(region.key);
                    return (
                      <button
                        key={region.key}
                        type="button"
                        disabled={busy}
                        aria-pressed={active}
                        onClick={() => toggleRowRegion(item, region.key)}
                        className={
                          active
                            ? "min-h-10 rounded-xl bg-[#ff6b9e]/18 px-3 text-[12px] font-medium text-[#ffc2d6] ring-1 ring-[#ff6b9e]/35 disabled:opacity-45"
                            : "min-h-10 rounded-xl border border-white/12 px-3 text-[12px] text-white/48 transition hover:border-white/25 hover:text-white/75 disabled:opacity-45"
                        }
                      >
                        {region.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
