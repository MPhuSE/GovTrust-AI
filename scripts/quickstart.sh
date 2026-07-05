#!/usr/bin/env bash
# ============================================================
# GovTrust AI — QUICKSTART: cài đặt & chạy toàn bộ hệ thống bằng 1 lệnh.
#
#   bash scripts/quickstart.sh
#
# Việc script tự làm (idempotent — chạy lại nhiều lần vẫn an toàn):
#   1. Tạo .env từ .env.example nếu chưa có.
#   2. Tự sinh JWT RSA keypair (RS256) + PII_ENCRYPTION_KEY vào .env
#      (thay các chỗ AUTO_GENERATE) — đây là lý do chính khiến bản clone
#      trước đây không đăng nhập được.
#   3. Dựng toàn bộ stack qua Docker Compose (web, gateway, core, ai,
#      mongo, redis, qdrant).
#
# ⚠️ OCR chạy API THẬT (không mock). Nếu tạo .env mới, PHẢI điền API key
#    (VNPT_*, QWEN_OCR_API_KEY, QDRANT_API_KEY) trước khi OCR hoạt động —
#    script sẽ nhắc và dừng để bạn điền.
#
# Yêu cầu DUY NHẤT trên máy: Docker + Docker Compose + openssl.
# ============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

green() { printf '\033[0;32m%s\033[0m\n' "$1"; }
yellow() { printf '\033[0;33m%s\033[0m\n' "$1"; }
red() { printf '\033[0;31m%s\033[0m\n' "$1"; }

# ── 0. Kiểm tra Docker ──────────────────────────────────────
if ! command -v docker >/dev/null 2>&1; then
  red "✗ Chưa cài Docker. Cài Docker Desktop / Docker Engine rồi chạy lại."
  exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
  red "✗ Thiếu 'docker compose' (v2). Cập nhật Docker rồi chạy lại."
  exit 1
fi
if ! command -v openssl >/dev/null 2>&1; then
  red "✗ Thiếu openssl (dùng để sinh JWT key). Cài openssl rồi chạy lại."
  exit 1
fi

# ── 1. Tạo .env ─────────────────────────────────────────────
FRESH_ENV=0
if [ ! -f .env ]; then
  cp .env.example .env
  FRESH_ENV=1
  green "✓ Đã tạo .env từ .env.example"
else
  green "✓ .env đã tồn tại — giữ nguyên"
fi

# ── 2. Tự sinh secret (chỉ thay các chỗ còn AUTO_GENERATE) ──
gen_pii_key() { openssl rand -base64 32; }

# Thay PII key nếu còn AUTO_GENERATE
if grep -q '^PII_ENCRYPTION_KEY=AUTO_GENERATE' .env; then
  PII_KEY="$(gen_pii_key)"
  # dùng | làm delimiter vì base64 có thể chứa /
  sed -i "s|^PII_ENCRYPTION_KEY=AUTO_GENERATE|PII_ENCRYPTION_KEY=${PII_KEY}|" .env
  green "✓ Đã sinh PII_ENCRYPTION_KEY"
fi

# Thay JWT RSA keypair nếu còn AUTO_GENERATE
if grep -q 'JWT_ACCESS_PRIVATE_KEY="AUTO_GENERATE"' .env; then
  TMPDIR_KEY="$(mktemp -d)"
  openssl genrsa -out "$TMPDIR_KEY/jwt.key" 2048 2>/dev/null
  openssl rsa -in "$TMPDIR_KEY/jwt.key" -pubout -out "$TMPDIR_KEY/jwt.pub" 2>/dev/null

  # Xoá 2 dòng AUTO_GENERATE rồi ghi lại key thật (đa dòng, trong ngoặc kép).
  # Dùng Python cho chắc chắn (sed đa dòng dễ lỗi với ký tự đặc biệt).
  PRIV="$TMPDIR_KEY/jwt.key" PUB="$TMPDIR_KEY/jwt.pub" python3 - <<'PY'
import os, re
priv = open(os.environ['PRIV']).read().strip()
pub  = open(os.environ['PUB']).read().strip()
env = open('.env').read()
env = env.replace('JWT_ACCESS_PRIVATE_KEY="AUTO_GENERATE"', f'JWT_ACCESS_PRIVATE_KEY="{priv}"')
env = env.replace('JWT_ACCESS_PUBLIC_KEY="AUTO_GENERATE"',  f'JWT_ACCESS_PUBLIC_KEY="{pub}"')
open('.env','w').write(env)
PY
  rm -rf "$TMPDIR_KEY"
  green "✓ Đã sinh JWT RSA keypair (RS256)"
fi

# ── 2b. Nếu .env vừa tạo mới → nhắc điền API key thật (OCR không mock) ──
if [ "$FRESH_ENV" = "1" ]; then
  MISSING=()
  grep -q '^QWEN_OCR_API_KEY=.\+' .env || MISSING+=("QWEN_OCR_API_KEY")
  grep -q '^VNPT_EKYC_ACCESS_TOKEN=.\+' .env || MISSING+=("VNPT_EKYC_ACCESS_TOKEN (và các VNPT_* token)")
  grep -q '^QDRANT_API_KEY=.\+' .env || MISSING+=("QDRANT_API_KEY")
  if [ "${#MISSING[@]}" -gt 0 ]; then
    yellow ""
    yellow "⚠️  .env vừa được tạo nhưng còn THIẾU API key thật (OCR/LawGuard cần):"
    for k in "${MISSING[@]}"; do yellow "      - $k"; done
    yellow ""
    yellow "   Điền các key trên vào .env rồi chạy lại: bash scripts/quickstart.sh"
    yellow "   (Auth/đăng nhập vẫn hoạt động; chỉ OCR & tra cứu pháp luật cần key.)"
    yellow ""
    read -r -p "   Vẫn tiếp tục dựng stack? [y/N] " ans
    [ "${ans:-N}" = "y" ] || [ "${ans:-N}" = "Y" ] || { red "Đã dừng. Điền key rồi chạy lại."; exit 1; }
  fi
fi

# ── 3. Dựng toàn bộ stack qua Docker Compose ────────────────
green ""
green "→ Đang dựng toàn bộ hệ thống (lần đầu build ~5-10 phút, tải model embedding ~500MB)…"
green ""
docker compose -f infra/docker-compose.yml up --build -d

# ── 4. Chờ web sẵn sàng ─────────────────────────────────────
green ""
green "→ Chờ web (http://localhost:3000) khởi động…"
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
   docker compose -f infra/docker-compose.yml down         # dừng
   node scripts/seed-officer.js                            # tạo tài khoản cán bộ (canbo_test / CanBo@1234)

 OCR chạy API THẬT (VNPT + Qwen). Đảm bảo .env đã có đủ token.
============================================================
BANNER
