import type { SearchIntent } from "@/lib/types";

export function extractUrl(text: string): string | undefined {
  const m = text.match(/https?:\/\/[^\s]+/i);
  return m?.[0]?.replace(/[),.;]+$/, "");
}

function uniq(arr: string[]): string[] {
  return [...new Set(arr.map((s) => s.trim()).filter(Boolean))];
}

/** Refine / constraint update vs brand-new request. */
export function isRefineMessage(message: string): boolean {
  const t = message.trim();
  if (t.length > 64) return false;
  return /再|更|稍|别|不要|少点|多点|还要|继续|换一|快点|慢点|轻一点|重一点|加快|放慢|鼓|808|偏|向|女声|男声|慢热|中速|暗一点|暖一点|换一批|再来几/.test(
    t,
  );
}

/** Clickable refine chips for UI (A2.3 点选修正理解). */
export type IntentActionChip = {
  id: string;
  label: string;
  /** Short refine message sent as user turn */
  message: string;
};

const STYLE_LABEL: Record<string, string> = {
  underground: "地下/UDG",
  "r&b": "R&B",
  "hip hop": "说唱",
  "trap soul": "Trap Soul",
  trap: "Trap",
  drill: "Drill",
  "boom bap": "Boom Bap",
  lofi: "Lo-fi",
  pop: "Pop",
  hyperpop: "Hyperpop",
  afrobeats: "Afrobeats",
  phonk: "Phonk",
  "cloud rap": "Cloud Rap",
  "jersey club": "Jersey Club",
  plugg: "Plugg",
  rage: "Rage",
};

/**
 * Build refine action chips from current intent.
 * Always includes a few common adjusts + style pivots.
 */
export function buildRefineChips(intent: SearchIntent): IntentActionChip[] {
  const chips: IntentActionChip[] = [];
  const styles = new Set((intent.style ?? []).map((s) => s.toLowerCase()));

  // Tempo
  if (intent.tempo !== "slow") {
    chips.push({
      id: "tempo-slow",
      label: "再慢一点",
      message: "再慢热一点",
    });
  }
  if (intent.tempo !== "fast") {
    chips.push({
      id: "tempo-fast",
      label: "再快一点",
      message: "再快一点",
    });
  }
  if (intent.tempo !== "mid") {
    chips.push({
      id: "tempo-mid",
      label: "中速",
      message: "中速一点",
    });
  }

  // Vocal
  if (intent.vocal !== "female") {
    chips.push({
      id: "vocal-f",
      label: "女声向",
      message: "更偏女声",
    });
  }
  if (intent.vocal !== "male") {
    chips.push({
      id: "vocal-m",
      label: "男声向",
      message: "更偏男声",
    });
  }

  // Mood / avoid
  if (!intent.mood?.includes("dark")) {
    chips.push({
      id: "mood-dark",
      label: "再暗一点",
      message: "再暗一点",
    });
  }
  if (!intent.mood?.includes("warm")) {
    chips.push({
      id: "mood-warm",
      label: "再暖一点",
      message: "再暖一点",
    });
  }
  if (!intent.avoid?.includes("heavy drums")) {
    chips.push({
      id: "avoid-drums",
      label: "鼓轻一点",
      message: "鼓别太抢",
    });
  }

  // Style pivots (only if not already active)
  const stylePivots: Array<[string, string, string]> = [
    ["underground", "偏地下", "更偏 underground udg"],
    ["r&b", "偏 R&B", "更偏 r&b"],
    ["trap", "偏 Trap", "更偏 trap"],
    ["trap soul", "Trap Soul", "更偏 trap soul"],
    ["drill", "Drill", "更偏 drill"],
    ["lofi", "Lo-fi", "更偏 lofi"],
  ];
  for (const [key, label, message] of stylePivots) {
    if (!styles.has(key)) {
      chips.push({ id: `style-${key}`, label, message });
    }
  }

  chips.push({
    id: "more",
    label: "换一批",
    message: "再来几个类似的",
  });

  // Cap for UI density
  return chips.slice(0, 10);
}

/** Display chips for active understanding (non-click actions). */
export function buildActiveLabels(intent: SearchIntent): string[] {
  const labels: string[] = [];
  if (intent.vocal === "female") labels.push("女声向");
  if (intent.vocal === "male") labels.push("男声向");
  if (intent.tempo === "slow") labels.push("慢热");
  if (intent.tempo === "fast") labels.push("偏快");
  if (intent.tempo === "mid") labels.push("中速");
  for (const s of intent.style ?? []) {
    labels.push(STYLE_LABEL[s] ?? s);
  }
  for (const m of intent.mood ?? []) {
    const map: Record<string, string> = {
      dark: "偏暗",
      warm: "偏暖",
      dreamy: "飘渺",
      aggressive: "偏硬",
    };
    labels.push(map[m] ?? m);
  }
  if (intent.avoid?.includes("heavy drums")) labels.push("鼓靠后");
  if (intent.avoid?.includes("heavy 808")) labels.push("少重 808");
  return labels;
}

/**
 * Merge previous intent with this turn's user message (rule-based).
 * Non-refine turns do not sticky-carry old styles (fixes "always r&b").
 */
export function mergeIntent(
  prev: SearchIntent,
  message: string,
  refUrl?: string,
): SearchIntent {
  const lower = message.toLowerCase();
  const refine = isRefineMessage(message);

  const next: SearchIntent = {
    free_text: message,
    style: refine ? [...(prev.style ?? [])] : [],
    mood: refine ? [...(prev.mood ?? [])] : [],
    avoid: refine ? [...(prev.avoid ?? [])] : [],
    vocal: refine ? prev.vocal : undefined,
    tempo: refine ? prev.tempo : undefined,
    purpose: refine ? prev.purpose : undefined,
    reference: refine ? prev.reference : undefined,
  };

  const url = refUrl || extractUrl(message);
  if (url) {
    next.reference = {
      ...(!refine ? undefined : prev.reference),
      ...next.reference,
      url,
    };
  }

  if (/女声|female/.test(lower)) next.vocal = "female";
  if (/男声|male/.test(lower)) next.vocal = "male";

  if (/慢热|慢|chill|slow|laid.?back/.test(lower)) next.tempo = "slow";
  if (/更快|再快|快一点|uptempo|faster|energetic/.test(lower)) next.tempo = "fast";
  if (/中速|mid.?tempo/.test(lower)) next.tempo = "mid";

  // Styles — order matters for trap soul before trap
  if (/trap\s*soul|trapsoul/.test(lower)) {
    next.style = uniq([...(next.style ?? []), "trap soul"]);
  } else if (/\btrap\b|trap\s*beat/.test(lower) || /trap/.test(lower)) {
    next.style = uniq([...(next.style ?? []), "trap"]);
  }

  if (/r\s*&?\s*b|\brnb\b|节奏蓝调/.test(lower)) {
    next.style = uniq([...(next.style ?? []), "r&b"]);
  }
  // UDG / underground — common shorthand in CN hip-hop scene
  if (/\budg\b|underground|地下|ug\b/.test(lower)) {
    next.style = uniq([...(next.style ?? []), "underground"]);
  }
  if (/drill/.test(lower)) next.style = uniq([...(next.style ?? []), "drill"]);
  if (/boom\s*bap|boombap/.test(lower)) {
    next.style = uniq([...(next.style ?? []), "boom bap"]);
  }
  if (/lo-?fi|lof i|chillhop/.test(lower)) {
    next.style = uniq([...(next.style ?? []), "lofi"]);
  }
  if (/\bpop\b/.test(lower) && !/k-?pop|hyperpop/.test(lower)) {
    next.style = uniq([...(next.style ?? []), "pop"]);
  }
  if (/hyperpop|hyper pop/.test(lower)) {
    next.style = uniq([...(next.style ?? []), "hyperpop"]);
  }
  if (/afro|阿弗罗/.test(lower)) {
    next.style = uniq([...(next.style ?? []), "afrobeats"]);
  }
  if (/phonk/.test(lower)) next.style = uniq([...(next.style ?? []), "phonk"]);
  if (/cloud\s*rap|cloudrap/.test(lower)) {
    next.style = uniq([...(next.style ?? []), "cloud rap"]);
  }
  if (/jersey\s*club/.test(lower)) {
    next.style = uniq([...(next.style ?? []), "jersey club"]);
  }
  if (/plugg|plugnb|pluggnb/.test(lower)) {
    next.style = uniq([...(next.style ?? []), "plugg"]);
  }
  if (/rage\s*beat|\brage\b/.test(lower)) {
    next.style = uniq([...(next.style ?? []), "rage"]);
  }
  if (/说唱|hip\s*hop|hiphop|rap\s*beat|\brap\b/.test(lower)) {
    next.style = uniq([...(next.style ?? []), "hip hop"]);
  }

  if (/暗|阴郁|dark|moody|丧/.test(lower)) {
    next.mood = uniq([...(next.mood ?? []), "dark"]);
  }
  if (/暖|温|warm|甜蜜|甜/.test(lower)) {
    next.mood = uniq([...(next.mood ?? []), "warm"]);
  }
  if (/梦|ethereal|dreamy|飘/.test(lower)) {
    next.mood = uniq([...(next.mood ?? []), "dreamy"]);
  }
  if (/燃|炸|aggressive|硬/.test(lower)) {
    next.mood = uniq([...(next.mood ?? []), "aggressive"]);
  }

  if (/鼓.*(轻|小|少)|轻一点|别太抢|不要太抢|soft drums|light drums/.test(lower)) {
    next.avoid = uniq([...(next.avoid ?? []), "heavy drums"]);
  }
  if (/808|重低音太|low.?end 太/.test(lower) && /别|不要|少|轻/.test(lower)) {
    next.avoid = uniq([...(next.avoid ?? []), "heavy 808"]);
  }

  if (/写词|填词|试唱|练习|翻唱/.test(lower)) {
    next.purpose = "practice_singing";
  }

  // Free keywords for query planning (e.g. "udg", artist-ish tokens)
  next.free_text = message;

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

  if (intent.style?.length) {
    const styleLabels: Record<string, string> = {
      underground: "地下/UDG",
      "r&b": "R&B",
      "hip hop": "说唱/Hip-Hop",
      "trap soul": "Trap Soul",
    };
    parts.push(
      intent.style.map((s) => styleLabels[s] ?? s).join("、"),
    );
  }

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

  // Surface free keywords when no structured style
  if (!intent.style?.length && intent.free_text) {
    const kw = freeTextKeywords(intent.free_text);
    if (kw) parts.push(`关键词「${kw}」`);
  }

  if (parts.length === 0) {
    return "按 type beat / instrumental 方向检索可试听伴奏。";
  }

  return `${parts.join("、")}；按 type beat / instrumental 检索。`;
}

/** Latin tokens + short phrases kept for query (no full Chinese dump). */
export function freeTextKeywords(text: string): string {
  const noUrl = text.replace(/https?:\/\/\S+/gi, " ");
  const latin = noUrl.match(/[a-zA-Z][a-zA-Z0-9+\-_/]{1,24}/g) ?? [];
  // drop ultra-common noise
  const stop = new Set([
    "type",
    "beat",
    "the",
    "and",
    "for",
    "with",
    "http",
    "https",
    "www",
  ]);
  const kept = latin
    .map((t) => t.toLowerCase())
    .filter((t) => !stop.has(t));
  return uniq(kept).slice(0, 6).join(" ");
}
