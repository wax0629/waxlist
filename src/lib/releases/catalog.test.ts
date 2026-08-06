import { describe, expect, it } from "vitest";
import {
  filterByCatalog,
  getCatalogFilterStats,
  parsePeriodParam,
  parseRegionParam,
  periodForDate,
} from "./catalog";

describe("catalog filters", () => {
  it("normalizes URL region and period values", () => {
    expect(parseRegionParam("cn,jp,cn,bad")).toEqual(["cn", "jp"]);
    expect(parseRegionParam(undefined)).toEqual([]);
    expect(parsePeriodParam("2010s")).toBe("2010s");
    expect(parsePeriodParam("1990s")).toBeNull();
  });

  it("maps release dates to supported periods", () => {
    expect(periodForDate("2026-01-01T00:00:00.000Z")).toBe("2020s");
    expect(periodForDate("2010-01-01T00:00:00.000Z")).toBe("2010s");
    expect(periodForDate("2000-01-01T00:00:00.000Z")).toBe("2000s");
    expect(periodForDate("1999-12-31T00:00:00.000Z")).toBe("before-2000");
    expect(periodForDate("not-a-date")).toBeNull();
    expect(periodForDate(undefined)).toBeNull();
  });

  it("uses OR within regions and AND across region and period", () => {
    const items = [
      { id: "a", regions: ["cn" as const], released_at: "2024-01-01" },
      { id: "b", regions: ["jp" as const], released_at: "2018-01-01" },
      { id: "c", regions: ["western" as const], released_at: "2022-01-01" },
    ];

    expect(filterByCatalog(items, ["cn", "jp"], null).map((i) => i.id)).toEqual([
      "a",
      "b",
    ]);
    expect(filterByCatalog(items, ["cn", "jp"], "2020s").map((i) => i.id)).toEqual([
      "a",
    ]);
  });

  it("reports region coverage and non-overlapping period counts", () => {
    const stats = getCatalogFilterStats([
      { regions: ["cn", "jp"], released_at: "2024-01-01" },
      { regions: [], released_at: "2014-01-01" },
      { regions: ["western"], released_at: undefined },
    ]);

    expect(stats.regionCounts).toMatchObject({ cn: 1, jp: 1, western: 1, other: 0 });
    expect(stats.periodCounts).toMatchObject({ "2020s": 1, "2010s": 1 });
    expect(stats.classifiedCount).toBe(2);
    expect(stats.regionCoverage).toBeCloseTo(2 / 3);
  });
});
