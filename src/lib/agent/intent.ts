import type { SearchIntent } from "@/lib/types";

export function extractUrl(text: string): string | undefined {
  const m = text.match(/https?:\/\/[^\s]+/i);
  return m?.[0]?.replace(/[),.;]+$/, "");
}

function uniq(arr: string[]): string[] {
  return [...new Set(arr.map((s) => s.trim()).filter(Boolean))];
}

/**
 * Merge previous intent with this turn's user message (rule-based).
 * Does not drop prior style/avoid unless contradicted lightly.
 */
export function mergeIntent(
  prev: SearchIntent,
  message: string,
  refUrl?: string,
): SearchIntent {
  const lower = message.toLowerCase();
  const next: SearchIntent = {
    ...prev,
    free_text: message,
    style: [...(prev.style ?? [])],
    mood: [...(prev.mood ?? [])],
    avoid: [...(prev.avoid ?? [])],
  };

  const url = refUrl || extractUrl(message);
  if (url) {
    next.reference = {
      ...prev.reference,
      url,
    };
  }

  if (/女声|female/.test(lower)) next.vocal = "female";
  if (/男声|male/.test(lower)) next.vocal = "male";

  if (/慢热|慢|chill|slow|laid.?back/.test(lower)) next.tempo = "slow";
  if (/更快|再快|快一点|uptempo|faster|energetic/.test(lower)) next.tempo = "fast";
  if (/中速|mid.?tempo/.test(lower)) next.tempo = "mid";

  if (/r\s*&?\s*b|rnb|节奏蓝调/.test(lower)) next.style = uniq([...(next.style ?? []), "r&b"]);
  if (/trap\s*soul|trapsoul/.test(lower)) next.style = uniq([...(next.style ?? []), "trap soul"]);
  else if (/trap/.test(lower)) next.style = uniq([...(next.style ?? []), "trap"]);
  if (/drill/.test(lower)) next.style = uniq([...(next.style ?? []), "drill"]);
  if (/boom\s*bap|boombap/.test(lower)) next.style = uniq([...(next.style ?? []), "boom bap"]);
  if (/lo-?fi|lof i|放克|chillhop/.test(lower)) next.style = uniq([...(next.style ?? []), "lofi"]);
  if (/pop/.test(lower) && !/k-?pop/.test(lower)) next.style = uniq([...(next.style ?? []), "pop"]);
  if (/hyperpop|hyper pop/.test(lower)) next.style = uniq([...(next.style ?? []), "hyperpop"]);
  if (/afro|阿弗罗/.test(lower)) next.style = uniq([...(next.style ?? []), "afrobeats"]);
  if (/phonk/.test(lower)) next.style = uniq([...(next.style ?? []), "phonk"]);

  if (/暗|阴郁|dark|moody|丧/.test(lower)) next.mood = uniq([...(next.mood ?? []), "dark"]);
  if (/暖|温|warm|甜蜜|甜/.test(lower)) next.mood = uniq([...(next.mood ?? []), "warm"]);
  if (/梦|ethereal|dreamy|飘/.test(lower)) next.mood = uniq([...(next.mood ?? []), "dreamy"]);
  if (/燃|炸|aggressive|硬/.test(lower)) next.mood = uniq([...(next.mood ?? []), "aggressive"]);

  if (/鼓.*(轻|小|少)|轻一点|别太抢|不要太抢|soft drums|light drums/.test(lower)) {
    next.avoid = uniq([...(next.avoid ?? []), "heavy drums"]);
  }
  if (/808|重低音太|low.?end 太/.test(lower) && /别|不要|少|轻/.test(lower)) {
    next.avoid = uniq([...(next.avoid ?? []), "heavy 808"]);
  }

  if (/写词|填词|试唱|练习|翻唱/.test(lower)) {
    next.purpose = "practice_singing";
  }

  next.style = uniq(next.style ?? []);
  next.mood = uniq(next.mood ?? []);
  next.avoid = uniq(next.avoid ?? []);

  return next;
}

/** Chinese one-liner for UI trust. */
export function summarizeIntent(intent: SearchIntent): string {
  const parts: string[] = [];

  if (intent.vocal === "female") parts.push("女声向");
  if (intent.vocal === "male") parts.push("男声向");

  if (intent.tempo === "slow") parts.push("慢热/偏慢");
  if (intent.tempo === "fast") parts.push("偏快节奏");
  if (intent.tempo === "mid") parts.push("中速");

  if (intent.style?.length) parts.push(intent.style.join("、"));
  if (intent.mood?.length) {
    const moodMap: Record<string, string> = {
      dark: "偏暗",
      warm: "偏暖",
      dreamy: "飘渺",
      aggressive: "偏硬/攻击性",
    };
    parts.push(intent.mood.map((m) => moodMap[m] ?? m).join("、"));
  }

  if (intent.avoid?.includes("heavy drums")) parts.push("鼓点靠后/别太抢");
  if (intent.avoid?.includes("heavy 808")) parts.push("少重 808");

  if (intent.reference?.title) {
    parts.push(`参考「${intent.reference.title.slice(0, 36)}」`);
  } else if (intent.reference?.url) {
    parts.push("已带参考链接");
  }

  if (parts.length === 0) {
    return "按 type beat / instrumental 方向检索可试听伴奏。";
  }

  return `${parts.join("、")}；按 type beat / instrumental 检索。`;
}
