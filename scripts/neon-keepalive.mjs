/**
 * Neon 保活：周期性 SELECT 1，避免 Free/默认 5 分钟 scale-to-zero 冷启动。
 *
 * 用法（生产）：
 *   pm2 start scripts/neon-keepalive.mjs --name waxlist-db-keepalive
 *
 * 说明：
 * - Free 档不能在控制台关闭 scale-to-zero；保活是实用替代。
 * - 会持续占用少量 CU-hours（近似 0.25 CU 常开）。超额需升级 Launch。
 * - 正式常开：Launch+ 计划 → Console → Branches → Computes → Edit → 关 Scale to zero。
 */
import { PrismaClient } from "@prisma/client";

const INTERVAL_MS = Number(process.env.NEON_KEEPALIVE_MS || 3 * 60 * 1000);
const prisma = new PrismaClient({
  log: ["error"],
});

let lastOk = 0;
let lastErr = "";

async function ping() {
  const t0 = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    lastOk = Date.now();
    lastErr = "";
    const ms = Date.now() - t0;
    // 冷启动会 >300ms；热路径通常几十毫秒
    console.log(
      JSON.stringify({
        ok: true,
        ms,
        at: new Date().toISOString(),
        coldish: ms > 400,
      }),
    );
  } catch (err) {
    lastErr = err instanceof Error ? err.message : String(err);
    console.error(
      JSON.stringify({
        ok: false,
        error: lastErr,
        at: new Date().toISOString(),
      }),
    );
  }
}

console.log(
  JSON.stringify({
    start: true,
    interval_ms: INTERVAL_MS,
    at: new Date().toISOString(),
  }),
);

await ping();
const timer = setInterval(() => {
  void ping();
}, INTERVAL_MS);

// 防止 Node 把 interval 当唯一引用时异常退出；显式处理信号
function shutdown() {
  clearInterval(timer);
  void prisma.$disconnect().finally(() => process.exit(0));
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// 暴露一点状态给运维（可选）
process.on("SIGUSR1", () => {
  console.log(
    JSON.stringify({
      status: true,
      lastOk: lastOk ? new Date(lastOk).toISOString() : null,
      lastErr: lastErr || null,
      uptime_s: Math.round(process.uptime()),
    }),
  );
});
