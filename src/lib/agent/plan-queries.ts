import type { SearchIntent } from "@/lib/types";
import { artistQueries } from "./artists";
import { freeTextKeywords } from "./intent";
import { producerQueries } from "./producers";

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
 * Never defaults unknown intent to r&b.
 */
export function planQueries(intent: SearchIntent): string[] {
  const styles = (intent.style ?? []).map(styleToEnglish);
  const freeKw = freeTextKeywords(intent.free_text ?? "");
  const artistEn = (intent.artist_refs ?? [])
    .flatMap((a) => a.style_en)
    .filter(Boolean);
  const artistTopic = artistEn[0] ?? null;

  // Core topic: style → artist style bridge → free keywords → generic (NOT r&b)
  const styleCore =
    styles[0] ||
    artistTopic ||
    freeKw.split(" ")[0] ||
    null;
  const styleJoin = styles.length
    ? styles.join(" ")
    : artistEn.length
      ? artistEn.slice(0, 2).join(" ")
      : freeKw || "melodic";

  const tempoBits: string[] = [];
  if (intent.tempo === "slow") tempoBits.push("slow", "chill");
  if (intent.tempo === "fast") tempoBits.push("uptempo", "energetic");
  if (intent.tempo === "mid") tempoBits.push("mid tempo");

  const vocalBits: string[] = [];
  if (intent.vocal === "female") vocalBits.push("female vocal");
  if (intent.vocal === "male") vocalBits.push("male vocal");

  const moodBits = (intent.mood ?? []).map(moodToEnglish);

  const softBits: string[] = [];
  if (intent.avoid?.includes("heavy drums")) {
    softBits.push("soft drums", "light drums");
  }
  if (intent.avoid?.includes("heavy 808")) softBits.push("soft 808");

  const topic = styleCore ?? "hip hop";
  // Avoid duplicating freeKw when it equals style core (e.g. "trap soul")
  const freeExtra =
    freeKw &&
    freeKw !== topic &&
    !topic.includes(freeKw) &&
    !freeKw.includes(topic)
      ? freeKw
      : null;

  // Angle 1: main topic + constraints
  const q1 = ensureBeatSuffix(
    [tempoBits[0], topic, vocalBits[0], softBits[0], freeExtra]
      .filter(Boolean)
      .join(" "),
  );

  // Angle 2: mood / instrumental emphasis
  const q2 = ensureBeatSuffix(
    [
      moodBits[0] ?? (intent.tempo === "slow" ? "late night" : "melodic"),
      styleJoin,
      softBits[0] || null,
    ]
      .filter(Boolean)
      .join(" ") + " instrumental",
  );

  // Angle 3: free keywords raw or reference
  let q3: string;
  if (intent.reference?.title) {
    const refTokens = sanitizeRefTitle(intent.reference.title);
    q3 = ensureBeatSuffix(
      refTokens ? `${refTokens} type beat` : `${topic} type beat free`,
    );
  } else if (freeKw) {
    // Keep user tokens prominent (e.g. "udg type beat")
    q3 = ensureBeatSuffix(`${freeKw} type beat free`);
  } else {
    q3 = ensureBeatSuffix(
      [
        intent.tempo === "fast" ? "hard" : "smooth",
        topic,
        vocalBits[0] ? "vocals" : "",
        "type beat free",
      ]
        .filter(Boolean)
        .join(" "),
    );
  }

  // Angle 4: CN rap artist bridge / producer / style expansion
  const artQs = artistQueries(intent);
  const expanded = expandStyleQueries(intent);
  const prodQs = producerQueries(intent, topic);
  const q4 = ensureBeatSuffix(
    artQs[0] ||
      prodQs[0] ||
      expanded[0] ||
      [topic, tempoBits[0] ?? "", "type beat"].filter(Boolean).join(" "),
  );

  const raw = [
    q1,
    q2,
    q3,
    q4,
    ...artQs.slice(1),
    ...prodQs.slice(0, 1),
    ...expanded.slice(0, 1),
  ].map((q) => q.replace(/\s+/g, " ").trim().toLowerCase());

  const out: string[] = [];
  for (const q of raw) {
    if (!q || out.length >= 4) break;
    if (out.some((existing) => tooSimilar(existing, q))) continue;
    out.push(q);
  }

  while (out.length < 2) {
    out.push(
      ensureBeatSuffix(
        freeKw ? `${freeKw} type beat` : `${topic} type beat instrumental`,
      ),
    );
  }

  return out.slice(0, 4);
}

function expandStyleQueries(intent: SearchIntent): string[] {
  const styles = intent.style ?? [];
  const extra: string[] = [];
  if (styles.includes("underground")) {
    extra.push("underground hip hop type beat");
    extra.push("udg type beat");
    extra.push("underground rap instrumental");
  }
  if (styles.includes("plugg")) {
    extra.push("pluggnb type beat");
  }
  if (styles.includes("rage")) {
    extra.push("rage type beat carti");
  }
  return extra;
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
    underground: "underground",
    "hip hop": "hip hop",
    "cloud rap": "cloud rap",
    "jersey club": "jersey club",
    plugg: "plugg",
    rage: "rage",
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
  return inter / union >= 0.75;
}
