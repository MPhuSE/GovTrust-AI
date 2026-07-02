#!/usr/bin/env bash
# E2E verify 2 tính năng privacy (docs/Gov_Trust.md):
#   1. GET /sessions/:id mask PII (ocrData + crossCheck) và ẩn fileUrl.
#   2. File upload bị xoá khỏi disk sau khi người dân confirm phiên.
# Chạy: bash scripts/e2e-pii-cleanup.sh
set -euo pipefail

API="http://localhost:4000"
MONGO="infra-mongo-1"
DB="govtrust_business"
UPLOAD_DIR="apps/core-svc/uploads"

jqget() { python3 -c "import sys,json;print(json.load(sys.stdin)$1)"; }

# 0. Auth
U="e2e_pii_$$"
curl -s -X POST "$API/auth/register" -H "Content-Type: application/json" \
  -d "{\"username\":\"$U\",\"password\":\"secret123\",\"fullName\":\"E2E PII\"}" >/dev/null || true
TOKEN=$(curl -sf -X POST "$API/auth/login" -H "Content-Type: application/json" \
  -d "{\"username\":\"$U\",\"password\":\"secret123\"}" | jqget "['access_token']")
echo "auth: JWT ok"

# 1. Tạo session + nạp ocrData thật (giống e2e-core-hkd.sh)
SID=$(curl -sf -X POST "$API/sessions" -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"procedureId":"HKD_THAY_DOI"}' | jqget "['_id']")
echo "session: $SID"

docker exec "$MONGO" mongosh "$DB" --quiet --eval '
  db.sessions.updateOne({_id: ObjectId("'"$SID"'")}, {$set: {"aiResult.ocrData": {
    "cccd_nguoi_yeu_cau": {"documentTypeCode":"CCCD","fields":{
      "soCCCD":{"value":"031089001234","confidence":0.99},
      "hoTen":{"value":"Nguyễn Văn An","confidence":0.98},
      "ngaySinh":{"value":"15/03/1990","confidence":0.97},
      "noiThuongTru":{"value":"12 Lê Lợi, Q.1, TP.HCM","confidence":0.95}}},
    "giay_hkd": {"documentTypeCode":"HO_KINH_DOANH","fields":{
      "hoTenChuHo":{"value":"Nguyễn Văn An","confidence":0.96},
      "maSoHoKinhDoanh":{"value":"41A8012345","confidence":0.97}}}
  }}})' >/dev/null
echo "ocrData: đã nạp"

# 2. Crosscheck để có leftValue/rightValue trong aiResult.crossCheck
curl -sf -X POST "$API/sessions/$SID/crosscheck" >/dev/null || true

# 3. GET session public → PII phải được mask
curl -sf "$API/sessions/$SID" | python3 -c '
import sys, json
s = json.load(sys.stdin)
ocr = s["aiResult"]["ocrData"]
so = ocr["cccd_nguoi_yeu_cau"]["fields"]["soCCCD"]["value"]
ten = ocr["cccd_nguoi_yeu_cau"]["fields"]["hoTen"]["value"]
diachi = ocr["cccd_nguoi_yeu_cau"]["fields"]["noiThuongTru"]["value"]
assert so == "03********34", f"soCCCD chưa mask: {so}"
assert ten == "Nguyễn V. A.", f"hoTen chưa mask: {ten}"
assert diachi == "***, TP.HCM", f"noiThuongTru chưa mask: {diachi}"
raw = json.dumps(s, ensure_ascii=False)
assert "031089001234" not in raw, "Số CCCD gốc còn lộ trong response"
assert "Nguyễn Văn An" not in raw, "Họ tên gốc còn lộ trong response"
assert all("fileUrl" not in d for d in s.get("documents", [])), "fileUrl còn lộ"
print("✓ GET /sessions/:id — PII đã mask, không lộ giá trị gốc, không lộ fileUrl")
'

# 4. Smartform generate (nội bộ) vẫn phải thấy dữ liệu ĐẦY ĐỦ
curl -sf -X POST "$API/sessions/$SID/score" >/dev/null
SF=$(curl -sf -X POST "$API/sessions/$SID/smartform")
echo "$SF" | python3 -c '
import sys, json
s = json.load(sys.stdin)
raw = json.dumps(s, ensure_ascii=False)
assert "Nguyễn Văn An" in raw, "Smartform bị mask nhầm — người dân không sửa được form"
print("✓ POST /sessions/:id/smartform — dữ liệu đầy đủ cho người dân tự kiểm tra/sửa")
'

# 5. File cleanup: tạo file giả trong uploads + gắn vào session, rồi confirm
mkdir -p "$UPLOAD_DIR"
FAKE="$UPLOAD_DIR/e2e-pii-test-$$"
echo "fake-scan" > "$FAKE"
ABS=$(cd "$(dirname "$FAKE")" && pwd)/$(basename "$FAKE")
docker exec "$MONGO" mongosh "$DB" --quiet --eval '
  db.sessions.updateOne({_id: ObjectId("'"$SID"'")}, {$set: {"documents": [
    {"checklistId":"giay_hkd","docTypeId":"HO_KINH_DOANH","fileUrl":"'"$ABS"'","originalName":"hkd.jpg","uploadTime":new Date()}
  ]}})' >/dev/null

curl -sf -X POST "$API/sessions/$SID/confirm" >/dev/null
sleep 1
if [ -f "$ABS" ]; then
  echo "✗ File vẫn còn sau confirm: $ABS"; exit 1
fi
echo "✓ Confirm — file upload đã bị xoá khỏi disk"

# 6. InsightLog phải ẩn danh (không còn sessionId thật)
docker exec "$MONGO" mongosh "$DB" --quiet --eval '
  const log = db.insight_logs.find().sort({createdAt:-1}).limit(1).toArray()[0];
  if (!log) { print("(không có insight log — score đủ cao, bỏ qua)"); }
  else if (log.sessionId) { print("✗ InsightLog còn sessionId thật"); quit(1); }
  else if (!/^[0-9a-f]{16}$/.test(log.anonymizedSessionId||"")) { print("✗ anonymizedSessionId sai định dạng"); quit(1); }
  else { print("✓ InsightLog — chỉ còn anonymizedSessionId (hash)"); }'

echo ""
echo "== E2E PII + cleanup: PASS =="
