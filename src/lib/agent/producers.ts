import { readFileSync } from "fs";
import path from "path";
import type { SearchIntent } from "@/lib/types";

export interface ProducerEntry {
  name: string;
  aliases: string[];
  boost: number;
}

export interface StyleProducerConfig {
  labels: string[];
  producers: ProducerEntry[];
}

type Catalog = Record<string, StyleProducerConfig>;

let cached: Catalog | null = null;

function loadCatalog(): Catalog {
  if (cached) return cached;
  try {
    const p = path.join(process.cwd(), "data", "style-producers.json");
    cached = JSON.parse(readFileSync(p, "utf8")) as Catalog;
  } catch {
    cached = {};
  }
  return cached;
}

/** Resolve intent styles to producer entries (soft prior). */
export function producersForIntent(intent: SearchIntent): ProducerEntry[] {
  const catalog = loadCatalog();
  const out: ProducerEntry[] = [];
  const seen = new Set<string>();

  for (const style of intent.style ?? []) {
    const key = style.toLowerCase();
    const block =
      catalog[key] ||
      catalog[key.replace("rnb", "r&b")] ||
      Object.values(catalog).find((b) =>
        b.labels.some((l) => l.toLowerCase() === key),
      );
    if (!block) continue;
    for (const pr of block.producers) {
      if (seen.has(pr.name)) continue;
      seen.add(pr.name);
      out.push(pr);
    }
  }
  return out;
}

/** One extra query per top producers (budget-friendly: max 2). */
export function producerQueries(
  intent: SearchIntent,
  styleCore: string,
): string[] {
  const producers = producersForIntent(intent).slice(0, 2);
  return producers.map(
    (p) => `${styleCore} type beat ${p.name}`.toLowerCase().replace(/\s+/g, " "),
  );
}

export function producerBoost(
  title: string,
  channel: string,
  intent: SearchIntent,
): { boost: number; hit?: string } {
  const blob = `${title} ${channel}`.toLowerCase();
  let best = 0;
  let hit: string | undefined;
  for (const p of producersForIntent(intent)) {
    const names = [p.name, ...p.aliases].map((a) => a.toLowerCase());
    if (names.some((n) => n && blob.includes(n))) {
      if (p.boost > best) {
        best = p.boost;
        hit = p.name;
      }
    }
  }
  return { boost: best, hit };
}
