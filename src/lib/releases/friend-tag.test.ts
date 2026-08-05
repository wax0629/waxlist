import { describe, expect, it } from "vitest";
import {
  displayTags,
  hasFriendTag,
  mergeFriendFlag,
  withFriendTag,
  withoutFriendTag,
} from "./friend-tag";

describe("reserved friend tag", () => {
  it("adds the reserved tag once and trims other tags", () => {
    expect(withFriendTag([" hip hop ", "友情"])).toEqual([
      "hip hop",
      "友情",
    ]);
    expect(withFriendTag(["album"])).toEqual(["album", "友情"]);
  });

  it("keeps the reserved tag out of ordinary display tags", () => {
    const tags = ["album", " 友情 ", "2026"];

    expect(hasFriendTag(tags)).toBe(true);
    expect(displayTags(tags)).toEqual(["album", "2026"]);
    expect(withoutFriendTag(tags)).toEqual(["album", "2026"]);
  });

  it("merges the owner-only flag without disturbing ordinary tags", () => {
    expect(mergeFriendFlag(["album"], true)).toEqual(["album", "友情"]);
    expect(mergeFriendFlag(["album", "友情"], false)).toEqual(["album"]);
  });
});
