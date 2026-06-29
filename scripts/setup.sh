#!/bin/bash
set -e

echo "=== GovTrust AI — Setup Script ==="

# 1. Copy .env
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✓ .env created from .env.example — điền VNPT API keys vào .env"
else
  echo "✓ .env already exists"
fi

# 2. Install Node.js dependencies
echo "→ Installing Node.js dependencies..."
pnpm install

# 3. Python venv for AI Gateway
echo "→ Setting up Python virtual environment..."
cd apps/ai-gateway
if [ ! -d venv ]; then
  python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt --quiet
deactivate
cd ../..

echo "=== Setup complete ==="
echo ""
echo "Next steps:"
echo "  1. Điền VNPT API keys vào .env"
echo "  2. Chạy: pnpm dev  (dev mode)"
echo "     hoặc: docker compose -f infra/docker-compose.yml up --build  (Docker)"
