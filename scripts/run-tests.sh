#!/bin/bash
set -e

echo "=== GovTrust AI — Test Suite ==="

# 1. Rule Engine unit tests (TypeScript thuần)
echo ""
echo "→ [1/3] Rule Engine unit tests..."
cd packages/rule-engine
pnpm test
cd ../..

# 2. Type-check các service TypeScript
echo ""
echo "→ [2/3] Type-check core-svc / api-gateway..."
for svc in core-svc api-gateway; do
  echo "   • $svc"
  (cd "apps/$svc" && npx tsc --noEmit)
done

# 3. FastAPI tests + Python syntax check
echo ""
echo "→ [3/3] FastAPI ai-svc tests..."
(cd apps/ai-svc && .venv/bin/python -m compileall -q app && .venv/bin/python -m pytest tests -q)

echo ""
echo "=== All checks passed ✓ ==="
