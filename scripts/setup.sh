#!/bin/bash
set -e

echo "=== GovTrust AI — Setup (NestJS core/gateway + FastAPI ai-svc) ==="

# 1. .env
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✓ Tạo .env từ .env.example — điền VNPT API keys nếu có"
else
  echo "✓ .env đã tồn tại"
fi

# 2. Cài dependencies JS workspace (web, api-gateway, core-svc, package wrappers)
echo "→ pnpm install (toàn workspace)..."
pnpm install

# 3. Tạo Python environment cho FastAPI ai-svc
echo "→ Cài Python dependencies cho ai-svc..."
python3 -m venv apps/ai-svc/.venv
apps/ai-svc/.venv/bin/pip install --upgrade pip
apps/ai-svc/.venv/bin/pip install -r apps/ai-svc/requirements-dev.txt

# 4. Generate Python gRPC stubs từ shared proto
echo "→ Generate Python gRPC stubs..."
(cd apps/ai-svc && .venv/bin/python -c "from app.proto.compiler import load_stubs; load_stubs()")

# 5. Build rule-engine (core-svc phụ thuộc)
echo "→ Build packages/rule-engine..."
pnpm --filter @govtrust/rule-engine build || (cd packages/rule-engine && npm install && npm run build)

echo ""
echo "=== Setup xong ==="
echo "Chạy demo:"
echo "  docker compose -f infra/docker-compose.yml up --build   (khuyến nghị)"
echo "  hoặc dev: pnpm dev"
