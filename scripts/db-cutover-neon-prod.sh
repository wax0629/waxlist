#!/usr/bin/env bash
# 将香港生产机 DATABASE_URL 切到新 Neon（迁移完成后使用）
# 依赖：.env.neon.local 里 DATABASE_URL_NEW；SSH ubuntu@43.161.255.64
#
# 用法：
#   npm run db:cutover-neon-prod
#   SKIP_CONFIRM=1 npm run db:cutover-neon-prod
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

HOST="${DEPLOY_HOST:-ubuntu@43.161.255.64}"
APP_DIR="${DEPLOY_APP_DIR:-/var/www/waxlist}"

read_env() {
  local key="$1"
  python3 -c '
from pathlib import Path
import sys
key = sys.argv[1]
for line in Path(".env.neon.local").read_text().splitlines():
    line = line.strip()
    if not line or line.startswith("#"):
        continue
    if line.startswith(key + "="):
        print(line.split("=", 1)[1].strip().strip("\"'\''"))
        raise SystemExit(0)
raise SystemExit(1)
' "$key"
}

mask_url() {
  echo "$1" | sed -E 's#(//[^:]+:)[^@]+@#\1***@#'
}

if [ ! -f .env.neon.local ]; then
  echo "缺少 .env.neon.local"
  exit 1
fi

NEW_URL="$(read_env DATABASE_URL_NEW)"
# 应用侧可用 pooler；若用户给了直连也行
echo "==> 新 DATABASE_URL: $(mask_url "$NEW_URL")"
echo "==> 目标: $HOST:$APP_DIR/.env"

if [ "${SKIP_CONFIRM:-0}" != "1" ]; then
  echo "将覆盖生产 DATABASE_URL 并 pm2 restart。Ctrl+C 取消，5 秒后继续…"
  sleep 5
fi

# 传到远端临时文件，再用 python 安全改 .env（避免 shell 转义问题）
REMOTE_TMP="/tmp/waxlist-database-url-new.txt"
printf '%s' "$NEW_URL" | ssh -o ConnectTimeout=20 "$HOST" "cat > $REMOTE_TMP && chmod 600 $REMOTE_TMP"

ssh -o ConnectTimeout=20 "$HOST" bash -s <<REMOTE
set -euo pipefail
APP_DIR="$APP_DIR"
REMOTE_TMP="$REMOTE_TMP"
ENV_FILE="\$APP_DIR/.env"
if [ ! -f "\$ENV_FILE" ]; then
  echo "缺少 \$ENV_FILE"
  exit 1
fi
# 备份
cp -a "\$ENV_FILE" "\$ENV_FILE.bak.\$(date +%Y%m%d-%H%M%S)"
NEW=\$(cat "\$REMOTE_TMP")
rm -f "\$REMOTE_TMP"
python3 - "\$ENV_FILE" "\$NEW" <<'PY'
from pathlib import Path
import sys
path = Path(sys.argv[1])
new = sys.argv[2]
lines = path.read_text().splitlines()
out = []
found = False
for line in lines:
    if line.startswith("DATABASE_URL="):
        out.append("DATABASE_URL=" + new)
        found = True
    else:
        out.append(line)
if not found:
    out.append("DATABASE_URL=" + new)
path.write_text("\n".join(out) + "\n")
print("DATABASE_URL updated")
PY
# 校验能连
cd "\$APP_DIR"
# 用 node/prisma 简单 count
node -e '
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  const u = await p.user.count();
  const r = await p.release.count();
  console.log("prod check users=", u, "releases=", r);
  await p.\$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
'
pm2 restart waxlist --update-env || pm2 restart all --update-env
sleep 2
curl -sS -m 8 http://127.0.0.1/health || true
echo
REMOTE

echo "==> 公网 health"
curl -sS -m 12 https://waxlist.cn/health || true
echo
echo "==> cutover 完成。建议："
echo "  - 浏览 https://waxlist.cn/explore 登录点一下"
echo "  - 把 .env.neon.local 的 DATABASE_URL_PROD 改成新串"
echo "  - 旧 US Neon 项目观察 1–3 天无问题再删"
