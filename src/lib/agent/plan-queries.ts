import type { SearchIntent } from "@/lib/types";

const BEAT_SUFFIXES = ["type beat", "instrumental", "beat"] as const;

function hasBeatSignal(q: string): boolean {
  const l = q.toLowerCase();
  return BEAT_SUFFIXES.some((s) => l.includes(s));
}

function ensureBeatSuffix(q: string): string {
  const cleaned = q.replace(/\s+/g, " ").trim();
  if (!cleaned) return "type beat instrumental";
  if (hasBeatSignal(cleaned)) return cleaned;
  return `${cleaned} type beat`;
}

/**
 * Build 2–4 multi-angle English queries (spec-v0.2 §6.2).
 * Never uses raw Chinese user text as the sole query.
 */
export function planQueries(intent: SearchIntent): string[] {
  const styles = (intent.style ?? []).map(styleToEnglish);
  const styleCore = styles[0] ?? "r&b";
  const styleJoin = styles.length ? styles.join(" ") : "melodic";

  const tempoBits: string[] = [];
  if (intent.tempo === "slow") tempoBits.push("slow", "chill");
  if (intent.tempo === "fast") tempoBits.push("uptempo", "energetic");
  if (intent.tempo === "mid") tempoBits.push("mid tempo");

  const vocalBits: string[] = [];
  if (intent.vocal === "female") vocalBits.push("female vocal");
  if (intent.vocal === "male") vocalBits.push("male vocal");

  const moodBits = (intent.mood ?? []).map(moodToEnglish);

  const softBits: string[] = [];
  if (intent.avoid?.includes("heavy drums")) softBits.push("soft drums", "light drums");
  if (intent.avoid?.includes("heavy 808")) softBits.push("soft 808");

  // Angle 1: main style + tempo + beat
  const q1 = ensureBeatSuffix(
    [tempoBits[0], styleCore, vocalBits[0], softBits[0]].filter(Boolean).join(" "),
  );

  // Angle 2: constraint emphasis
  const q2 = ensureBeatSuffix(
    [
      moodBits[0] ?? (intent.tempo === "slow" ? "late night" : "melodic"),
      styleJoin,
      softBits[0] ?? "instrumental",
      "instrumental",
    ]
      .filter(Boolean)
      .join(" "),
  );

  // Angle 3: reference or synonym neighborhood
  let q3: string;
  if (intent.reference?.title) {
    const refTokens = sanitizeRefTitle(intent.reference.title);
    q3 = ensureBeatSuffix(
      refTokens ? `${refTokens} type beat` : `${styleCore} type beat free`,
    );
  } else if (intent.reference?.hints?.length) {
    q3 = ensureBeatSuffix(
      `${intent.reference.hints.slice(0, 2).join(" ")} type beat`,
    );
  } else {
    q3 = ensureBeatSuffix(
      [
        intent.tempo === "fast" ? "hard" : "smooth",
        styleCore,
        vocalBits[0] ? "vocals" : "",
        "type beat free",
      ]
        .filter(Boolean)
        .join(" "),
    );
  }

  // Angle 4 optional: purpose-tinged
  const q4 = ensureBeatSuffix(
    [styleCore, tempoBits[0] ?? "chill", "type beat", softBits[1] ?? ""].filter(Boolean).join(" "),
  );

  const raw = [q1, q2, q3, q4].map((q) =>
    q
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase(),
  );

  // Dedupe + diversity: drop near-duplicates
  const out: string[] = [];
  for (const q of raw) {
    if (!q || out.length >= 4) break;
    if (out.some((existing) => tooSimilar(existing, q))) continue;
    out.push(q);
  }

  while (out.length < 2) {
    out.push(ensureBeatSuffix(`${styleCore} type beat instrumental`));
  }

  return out.slice(0, 4);
}

function styleToEnglish(s: string): string {
  const map: Record<string, string> = {
    "r&b": "rnb",
    rnb: "rnb",
    trap: "trap",
    "trap soul": "trap soul",
    drill: "drill",
    "boom bap": "boom bap",
    lofi: "lofi",
    pop: "pop",
    hyperpop: "hyperpop",
    afrobeats: "afrobeats",
    phonk: "phonk",
  };
  return map[s.toLowerCase()] ?? s;
}

function moodToEnglish(m: string): string {
  const map: Record<string, string> = {
    dark: "dark",
    warm: "warm",
    dreamy: "dreamy",
    aggressive: "aggressive",
  };
  return map[m] ?? m;
}

function sanitizeRefTitle(title: string): string {
  return title
    .replace(/\(.*?\)|\[.*?\]/g, " ")
    .replace(/official|video|lyrics|audio|hd|4k/gi, " ")
    .replace(/[^\w\s\-']/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((w) => w.length > 2)
    .slice(0, 5)
    .join(" ");
}

function tooSimilar(a: string, b: string): boolean {
  if (a === b) return true;
  const ta = new Set(a.split(" ").filter(Boolean));
  const tb = new Set(b.split(" ").filter(Boolean));
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  const union = ta.size + tb.size - inter || 1;
  const jaccard = inter / union;
  return jaccard >= 0.75;
}
