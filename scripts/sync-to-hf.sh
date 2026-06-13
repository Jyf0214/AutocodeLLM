#!/bin/bash
# 同步代码到 Hugging Face Spaces/Datasets/Models
# 使用硬编码的 HF Space 配置前缀 + GitHub README 内容

set -e

# 配置变量
HF_REPO="${HF_REPO:-}"
HF_TOKEN="${HF_TOKEN:-}"
HF_REPO_TYPE="${HF_REPO_TYPE:-space}"  # space, dataset, model
SYNC_DIR="${SYNC_DIR:-.}"

# 将 SYNC_DIR 转为绝对路径（必须在 cd 之前）
SYNC_DIR="$(cd "$SYNC_DIR" && pwd)"

# 检查必需的环境变量
if [ -z "$HF_REPO" ]; then
  echo "::warning::HF_REPO 未设置，跳过 Hugging Face 同步"
  exit 0
fi

if [ -z "$HF_TOKEN" ]; then
  echo "::warning::HF_TOKEN 未设置，跳过 Hugging Face 同步"
  exit 0
fi

echo "========================================="
echo "开始同步到 Hugging Face"
echo "仓库: $HF_REPO"
echo "类型: $HF_REPO_TYPE"
echo "========================================="

# 构建 Hugging Face 仓库 URL
case "$HF_REPO_TYPE" in
  space)
    HF_URL="https://huggingface.co/spaces/$HF_REPO"
    ;;
  dataset)
    HF_URL="https://huggingface.co/datasets/$HF_REPO"
    ;;
  model|*)
    HF_URL="https://huggingface.co/$HF_REPO"
    ;;
esac

# 创建临时目录用于同步
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# 克隆 HF 仓库（使用 token 认证）
echo "克隆 Hugging Face 仓库..."
if git clone "https://user:$HF_TOKEN@${HF_URL#https://}" "$TEMP_DIR"; then
  echo "仓库克隆成功"
else
  echo "::error::仓库克隆失败"
  exit 1
fi

cd "$TEMP_DIR"

# 配置 git
git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"

# 同步文件（排除 .git、.gitignore、README 和 HF 不支持的二进制文件）
echo "同步文件..."
rsync -av --delete \
  --exclude='.git' \
  --exclude='.gitignore' \
  --exclude='README.md' \
  --exclude='README.*' \
  --exclude='*.ttf' \
  --exclude='*.otf' \
  --exclude='*.woff' \
  --exclude='*.woff2' \
  --exclude='*.eot' \
  --exclude='*.dll' \
  --exclude='*.exe' \
  --exclude='*.so' \
  --exclude='*.dylib' \
  --exclude='*.pyc' \
  --exclude='*.pyo' \
  --exclude='__pycache__/' \
  --exclude='node_modules/' \
  --exclude='.next/' \
  --exclude='cache/' \
  "$SYNC_DIR/" "$TEMP_DIR/"

# 清理远程仓库中已存在的二进制文件（仅在远程清理，不删除本地文件）
echo "清理远程仓库中的二进制文件..."
find "$TEMP_DIR" -type f \( \
  -name '*.ttf' -o -name '*.otf' -o -name '*.woff' -o -name '*.woff2' -o -name '*.eot' \
  -o -name '*.dll' -o -name '*.exe' -o -name '*.so' -o -name '*.dylib' \
  \) -print -delete

# 清理空目录
find "$TEMP_DIR" -type d -empty -delete 2>/dev/null || true

# 生成 HF README：硬编码 Space 配置前缀 + GitHub README 内容
if [ -f "$SYNC_DIR/README.md" ]; then
  echo "生成 HF README（Space 配置 + GitHub 内容）..."
  cat > README.md << 'FRONTMATTER'
---
title: AutocodeLLM
emoji: 🤖
colorFrom: blue
colorTo: purple
sdk: docker
app_file: Dockerfile
pinned: false
---
FRONTMATTER
  echo "" >> README.md
  cat "$SYNC_DIR/README.md" >> README.md
fi

# 添加所有更改
git add -A

# 检查是否有更改
if git diff --staged --quiet; then
  echo "::notice::没有检测到更改，跳过同步"
  exit 0
fi

# 在现有历史基础上新增提交
COMMIT_MSG="Sync from GitHub Actions - ${GITHUB_SHA:-unknown}"
git commit -m "$COMMIT_MSG"

# 推送
if git push --force; then
  echo "========================================="
  echo "::notice::Hugging Face 同步成功！"
  echo "仓库: $HF_URL"
  echo "========================================="
else
  echo "::error::Hugging Face 同步失败"
  exit 1
fi
