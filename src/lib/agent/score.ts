import type { SearchIntent } from "@/lib/types";
import type { YtSearchHit } from "@/lib/youtube";
import { producerBoost } from "./producers";

export interface ScoredHit extends YtSearchHit {
  score: number;
  score_reasons: string[];
}

const BEAT_POS =
  /\b(type\s*beat|instrumental|beat\b|prod(\.|uced)?\s*by|free\s*for\s*profit|no\s*copyright)\b/i;
const BEAT_STRONG = /\btype\s*beat\b|\binstrumental\b/i;

const NEG =
  /\b(tutorial|how\s*to|reaction|full\s*album|live\s*concert|live\s*performance|lyrics\s*video|karaoke|cover\s*lesson|reacts?|mix\s*202\d|hours?\s*of|compilation|best\s*of)\b/i;

/**
 * Score YouTube hits for instrumental/type-beat suitability (spec-v0.2 §6.4).
 */
export function filterAndScore(
  hits: YtSearchHit[],
  intent: SearchIntent,
): ScoredHit[] {
  const scored: ScoredHit[] = [];

  for (const hit of hits) {
    const title = hit.title ?? "";
    const channel = hit.channelTitle ?? "";
    const blob = `${title} ${channel} ${hit.description ?? ""}`;
    let score = 0;
    const reasons: string[] = [];

    if (BEAT_STRONG.test(title)) {
      score += 5;
      reasons.push("标题强伴奏信号");
    } else if (BEAT_POS.test(title)) {
      score += 3;
      reasons.push("标题含 beat/prod");
    } else if (BEAT_POS.test(blob)) {
      score += 1;
      reasons.push("描述/频道含 beat 信号");
    }

    if (NEG.test(title) && !BEAT_STRONG.test(title)) {
      score -= 5;
      reasons.push("教程/合集/mix/live 向降权");
    } else if (NEG.test(title) && BEAT_STRONG.test(title)) {
      score -= 1.5;
      reasons.push("合集向但含 beat 信号，轻降权");
    }

    const pb = producerBoost(title, channel, intent);
    if (pb.boost > 0) {
      score += pb.boost;
      reasons.push(`制作人先验命中 ${pb.hit}`);
    }

    // Intent overlap
    for (const s of intent.style ?? []) {
      const en = s.replace("&", "n").toLowerCase();
      if (blob.toLowerCase().includes(en) || blob.toLowerCase().includes(s.toLowerCase())) {
        score += 1.5;
        reasons.push(`风格命中 ${s}`);
      }
    }

    if (intent.tempo === "slow" && /\b(slow|chill|soft|night|lofi|lo-fi|calm)\b/i.test(title)) {
      score += 1.5;
      reasons.push("速度偏慢热");
    }
    if (intent.tempo === "fast" && /\b(fast|uptempo|energy|rage|drill)\b/i.test(title)) {
      score += 1.5;
      reasons.push("速度偏快");
    }
    if (intent.vocal === "female" && /\b(female|girl|woman|rnb|r&b)\b/i.test(title)) {
      score += 1;
      reasons.push("女声向相关");
    }
    if (intent.mood?.includes("dark") && /\b(dark|sad|pain|moody)\b/i.test(title)) {
      score += 1;
      reasons.push("情绪偏暗");
    }

    if (intent.avoid?.includes("heavy drums")) {
      if (/\b(hard\s*drums|heavy\s*drums|aggressive\s*drums)\b/i.test(title)) {
        score -= 2;
        reasons.push("与「鼓轻」冲突");
      }
      if (/\b(soft\s*drums|light\s*drums|no\s*drums)\b/i.test(title)) {
        score += 1.5;
        reasons.push("鼓点偏轻信号");
      }
    }

    if (intent.reference?.title) {
      const tokens = intent.reference.title
        .toLowerCase()
        .split(/\W+/)
        .filter((t) => t.length > 3)
        .slice(0, 6);
      let hitsTok = 0;
      for (const t of tokens) {
        if (blob.toLowerCase().includes(t)) hitsTok++;
      }
      if (hitsTok >= 2) {
        score += 1;
        reasons.push("与参考标题词有重叠");
      }
    }

    // Keep even low scores if not terrible — pipeline will take top N
    if (score <= -3 && !BEAT_POS.test(title)) {
      continue; // hard drop junk
    }

    scored.push({ ...hit, score, score_reasons: reasons });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

export function templateReason(hit: ScoredHit, intent: SearchIntent): string {
  const bits: string[] = [];
  if (BEAT_STRONG.test(hit.title)) bits.push("标题偏 type beat / instrumental，适合试唱。");
  else bits.push("检索命中，可点开判断是否合拍。");

  if (intent.vocal === "female") bits.push("需求含女声向。");
  if (intent.tempo === "slow") bits.push("按慢热/放松节奏检索。");
  if (intent.tempo === "fast") bits.push("按偏快节奏检索。");
  if (intent.avoid?.includes("heavy drums")) bits.push("已尽量避开鼓点过重取向。");
  if (intent.style?.length) bits.push(`风格侧重：${intent.style.join("、")}。`);
  if (intent.reference?.title) bits.push(`参考气质：「${intent.reference.title.slice(0, 28)}」。`);
  if (hit.score_reasons[0]) bits.push(`(${hit.score_reasons[0]})`);

  return bits.slice(0, 3).join(" ");
}
