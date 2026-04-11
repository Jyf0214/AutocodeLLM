#!/bin/bash
# 启动脚本 - 加载环境变量并启动开发服务器

set -e

# 加载 .env.local 文件
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
  echo "✅ 已加载 .env.local 环境变量"
else
  echo "⚠️  未找到 .env.local 文件"
  exit 1
fi

# 启动开发服务器
echo "🚀 启动开发服务器..."
bun run dev
