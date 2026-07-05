#!/bin/bash

# init-letsencrypt.sh — Tự động xin chứng chỉ Let's Encrypt cho govtrust.site
#
# Chạy script này TRƯỚC KHI up docker-compose.prod.yml lần đầu.
# Script sẽ:
#   1. Tạo dummy certificate tạm để nginx khởi động được
#   2. Start nginx
#   3. Xóa dummy cert
#   4. Xin cert thật từ Let's Encrypt qua certbot
#   5. Reload nginx để dùng cert thật
#
# Yêu cầu: DNS đã trỏ govtrust.site → IP server này.

set -e

domains=(govtrust.site www.govtrust.site)
rsa_key_size=4096
data_path="./certbot"
email="admin@govtrust.site"  # Thay bằng email thật để nhận thông báo từ Let's Encrypt
staging=0  # Set = 1 để test với Let's Encrypt staging (tránh rate limit)

if [ -d "$data_path" ]; then
  read -p "Thư mục $data_path đã tồn tại. Xóa và tạo lại? (y/N) " decision
  if [ "$decision" != "y" ] && [ "$decision" != "Y" ]; then
    exit
  fi
fi

# Tạo cấu trúc thư mục certbot
echo "### Tạo thư mục certbot..."
mkdir -p "$data_path/conf/live/$domains"
mkdir -p "$data_path/www"

# Download recommended TLS parameters từ certbot
echo "### Download TLS parameters..."
curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$data_path/conf/options-ssl-nginx.conf"
curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$data_path/conf/ssl-dhparams.pem"

# Tạo dummy certificate để nginx start được
echo "### Tạo dummy certificate cho $domains..."
path="/etc/letsencrypt/live/$domains"
docker compose -f docker-compose.prod.yml run --rm --entrypoint "\
  openssl req -x509 -nodes -newkey rsa:$rsa_key_size -days 1\
    -keyout '$path/privkey.pem' \
    -out '$path/fullchain.pem' \
    -subj '/CN=localhost'" certbot
echo

# Start nginx với dummy cert
echo "### Starting nginx..."
docker compose -f docker-compose.prod.yml up --force-recreate -d nginx
echo

# Xóa dummy cert
echo "### Xóa dummy certificate..."
docker compose -f docker-compose.prod.yml run --rm --entrypoint "\
  rm -Rf /etc/letsencrypt/live/$domains && \
  rm -Rf /etc/letsencrypt/archive/$domains && \
  rm -Rf /etc/letsencrypt/renewal/$domains.conf" certbot
echo

# Xin cert thật từ Let's Encrypt
echo "### Xin chứng chỉ Let's Encrypt cho $domains..."
domain_args=""
for domain in "${domains[@]}"; do
  domain_args="$domain_args -d $domain"
done

# Chọn staging hoặc production
case "$staging" in
  1) staging_arg="--staging" ;;
  *) staging_arg="" ;;
esac

docker compose -f docker-compose.prod.yml run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $staging_arg \
    $domain_args \
    --email $email \
    --rsa-key-size $rsa_key_size \
    --agree-tos \
    --force-renewal" certbot
echo

# Reload nginx để dùng cert thật
echo "### Reload nginx..."
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload

echo "### Done! HTTPS đã sẵn sàng tại https://govtrust.site"
