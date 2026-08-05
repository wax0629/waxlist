import { describe, expect, it } from "vitest";
import { formatReleasedAt } from "./format";

describe("release date formatting", () => {
  it("formats an ISO release date for the Chinese UI", () => {
    expect(formatReleasedAt("2024-02-03T00:00:00.000Z")).toBe(
      "2024年2月3日",
    );
  });

  it("returns null when a release date is missing or invalid", () => {
    expect(formatReleasedAt(undefined)).toBeNull();
    expect(formatReleasedAt(null)).toBeNull();
    expect(formatReleasedAt("not-a-date")).toBeNull();
  });
});
