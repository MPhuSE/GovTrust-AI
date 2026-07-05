# 📋 Test Cases - Hướng dẫn tạo ảnh giấy tờ thật để test

## 🎯 Mục đích
Tài liệu này cung cấp thông tin chi tiết về các test cases để bạn có thể:
1. Tạo ảnh giấy tờ giả (dùng Photoshop/Canva)
2. Hoặc sử dụng giấy tờ thật của mình
3. Test toàn bộ flow từ OCR → Cross-check → Form rendering

---

## 📦 Test Case 1: Happy Path - Tất cả khớp hoàn toàn

### Mục tiêu
Verify rằng hệ thống hoạt động đúng khi tất cả thông tin khớp hoàn hảo.

### Giấy tờ cần chuẩn bị

#### 1. CCCD Mẹ (cccd_nguoi_yeu_cau)
```
Họ và tên:           Nguyễn Thị Lan
Ngày sinh:           15/03/1995
Giới tính:           Nữ
Số CCCD:             001095012345
Quê quán:            Xã Tân Lập, Huyện Đan Phượng, Hà Nội
Địa chỉ thường trú:  Số 10, Ngõ 5, Đường Láng, 
                     Phường Láng Thượng, Quận Đống Đa, Hà Nội
Ngày cấp:            10/05/2020
Nơi cấp:             Cục Cảnh sát ĐKQL cư trú và DLQG về dân cư
```

**Chụp ảnh:**
- Mặt trước CCCD, rõ nét
- Ánh sáng đều, không bị lóa
- Không bị mờ hoặc nhòe chữ
- Format: JPG hoặc PNG, độ phân giải tối thiểu 1200x800px

---

#### 2. CCCD Cha (cccd_cha)
```
Họ và tên:           Trần Văn Minh
Ngày sinh:           20/08/1993
Giới tính:           Nam
Số CCCD:             001093098765
Quê quán:            Thôn Đông, Xã Hòa Bình, Huyện Chương Mỹ, Hà Nội
Địa chỉ thường trú:  Số 10, Ngõ 5, Đường Láng,
                     Phường Láng Thượng, Quận Đống Đa, Hà Nội
Ngày cấp:            15/06/2019
Nơi cấp:             Cục Cảnh sát ĐKQL cư trú và DLQG về dân cư
```

**Chụp ảnh:** Tương tự CCCD mẹ

---

#### 3. Giấy chứng sinh (giay_chung_sinh)
```
=== THÔNG TIN TRẺ EM ===
Tên dự định:         Trần Minh An
Giới tính:           Nam
Ngày tháng năm sinh: 05/01/2026
Giờ sinh:            08:30
Nơi sinh:            Bệnh viện Phụ sản Hà Nội
Cân nặng:            3.2 kg

=== THÔNG TIN MẸ ===
Họ và tên mẹ:        Nguyễn Thị Lan
Ngày sinh:           15/03/1995
Dân tộc:             Kinh
Quốc tịch:           Việt Nam
Loại giấy tờ:        CCCD
Số giấy tờ:          001095012345

=== THÔNG TIN CHA ===
Họ và tên cha:       Trần Văn Minh
Ngày sinh:           20/08/1993
Dân tộc:             Kinh
Quốc tịch:           Việt Nam
Loại giấy tờ:        CCCD
Số giấy tờ:          001093098765

=== NGƯỜI KHAI ===
Người khai:          Nguyễn Thị Lan
Quan hệ với trẻ:     Mẹ
```

**Tạo ảnh:**
- Dùng template: `/template/1._To_khai_dang_ky_khai_sinh_1605163058.doc`
- Điền thông tin trên vào template
- Export sang PDF rồi chụp/scan thành ảnh

---

#### 4. Giấy chứng nhận kết hôn (giay_chung_nhan_ket_hon) - OPTIONAL
```
Họ tên chồng:        Trần Văn Minh
Ngày sinh chồng:     20/08/1993

Họ tên vợ:           Nguyễn Thị Lan
Ngày sinh vợ:        15/03/1995

Ngày đăng ký:        10/05/2024
Cơ quan đăng ký:     UBND Phường Láng Thượng, Quận Đống Đa, Hà Nội
Số giấy chứng nhận:  KH-2024-001234
```

---

### Expected Result
```
✅ Cross-check 1: Họ tên mẹ MATCH (HIGH)
✅ Cross-check 2: Họ tên cha MATCH (MEDIUM)
✅ Cross-check 3: Họ tên vợ/chồng MATCH (LOW)

Kết luận: DAY_DU (Đầy đủ, không cần bổ sung)
```

---

## 📦 Test Case 2: Mother Name Mismatch - Họ tên mẹ không khớp

### Mục tiêu
Test HIGH severity mismatch khi họ tên mẹ trên CCCD khác với Giấy chứng sinh.

### Thay đổi so với Test Case 1

**CCCD Mẹ:**
```diff
- Họ và tên:  Nguyễn Thị Lan
+ Họ và tên:  Nguyễn Thị Lan Anh
```

**Giữ nguyên:** CCCD cha, Giấy chứng sinh, GCN kết hôn

### Expected Result
```
❌ Cross-check 1: Họ tên mẹ MISMATCH (HIGH)
   Left:  Nguyễn Thị Lan Anh
   Right: Nguyễn Thị Lan
   
✅ Cross-check 2: Họ tên cha MATCH (MEDIUM)

❌ Cross-check 3: Họ tên vợ/chồng MISMATCH (LOW)
   (Cascade effect từ CCCD mẹ)

Kết luận: CAN_KIEM_TRA_KY (Cần kiểm tra kỹ - 2+ HIGH mismatches)
```

---

## 📦 Test Case 3: Father Name Mismatch - Họ tên cha không khớp

### Mục tiêu
Test MEDIUM severity mismatch khi họ tên cha không khớp.

### Thay đổi so với Test Case 1

**CCCD Cha:**
```diff
- Họ và tên:  Trần Văn Minh
+ Họ và tên:  Trần Minh Văn
```

**Giữ nguyên:** CCCD mẹ, Giấy chứng sinh

**Không có:** GCN kết hôn

### Expected Result
```
✅ Cross-check 1: Họ tên mẹ MATCH (HIGH)

❌ Cross-check 2: Họ tên cha MISMATCH (MEDIUM)
   Left:  Trần Minh Văn
   Right: Trần Văn Minh

⏭️ Cross-check 3: SKIPPED (thiếu GCN kết hôn)

Kết luận: CAN_BO_SUNG (Cần bổ sung - 1 MEDIUM mismatch)
```

---

## 📦 Test Case 4: Normalized Pass - Khác dấu/hoa thường

### Mục tiêu
Test normalized matching - hệ thống bỏ qua dấu thanh và chữ hoa/thường.

### Thay đổi so với Test Case 1

**CCCD Mẹ:**
```diff
- Họ và tên:  Nguyễn Thị Lan
+ Họ và tên:  NGUYEN THI LAN  (toàn bộ chữ HOA, không dấu)
```

**CCCD Cha:**
```diff
- Họ và tên:  Trần Văn Minh
+ Họ và tên:  Trần Văn Mịnh  (dấu "ị" thay vì "i")
```

### Expected Result
```
✅ Cross-check 1: Họ tên mẹ MATCH (HIGH)
   Normalized: "nguyen thi lan" == "nguyen thi lan"
   
✅ Cross-check 2: Họ tên cha MATCH (MEDIUM)
   Normalized: "tran van minh" == "tran van minh"

Kết luận: DAY_DU (Normalization hoạt động đúng)
```

---

## 📦 Test Case 5: Single Mother - Mẹ đơn thân

### Mục tiêu
Test trường hợp không có CCCD cha (skipIfMissing).

### Giấy tờ cần chuẩn bị

1. **CCCD Mẹ** (như Test Case 1)
2. **Giấy chứng sinh** với thông tin cha để trống:

```diff
=== THÔNG TIN CHA ===
- Họ và tên cha:       Trần Văn Minh
+ Họ và tên cha:       (để trống)
- Ngày sinh:           20/08/1993
+ Ngày sinh:           (để trống)
- Số giấy tờ:          001093098765
+ Số giấy tờ:          (để trống)
```

3. **Không có:** CCCD cha, GCN kết hôn

### Expected Result
```
✅ Cross-check 1: Họ tên mẹ MATCH (HIGH)

⏭️ Cross-check 2: SKIPPED (thiếu CCCD cha)

⏭️ Cross-check 3: SKIPPED (thiếu GCN kết hôn)

Kết luận: DAY_DU (Trường hợp hợp lệ - mẹ đơn thân)
```

---

## 📦 Test Case 6: No Marriage Certificate - Không có GCN kết hôn

### Mục tiêu
Test skipIfMissing cho GCN kết hôn.

### Giấy tờ cần chuẩn bị

1. CCCD Mẹ (như Test Case 1)
2. CCCD Cha (như Test Case 1)
3. Giấy chứng sinh (như Test Case 1)
4. **Không có:** GCN kết hôn

### Expected Result
```
✅ Cross-check 1: Họ tên mẹ MATCH (HIGH)
✅ Cross-check 2: Họ tên cha MATCH (MEDIUM)
⏭️ Cross-check 3: SKIPPED (thiếu GCN kết hôn)

Kết luận: DAY_DU (GCN kết hôn là optional)
```

---

## 🖼️ Hướng dẫn tạo ảnh giả

### Option 1: Dùng Canva
1. Tìm template "Vietnam ID Card" hoặc "Birth Certificate"
2. Điền thông tin theo test case
3. Export PNG/JPG độ phân giải cao

### Option 2: Dùng Photoshop
1. Lấy template từ `/template/` folder
2. Chỉnh sửa text fields
3. Export sang PNG

### Option 3: Dùng Google Docs
1. Copy template Word vào Google Docs
2. Điền thông tin
3. Download as PDF → Convert to image

### Option 4: Fake ID Generator (chỉ để test)
⚠️ **Lưu ý:** Chỉ dùng cho môi trường test, KHÔNG dùng cho production!

---

## 📂 Cấu trúc lưu trữ

```
data/test-documents/DANG_KY_KHAI_SINH/
├── test-case-1-happy-path/
│   ├── cccd_me.jpg
│   ├── cccd_cha.jpg
│   ├── giay_chung_sinh.jpg
│   └── gcn_ket_hon.jpg
├── test-case-2-mother-mismatch/
│   ├── cccd_me.jpg          (tên khác)
│   ├── cccd_cha.jpg
│   ├── giay_chung_sinh.jpg
│   └── gcn_ket_hon.jpg
├── test-case-3-father-mismatch/
│   ├── cccd_me.jpg
│   ├── cccd_cha.jpg          (tên khác)
│   └── giay_chung_sinh.jpg
├── test-case-4-normalized-pass/
│   ├── cccd_me.jpg           (chữ HOA, không dấu)
│   ├── cccd_cha.jpg          (dấu sai)
│   └── giay_chung_sinh.jpg
├── test-case-5-single-mother/
│   ├── cccd_me.jpg
│   └── giay_chung_sinh.jpg   (không có thông tin cha)
└── test-case-6-no-marriage-cert/
    ├── cccd_me.jpg
    ├── cccd_cha.jpg
    └── giay_chung_sinh.jpg
```

---

## 🧪 Cách test với ảnh thật

### Bước 1: Upload giấy tờ
```bash
# Tạo session
SESSION_ID=$(curl -X POST http://localhost:3001/api/sessions \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"procedureCode": "DANG_KY_KHAI_SINH"}' | jq -r '.sessionId')

# Upload CCCD mẹ
curl -X POST http://localhost:3001/api/documents/upload \
  -F "sessionId=$SESSION_ID" \
  -F "checklistId=cccd_nguoi_yeu_cau" \
  -F "file=@data/test-documents/DANG_KY_KHAI_SINH/test-case-1-happy-path/cccd_me.jpg"

# Upload CCCD cha
curl -X POST http://localhost:3001/api/documents/upload \
  -F "sessionId=$SESSION_ID" \
  -F "checklistId=cccd_cha" \
  -F "file=@data/test-documents/DANG_KY_KHAI_SINH/test-case-1-happy-path/cccd_cha.jpg"

# Upload Giấy chứng sinh
curl -X POST http://localhost:3001/api/documents/upload \
  -F "sessionId=$SESSION_ID" \
  -F "checklistId=giay_chung_sinh" \
  -F "file=@data/test-documents/DANG_KY_KHAI_SINH/test-case-1-happy-path/giay_chung_sinh.jpg"
```

### Bước 2: Chạy Cross-check
```bash
curl -X POST http://localhost:3001/api/scoring/crosscheck/$SESSION_ID
```

### Bước 3: Xem kết quả
```bash
curl http://localhost:3001/api/sessions/$SESSION_ID | jq '.aiResult.crossCheck'
```

---

## 📊 Checklist

- [ ] Tạo ảnh cho Test Case 1 (Happy Path)
- [ ] Tạo ảnh cho Test Case 2 (Mother Mismatch)
- [ ] Tạo ảnh cho Test Case 3 (Father Mismatch)
- [ ] Tạo ảnh cho Test Case 4 (Normalized Pass)
- [ ] Tạo ảnh cho Test Case 5 (Single Mother)
- [ ] Tạo ảnh cho Test Case 6 (No Marriage Cert)
- [ ] Upload và test qua API
- [ ] Verify cross-check results
- [ ] Test form rendering với OCR data

---

**File:** `/docs/TEST_CASES_IMAGE_GUIDE.md`  
**Last updated:** 2026-07-04  
**Purpose:** Hướng dẫn tạo ảnh giấy tờ để test cross-check flow
