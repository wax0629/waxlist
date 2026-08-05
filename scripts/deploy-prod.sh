#!/usr/bin/env bash
# 将当前工作区部署到香港生产机（rsync；服务器目录未必是 git 仓库）
# 依赖：本机已配置 SSH ubuntu@43.161.255.64
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${DEPLOY_HOST:-ubuntu@43.161.255.64}"
APP_DIR="${DEPLOY_APP_DIR:-/var/www/waxlist}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"

CURRENT_BRANCH="$(git -C "$ROOT" branch --show-current)"
if [[ "$CURRENT_BRANCH" != "$DEPLOY_BRANCH" ]]; then
  echo "Refusing deploy: current branch is '$CURRENT_BRANCH', expected '$DEPLOY_BRANCH'." >&2
  exit 1
fi

if [[ -n "$(git -C "$ROOT" status --porcelain)" ]]; then
  echo "Refusing deploy: working tree is not clean." >&2
  exit 1
fi

git -C "$ROOT" fetch origin "$DEPLOY_BRANCH"
LOCAL_COMMIT="$(git -C "$ROOT" rev-parse HEAD)"
REMOTE_COMMIT="$(git -C "$ROOT" rev-parse "origin/$DEPLOY_BRANCH")"
if [[ "$LOCAL_COMMIT" != "$REMOTE_COMMIT" ]]; then
  echo "Refusing deploy: local HEAD does not match origin/$DEPLOY_BRANCH." >&2
  exit 1
fi

echo "==> rsync $ROOT → $HOST:$APP_DIR"
rsync -az --delete \
  --exclude .git \
  --exclude node_modules \
  --exclude .next \
  --exclude .env \
  --exclude .env.local \
  --exclude .data \
  --exclude data \
  --exclude .DS_Store \
  --exclude tsconfig.tsbuildinfo \
  --exclude ecosystem.config.cjs \
  --exclude DEPLOYED_COMMIT \
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
printf '%s\n' "$LOCAL_COMMIT" > DEPLOYED_COMMIT
pm2 save
sleep 2
curl -sS -m 8 http://127.0.0.1/health || true
echo
REMOTE

echo "==> public health"
curl -sS -m 12 https://waxlist.cn/health || true
echo
echo "==> deploy finished"
