#!/usr/bin/env bash
# E2E qua core-svc thật (HTTP :4000): session → ocrData → crosscheck → score → smartform → docx.
# OCR async (BullMQ đọc file trong container) khó chờ từ host, nên nạp thẳng ocrData
# (chính là field OCR thật đã verify bằng scripts/e2e-ocr-samples.py) vào Mongo.
# Chạy: bash scripts/e2e-core-hkd.sh
set -euo pipefail

API="http://localhost:4000"
MONGO="infra-mongo-1"
DB="govtrust_business"

jqget() { python3 -c "import sys,json;print(json.load(sys.stdin)$1)"; }

# 0. Auth: register (bỏ qua nếu đã có) + login lấy JWT
U="e2e_hkd_$$"
curl -s -X POST "$API/auth/register" -H "Content-Type: application/json" \
  -d "{\"username\":\"$U\",\"password\":\"secret123\",\"fullName\":\"E2E HKD\"}" >/dev/null || true
TOKEN=$(curl -sf -X POST "$API/auth/login" -H "Content-Type: application/json" \
  -d "{\"username\":\"$U\",\"password\":\"secret123\"}" | jqget "['access_token']")
if [ -z "${TOKEN:-}" ] || [ "$TOKEN" = "None" ]; then
  echo "✗ Không lấy được JWT (login thất bại)"; exit 1
fi
echo "auth: JWT ok (user=$U)"

run_scenario() {
  local NAME="$1" CCCD_NAME="$2" CHUHO_NAME="$3"
  echo ""
  echo "======================================================"
  echo "  KỊCH BẢN: $NAME  (CCCD='$CCCD_NAME' vs chủ hộ='$CHUHO_NAME')"
  echo "======================================================"

  # 1. Tạo session HKD_THAY_DOI
  SID=$(curl -sf -X POST "$API/sessions" -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"procedureId":"HKD_THAY_DOI"}' | jqget "['_id']")
  echo "  session: $SID"

  # 2. Nạp ocrData thật (CCCD chủ hộ + Giấy chứng nhận ĐKHKD) vào Mongo
  docker exec "$MONGO" mongosh "$DB" --quiet --eval '
    db.sessions.updateOne({_id: ObjectId("'"$SID"'")}, {$set: {"aiResult.ocrData": {
      "cccd_nguoi_yeu_cau": { documentTypeCode: "CCCD", fields: {
        hoTen: { value: "'"$CCCD_NAME"'", confidence: 0.98 },
        soCCCD: { value: "091652320011", confidence: 0.99 }
      }},
      "giay_hkd": { documentTypeCode: "HO_KINH_DOANH", fields: {
        tenHoKinhDoanh: { value: "LÊ THÁI HƯNG", confidence: 0.95 },
        maSoHoKinhDoanh: { value: "12.A8.018999", confidence: 0.95 },
        diaChiKinhDoanh: { value: "Sn 043, Vương Thừa Vũ, tổ 2, phường Bình Minh, Tp Lào Cai", confidence: 0.95 },
        hoTenChuHo: { value: "'"$CHUHO_NAME"'", confidence: 0.95 },
        nganhNghe: { value: "Mua bán, sửa chữa điện thoại", confidence: 0.95 }
      }}
    }}})' >/dev/null
  echo "  ocrData: đã nạp 2 giấy (CCCD + HKD)"

  # 3. Cross-check
  CC=$(curl -sf -X POST "$API/sessions/$SID/crosscheck")
  echo "  crosscheck.checks:"
  echo "$CC" | python3 -c "import sys,json
d=json.load(sys.stdin)
for c in d['checks']: print(f\"    - {c['ruleName']}: {c['status']} / {c['severity']}\")
print(f\"    summary: {d['summary']}\")"

  # 4. Score
  SC=$(curl -sf -X POST "$API/sessions/$SID/score")
  echo "  score: $(echo "$SC" | jqget "['score']") | grade $(echo "$SC" | jqget "['grade']") | canSubmit $(echo "$SC" | jqget "['canSubmit']")"

  # 5. SmartForm (chỉ chạy nếu canSubmit)
  if [ "$(echo "$SC" | jqget "['canSubmit']")" = "True" ]; then
    SF=$(curl -sf -X POST "$API/sessions/$SID/smartform")
    echo "  smartform: điền $(echo "$SF" | jqget "['filledCount']")/$(echo "$SF" | jqget "['totalCount']") field"
    curl -sf "$API/sessions/$SID/smartform/docx" -o "/tmp/hkd_${NAME}.docx"
    echo "  docx: /tmp/hkd_${NAME}.docx ($(stat -c%s /tmp/hkd_${NAME}.docx 2>/dev/null || echo 0) bytes)"
  else
    echo "  smartform: BỎ QUA (canSubmit=false)"
  fi
}

run_scenario "MATCH" "Lê Thái Hưng" "LÊ THÁI HƯNG"
run_scenario "MISMATCH" "Nguyễn Văn An" "Lê Thái Hưng"

echo ""
echo "=== E2E core-svc hoàn tất ==="
