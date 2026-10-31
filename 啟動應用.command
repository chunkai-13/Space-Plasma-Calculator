#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

# 尋找可用埠口啟動本機伺服器並自動打開瀏覽器
PORT=8080
while lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; do
    PORT=$((PORT+1))
done

echo "正在啟動太空電漿物理計算機..."
echo "存取網址：http://localhost:$PORT"

# 開啟預設瀏覽器
open "http://localhost:$PORT"

# 啟動輕量 Python HTTP 伺服器
python3 -m http.server $PORT
