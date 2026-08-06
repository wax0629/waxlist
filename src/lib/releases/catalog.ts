export const CATALOG_REGION_KEYS = ["cn", "jp", "western", "other"] as const;

export type CatalogRegion = (typeof CATALOG_REGION_KEYS)[number];

export const CATALOG_REGIONS: readonly {
  key: CatalogRegion;
  label: string;
}[] = [
  { key: "cn", label: "国内" },
  { key: "jp", label: "日本" },
  { key: "western", label: "欧美" },
  { key: "other", label: "其他" },
];

export const RELEASE_PERIOD_KEYS = [
  "2020s",
  "2010s",
  "2000s",
  "before-2000",
] as const;

export type ReleasePeriod = (typeof RELEASE_PERIOD_KEYS)[number];

export const RELEASE_PERIODS: readonly {
  key: ReleasePeriod;
  label: string;
}[] = [
  { key: "2020s", label: "2020 年代" },
  { key: "2010s", label: "2010 年代" },
  { key: "2000s", label: "2000 年代" },
  { key: "before-2000", label: "2000 年前" },
];

export const PUBLIC_REGION_COVERAGE_THRESHOLD = 0.9;

export function isCatalogRegion(value: string): value is CatalogRegion {
  return CATALOG_REGION_KEYS.some((region) => region === value);
}

export function normalizeRegions(values: readonly string[]): CatalogRegion[] {
  return [...new Set(values.filter(isCatalogRegion))];
}

export function parseRegionParam(
  raw: string | string[] | undefined,
): CatalogRegion[] {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return normalizeRegions((value ?? "").split(","));
}

export function parsePeriodParam(
  raw: string | string[] | undefined,
): ReleasePeriod | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return RELEASE_PERIOD_KEYS.some((period) => period === value)
    ? (value as ReleasePeriod)
    : null;
}

export function periodForDate(
  releasedAt: string | undefined,
): ReleasePeriod | null {
  if (!releasedAt) return null;
  const year = new Date(releasedAt).getUTCFullYear();
  if (!Number.isFinite(year)) return null;
  if (year >= 2020) return "2020s";
  if (year >= 2010) return "2010s";
  if (year >= 2000) return "2000s";
  return "before-2000";
}

type CatalogRelease = {
  regions: readonly CatalogRegion[];
  released_at?: string;
};

export function filterByCatalog<T extends CatalogRelease>(
  items: readonly T[],
  regions: readonly CatalogRegion[],
  period: ReleasePeriod | null,
): T[] {
  return items.filter((item) => {
    const matchesRegion =
      regions.length === 0 || item.regions.some((region) => regions.includes(region));
    const matchesPeriod = !period || periodForDate(item.released_at) === period;
    return matchesRegion && matchesPeriod;
  });
}

export function getCatalogFilterStats(
  items: readonly CatalogRelease[],
) {
  const regionCounts = Object.fromEntries(
    CATALOG_REGION_KEYS.map((region) => [region, 0]),
  ) as Record<CatalogRegion, number>;
  const periodCounts = Object.fromEntries(
    RELEASE_PERIOD_KEYS.map((period) => [period, 0]),
  ) as Record<ReleasePeriod, number>;
  let classifiedCount = 0;

  for (const item of items) {
    const regions = normalizeRegions(item.regions);
    if (regions.length > 0) classifiedCount += 1;
    for (const region of regions) regionCounts[region] += 1;

    const period = periodForDate(item.released_at);
    if (period) periodCounts[period] += 1;
  }

  return {
    regionCounts,
    periodCounts,
    classifiedCount,
    totalCount: items.length,
    regionCoverage: items.length === 0 ? 0 : classifiedCount / items.length,
  };
}
