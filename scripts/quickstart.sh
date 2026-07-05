#!/usr/bin/env bash
# ============================================================
# GovTrust AI — QUICKSTART (macOS / Linux / WSL)
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

green() { printf '\033[0;32m%s\033[0m\n' "$1"; }
red() { printf '\033[0;31m%s\033[0m\n' "$1"; }

if ! command -v docker >/dev/null 2>&1; then
  red "✗ Chưa cài Docker. Cài Docker Desktop / Docker Engine rồi chạy lại."
  exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
  red "✗ Thiếu 'docker compose' (v2). Cập nhật Docker rồi chạy lại."
  exit 1
fi

echo "→ Đang cấu hình môi trường (Sinh Key qua Docker Node)..."
# Chạy script setup đa nền tảng bằng container Node.js gọn nhẹ
docker run --rm -v "$(pwd):/app" -w /app node:20-alpine node scripts/setup.js

green "→ Đang dựng toàn bộ hệ thống (lần đầu tải model ~500MB sẽ tốn 5-10 phút)…"
docker compose -f infra/docker-compose.yml up --build -d

green ""
green "→ Chờ API Gateway (http://localhost:8080/health) khởi động…"
for _ in $(seq 1 60); do
  if curl -fsS -m 3 http://localhost:8080/health >/dev/null 2>&1; then
    green "✓ API Gateway đã sẵn sàng."
    break
  fi
  sleep 3
done

cat <<'BANNER'

============================================================
 ✅ GovTrust AI đã chạy!

   Người dân   → http://localhost:3000
   API Gateway → http://localhost:8080/health
   Swagger API → http://localhost:4000/api/docs

 Lệnh hữu ích:
   docker compose -f infra/docker-compose.yml logs -f      # xem log
   docker compose -f infra/docker-compose.yml down         # dừng hệ thống

 OCR & RAG chạy API THẬT. Đảm bảo file .env đã có đủ token.
============================================================
BANNER
