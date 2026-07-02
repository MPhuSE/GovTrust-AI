#!/usr/bin/env bash
# Chạy toàn bộ GovTrust-AI stack cho dev bằng 1 lệnh:
#   Redis (Docker, local) + turbo dev  →  web · api-gateway · core-svc · ai-svc
# Mongo = Atlas (remote) và Qdrant = server SG (remote) nên KHÔNG cần chạy local.
# Ctrl+C để dừng tất cả (Redis do script bật sẽ tự tắt).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

REDIS_NAME="govtrust-redis"
STARTED_REDIS=0

cleanup() {
  if [ "$STARTED_REDIS" = "1" ]; then
    echo -e "\n→ Dừng Redis ($REDIS_NAME)…"
    docker rm -f "$REDIS_NAME" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

redis_up() { (exec 3<>/dev/tcp/127.0.0.1/6379) 2>/dev/null; }

# 1) Redis cho BullMQ (queue AI_TASKS)
if redis_up; then
  echo "✓ Redis đã chạy sẵn trên :6379"
else
  echo "→ Khởi động Redis (Docker) trên :6379…"
  docker rm -f "$REDIS_NAME" >/dev/null 2>&1 || true
  docker run -d --name "$REDIS_NAME" -p 6379:6379 redis:7-alpine \
    redis-server --appendonly yes --maxmemory-policy noeviction >/dev/null
  STARTED_REDIS=1
  for _ in $(seq 1 20); do redis_up && break; sleep 0.5; done
  redis_up && echo "✓ Redis sẵn sàng" || { echo "✗ Redis không lên được"; exit 1; }
fi

# 2) Kiểm tra venv ai-svc (embedding local + FastAPI)
if [ ! -x apps/ai-svc/.venv/bin/uvicorn ]; then
  echo "✗ Thiếu venv ai-svc. Tạo trước:"
  echo "    cd apps/ai-svc && python3 -m venv .venv \\"
  echo "      && .venv/bin/pip install -r requirements.txt -r requirements-local.txt"
  exit 1
fi

cat <<'BANNER'

===============================================
 GovTrust-AI fullstack  (Ctrl+C để dừng tất cả)
   web         → http://localhost:3000
   api-gateway → http://localhost:8080
   core-svc    → http://localhost:4000
   ai-svc      → http://localhost:8000  (gRPC :50051)
   Mongo = Atlas · Qdrant = 45.130.164.249  (remote)
===============================================

BANNER

# 3) Chạy web + api-gateway + core-svc + ai-svc song song qua turbo.
#    Ép --ui=stream (log cuộn, hợp khi chạy trong script) đứng TRƯỚC task
#    để turbo nhận flag thay vì chuyển xuống next/nest.
pnpm exec turbo run dev --ui=stream
