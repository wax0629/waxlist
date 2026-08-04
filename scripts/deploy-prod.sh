#!/usr/bin/env bash
# 将 origin/main 部署到香港生产机（需本机已配置 SSH：ubuntu@43.161.255.64）
set -euo pipefail

HOST="${DEPLOY_HOST:-ubuntu@43.161.255.64}"
APP_DIR="${DEPLOY_APP_DIR:-/var/www/waxlist}"

echo "==> deploy $HOST:$APP_DIR"

ssh -o ConnectTimeout=15 "$HOST" bash -s <<REMOTE
set -euo pipefail
cd "$APP_DIR"
echo "--- git ---"
git fetch origin
git checkout main
git pull --ff-only origin main
echo "--- deps ---"
npm ci
npx prisma generate
# schema 无变更时 db push 很快；有破坏性变更请先人工确认
npx prisma db push
echo "--- build ---"
npm run build
echo "--- restart ---"
if [ -f ecosystem.config.cjs ]; then
  pm2 startOrReload ecosystem.config.cjs --update-env
else
  pm2 restart waxlist --update-env || pm2 start npm --name waxlist -- start
fi
pm2 save
echo "--- health ---"
sleep 2
curl -sS -m 8 http://127.0.0.1/health || true
echo
curl -sS -m 8 -o /dev/null -w "explore:%{http_code}\n" -H "Host: waxlist.cn" http://127.0.0.1/explore
pm2 status
REMOTE

echo "==> remote done; probing public health"
curl -sS -m 12 https://waxlist.cn/health || true
echo
echo "==> deploy finished"
