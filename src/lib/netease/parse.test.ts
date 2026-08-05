import { describe, expect, it } from "vitest";
import {
  extractNeteaseInput,
  isNeteaseShortLink,
  parseNeteaseUrl,
} from "./parse";

describe("NetEase URL parsing", () => {
  it("extracts a URL from NetEase share text", () => {
    expect(
      extractNeteaseInput(
        "分享专辑 https://music.163.com/album?id=12345。 (@网易云音乐)",
      ),
    ).toBe("https://music.163.com/album?id=12345");
  });

  it.each([
    ["https://music.163.com/#/album?id=123", "album", "123"],
    ["https://music.163.com/song?id=456", "song", "456"],
    ["https://y.music.163.com/m/album?id=789", "album", "789"],
  ])("canonicalizes %s", (input, kind, id) => {
    const parsed = parseNeteaseUrl(input);

    expect(parsed).toMatchObject({ id, kind });
    expect(parsed.url).toBe(
      `https://music.163.com/#/${kind === "song" ? "song" : "album"}?id=${id}`,
    );
  });

  it("treats a bare numeric id as an album", () => {
    expect(parseNeteaseUrl("24680")).toEqual({
      id: "24680",
      kind: "album",
      url: "https://music.163.com/#/album?id=24680",
    });
  });

  it("leaves short links unresolved for the network expansion step", () => {
    const input = "https://163cn.tv/abc123";

    expect(isNeteaseShortLink(input)).toBe(true);
    expect(parseNeteaseUrl(input)).toEqual({
      kind: "unknown",
      url: input,
    });
  });

  it("rejects unrelated hosts", () => {
    expect(parseNeteaseUrl("https://example.com/album?id=123")).toEqual({
      kind: "unknown",
      url: "https://example.com/album?id=123",
    });
  });
});
