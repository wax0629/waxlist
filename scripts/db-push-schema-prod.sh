#!/usr/bin/env bash
# 仅将 prisma schema 推到 Neon 生产（不碰数据行，不 dump）
# 用法：
#   export DATABASE_URL_PROD='postgresql://...neon.../neondb?sslmode=require'
#   npm run db:push-schema-prod
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ -f .env.neon.local ]; then
  set -a
  # shellcheck source=/dev/null
  source <(grep -E '^[A-Za-z_][A-Za-z0-9_]*=' .env.neon.local || true)
  set +a
fi

PROD_URL="${DATABASE_URL_PROD:-${NEON_DATABASE_URL:-}}"
if [ -z "$PROD_URL" ]; then
  echo "缺少 DATABASE_URL_PROD（或 NEON_DATABASE_URL / .env.neon.local）"
  exit 1
fi

# 拒绝误用本地串
if echo "$PROD_URL" | grep -qiE 'localhost|127\.0\.0\.1'; then
  echo "拒绝：DATABASE_URL_PROD 看起来是本地地址。"
  exit 1
fi

echo "==> prisma db push → Neon（仅结构）"
echo "    host: $(echo "$PROD_URL" | sed -E 's#(//[^:]+:)[^@]+@#\1***@#')"
echo "    3 秒后继续…"
sleep 3

DATABASE_URL="$PROD_URL" npx prisma db push

echo "==> 完成。数据行未通过 dump 覆盖。"
