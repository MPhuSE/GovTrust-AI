#!/bin/bash

# deploy.sh — Script rsync code lên EC2 và khởi động production stack
#
# Chạy: ./deploy.sh
# Yêu cầu: SSH key ở ./govtrust.pem, DNS đã trỏ govtrust.site → server IP

set -e

SERVER="ubuntu@ec2-54-254-227-86.ap-southeast-1.compute.amazonaws.com"
KEY="./govtrust.pem"
REMOTE_DIR="/home/ubuntu/govtrust-ai"

echo "=== 1. Rsync code lên server (exclude large files) ==="
rsync -avz --progress \
  --exclude='.git/objects' \
  --exclude='node_modules' \
  --exclude='.venv' \
  --exclude='__pycache__' \
  --exclude='*.pyc' \
  --exclude='.next' \
  --exclude='dist' \
  --exclude='build' \
  --exclude='.turbo' \
  --exclude='tsconfig.tsbuildinfo' \
  -e "ssh -i $KEY" \
  ../ $SERVER:$REMOTE_DIR

echo ""
echo "=== 2. Kiểm tra DNS đã trỏ chưa ==="
RESOLVED_IP=$(dig +short govtrust.site @8.8.8.8 | tail -n1)
if [ "$RESOLVED_IP" != "54.254.227.86" ]; then
  echo "⚠️  WARNING: govtrust.site chưa trỏ về 54.254.227.86 (hiện tại: $RESOLVED_IP)"
  echo "    Hãy thêm A record trong Cloudflare DNS (DNS-only mode) trước khi chạy init-letsencrypt.sh"
  read -p "Tiếp tục deploy? (y/N) " decision
  if [ "$decision" != "y" ] && [ "$decision" != "Y" ]; then
    exit 1
  fi
fi

echo ""
echo "=== 3. Copy .env sang server ==="
ssh -i $KEY $SERVER "mkdir -p $REMOTE_DIR"
scp -i $KEY ../.env $SERVER:$REMOTE_DIR/.env

echo ""
echo "=== 4. Chạy init-letsencrypt.sh để xin cert (chỉ lần đầu) ==="
ssh -i $KEY $SERVER << 'EOF'
cd ~/govtrust-ai/infra
if [ ! -d "./certbot/conf/live/govtrust.site" ]; then
  echo "Chạy init-letsencrypt.sh để xin chứng chỉ Let's Encrypt..."
  chmod +x init-letsencrypt.sh
  ./init-letsencrypt.sh
else
  echo "Chứng chỉ Let's Encrypt đã tồn tại, bỏ qua init-letsencrypt.sh"
fi
EOF

echo ""
echo "=== 5. Build và start các service ==="
ssh -i $KEY $SERVER << 'EOF'
cd ~/govtrust-ai/infra
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
EOF

echo ""
echo "=== 6. Kiểm tra status ==="
ssh -i $KEY $SERVER << 'EOF'
cd ~/govtrust-ai/infra
docker compose -f docker-compose.prod.yml ps
EOF

echo ""
echo "✅ Deploy hoàn tất!"
echo "   HTTPS: https://govtrust.site"
echo "   API Gateway: https://govtrust.site/gw/health"
echo ""
echo "Xem logs:"
echo "  ssh -i $KEY $SERVER 'cd ~/govtrust-ai/infra && docker compose -f docker-compose.prod.yml logs -f'"
