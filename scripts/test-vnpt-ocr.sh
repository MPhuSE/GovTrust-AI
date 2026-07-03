#!/bin/bash
# Test VNPT SmartReader OCR APIs với giấy tờ mẫu

set -e

# Load env variables
source /home/dangkien/1st-Main/hackaithon/GovTrust-AI/.env

BASE_URL="https://api.idg.vnpt.vn/rpa-service/aidigdoc/v1/ocr"
TEST_DIR="/home/dangkien/1st-Main/hackaithon/GovTrust-AI/data/test-documents"

echo "=== Testing VNPT SmartReader OCR APIs ==="
echo ""

# Test 1: Sổ đỏ
echo "1. Testing Sổ đỏ (GIAY_CHUNG_NHAN_QSDD)..."
echo "   Endpoint: $BASE_URL/so-do"
curl -X POST "$BASE_URL/so-do" \
  -H "token_id: $VNPT_SMARTREADER_TOKEN_ID" \
  -H "token_key: $VNPT_SMARTREADER_TOKEN_KEY" \
  -H "Authorization: $VNPT_SMARTREADER_ACCESS_TOKEN" \
  -F "img=@$TEST_DIR/DK_THUONG_TRU/so-do.jpg" \
  2>/dev/null | jq '.'
echo ""
echo "---"
echo ""

# Test 2: Giấy khai sinh
echo "2. Testing Giấy khai sinh (GIAY_KHAI_SINH)..."
echo "   Endpoint: $BASE_URL/giay-khai-sinh"
curl -X POST "$BASE_URL/giay-khai-sinh" \
  -H "token_id: $VNPT_SMARTREADER_TOKEN_ID" \
  -H "token_key: $VNPT_SMARTREADER_TOKEN_KEY" \
  -H "Authorization: $VNPT_SMARTREADER_ACCESS_TOKEN" \
  -F "img=@$TEST_DIR/DK_THUONG_TRU/giay-khai-sinh.jpg" \
  2>/dev/null | jq '.'
echo ""
echo "---"
echo ""

# Test 3: Giấy chứng nhận đăng ký hộ kinh doanh
echo "3. Testing GCN ĐKHKD (HO_KINH_DOANH)..."
echo "   Endpoint: $BASE_URL/dang-ky-ho-kinh-doanh"
curl -X POST "$BASE_URL/dang-ky-ho-kinh-doanh" \
  -H "token_id: $VNPT_SMARTREADER_TOKEN_ID" \
  -H "token_key: $VNPT_SMARTREADER_TOKEN_KEY" \
  -H "Authorization: $VNPT_SMARTREADER_ACCESS_TOKEN" \
  -F "img=@$TEST_DIR/HKD_THAY_DOI/giay-dang-ky-ho-kinh-doanh_sample.jpg" \
  2>/dev/null | jq '.'
echo ""

echo "=== Test completed ==="
