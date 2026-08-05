import { prisma } from "@/lib/db";
import type { Release } from "./types";
import { listReleases } from "./store";

export type DailyPickPayload = {
  /** 上海日历日 YYYY-MM-DD */
  day: string;
  /** 兼容字段：本轮在池中的序号（仅展示用，不再做确定性队列） */
  index: number;
  release: Release;
  /** 展示用推荐摘句 */
  quote?: {
    reason: string;
    user_name: string;
  };
  pool_size: number;
};

/** 上海时区下的「今天」 */
export function shanghaiDayKey(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * 候选池：已上架；优先有封面。
 * 规则只影响「权重」，真正抽出靠随机。
 */
async function loadPool(): Promise<Release[]> {
  const all = await listReleases({ status: "published", sort: "rec" });
  if (all.length === 0) return [];

  const withCover = all.filter((r) => Boolean(r.cover_url));
  return withCover.length >= 3 ? withCover : all;
}

/** 规则权重 + 当日轻微偏好 + 真随机抖动 */
function weightOf(r: Release, day: string): number {
  let w = 1;
  if (r.cover_url) w += 0.8;
  if (r.owner_loved) w += 2.2;
  if (r.rating_count && r.rating_count > 0) {
    w += 1 + Math.min(2, Math.log10(r.rating_count + 1));
  }
  if (r.rating_avg != null && r.rating_avg >= 7) w += 0.6;
  // 日 seed：同一天某些专略抬一点（约 0～1.2），不是定死顺序
  const dayBias = (hashString(`${day}:${r.id}`) % 1200) / 1000;
  w += dayBias;
  // 真随机抖动，避免纯规则
  w *= 0.55 + Math.random() * 0.9;
  return Math.max(0.05, w);
}

function weightedPick(
  pool: Release[],
  day: string,
  exclude: Set<string>,
): Release {
  let candidates = pool.filter((r) => !exclude.has(r.id));
  // 本轮都开过了 → 重新洗一轮
  if (candidates.length === 0) candidates = [...pool];

  const weights = candidates.map((r) => weightOf(r, day));
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < candidates.length; i++) {
    roll -= weights[i]!;
    if (roll <= 0) return candidates[i]!;
  }
  return candidates[candidates.length - 1]!;
}

async function quoteFor(releaseId: string): Promise<DailyPickPayload["quote"]> {
  const row = await prisma.recommendation.findFirst({
    where: { releaseId, status: "published" },
    orderBy: [{ isFirst: "desc" }, { createdAt: "asc" }],
    include: { user: { select: { name: true } } },
  });
  if (!row?.reason?.trim()) return undefined;
  return {
    reason: row.reason.trim(),
    user_name: row.user.name,
  };
}

export type DailyPickOpts = {
  /** 本轮已开过的 id，尽量不重复 */
  excludeIds?: string[];
  now?: Date;
};

/**
 * 专辑盲盒：加权随机抽取（规则定权重，随机定结果）。
 * @deprecated index 参数保留兼容旧调用，已忽略
 */
export async function getDailyPick(
  indexOrOpts: number | DailyPickOpts = 0,
  nowArg?: Date,
): Promise<DailyPickPayload | null> {
  const opts: DailyPickOpts =
    typeof indexOrOpts === "number"
      ? { excludeIds: [], now: nowArg }
      : indexOrOpts;

  const day = shanghaiDayKey(opts.now ?? new Date());
  const pool = await loadPool();
  if (pool.length === 0) return null;

  const exclude = new Set(
    (opts.excludeIds ?? []).filter((id) => typeof id === "string" && id),
  );
  const release = weightedPick(pool, day, exclude);
  const quote = await quoteFor(release.id);
  const index = Math.max(
    0,
    pool.findIndex((r) => r.id === release.id),
  );

  return {
    day,
    index,
    release,
    quote,
    pool_size: pool.length,
  };
}
