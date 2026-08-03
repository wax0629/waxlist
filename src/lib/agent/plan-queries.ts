import type { SessionConstraints } from "@/lib/types";

/**
 * Build YouTube search queries from structured constraints (no LLM yet).
 */
export function planQueries(constraints: SessionConstraints): string[] {
  const parts: string[] = [];

  if (constraints.style?.length) {
    parts.push(constraints.style.join(" "));
  }
  if (constraints.mood?.length) {
    parts.push(constraints.mood.join(" "));
  }
  if (constraints.vocal === "female") parts.push("female vocal");
  if (constraints.vocal === "male") parts.push("male vocal");
  if (constraints.tempo === "slow") parts.push("slow chill");
  if (constraints.tempo === "fast") parts.push("uptempo");
  if (constraints.avoid?.includes("heavy drums")) parts.push("soft drums");

  // Free text: strip URLs, keep short
  const free = (constraints.free_text ?? "")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);

  if (free && free.length > 2) {
    parts.push(free);
  }

  if (constraints.reference?.title) {
    parts.push(constraints.reference.title);
  }
  if (constraints.reference?.hints?.length) {
    parts.push(constraints.reference.hints.slice(0, 3).join(" "));
  }

  const core = parts.filter(Boolean).join(" ").trim() || "type beat instrumental";

  const queries = [
    `${core} type beat`,
    `${core} instrumental beat`,
    free ? `${free} type beat free` : "r&b type beat instrumental",
  ];

  // Dedupe while preserving order
  const seen = new Set<string>();
  return queries
    .map((q) => q.replace(/\s+/g, " ").trim())
    .filter((q) => {
      const k = q.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return q.length > 0;
    })
    .slice(0, 3);
}
