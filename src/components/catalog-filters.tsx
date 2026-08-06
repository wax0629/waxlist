"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import {
  CATALOG_REGIONS,
  RELEASE_PERIODS,
  filterByCatalog,
  type CatalogRegion,
  type ReleasePeriod,
} from "@/lib/releases/catalog";

type Counts<T extends string> = Record<T, number>;

export function CatalogFilters({
  selectedRegions,
  selectedPeriod,
  regionCounts,
  periodCounts,
  regionEnabled,
  regionCoverage,
  catalogItems,
}: {
  selectedRegions: CatalogRegion[];
  selectedPeriod: ReleasePeriod | null;
  regionCounts: Counts<CatalogRegion>;
  periodCounts: Counts<ReleasePeriod>;
  regionEnabled: boolean;
  regionCoverage: number;
  catalogItems: { regions: CatalogRegion[]; released_at?: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [draftRegions, setDraftRegions] = useState(selectedRegions);
  const [draftPeriod, setDraftPeriod] = useState<ReleasePeriod | null>(
    selectedPeriod,
  );

  function hrefFor(regions: CatalogRegion[], period: ReleasePeriod | null) {
    const next = new URLSearchParams(searchParams.toString());
    if (regions.length > 0) next.set("region", regions.join(","));
    else next.delete("region");
    if (period) next.set("period", period);
    else next.delete("period");
    const query = next.toString();
    return query ? `/explore?${query}` : "/explore";
  }

  function navigate(regions: CatalogRegion[], period: ReleasePeriod | null) {
    router.push(hrefFor(regions, period), { scroll: false });
  }

  function toggleRegion(
    current: CatalogRegion[],
    region: CatalogRegion,
  ): CatalogRegion[] {
    return current.includes(region)
      ? current.filter((value) => value !== region)
      : [...current, region];
  }

  function openMobile() {
    setDraftRegions(selectedRegions);
    setDraftPeriod(selectedPeriod);
    setMobileOpen(true);
  }

  function closeMobile() {
    setMobileOpen(false);
  }

  function applyMobile() {
    navigate(regionEnabled ? draftRegions : [], draftPeriod);
    closeMobile();
  }

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  const periodLabel = RELEASE_PERIODS.find(
    (period) => period.key === selectedPeriod,
  )?.label;
  const activeCount =
    (regionEnabled ? selectedRegions.length : 0) + (selectedPeriod ? 1 : 0);
  const coveragePercent = Math.round(regionCoverage * 100);
  const draftResultCount = filterByCatalog(
    catalogItems,
    regionEnabled ? draftRegions : [],
    draftPeriod,
  ).length;

  return (
    <>
      <div className="hidden lg:block">
        <h2 className="text-[12px] font-medium text-white/50">筛选</h2>
        <div className="mt-1.5 space-y-1.5">
          {regionEnabled ? (
            <details className="group rounded-xl border border-white/12 open:border-white/20 open:bg-white/[0.025]">
              <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-2 px-3 text-[13px] text-white/60 marker:content-none">
                <span>地区</span>
                <span className="text-[11px] text-white/35">
                  {selectedRegions.length > 0 ? selectedRegions.length : "+"}
                </span>
              </summary>
              <div className="space-y-1 border-t border-white/8 p-1.5">
                {CATALOG_REGIONS.map((region) => {
                  const active = selectedRegions.includes(region.key);
                  return (
                    <button
                      key={region.key}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        navigate(
                          toggleRegion(selectedRegions, region.key),
                          selectedPeriod,
                        )
                      }
                      className={
                        active
                          ? "flex min-h-9 w-full items-center justify-between rounded-lg bg-white/10 px-2.5 text-left text-[12px] text-white"
                          : "flex min-h-9 w-full items-center justify-between rounded-lg px-2.5 text-left text-[12px] text-white/48 hover:bg-white/[0.05] hover:text-white/75"
                      }
                    >
                      <span>{region.label}</span>
                      <span className="tabular-nums text-white/30">
                        {regionCounts[region.key]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </details>
          ) : (
            <div
              className="flex min-h-10 cursor-default items-center justify-between gap-2 rounded-xl border border-dashed border-white/12 px-3 text-[13px] text-white/38"
              title={`地区已整理 ${coveragePercent}%，达到 90% 后开放`}
            >
              <span>地区</span>
              <span className="text-[10px]">整理中 {coveragePercent}%</span>
            </div>
          )}

          <details className="group rounded-xl border border-white/12 open:border-white/20 open:bg-white/[0.025]">
            <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-2 px-3 text-[13px] text-white/60 marker:content-none">
              <span>年代</span>
              <span className="max-w-[90px] truncate text-[11px] text-white/35">
                {periodLabel ?? "+"}
              </span>
            </summary>
            <div className="space-y-1 border-t border-white/8 p-1.5">
              <button
                type="button"
                aria-pressed={!selectedPeriod}
                onClick={() => navigate(selectedRegions, null)}
                className={
                  !selectedPeriod
                    ? "flex min-h-9 w-full items-center justify-between rounded-lg bg-white/10 px-2.5 text-left text-[12px] text-white"
                    : "flex min-h-9 w-full items-center justify-between rounded-lg px-2.5 text-left text-[12px] text-white/48 hover:bg-white/[0.05] hover:text-white/75"
                }
              >
                <span>全部年代</span>
              </button>
              {RELEASE_PERIODS.map((period) => {
                const active = selectedPeriod === period.key;
                return (
                  <button
                    key={period.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => navigate(selectedRegions, period.key)}
                    className={
                      active
                        ? "flex min-h-9 w-full items-center justify-between rounded-lg bg-white/10 px-2.5 text-left text-[12px] text-white"
                        : "flex min-h-9 w-full items-center justify-between rounded-lg px-2.5 text-left text-[12px] text-white/48 hover:bg-white/[0.05] hover:text-white/75"
                    }
                  >
                    <span>{period.label}</span>
                    <span className="tabular-nums text-white/30">
                      {periodCounts[period.key]}
                    </span>
                  </button>
                );
              })}
            </div>
          </details>

          <div
            className="flex min-h-10 cursor-default items-center justify-between gap-2 rounded-xl border border-dashed border-white/12 px-3 text-[13px] text-white/38"
            title="风格分类正在整理"
          >
            <span>风格</span>
            <span className="text-[10px]">整理中</span>
          </div>
        </div>
      </div>

      <div className="lg:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openMobile}
            className={
              activeCount > 0
                ? "min-h-11 rounded-full bg-white/12 px-4 text-[13px] font-medium text-white ring-1 ring-white/20"
                : "min-h-11 rounded-full border border-white/15 px-4 text-[13px] text-white/65"
            }
          >
            筛选{activeCount > 0 ? ` ${activeCount}` : ""}
          </button>
          {regionEnabled
            ? selectedRegions.map((key) => {
                const region = CATALOG_REGIONS.find((item) => item.key === key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      navigate(
                        selectedRegions.filter((value) => value !== key),
                        selectedPeriod,
                      )
                    }
                    className="min-h-11 rounded-full bg-white/[0.07] px-3 text-[12px] text-white/65"
                    aria-label={`清除${region?.label ?? key}筛选`}
                  >
                    {region?.label ?? key} ×
                  </button>
                );
              })
            : null}
          {selectedPeriod ? (
            <button
              type="button"
              onClick={() => navigate(selectedRegions, null)}
              className="min-h-11 rounded-full bg-white/[0.07] px-3 text-[12px] text-white/65"
              aria-label={`清除${periodLabel ?? "年代"}筛选`}
            >
              {periodLabel} ×
            </button>
          ) : null}
        </div>
      </div>

      {mobileOpen
        ? createPortal(
            <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            onClick={closeMobile}
            aria-label="关闭筛选"
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="catalog-filter-title"
            className="absolute inset-x-0 bottom-0 max-h-[86dvh] overflow-y-auto rounded-t-2xl border-t border-white/15 bg-[#111] px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] shadow-2xl"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" aria-hidden />
            <div className="flex items-center justify-between gap-3">
              <h2 id="catalog-filter-title" className="font-display text-lg font-semibold">
                筛选
              </h2>
              <button
                type="button"
                onClick={closeMobile}
                className="flex h-11 w-11 items-center justify-center rounded-full text-xl text-white/60"
                aria-label="关闭"
              >
                ×
              </button>
            </div>

            <div className="mt-4 border-t border-white/10 pt-5">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-sm font-medium text-white/85">地区</h3>
                {!regionEnabled ? (
                  <span className="text-[11px] text-white/35">整理中 {coveragePercent}%</span>
                ) : null}
              </div>
              {regionEnabled ? (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {CATALOG_REGIONS.map((region) => {
                    const active = draftRegions.includes(region.key);
                    return (
                      <button
                        key={region.key}
                        type="button"
                        aria-pressed={active}
                        onClick={() =>
                          setDraftRegions((current) => toggleRegion(current, region.key))
                        }
                        className={
                          active
                            ? "min-h-12 rounded-xl bg-[#ff6b9e]/18 px-3 text-sm text-[#ffc2d6] ring-1 ring-[#ff6b9e]/35"
                            : "min-h-12 rounded-xl border border-white/12 px-3 text-sm text-white/58"
                        }
                      >
                        {region.label} · {regionCounts[region.key]}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-2 text-[13px] leading-relaxed text-white/42">
                  地区数据补录达到 90% 后开放筛选。
                </p>
              )}
            </div>

            <div className="mt-6 border-t border-white/10 pt-5">
              <h3 className="text-sm font-medium text-white/85">年代</h3>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {RELEASE_PERIODS.map((period) => {
                  const active = draftPeriod === period.key;
                  return (
                    <button
                      key={period.key}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setDraftPeriod(active ? null : period.key)}
                      className={
                        active
                          ? "min-h-12 rounded-xl bg-[#ff6b9e]/18 px-3 text-sm text-[#ffc2d6] ring-1 ring-[#ff6b9e]/35"
                          : "min-h-12 rounded-xl border border-white/12 px-3 text-sm text-white/58"
                      }
                    >
                      {period.label} · {periodCounts[period.key]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 border-t border-white/10 pt-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium text-white/50">风格</h3>
                <span className="text-[11px] text-white/30">分类整理中</span>
              </div>
            </div>

            <div className="sticky bottom-0 mt-6 flex gap-2 bg-[#111] pt-3">
              <button
                type="button"
                onClick={() => {
                  setDraftRegions([]);
                  setDraftPeriod(null);
                }}
                className="min-h-12 rounded-xl border border-white/15 px-4 text-sm text-white/60"
              >
                重置
              </button>
              <button
                type="button"
                onClick={applyMobile}
                className="min-h-12 flex-1 rounded-xl bg-[#ff6b9e] px-5 text-sm font-semibold text-[#16070d]"
              >
                查看 {draftResultCount} 张
              </button>
            </div>
          </section>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
