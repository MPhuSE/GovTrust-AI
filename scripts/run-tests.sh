#!/bin/bash
set -e

echo "=== GovTrust AI — Test Suite ==="

# 1. Rule Engine unit tests (TypeScript)
echo ""
echo "→ [1/3] Rule Engine unit tests..."
cd packages/rule-engine
pnpm test
cd ../..

# 2. NestJS integration tests
echo ""
echo "→ [2/3] NestJS API tests..."
cd apps/api
pnpm test
cd ../..

# 3. FastAPI tests
echo ""
echo "→ [3/3] FastAPI AI Gateway tests..."
cd apps/ai-gateway
source venv/bin/activate 2>/dev/null || true
python -m pytest tests/ -v
deactivate 2>/dev/null || true
cd ../..

echo ""
echo "=== All tests passed ✓ ==="
