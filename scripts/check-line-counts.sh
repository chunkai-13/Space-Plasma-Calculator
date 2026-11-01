#!/usr/bin/env bash
# scripts/check-line-counts.sh
# 檢查專案原始碼檔案長度，防止單一檔案過長導致注意力稀釋 (Attention Dilution)

MAX_LINES=${1:-500}
FAILED=0

echo "=========================================================="
echo " 程式碼檔案長度防線檢查 (上限: ${MAX_LINES} 行)"
echo "=========================================================="
printf "%-35s %10s %10s\n" "檔案路徑" "行數" "狀態"
echo "----------------------------------------------------------"

FILES=$(find . -maxdepth 2 \( -name "*.js" -o -name "*.css" \) ! -path "*/katex/*" | sort)

for file in $FILES; do
  lines=$(wc -l < "$file" | tr -d ' ')
  clean_path=${file#./}
  if [ "$lines" -gt "$MAX_LINES" ]; then
    printf "%-35s %10d \033[31m[過長 WARN]\033[0m\n" "$clean_path" "$lines"
    # 若為 JS 核心檔案且超過 500 行則視為違規
    if [[ "$clean_path" == *.js ]]; then
      FAILED=1
    fi
  else
    printf "%-35s %10d \033[32m[合格 OK]\033[0m\n" "$clean_path" "$lines"
  fi
done

echo "=========================================================="
if [ "$FAILED" -ne 0 ]; then
  echo "❌ 檢查失敗：存在超過 ${MAX_LINES} 行的 JavaScript 程式檔，請進行模組拆分！"
  exit 1
else
  echo "✅ 檢查通過：所有 JavaScript 核心程式檔皆符合長度標準（< ${MAX_LINES} 行）！"
  exit 0
fi
