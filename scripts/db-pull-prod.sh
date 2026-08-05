#!/usr/bin/env bash
# 从 Neon 生产库拉快照 → 覆盖本地 Docker Postgres
# 用法：
#   export DATABASE_URL_PROD='postgresql://...@ep-xxx...neon.tech/neondb?sslmode=require'
#   或写在 .env.neon.local（不进 Git）
#   npm run db:pull-prod
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ -f .env.neon.local ]; then
  set -a
  # shellcheck disable=SC1091
  source <(grep -E '^[A-Za-z_][A-Za-z0-9_]*=' .env.neon.local || true)
  set +a
fi

PROD_URL="${DATABASE_URL_PROD:-${NEON_DATABASE_URL:-}}"
if [ -z "$PROD_URL" ]; then
  echo "缺少生产连接串。"
  echo "请设置 DATABASE_URL_PROD 或 NEON_DATABASE_URL，"
  echo "或在项目根目录创建 .env.neon.local（勿提交）："
  echo "  DATABASE_URL_PROD=postgresql://...@ep-xxxx.neon.tech/neondb?sslmode=require"
  exit 1
fi

LOCAL_URL=""
if [ -f .env.local ]; then
  LOCAL_URL="$(grep -E '^DATABASE_URL=' .env.local | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
fi
if [ -z "$LOCAL_URL" ] && [ -f .env ]; then
  LOCAL_URL="$(grep -E '^DATABASE_URL=' .env | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
fi
LOCAL_URL="${LOCAL_URL:-postgresql://waxlist:waxlist@localhost:5432/waxlist}"

PROD_DUMP_URL="$(
  PROD_URL="$PROD_URL" python3 -c '
import os, re
u = os.environ["PROD_URL"]
u = u.replace("-pooler", "")
u = re.sub(r"([?&])pgbouncer=true&?", r"\1", u)
u = re.sub(r"([?&])connect_timeout=\d+&?", r"\1", u)
u = u.rstrip("?&")
if "sslmode=" not in u:
    u += ("&" if "?" in u else "?") + "sslmode=require"
print(u)
'
)"

export PATH="/usr/local/opt/libpq/bin:/opt/homebrew/opt/libpq/bin:${PATH}"
if ! command -v pg_dump >/dev/null 2>&1; then
  echo "需要 pg_dump（macOS: brew install libpq && brew link --force libpq）"
  exit 1
fi

echo "==> 目标本地库: $(echo "$LOCAL_URL" | sed -E 's#(//[^:]+:)[^@]+@#\1***@#')"
echo "==> 来源 Neon:   $(echo "$PROD_DUMP_URL" | sed -E 's#(//[^:]+:)[^@]+@#\1***@#')"
echo "==> 将覆盖本地全部表数据。Ctrl+C 取消，3 秒后继续…"
sleep 3

DUMP="$(mktemp /tmp/waxlist-neon-XXXXXX.sql)"
CLEAN="$(mktemp /tmp/waxlist-neon-clean-XXXXXX.sql)"
trap 'rm -f "$DUMP" "$CLEAN"' EXIT

echo "==> pg_dump …"
pg_dump "$PROD_DUMP_URL" \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  --format=plain \
  -f "$DUMP"

grep -v -E '^\\restrict |^\\unrestrict |transaction_timeout' "$DUMP" > "$CLEAN"

echo "==> 确保本地容器在跑 …"
npm run db:up >/dev/null 2>&1 || true
sleep 2

echo "==> restore → 本地 …"
psql "$LOCAL_URL" -v ON_ERROR_STOP=1 -f "$CLEAN" >/dev/null

echo "==> 校验 …"
DATABASE_URL="$LOCAL_URL" node <<'NODE'
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  console.log("users   ", await p.user.count());
  console.log("releases", await p.release.count());
  await p.$disconnect();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
NODE

echo "==> 完成。本地 .env 请继续指向 localhost；这是 Neon 的只读副本。"
