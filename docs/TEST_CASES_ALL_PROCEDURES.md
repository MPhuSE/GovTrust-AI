# 📋 Test Cases - Tất cả 3 thủ tục MVP

## 🎯 Tổng quan

Tài liệu này cung cấp test cases chi tiết cho **3 thủ tục MVP**:
1. **DANG_KY_KHAI_SINH** - Đăng ký khai sinh
2. **HKD_THAY_DOI** - Thay đổi chủ hộ kinh doanh  
3. **CHUYEN_NHUONG_QSDD** - Chuyển nhượng quyền sử dụng đất

---

# 📦 THỦ TỤC 1: ĐĂNG KÝ KHAI SINH

## Test Case 1.1: Happy Path - Tất cả khớp

### Giấy tờ cần chuẩn bị

#### CCCD Mẹ (cccd_nguoi_yeu_cau)
```
Họ và tên:           Nguyễn Thị Lan
Ngày sinh:           15/03/1995
Giới tính:           Nữ
Số CCCD:             001095012345
Địa chỉ thường trú:  Số 10, Ngõ 5, Đường Láng, P. Láng Thượng, Q. Đống Đa, Hà Nội
```

#### CCCD Cha (cccd_cha)
```
Họ và tên:           Trần Văn Minh
Ngày sinh:           20/08/1993
Số CCCD:             001093098765
Địa chỉ thường trú:  Số 10, Ngõ 5, Đường Láng, P. Láng Thượng, Q. Đống Đa, Hà Nội
```

#### Giấy chứng sinh (giay_chung_sinh)
```
Tên dự định:         Trần Minh An
Ngày sinh:           05/01/2026
Họ tên mẹ:           Nguyễn Thị Lan
Ngày sinh mẹ:        15/03/1995
Số CCCD mẹ:          001095012345
Họ tên cha:          Trần Văn Minh
Ngày sinh cha:       20/08/1993
Số CCCD cha:         001093098765
```

#### Giấy chứng nhận kết hôn (optional)
```
Họ tên chồng:        Trần Văn Minh
Họ tên vợ:           Nguyễn Thị Lan
Ngày đăng ký:        10/05/2024
```

### Expected: ✅ DAY_DU (3/3 checks MATCH)

---

## Test Case 1.2: Mother Name Mismatch

**Thay đổi:** CCCD mẹ → "Nguyễn Thị Lan Anh"  
**Expected:** ❌ CAN_KIEM_TRA_KY (HIGH mismatch)

---

## Test Case 1.3: Single Mother

**Không có:** CCCD cha, thông tin cha trên giấy chứng sinh để trống  
**Expected:** ✅ DAY_DU (skip checks về cha)

---

# 📦 THỦ TỤC 2: THAY ĐỔI CHỦ HỘ KINH DOANH

## Test Case 2.1: Happy Path - Tất cả khớp

### Giấy tờ cần chuẩn bị

#### CCCD Chủ hộ mới (cccd_nguoi_yeu_cau)
```
Họ và tên:           Nguyễn Văn Bình
Ngày sinh:           10/05/1985
Số CCCD:             001085067890
Địa chỉ:             123 Đường ABC, Phường XYZ, Quận 1, TP.HCM
Điện thoại:          0912345678
```

#### Giấy đăng ký hộ kinh doanh (giay_dang_ky_hkd)
```
Tên hộ KD:           Hộ kinh doanh Bình Minh
Mã số HKD:           0123456789
Chủ hộ hiện tại:     Nguyễn Văn An
Số CCCD chủ cũ:      001080012345
Địa chỉ KD:          123 Đường ABC, Phường XYZ, Quận 1, TP.HCM
Ngành nghề:          Kinh doanh tạp hóa
Ngày cấp:            15/01/2020
```

#### Văn bản ủy quyền HGĐ (van_ban_uy_quyen_hgd)
```
Người ủy quyền:      Nguyễn Văn An (chủ hộ cũ)
Số CCCD:             001080012345

Người được ủy quyền: Nguyễn Văn Bình (chủ hộ mới)
Số CCCD:             001085067890

Quan hệ:             Thành viên hộ gia đình
Nội dung ủy quyền:   Chuyển giao quyền chủ hộ kinh doanh
Ngày ủy quyền:       01/01/2026
```

#### Sổ hộ khẩu (so_ho_khau) - optional
```
Chủ hộ:              Nguyễn Văn An
Thành viên:          Nguyễn Văn Bình (con trai)
Địa chỉ:             123 Đường ABC, Phường XYZ
```

### Cross-check rules:
1. ✅ Chủ hộ mới trên CCCD khớp người được ủy quyền (HIGH)
2. ✅ Chủ hộ cũ trên giấy HKD khớp người ủy quyền (HIGH)
3. ✅ Địa chỉ KD khớp với CCCD chủ hộ mới (MEDIUM)
4. ✅ Chủ hộ mới có trong sổ hộ khẩu (LOW, optional)

### Expected: ✅ DAY_DU (4/4 checks MATCH)

---

## Test Case 2.2: Người được ủy quyền không khớp

**Thay đổi:** Văn bản ủy quyền → "Nguyễn Văn Cường" (không phải Bình)  
**Expected:** ❌ CAN_KIEM_TRA_KY (HIGH mismatch - có thể là gian lận)

---

## Test Case 2.3: Địa chỉ kinh doanh không khớp

**Thay đổi:** 
- Giấy HKD: "123 Đường ABC"
- CCCD: "456 Đường XYZ"

**Expected:** ⚠️ CAN_BO_SUNG (MEDIUM mismatch - cần giải trình)

---

## Test Case 2.4: Không có sổ hộ khẩu

**Không có:** Sổ hộ khẩu (optional document)  
**Expected:** ✅ DAY_DU (skip check về hộ khẩu)

---

# 📦 THỦ TỤC 3: CHUYỂN NHƯỢNG QUYỀN SỬ DỤNG ĐẤT

## Test Case 3.1: Happy Path - Tất cả khớp

### Giấy tờ cần chuẩn bị

#### CCCD Bên nhận (cccd_nguoi_yeu_cau)
```
Họ và tên:           Lê Thị Mai
Ngày sinh:           20/08/1988
Số CCCD:             001088054321
Địa chỉ:             789 Đường DEF, Phường ABC, Quận 3, TP.HCM
Điện thoại:          0987654321
```

#### Sổ đỏ bên chuyển nhượng (so_do_ben_chuyen_nhuong)
```
Tên chủ sở hữu:      Phạm Văn Hùng
Số CCCD:             001085012345
Địa chỉ thửa đất:    123 Đường Nguyễn Trãi, P. Bến Thành, Q.1, TP.HCM
Số thửa:             45
Tờ bản đồ số:        12
Diện tích:           100 m²
Mục đích sử dụng:    Đất ở
Thời hạn:            Lâu dài
Số sổ:               SO-2020-001234
```

#### Hợp đồng chuyển nhượng (hop_dong_chuyen_nhuong)
```
=== BÊN CHUYỂN NHƯỢNG (Bên A) ===
Họ tên:              Phạm Văn Hùng
Số CCCD:             001085012345
Địa chỉ:             123 Đường Nguyễn Trãi, P. Bến Thành, Q.1, TP.HCM

=== BÊN NHẬN CHUYỂN NHƯỢNG (Bên B) ===
Họ tên:              Lê Thị Mai
Số CCCD:             001088054321
Địa chỉ:             789 Đường DEF, P. ABC, Q.3, TP.HCM

=== TÀI SẢN CHUYỂN NHƯỢNG ===
Địa chỉ thửa đất:    123 Đường Nguyễn Trãi, P. Bến Thành, Q.1, TP.HCM
Diện tích:           100 m²
Số thửa:             45
Tờ bản đồ:           12

=== GIÁ TRỊ ===
Giá chuyển nhượng:   5,000,000,000 VNĐ (Năm tỷ đồng)
Phương thức thanh toán: Chuyển khoản

=== CÔNG CHỨNG ===
Ngày công chứng:     15/12/2025
Văn phòng công chứng: VPCC Quận 1, TP.HCM
Số công chứng:       CC-2025-012345
```

#### Giấy tờ thuế (optional)
```
Người nộp:           Lê Thị Mai
Loại thuế:           Thuế chuyển nhượng BĐS
Số tiền:             250,000,000 VNĐ (5% giá trị)
Ngày nộp:            20/12/2025
```

### Cross-check rules:
1. ✅ Bên nhận trên CCCD khớp với hợp đồng (HIGH)
2. ✅ Bên chuyển nhượng trên sổ đỏ khớp với hợp đồng (HIGH)
3. ✅ Địa chỉ thửa đất trên sổ đỏ khớp với hợp đồng (MEDIUM, fuzzy match)
4. ✅ Diện tích trên sổ đỏ khớp với hợp đồng (MEDIUM)
5. ✅ Người nộp thuế khớp với bên nhận (LOW, optional)

### Expected: ✅ DAY_DU (5/5 checks MATCH)

---

## Test Case 3.2: Bên nhận không khớp

**Thay đổi:** CCCD → "Trần Văn Đức" (không phải Lê Thị Mai)  
**Expected:** ❌ CAN_KIEM_TRA_KY (HIGH mismatch - nghi vấn gian lận)

---

## Test Case 3.3: Bên chuyển nhượng không khớp

**Thay đổi:** Sổ đỏ → "Nguyễn Văn An" (không phải Phạm Văn Hùng)  
**Expected:** ❌ CAN_KIEM_TRA_KY (HIGH mismatch - không đúng chủ sở hữu)

---

## Test Case 3.4: Địa chỉ thửa đất khác nhau (fuzzy match)

**Thay đổi:**
- Sổ đỏ: "123 Đường Nguyễn Trãi, P. Bến Thành, Q.1"
- Hợp đồng: "123 Nguyễn Trãi, Phường Bến Thành, Quận 1"

**Expected:** ✅ DAY_DU (fuzzy match PASS - cùng địa chỉ viết khác)

---

## Test Case 3.5: Diện tích không khớp

**Thay đổi:**
- Sổ đỏ: 100 m²
- Hợp đồng: 95 m² (sai số lớn)

**Expected:** ⚠️ CAN_BO_SUNG (MEDIUM mismatch - cần đo đạc lại)

---

## Test Case 3.6: Không có giấy nộp thuế

**Không có:** Giấy tờ thuế (optional)  
**Expected:** ✅ DAY_DU (skip check về thuế, nhưng nhắc nhở nộp thuế)

---

# 🖼️ Hướng dẫn tạo ảnh test

## Cấu trúc thư mục

```
data/test-documents/
├── DANG_KY_KHAI_SINH/
│   ├── 1.1-happy-path/
│   │   ├── cccd_me.jpg
│   │   ├── cccd_cha.jpg
│   │   ├── giay_chung_sinh.jpg
│   │   └── gcn_ket_hon.jpg
│   ├── 1.2-mother-mismatch/
│   └── 1.3-single-mother/
│
├── HKD_THAY_DOI/
│   ├── 2.1-happy-path/
│   │   ├── cccd_chu_ho_moi.jpg
│   │   ├── giay_dang_ky_hkd.jpg
│   │   ├── van_ban_uy_quyen.jpg
│   │   └── so_ho_khau.jpg
│   ├── 2.2-uy-quyen-mismatch/
│   ├── 2.3-dia-chi-mismatch/
│   └── 2.4-no-so-ho-khau/
│
└── CHUYEN_NHUONG_QSDD/
    ├── 3.1-happy-path/
    │   ├── cccd_ben_nhan.jpg
    │   ├── so_do_ben_chuyen_nhuong.jpg
    │   ├── hop_dong_chuyen_nhuong.jpg
    │   └── giay_nop_thue.jpg
    ├── 3.2-ben-nhan-mismatch/
    ├── 3.3-ben-chuyen-nhuong-mismatch/
    ├── 3.4-dia-chi-fuzzy-match/
    ├── 3.5-dien-tich-mismatch/
    └── 3.6-no-giay-thue/
```

## Tools để tạo ảnh

### 1. Canva
- Search "Vietnam ID Card template"
- Search "Birth Certificate template"  
- Search "Real Estate Contract template"

### 2. Google Docs/Slides
- Import template Word/PDF
- Fill in data
- Export as image

### 3. Photoshop/GIMP
- Edit template files
- Add text layers
- Export PNG/JPG

### 4. LibreOffice
```bash
# Convert DOCX → PDF → PNG
libreoffice --headless --convert-to pdf document.docx
pdftoppm -png -r 300 document.pdf output
```

---

# 🧪 Script test tự động

## Upload và test 1 scenario

```bash
#!/bin/bash
# test-scenario.sh <procedure-code> <test-case-folder>

PROCEDURE_CODE=$1
TEST_FOLDER=$2

# Create session
SESSION_ID=$(curl -s -X POST http://localhost:3001/api/sessions \
  -H "Content-Type: application/json" \
  -d "{\"procedureCode\": \"$PROCEDURE_CODE\"}" \
  | jq -r '.sessionId')

echo "Created session: $SESSION_ID"

# Upload all images in folder
for img in $TEST_FOLDER/*.jpg; do
  CHECKLIST_ID=$(basename $img .jpg)
  
  echo "Uploading $CHECKLIST_ID..."
  curl -s -X POST http://localhost:3001/api/documents/upload \
    -F "sessionId=$SESSION_ID" \
    -F "checklistId=$CHECKLIST_ID" \
    -F "file=@$img"
done

# Run cross-check
echo "Running cross-check..."
curl -s -X POST http://localhost:3001/api/scoring/crosscheck/$SESSION_ID

# Get results
echo "Results:"
curl -s http://localhost:3001/api/sessions/$SESSION_ID \
  | jq '.aiResult.crossCheck'
```

## Sử dụng:

```bash
# Test Case 1.1
./test-scenario.sh DANG_KY_KHAI_SINH \
  data/test-documents/DANG_KY_KHAI_SINH/1.1-happy-path/

# Test Case 2.1
./test-scenario.sh HKD_THAY_DOI \
  data/test-documents/HKD_THAY_DOI/2.1-happy-path/

# Test Case 3.1
./test-scenario.sh CHUYEN_NHUONG_QSDD \
  data/test-documents/CHUYEN_NHUONG_QSDD/3.1-happy-path/
```

---

# 📊 Checklist

## Thủ tục 1: Đăng ký khai sinh
- [ ] Test Case 1.1 (Happy Path)
- [ ] Test Case 1.2 (Mother Mismatch)
- [ ] Test Case 1.3 (Single Mother)

## Thủ tục 2: Thay đổi chủ hộ KD
- [ ] Test Case 2.1 (Happy Path)
- [ ] Test Case 2.2 (Ủy quyền mismatch)
- [ ] Test Case 2.3 (Địa chỉ mismatch)
- [ ] Test Case 2.4 (No sổ hộ khẩu)

## Thủ tục 3: Chuyển nhượng đất
- [ ] Test Case 3.1 (Happy Path)
- [ ] Test Case 3.2 (Bên nhận mismatch)
- [ ] Test Case 3.3 (Bên chuyển nhượng mismatch)
- [ ] Test Case 3.4 (Địa chỉ fuzzy match)
- [ ] Test Case 3.5 (Diện tích mismatch)
- [ ] Test Case 3.6 (No giấy thuế)

---

**File:** `/docs/TEST_CASES_ALL_PROCEDURES.md`  
**Last updated:** 2026-07-04  
**Purpose:** Test cases cho cả 3 thủ tục MVP
