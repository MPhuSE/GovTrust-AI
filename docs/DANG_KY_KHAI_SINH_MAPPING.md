# Document Mapping: Đăng ký khai sinh

## 📋 Tổng quan

**Thủ tục:** `DANG_KY_KHAI_SINH` - Đăng ký khai sinh cho trẻ em

**Tỷ lệ API:**
- ✅ **70% VNPT OCR**: CCCD mẹ (eKYC), CCCD cha (upload), GCN kết hôn
- ⚠️ **30% Qwen VL**: Giấy chứng sinh

**Output:** Giấy khai sinh (KHAI_SINH.docx)

---

## 🗂️ Nguồn dữ liệu (4 giấy tờ)

### 1. CCCD của mẹ (VNPT eKYC)
- **Document Type:** `CCCD`
- **Input Mode:** `EKYC` (chụp CCCD + selfie + liveness)
- **OCR Engine:** VNPT SmartCA
- **Bắt buộc:** ✅ Yes
- **Fields:**
  - `cccd_nguoi_yeu_cau.hoTen`
  - `cccd_nguoi_yeu_cau.soCCCD`
  - `cccd_nguoi_yeu_cau.ngaySinh`
  - `cccd_nguoi_yeu_cau.noiThuongTru`
  - `cccd_nguoi_yeu_cau.danToc`
  - `cccd_nguoi_yeu_cau.quocTich`

### 2. CCCD của cha (VNPT OCR)
- **Document Type:** `CCCD`
- **Input Mode:** `UPLOAD` (upload ảnh CCCD)
- **OCR Engine:** VNPT SmartCA
- **Bắt buộc:** ✅ Yes
- **Fields:**
  - `cccd_cha.hoTen`
  - `cccd_cha.soCCCD`
  - `cccd_cha.ngaySinh`
  - `cccd_cha.noiThuongTru`
  - `cccd_cha.danToc`
  - `cccd_cha.quocTich`

### 3. Giấy chứng sinh (Qwen VL OCR)
- **Document Type:** `GIAY_CHUNG_SINH`
- **Input Mode:** `UPLOAD` (upload ảnh/PDF Giấy chứng sinh)
- **OCR Engine:** Qwen VL (qwen3-vl-plus)
- **Bắt buộc:** ✅ Yes
- **Fields:**
  - `giay_chung_sinh.so` - Số giấy chứng sinh
  - `giay_chung_sinh.quyenSo` - Quyển số
  - `giay_chung_sinh.hoTenMe` - Họ tên mẹ
  - `giay_chung_sinh.namSinhMe` - Năm sinh mẹ
  - `giay_chung_sinh.noiThuongTruMe` - Nơi thường trú mẹ
  - `giay_chung_sinh.maSoBHXH` - Mã số BHXH/BHYT
  - `giay_chung_sinh.soCMND` - Số CMND/CCCD mẹ
  - `giay_chung_sinh.ngayCapCMND` - Ngày cấp
  - `giay_chung_sinh.noiCapCMND` - Nơi cấp
  - `giay_chung_sinh.danTocMe` - Dân tộc mẹ
  - `giay_chung_sinh.hoTenCha` - Họ tên cha
  - `giay_chung_sinh.thoiGianSinh` - Thời gian sinh (giờ, phút, ngày, tháng, năm)
  - `giay_chung_sinh.noiSinh` - Nơi sinh (cơ sở y tế)
  - `giay_chung_sinh.soConTrongLanSinhNay` - Số con trong lần sinh
  - `giay_chung_sinh.gioiTinhCon` - Giới tính con
  - `giay_chung_sinh.canNang` - Cân nặng
  - `giay_chung_sinh.tenDuDinh` - Tên dự định đặt cho con
  - `giay_chung_sinh.ghiChu` - Ghi chú

### 4. Giấy chứng nhận kết hôn (VNPT OCR - Optional)
- **Document Type:** `GIAY_CHUNG_NHAN_KET_HON`
- **Input Mode:** `UPLOAD`
- **OCR Engine:** VNPT SmartReader
- **Bắt buộc:** ⚠️ Optional (nếu cha mẹ có đăng ký kết hôn)
- **Fields:**
  - `giay_chung_nhan_ket_hon.so` - Số GCN kết hôn
  - `giay_chung_nhan_ket_hon.quyenSo` - Quyển số
  - `giay_chung_nhan_ket_hon.ngayDangKy` - Ngày đăng ký kết hôn
  - `giay_chung_nhan_ket_hon.noiDangKy` - Nơi đăng ký
  - `giay_chung_nhan_ket_hon.hoTenVo` - Họ tên vợ
  - `giay_chung_nhan_ket_hon.hoTenChong` - Họ tên chồng

---

## 📝 Đích: Tờ khai đăng ký khai sinh (KHAI_SINH.docx)

### FormFields Mapping (30 trường)

| **Trường trong tờ khai** | **Label** | **Required** | **Nguồn OCR** | **sourceMap** |
|--------------------------|-----------|--------------|---------------|---------------|
| **PHẦN 1: Cơ quan tiếp nhận** | | | | |
| coQuanTiepNhan | Cơ quan tiếp nhận | ✅ | Manual | `[]` (default: "UBND cấp xã") |
| **PHẦN 2: Người yêu cầu (Mẹ)** | | | | |
| nguoiYeuCau.hoTen | Họ tên người yêu cầu | ✅ | CCCD mẹ | `['cccd_nguoi_yeu_cau.hoTen']` |
| nguoiYeuCau.soCCCD | Số CCCD người yêu cầu | ✅ | CCCD mẹ | `['cccd_nguoi_yeu_cau.soCCCD']` |
| nguoiYeuCau.noiCuTru | Nơi cư trú | ⚠️ | CCCD mẹ | `['cccd_nguoi_yeu_cau.noiThuongTru']` |
| nguoiYeuCau.quanHe | Quan hệ với trẻ | ✅ | Manual | `[]` (default: "Mẹ") |
| nguoiYeuCau.dienThoai | Số điện thoại | ✅ | User profile | `[]` (autofillFromUser: 'phoneNumber') |
| nguoiYeuCau.email | Email | ⚠️ | User profile | `[]` (autofillFromUser: 'email') |
| **PHẦN 3: Thông tin trẻ em** | | | | |
| treEm.hoTen | Họ tên trẻ | ✅ | Giấy chứng sinh | `['giay_chung_sinh.tenDuDinh']` |
| treEm.gioiTinh | Giới tính | ✅ | Giấy chứng sinh | `['giay_chung_sinh.gioiTinhCon']` |
| treEm.ngaySinh | Ngày sinh | ✅ | Giấy chứng sinh | `['giay_chung_sinh.thoiGianSinh']` |
| treEm.noiSinh | Nơi sinh | ✅ | Giấy chứng sinh | `['giay_chung_sinh.noiSinh']` |
| treEm.canNang | Cân nặng (kg) | ⚠️ | Giấy chứng sinh | `['giay_chung_sinh.canNang']` |
| treEm.soGiayChungSinh | Số giấy chứng sinh | ⚠️ | Giấy chứng sinh | `['giay_chung_sinh.so']` |
| treEm.danToc | Dân tộc | ⚠️ | Manual | `[]` (default: "Kinh") |
| treEm.quocTich | Quốc tịch | ⚠️ | Manual | `[]` (default: "Việt Nam") |
| **PHẦN 4: Thông tin mẹ** | | | | |
| me.hoTen | Họ tên mẹ | ✅ | CCCD mẹ + Giấy chứng sinh | `['cccd_nguoi_yeu_cau.hoTen', 'giay_chung_sinh.hoTenMe']` |
| me.soCCCD | Số CCCD mẹ | ✅ | CCCD mẹ | `['cccd_nguoi_yeu_cau.soCCCD']` |
| me.ngaySinh | Ngày sinh mẹ | ⚠️ | CCCD mẹ + Giấy chứng sinh | `['cccd_nguoi_yeu_cau.ngaySinh', 'giay_chung_sinh.namSinhMe']` |
| me.danToc | Dân tộc mẹ | ⚠️ | CCCD mẹ + Giấy chứng sinh | `['cccd_nguoi_yeu_cau.danToc', 'giay_chung_sinh.danTocMe']` |
| me.quocTich | Quốc tịch mẹ | ⚠️ | CCCD mẹ | `['cccd_nguoi_yeu_cau.quocTich']` (default: "Việt Nam") |
| me.noiThuongTru | Nơi thường trú mẹ | ⚠️ | CCCD mẹ + Giấy chứng sinh | `['cccd_nguoi_yeu_cau.noiThuongTru', 'giay_chung_sinh.noiThuongTruMe']` |
| **PHẦN 5: Thông tin cha** | | | | |
| cha.hoTen | Họ tên cha | ✅ | CCCD cha + Giấy chứng sinh | `['cccd_cha.hoTen', 'giay_chung_sinh.hoTenCha']` |
| cha.soCCCD | Số CCCD cha | ⚠️ | CCCD cha | `['cccd_cha.soCCCD']` |
| cha.ngaySinh | Ngày sinh cha | ⚠️ | CCCD cha | `['cccd_cha.ngaySinh']` |
| cha.danToc | Dân tộc cha | ⚠️ | CCCD cha | `['cccd_cha.danToc']` |
| cha.quocTich | Quốc tịch cha | ⚠️ | CCCD cha | `['cccd_cha.quocTich']` (default: "Việt Nam") |
| cha.noiThuongTru | Nơi thường trú cha | ⚠️ | CCCD cha | `['cccd_cha.noiThuongTru']` |
| **PHẦN 6: Thông tin kết hôn** | | | | |
| ketHon.so | Số GCN kết hôn | ⚠️ | GCN kết hôn | `['giay_chung_nhan_ket_hon.so']` |
| ketHon.ngayDangKy | Ngày đăng ký kết hôn | ⚠️ | GCN kết hôn | `['giay_chung_nhan_ket_hon.ngayDangKy']` |
| ketHon.noiDangKy | Nơi đăng ký kết hôn | ⚠️ | GCN kết hôn | `['giay_chung_nhan_ket_hon.noiDangKy']` |

**Tổng:** 30 trường (7 bắt buộc, 23 optional)

---

## 🔍 Cross-Check Rules (3 rules)

### Rule 1: Họ tên mẹ trên CCCD khớp với Giấy chứng sinh
```typescript
{
  name: 'Họ tên mẹ trên CCCD khớp với Giấy chứng sinh',
  left: 'cccd_nguoi_yeu_cau.hoTen',
  right: 'giay_chung_sinh.hoTenMe',
  matchType: 'normalized',
  severityIfMismatch: 'HIGH',
  skipIfMissing: 'giay_chung_sinh'
}
```

**Giải thích:** Họ tên mẹ trên CCCD phải khớp với họ tên mẹ trên Giấy chứng sinh do bệnh viện cấp.

---

### Rule 2: Họ tên cha trên CCCD khớp với Giấy chứng sinh
```typescript
{
  name: 'Họ tên cha trên CCCD khớp với Giấy chứng sinh',
  left: 'cccd_cha.hoTen',
  right: 'giay_chung_sinh.hoTenCha',
  matchType: 'normalized',
  severityIfMismatch: 'MEDIUM',
  skipIfMissing: 'cccd_cha'
}
```

**Giải thích:** Họ tên cha trên CCCD phải khớp với họ tên cha trên Giấy chứng sinh.

---

### Rule 3: Họ tên vợ/chồng trên GCN kết hôn khớp với CCCD cha mẹ
```typescript
{
  name: 'Họ tên vợ/chồng trên GCN kết hôn khớp với CCCD cha mẹ',
  left: 'giay_chung_nhan_ket_hon.hoTenVo',
  right: 'cccd_nguoi_yeu_cau.hoTen',
  matchType: 'normalized',
  severityIfMismatch: 'LOW',
  skipIfMissing: 'giay_chung_nhan_ket_hon'
}
```

**Giải thích:** Nếu có Giấy chứng nhận kết hôn, họ tên vợ/chồng phải khớp với CCCD của cha/mẹ.

---

## 📊 Flow Auto-Fill

```
┌─────────────────────────────────────────────────────────┐
│ 1. Mẹ eKYC (CCCD + selfie + liveness)                  │
│    → Lưu vào User profile                              │
│      • cccdNumber, cccdFullName, cccdBirthDay          │
│      • cccdGender, cccdRecentLocation, ...             │
│    → VNPT OCR: cccd_nguoi_yeu_cau.*                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Upload CCCD cha                                      │
│    → VNPT OCR trích xuất:                              │
│      • hoTen, soCCCD, ngaySinh                         │
│      • danToc, quocTich, noiThuongTru                  │
│    → Lưu vào Session.documents[cccd_cha]               │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Upload Giấy chứng sinh                              │
│    → Qwen VL OCR trích xuất:                           │
│      • hoTenMe, hoTenCha                               │
│      • thoiGianSinh, noiSinh, gioiTinhCon              │
│      • tenDuDinh, canNang, so, quyenSo                 │
│    → Lưu vào Session.documents[giay_chung_sinh]        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Upload GCN kết hôn (optional)                       │
│    → VNPT OCR trích xuất:                              │
│      • so, quyenSo, ngayDangKy, noiDangKy              │
│      • hoTenVo, hoTenChong                             │
│    → Lưu vào Session.documents[giay_chung_nhan_ket_hon]│
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Cross-check tự động                                  │
│    ✓ cccd_me.hoTen = giay_chung_sinh.hoTenMe         │
│    ✓ cccd_cha.hoTen = giay_chung_sinh.hoTenCha       │
│    ✓ gcn_ket_hon.hoTenVo = cccd_me.hoTen              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 6. Auto-fill formData (30 trường)                      │
│                                                          │
│    formData = {                                         │
│      // Từ CCCD mẹ                                     │
│      "nguoiYeuCau.hoTen": cccd_me.hoTen,              │
│      "nguoiYeuCau.soCCCD": cccd_me.soCCCD,            │
│      "me.hoTen": cccd_me.hoTen,                        │
│      "me.noiThuongTru": cccd_me.noiThuongTru,         │
│                                                          │
│      // Từ CCCD cha                                     │
│      "cha.hoTen": cccd_cha.hoTen,                      │
│      "cha.soCCCD": cccd_cha.soCCCD,                    │
│                                                          │
│      // Từ Giấy chứng sinh (Qwen VL)                   │
│      "treEm.hoTen": giay_chung_sinh.tenDuDinh,        │
│      "treEm.ngaySinh": giay_chung_sinh.thoiGianSinh,  │
│      "treEm.noiSinh": giay_chung_sinh.noiSinh,        │
│      "treEm.gioiTinh": giay_chung_sinh.gioiTinhCon,   │
│      "treEm.canNang": giay_chung_sinh.canNang,        │
│                                                          │
│      // Từ GCN kết hôn                                  │
│      "ketHon.so": gcn_ket_hon.so,                      │
│      "ketHon.ngayDangKy": gcn_ket_hon.ngayDangKy,     │
│                                                          │
│      // Từ User profile                                 │
│      "nguoiYeuCau.dienThoai": user.phoneNumber,        │
│      "nguoiYeuCau.email": user.email,                  │
│    }                                                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 7. Render tờ khai DOCX                                  │
│    → Thay thế 30 placeholder bằng formData             │
│    → Xuất file PDF/DOCX đã điền                        │
│    → Người dùng xem trước & xác nhận                   │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Ví dụ cụ thể

### Input (4 giấy tờ):

**1. CCCD mẹ (eKYC):**
```
Họ tên: NGUYỄN THỊ LAN
Số CCCD: 001199012345
Ngày sinh: 15/05/1990
Dân tộc: Kinh
Quốc tịch: Việt Nam
Nơi thường trú: 123 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP.HCM
```

**2. CCCD cha:**
```
Họ tên: TRẦN VĂN MINH
Số CCCD: 001198054321
Ngày sinh: 20/08/1988
Dân tộc: Kinh
Quốc tịch: Việt Nam
Nơi thường trú: 123 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP.HCM
```

**3. Giấy chứng sinh:**
```
Số: 0012345
Quyển số: 001
Họ tên mẹ: NGUYỄN THỊ LAN
Họ tên cha: TRẦN VĂN MINH
Sinh con vào lúc: 08 giờ 30 phút, ngày 15 tháng 01 năm 2025
Tại: Bệnh viện Phụ sản Hùng Vương, TP.HCM
Giới tính: Nữ
Cân nặng: 3.2 kg
Tên dự định: TRẦN NGỌC ANH
```

**4. Giấy chứng nhận kết hôn:**
```
Số: 123/2018/KSKH
Ngày đăng ký: 01/06/2018
Nơi đăng ký: UBND Phường Bến Thành, Quận 1, TP.HCM
Tên vợ: NGUYỄN THỊ LAN
Tên chồng: TRẦN VĂN MINH
```

---

### Output (Tờ khai đã điền):

```
TỜ KHAI ĐĂNG KÝ KHAI SINH

Kính gửi: UBND Phường Bến Thành, Quận 1, TP.HCM

Họ tên người yêu cầu: NGUYỄN THỊ LAN
Số CCCD: 001199012345
Nơi cư trú: 123 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP.HCM
Quan hệ với người được khai sinh: Mẹ
Số điện thoại: 0901234567
Email: nguyenlan@example.com

Đề nghị đăng ký khai sinh cho người dưới đây:

Họ, chữ đệm, tên: TRẦN NGỌC ANH
Ngày, tháng, năm sinh: 15/01/2025 (mười lăm tháng một năm hai nghìn hai mươi lăm)
Nơi sinh: Bệnh viện Phụ sản Hùng Vương, TP.HCM
Giới tính: Nữ
Dân tộc: Kinh
Quốc tịch: Việt Nam
Cân nặng: 3.2 kg
Số Giấy chứng sinh: 0012345, Quyển số: 001

Họ, chữ đệm, tên người mẹ: NGUYỄN THỊ LAN
Số CCCD: 001199012345
Ngày sinh: 15/05/1990
Dân tộc: Kinh
Quốc tịch: Việt Nam
Nơi thường trú: 123 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP.HCM

Họ, chữ đệm, tên người cha: TRẦN VĂN MINH
Số CCCD: 001198054321
Ngày sinh: 20/08/1988
Dân tộc: Kinh
Quốc tịch: Việt Nam
Nơi thường trú: 123 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP.HCM

Thông tin về Giấy chứng nhận kết hôn:
Số: 123/2018/KSKH
Ngày đăng ký: 01/06/2018
Tại: UBND Phường Bến Thành, Quận 1, TP.HCM

Tôi cam đoan nội dung khai trên đây là đúng sự thật.
```

---

## 📌 Ghi chú kỹ thuật

### 1. Qwen VL OCR - Giấy chứng sinh
- **Model:** qwen3-vl-plus
- **API:** https://api.shopaikey.com/v1
- **Độ chính xác:** ~85% (layout phức tạp, 2 cột)
- **Xử lý:** 
  - Convert DOC/DOCX → PDF → PNG
  - Gửi image bytes + prompt extraction
  - Parse JSON response

### 2. VNPT OCR - CCCD
- **API:** https://smartid.vnpt.vn/api/v1/ocr/cccd
- **Độ chính xác:** ~95%
- **Features:** Face matching, Liveness detection

### 3. Template rendering
- **Engine:** python-docx hoặc NestJS DOCX renderer
- **Placeholders:** `{{treEm.hoTen}}`, `{{me.soCCCD}}`, etc.
- **Output formats:** DOCX, PDF

---

## ✅ Checklist triển khai

- [x] Cập nhật thủ tục `DANG_KY_KHAI_SINH` trong `mvp-procedures.ts`
- [x] Định nghĩa 4 document types trong checklist
- [x] Map 30 formFields với sourceMap
- [x] Thiết lập 3 cross-check rules
- [ ] Test Qwen OCR với Giấy chứng sinh thật (có data)
- [ ] Thêm placeholders vào template `KHAI_SINH.docx`
- [ ] Test auto-fill flow end-to-end
- [ ] Cập nhật MongoDB schema cho `GIAY_CHUNG_SINH` document type
- [ ] Deploy Qwen OCR service với API key

---

**File location:** `/docs/DANG_KY_KHAI_SINH_MAPPING.md`
**Last updated:** 2026-07-03
