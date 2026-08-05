#!/usr/bin/env bash
# Neon 跨区域迁移：旧项目 → 新项目（同账号不同 region）
#
# Neon 不能改已有 project 的 region，只能：
#   1. 控制台新建目标区域 project（推荐 Singapore / aws-ap-southeast-1）
#   2. 本脚本 pg_dump 旧库 → restore 新库
#   3. 把生产服务器 DATABASE_URL 改成新连接串并重启
#
# 用法：
#   在 .env.neon.local 写：
#     DATABASE_URL_PROD=...   # 旧库（当前 US 等）
#     DATABASE_URL_NEW=...    # 新库（Singapore 等）
#   npm run db:migrate-neon-region
#
# 可选：
#   SKIP_CONFIRM=1   跳过 5 秒确认
#   DUMP_ONLY=1      只 dump 到 /tmp，不 restore
#   RESTORE_ONLY=1   用已有 clean dump 只 restore（需 MIGRATE_CLEAN 路径）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export PATH="/usr/local/opt/libpq/bin:/opt/homebrew/opt/libpq/bin:${PATH}"

if [ -f .env.neon.local ]; then
  # 不用 source：连接串里的 & 会炸 shell
  :
else
  echo "缺少 .env.neon.local"
  exit 1
fi

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

normalize_dump_url() {
  python3 -c '
import os, re, sys
u = sys.argv[1]
u = u.replace("-pooler", "")
u = re.sub(r"([?&])pgbouncer=true&?", r"\1", u)
u = re.sub(r"([?&])channel_binding=[^&]*&?", r"\1", u)
u = re.sub(r"([?&])connect_timeout=\d+&?", r"\1", u)
u = u.rstrip("?&")
if "sslmode=" not in u:
    u += ("&" if "?" in u else "?") + "sslmode=require"
u = re.sub(r"\?&+", "?", u)
u = re.sub(r"&&+", "&", u)
print(u)
' "$1"
}

mask_url() {
  echo "$1" | sed -E 's#(//[^:]+:)[^@]+@#\1***@#'
}

host_of() {
  echo "$1" | python3 -c 'import re,sys; m=re.search(r"@([^/?]+)", sys.stdin.read()); print(m.group(1) if m else "?")'
}

if ! command -v pg_dump >/dev/null || ! command -v psql >/dev/null; then
  echo "需要 pg_dump / psql（macOS: brew install libpq && brew link --force libpq）"
  exit 1
fi

OLD_URL="$(read_env DATABASE_URL_PROD 2>/dev/null || read_env DATABASE_URL_OLD 2>/dev/null || true)"
NEW_URL="$(read_env DATABASE_URL_NEW 2>/dev/null || true)"

if [ -z "${OLD_URL:-}" ]; then
  echo "缺少 DATABASE_URL_PROD（旧 Neon）"
  exit 1
fi

OLD_DUMP="$(normalize_dump_url "$OLD_URL")"
echo "==> 旧库: $(mask_url "$OLD_DUMP")"
echo "    host: $(host_of "$OLD_DUMP")"

if [ "${DUMP_ONLY:-0}" != "1" ]; then
  if [ -z "${NEW_URL:-}" ]; then
    echo ""
    echo "缺少 DATABASE_URL_NEW（新区域 Neon 连接串）。"
    echo ""
    echo "请先在 https://console.neon.tech 新建项目："
    echo "  Region: AWS Asia Pacific (Singapore)  —  aws-ap-southeast-1"
    echo "  离香港机 / 国内最近的 Neon 区域"
    echo ""
    echo "然后把连接串写入 .env.neon.local（勿提交 Git）："
    echo "  DATABASE_URL_NEW=postgresql://...@ep-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
    echo ""
    echo "优先用「直连」主机（不要 -pooler），pg_restore 更稳；应用运行时可用 pooler。"
    exit 1
  fi
  NEW_DUMP="$(normalize_dump_url "$NEW_URL")"
  echo "==> 新库: $(mask_url "$NEW_DUMP")"
  echo "    host: $(host_of "$NEW_DUMP")"
  if [ "$(host_of "$OLD_DUMP")" = "$(host_of "$NEW_DUMP")" ]; then
    echo "拒绝：新旧 host 相同"
    exit 1
  fi
fi

WORKDIR="${MIGRATE_WORKDIR:-/tmp/waxlist-neon-migrate}"
mkdir -p "$WORKDIR"
RAW="${MIGRATE_RAW:-$WORKDIR/source-raw.sql}"
CLEAN="${MIGRATE_CLEAN:-$WORKDIR/source-clean.sql}"

if [ "${RESTORE_ONLY:-0}" != "1" ]; then
  echo "==> pg_dump 旧库 …"
  pg_dump "$OLD_DUMP" \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    --format=plain \
    -f "$RAW"
  # Neon / 新版 pg 可能带出目标不认的指令
  grep -v -E '^\\restrict |^\\unrestrict |^SET transaction_timeout' "$RAW" > "$CLEAN" || cp "$RAW" "$CLEAN"
  echo "    dump: $RAW ($(wc -c < "$RAW" | tr -d ' ') bytes)"
  echo "    clean: $CLEAN"
fi

if [ "${DUMP_ONLY:-0}" = "1" ]; then
  echo "==> DUMP_ONLY：已写出 clean dump，跳过 restore。"
  exit 0
fi

if [ ! -s "$CLEAN" ]; then
  echo "clean dump 不存在或为空: $CLEAN"
  exit 1
fi

echo "==> 将覆盖新库全部对象（schema + 数据）。"
echo "    旧库不会被修改。"
if [ "${SKIP_CONFIRM:-0}" != "1" ]; then
  echo "    Ctrl+C 取消，5 秒后继续…"
  sleep 5
fi

echo "==> restore → 新库 …"
# 某些 Neon 目标库可能已有默认角色/扩展；--clean 会尝试 DROP
psql "$NEW_DUMP" -v ON_ERROR_STOP=1 -f "$CLEAN" >/tmp/waxlist-neon-migrate-restore.log 2>&1 || {
  echo "restore 失败，日志: /tmp/waxlist-neon-migrate-restore.log"
  tail -40 /tmp/waxlist-neon-migrate-restore.log
  exit 1
}

echo "==> 校验新旧行数 …"
python3 - <<'PY'
import os, re, subprocess, sys
from pathlib import Path

def read_env(key):
    for line in Path(".env.neon.local").read_text().splitlines():
        line = line.strip()
        if line.startswith(key + "="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    return None

def norm(u: str) -> str:
    u = u.replace("-pooler", "")
    u = re.sub(r"([?&])pgbouncer=true&?", r"\1", u)
    u = u.rstrip("?&")
    if "sslmode=" not in u:
        u += ("&" if "?" in u else "?") + "sslmode=require"
    return u

old = norm(read_env("DATABASE_URL_PROD") or read_env("DATABASE_URL_OLD"))
new = norm(read_env("DATABASE_URL_NEW"))
tables = ["users", "releases", "ratings", "favorites", "recommendations", "comments"]

def count(url, table):
    r = subprocess.run(
        ["psql", url, "-tAc", f'SELECT count(*) FROM "{table}";'],
        capture_output=True, text=True,
    )
    if r.returncode != 0:
        return f"err:{r.stderr.strip()[:80]}"
    return r.stdout.strip()

print(f"{'table':<20} {'old':>8} {'new':>8}")
ok = True
for t in tables:
    a, b = count(old, t), count(new, t)
    print(f"{t:<20} {a:>8} {b:>8}")
    if a != b and not str(a).startswith("err") and not str(b).startswith("err"):
        ok = False
if not ok:
    print("行数不一致，请检查 restore 日志")
    sys.exit(1)
print("行数一致 ✓")
PY

echo ""
echo "==> 数据迁移完成。"
echo "接下来（切换生产流量）："
echo "  1. 把新串（可用 -pooler）写到服务器 /var/www/waxlist/.env 的 DATABASE_URL"
echo "  2. ssh 上 pm2 restart waxlist --update-env"
echo "  3. 打开 https://waxlist.cn/explore 确认列表与登录"
echo "  4. 本机 .env.neon.local 把 DATABASE_URL_PROD 改成新串，旧 US 项目观察几天后可删"
echo ""
echo "或运行： npm run db:cutover-neon-prod   （需已配置 SSH + DATABASE_URL_NEW）"
