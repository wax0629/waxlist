#!/usr/bin/env bash
# 将当前工作区部署到香港生产机（rsync；服务器目录未必是 git 仓库）
# 依赖：本机已配置 SSH ubuntu@43.161.255.64
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${DEPLOY_HOST:-ubuntu@43.161.255.64}"
APP_DIR="${DEPLOY_APP_DIR:-/var/www/waxlist}"

echo "==> rsync $ROOT → $HOST:$APP_DIR"
rsync -az --delete \
  --exclude node_modules \
  --exclude .next \
  --exclude .env \
  --exclude .env.local \
  --exclude .data \
  --exclude data \
  --exclude .DS_Store \
  --exclude tsconfig.tsbuildinfo \
  --exclude ecosystem.config.cjs \
  "$ROOT/" "$HOST:$APP_DIR/"

echo "==> remote install / build / restart"
ssh -o ConnectTimeout=15 "$HOST" bash -s <<REMOTE
set -euo pipefail
cd "$APP_DIR"
if [ -f .env ]; then
  sed -i "s|^AUTH_URL=.*|AUTH_URL=https://waxlist.cn|" .env || true
  grep -q "^NEXTAUTH_URL=" .env || echo "NEXTAUTH_URL=https://waxlist.cn" >> .env
  grep -q "^AUTH_TRUST_HOST=" .env || echo "AUTH_TRUST_HOST=true" >> .env
fi
npm ci
npx prisma generate
npx prisma db push
npm run build
if [ -f ecosystem.config.cjs ]; then
  pm2 startOrReload ecosystem.config.cjs --update-env
else
  pm2 restart waxlist --update-env || pm2 start npm --name waxlist -- start
fi
pm2 save
sleep 2
curl -sS -m 8 http://127.0.0.1/health || true
echo
REMOTE

echo "==> public health"
curl -sS -m 12 https://waxlist.cn/health || true
echo
echo "==> deploy finished"
