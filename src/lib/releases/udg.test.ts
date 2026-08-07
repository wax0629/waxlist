import { describe, expect, it } from "vitest";
import { hasUdgTag, mergeUdgFlag, withUdgTag, withoutUdgTag } from "./udg";

describe("UDG release tag", () => {
  it("recognizes the tag without depending on casing", () => {
    expect(hasUdgTag(["trap", "udg"])).toBe(true);
    expect(hasUdgTag(["友情"])).toBe(false);
  });

  it("writes one canonical UDG tag", () => {
    expect(withUdgTag(["udg", "trap", "UDG"])).toEqual(["trap", "UDG"]);
  });

  it("removes the reserved tag when the flag is disabled", () => {
    expect(withoutUdgTag(["UDG", "trap"])).toEqual(["trap"]);
    expect(mergeUdgFlag(["trap"], false)).toEqual(["trap"]);
  });
});
