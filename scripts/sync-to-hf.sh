#!/usr/bin/env bash
set -euo pipefail

# Sync to Hugging Face Hub
# Requires: HF_REPO, HF_TOKEN, HF_REPO_TYPE environment variables

if [ -z "${HF_TOKEN:-}" ]; then
  echo "HF_TOKEN not set, skipping Hugging Face sync"
  exit 0
fi

if [ -z "${HF_REPO:-}" ]; then
  echo "HF_REPO not set, skipping Hugging Face sync"
  exit 0
fi

REPO_TYPE="${HF_REPO_TYPE:-space}"
CLONE_DIR="/tmp/hf-repo"

echo "Syncing to Hugging Face: ${HF_REPO} (type: ${REPO_TYPE})"

# Clean up previous clone
rm -rf "${CLONE_DIR}"

# Clone HF repo
git clone "https://oauth2:${HF_TOKEN}@huggingface.co/${HF_REPO}" "${CLONE_DIR}"

# Sync files using rsync (exclude unnecessary files)
rsync -av --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='cache' \
  --exclude='.env*' \
  --exclude='bun.lock' \
  --exclude='*.md' \
  --exclude='.agents' \
  --exclude='.husky' \
  ./ "${CLONE_DIR}/"

# Commit and push
cd "${CLONE_DIR}"
git config user.name "GitHub Actions"
git config user.email "actions@github.com"

if git diff --staged --quiet; then
  echo "No changes to commit"
  exit 0
fi

git add -A
git commit -m "Sync from GitHub (${GITHUB_SHA:-unknown})"
git push

echo "Hugging Face sync completed successfully"
