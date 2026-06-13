#!/bin/bash
# pre-commit-copyright.sh
# 在本地提交前检查待提交文件的版权头完整性和归属一致性
# 与 CI workflow (copyright-header.yml) 逻辑一致，但只检查 staged 文件

set -u

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
BASELINE=".github/copyright-audit/baseline.txt"

# ── 模式选择 ──────────────────────────────────────────────
# --full-scan: pre-push 模式，扫描所有源文件
# 无参数:      pre-commit 模式，只扫描 staged 文件
FULL_SCAN=false
if [ "${1:-}" = "--full-scan" ]; then
  FULL_SCAN=true
fi

# ── 获取待检查文件列表 ────────────────────────────────────
if [ "$FULL_SCAN" = true ]; then
  # 使用 git ls-files 动态识别 .gitignore（比硬编码 find 排除更可靠）
  FILE_LIST=$(git ls-files --cached --others --exclude-standard \
    | grep -E '\.(ts|tsx|js|jsx|mjs|cjs|py|java|kt|go|rs)$' \
    || true)
else
  FILE_LIST=$(git diff --cached --name-only --diff-filter=ACM \
    | grep -E '\.(ts|tsx|js|jsx|mjs|cjs|py|java|kt|go|rs)$' || true)
fi

if [ -z "$FILE_LIST" ]; then
  exit 0
fi

HAS_ERROR=false
TAMPER_COUNT=0
MISSING_COUNT=0
NEW_MISSING_COUNT=0

# 加载基线
declare -A BL_CP BL_SP
if [ -f "$BASELINE" ]; then
  while IFS='|' read -r file copyright spdx _; do
    # 去除首尾空格
    file="${file#"${file%%[![:space:]]*}"}"; file="${file%"${file##*[![:space:]]}"}"
    copyright="${copyright#"${copyright%%[![:space:]]*}"}"; copyright="${copyright%"${copyright##*[![:space:]]}"}"
    spdx="${spdx#"${spdx%%[![:space:]]*}"}"; spdx="${spdx%"${spdx##*[![:space:]]}"}"
    [[ "$file" =~ ^# ]] && continue
    [ -z "$file" ] && continue
    BL_CP["$file"]="$copyright"
    BL_SP["$file"]="$spdx"
  done < "$BASELINE"
fi

echo ""
if [ "$FULL_SCAN" = true ]; then
  echo "━━━ 版权头全量扫描（pre-push）━━━"
else
  echo "━━━ 版权头检查（pre-commit）━━━"
fi

TOTAL_FILES=$(echo "$FILE_LIST" | wc -l)

# pre-push 全量扫描时显示进度
if [ "$FULL_SCAN" = true ]; then
  echo "  扫描 $TOTAL_FILES 个源文件..."
  SCANNED=0
fi

while IFS= read -r file; do
  [ -z "$file" ] && continue
  [ ! -f "$file" ] && continue

  if [ "$FULL_SCAN" = true ]; then
    SCANNED=$((SCANNED + 1))
    [ $((SCANNED % 500)) -eq 0 ] && printf "\r  进度: %d / %d" "$SCANNED" "$TOTAL_FILES"
  fi
  # 最后一行时补换行
  [ "$FULL_SCAN" = true ] && [ "$SCANNED" -eq "$TOTAL_FILES" ] && echo ""

  rel="${file#./}"
  current_cp=$(head -10 "$file" 2>/dev/null | grep "Copyright " | head -1 | sed 's/^[[:space:]*/!]*//;s/[[:space:]]*$//')
  current_sp=$(head -10 "$file" 2>/dev/null | grep "SPDX-License-Identifier" | head -1 | sed 's/^[[:space:]*/!]*//;s/[[:space:]]*$//')

  hc=false; hs=false
  [ -n "$current_cp" ] && hc=true
  [ -n "$current_sp" ] && hs=true

  if [ -n "${BL_CP[$rel]:-}" ]; then
    # 基线中的文件 — 检查版权归属
    expected_cp="${BL_CP[$rel]}"
    expected_sp="${BL_SP[$rel]}"

    if [ "$expected_cp" != "(无)" ] && [ "$hc" = true ] && [ "$current_cp" != "$expected_cp" ]; then
      HAS_ERROR=true
      TAMPER_COUNT=$((TAMPER_COUNT + 1))
      printf "${RED}❌  版权被篡改:${NC} %s\n" "$rel"
      printf "    基线: %s\n" "$expected_cp"
      printf "    当前: %s\n" "$current_cp"
      continue
    fi

    if [ "$expected_cp" != "(无)" ] && [ "$hc" = false ]; then
      HAS_ERROR=true
      MISSING_COUNT=$((MISSING_COUNT + 1))
      printf "${RED}❌  版权被删除:${NC} %s (基线: %s)\n" "$rel" "$expected_cp"
      continue
    fi

    if [ "$expected_sp" != "(无)" ] && [ "$hs" = false ]; then
      HAS_ERROR=true
      MISSING_COUNT=$((MISSING_COUNT + 1))
      printf "${RED}❌  SPDX 被删除:${NC} %s (基线: %s)\n" "$rel" "$expected_sp"
      continue
    fi
  else
    # 新增文件 — 检查是否有版权头
    if [ "$hc" = false ] || [ "$hs" = false ]; then
      NEW_MISSING_COUNT=$((NEW_MISSING_COUNT + 1))
      printf "${YELLOW}⚠️  新文件缺版权头:${NC} %s" "$rel"
      [ "$hc" = false ] && printf " [缺 Copyright]"
      [ "$hs" = false ] && printf " [缺 SPDX]"
      printf "\n"
    fi
  fi
done <<< "$FILE_LIST"

echo "━━━━━━━━━━━━━━━━━━"
printf "${GREEN}✅  通过${NC} | " >&2

if [ "$HAS_ERROR" = true ]; then
  printf "${RED}%d 个错误${NC} | " "$((TAMPER_COUNT + MISSING_COUNT))" >&2
fi
printf "${YELLOW}%d 个警告${NC}" "$NEW_MISSING_COUNT" >&2
echo ""

if [ "$HAS_ERROR" = true ]; then
  if [ "$FULL_SCAN" = true ]; then
    echo ""
    echo "❌ 版权检查未通过！已阻止推送。"
    echo "  错误原因："
    [ "$TAMPER_COUNT" -gt 0 ] && echo "    - 版权归属被篡改（恢复原始 Google LLC / Qwen Team 声明）"
    [ "$MISSING_COUNT" -gt 0 ] && echo "    - 版权头被删除"
    echo ""
    echo "  使用 git push --no-verify 跳过（不推荐）"
  else
    echo ""
    echo "❌ 版权检查未通过！已阻止提交。"
    echo "  错误原因："
    [ "$TAMPER_COUNT" -gt 0 ] && echo "    - 版权归属被篡改（恢复原始 Google LLC / Qwen Team 声明）"
    [ "$MISSING_COUNT" -gt 0 ] && echo "    - 版权头被删除"
    echo ""
    echo "  使用 git commit --no-verify 跳过（不推荐）"
  fi
  exit 1
fi
