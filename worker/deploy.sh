#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

if ! command -v node >/dev/null 2>&1; then
  NODE_DIR="/tmp/node-v22.14.0-darwin-arm64"
  if [ ! -x "$NODE_DIR/bin/node" ]; then
    echo "正在下载 Node.js..."
    curl -fsSL "https://nodejs.org/dist/v22.14.0/node-v22.14.0-darwin-arm64.tar.gz" -o /tmp/node.tar.gz
    tar -xzf /tmp/node.tar.gz -C /tmp
  fi
  export PATH="$NODE_DIR/bin:$PATH"
fi

if [ ! -d node_modules ]; then
  echo "正在安装 wrangler..."
  npm install
fi

echo "检查 Cloudflare 登录状态..."
WHOAMI_OUTPUT="$(npx wrangler whoami 2>&1 || true)"
if echo "$WHOAMI_OUTPUT" | grep -q "not authenticated\|Please run \`wrangler login\`"; then
  echo ""
  echo "请先登录 Cloudflare（浏览器会弹出授权页面）..."
  npx wrangler login
  WHOAMI_OUTPUT="$(npx wrangler whoami 2>&1)"
fi

echo ""
echo "Cloudflare 账号："
echo "$WHOAMI_OUTPUT"

DB_NAME="jh-portfolio-chungli-db"
DB_ID="$(grep -E '^database_id\s*=' wrangler.toml | sed -E 's/.*=\s*"([^"]+)".*/\1/')"

if [ "$DB_ID" = "REPLACE_WITH_YOUR_D1_DATABASE_ID" ] || [ -z "$DB_ID" ]; then
  echo ""
  echo "正在建立 D1 数据库..."
  CREATE_OUTPUT="$(npx wrangler d1 create "$DB_NAME" 2>&1)"
  echo "$CREATE_OUTPUT"

  DB_ID="$(echo "$CREATE_OUTPUT" | sed -n 's/.*database_id = "\([^"]*\)".*/\1/p' | head -1)"
  if [ -z "$DB_ID" ]; then
    echo "无法解析 database_id，请手动填入 wrangler.toml 后重试。"
    exit 1
  fi

  sed -i '' "s/database_id = \"REPLACE_WITH_YOUR_D1_DATABASE_ID\"/database_id = \"$DB_ID\"/" wrangler.toml
  echo "已写入 database_id: $DB_ID"
fi

echo ""
echo "正在初始化 D1 数据表..."
npx wrangler d1 execute "$DB_NAME" --remote --file=schema.sql

echo ""
echo "正在部署 Worker..."
DEPLOY_OUTPUT="$(npx wrangler deploy 2>&1)"
echo "$DEPLOY_OUTPUT"

WORKER_URL="$(echo "$DEPLOY_OUTPUT" | grep -Eo 'https://[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+\.workers\.dev' | head -1)"
if [ -z "$WORKER_URL" ]; then
  ACCOUNT="$(npx wrangler whoami 2>/dev/null | grep -Eo 'Account Name: .*' | sed 's/Account Name: //' || true)"
  echo "部署完成。请在 Cloudflare Dashboard 查看 Worker URL，并手动更新 config.js。"
  exit 0
fi

CONFIG="../config.js"
if [ -f "$CONFIG" ]; then
  sed -i '' "s|workerUrl: \"https://[^\"]*\"|workerUrl: \"$WORKER_URL\"|" "$CONFIG"
  echo ""
  echo "已更新 config.js -> workerUrl: $WORKER_URL"
fi

echo ""
echo "测试 API..."
curl -fsS "$WORKER_URL/?symbols=00981A.TW" | head -c 300
echo ""
echo ""
echo "完成！请将 config.js 推送到 GitHub Pages。"
