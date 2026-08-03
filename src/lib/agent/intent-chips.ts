import type { SearchIntent } from "@/lib/types";

/** Clickable refine chips for UI (client-safe, no fs). */
export type IntentActionChip = {
  id: string;
  label: string;
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

export function buildRefineChips(intent: SearchIntent): IntentActionChip[] {
  const chips: IntentActionChip[] = [];
  const styles = new Set((intent.style ?? []).map((s) => s.toLowerCase()));

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

  return chips.slice(0, 10);
}

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
  for (const a of intent.artist_refs ?? []) {
    labels.push(`像${a.name_zh || a.name_en}`);
  }
  return labels;
}
