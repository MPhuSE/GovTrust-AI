#!/bin/bash
set -e

echo "=== GovTrust AI — Demo Script (3 lần) ==="

API="http://localhost:4000"
PASS=0
FAIL=0

run_demo() {
  local RUN=$1
  echo ""
  echo "--- Demo Run $RUN/3 ---"

  # Tạo session
  SESSION=$(curl -sf -X POST "$API/sessions" \
    -H "Content-Type: application/json" \
    -d '{"procedureId":"DK_KHAI_SINH"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['_id'])")

  if [ -z "$SESSION" ]; then
    echo "✗ Run $RUN: Không tạo được session"
    FAIL=$((FAIL + 1))
    return
  fi
  echo "  Session: $SESSION"

  # Lấy trạng thái
  STATUS=$(curl -sf "$API/sessions/$SESSION" | python3 -c "import sys,json; print(json.load(sys.stdin)['status'])")
  echo "  Status: $STATUS"

  if [ "$STATUS" = "INIT" ]; then
    echo "✓ Run $RUN: OK"
    PASS=$((PASS + 1))
  else
    echo "✗ Run $RUN: Status không đúng ($STATUS)"
    FAIL=$((FAIL + 1))
  fi
}

run_demo 1
run_demo 2
run_demo 3

echo ""
echo "=== Kết quả: $PASS/3 pass, $FAIL/3 fail ==="

if [ $FAIL -gt 0 ]; then
  exit 1
fi
