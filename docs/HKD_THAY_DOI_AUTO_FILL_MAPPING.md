# Auto-Fill Mapping: 3 Giấy Tờ → Tờ Khai Thay Đổi Chủ Hộ

## Nguồn dữ liệu (3 giấy tờ)

### 1. Giấy ĐKHKD (Phụ lục VI-1)
**File:** `/data/test-documents/Phụ lục VI-1.md`

### 2. Giấy ủy quyền HGĐ
**File:** `/data/test-documents/giay-uy-quyen-lam-chu-ho-kinh-doanh (1).md`

### 3. CCCD chủ hộ mới (eKYC)
**Từ:** `User.cccd*` fields sau khi eKYC

---

## Đích: Tờ Khai Thay Đổi Chủ Hộ
**File:** `/template/mau-thong-bao-thay-di-chu-ho-kinh-doanh.md`

---

## Mapping chi tiết

### PHẦN 1: Thông tin hộ kinh doanh

| Trường trong tờ khai | Nguồn dữ liệu | Trường OCR |
|---------------------|---------------|------------|
| Tên hộ kinh doanh | **Giấy ĐKHKD** dòng 16 | `giay_hkd.tenHoKinhDoanh` |
| Mã số hộ kinh doanh/Mã số thuế | **Giấy ĐKHKD** dòng 10 | `giay_hkd.maSoHoKinhDoanh` |
| Mã số đăng ký hộ kinh doanh | **Giấy ĐKHKD** dòng 10 | `giay_hkd.maSoDangKy` |
| Điện thoại | **Giấy ĐKHKD** dòng 20 | `giay_hkd.dienThoai` |
| Fax | **Giấy ĐKHKD** dòng 20 | `giay_hkd.fax` |
| Email | **Giấy ĐKHKD** dòng 22 | `giay_hkd.email` |
| Website | **Giấy ĐKHKD** dòng 22 | `giay_hkd.website` |

### PHẦN 2: Chủ hộ TRƯỚC khi thay đổi (Chủ hộ cũ)

| Trường trong tờ khai | Nguồn dữ liệu | Trường OCR |
|---------------------|---------------|------------|
| Họ và tên | **Giấy ĐKHKD** dòng 32 | `giay_hkd.hoTenChuHo` |
| Giới tính | **Giấy ĐKHKD** dòng 34 | `giay_hkd.gioiTinhChuHo` |
| Sinh ngày | **Giấy ĐKHKD** dòng 36 | `giay_hkd.ngaySinhChuHo` |
| Dân tộc | **Giấy ĐKHKD** dòng 36 | `giay_hkd.danTocChuHo` |
| Quốc tịch | **Giấy ĐKHKD** dòng 36 | `giay_hkd.quocTichChuHo` |
| Loại giấy tờ pháp lý | **Giấy ĐKHKD** dòng 38 | `giay_hkd.loaiGiayToChuHo` |
| Số giấy tờ pháp lý | **Giấy ĐKHKD** dòng 40 | `giay_hkd.soCCCDChuHo` ⭐ |
| Ngày cấp | **Giấy ĐKHKD** dòng 42 | `giay_hkd.ngayCapCCCDChuHo` |
| Nơi cấp | **Giấy ĐKHKD** dòng 42 | `giay_hkd.noiCapCCCDChuHo` |
| Địa chỉ thường trú | **Giấy ĐKHKD** dòng 44 | `giay_hkd.diaChiThuongTruChuHo` |
| Địa chỉ liên lạc | **Giấy ĐKHKD** dòng 46 | `giay_hkd.diaChiLienLacChuHo` |
| Điện thoại | **Giấy ĐKHKD** dòng 20 hoặc riêng | `giay_hkd.dienThoaiChuHo` |
| Email | **Giấy ĐKHKD** dòng 22 hoặc riêng | `giay_hkd.emailChuHo` |

### PHẦN 3: Chủ hộ SAU khi thay đổi (Chủ hộ mới)

| Trường trong tờ khai | Nguồn dữ liệu | Trường OCR/eKYC |
|---------------------|---------------|-----------------|
| Họ và tên | **CCCD (eKYC)** | `cccd_nguoi_yeu_cau.hoTen` |
| Giới tính | **CCCD (eKYC)** | `cccd_nguoi_yeu_cau.gioiTinh` |
| Sinh ngày | **CCCD (eKYC)** | `cccd_nguoi_yeu_cau.ngaySinh` |
| Dân tộc | **CCCD (eKYC)** | `cccd_nguoi_yeu_cau.danToc` |
| Quốc tịch | **CCCD (eKYC)** | `cccd_nguoi_yeu_cau.quocTich` |
| Loại giấy tờ pháp lý | **CCCD (eKYC)** | `cccd_nguoi_yeu_cau.loaiGiayTo` (CCCD/CMND) |
| Số giấy tờ pháp lý | **CCCD (eKYC)** | `cccd_nguoi_yeu_cau.soCCCD` ⭐ |
| Ngày cấp | **CCCD (eKYC)** | `cccd_nguoi_yeu_cau.ngayCap` |
| Nơi cấp | **CCCD (eKYC)** | `cccd_nguoi_yeu_cau.noiCap` |
| Có giá trị đến ngày | **CCCD (eKYC)** | `cccd_nguoi_yeu_cau.ngayHetHan` |
| Địa chỉ thường trú | **CCCD (eKYC)** | `cccd_nguoi_yeu_cau.noiThuongTru` |
| Địa chỉ liên lạc | **Giấy ủy quyền** dòng 34 hoặc CCCD | `van_ban_uy_quyen_hgd.diaChiNguoiDuocUyQuyen` |
| Điện thoại | **User profile** | `user.phoneNumber` |
| Email | **User profile** | `user.email` |

### PHẦN 4: Lý do thay đổi (checkbox)

| Trường trong tờ khai | Nguồn dữ liệu | Giá trị |
|---------------------|---------------|---------|
| Thành viên hộ gia đình ủy quyền | **Giấy ủy quyền** phần III | `thayDoi.lyDo.uyQuyen = true` ⭐ |
| Tặng cho hộ kinh doanh | Người dùng chọn | `thayDoi.lyDo.tang = false` |
| Bán hộ kinh doanh | Người dùng chọn | `thayDoi.lyDo.ban = false` |
| Thừa kế hộ kinh doanh | Người dùng chọn | `thayDoi.lyDo.thuaKe = false` |

---

## Cross-check giữa 3 giấy tờ

### Rule 1: Chủ hộ mới trên CCCD = Người được ủy quyền
```
cccd_nguoi_yeu_cau.hoTen 
  PHẢI KHỚP với 
van_ban_uy_quyen_hgd.tenNguoiDuocUyQuyen (dòng 31)
```

### Rule 2: Chủ hộ cũ trên ĐKHKD = Người ủy quyền
```
giay_hkd.hoTenChuHo (dòng 32)
  PHẢI KHỚP với 
van_ban_uy_quyen_hgd.tenNguoiUyQuyen (dòng 15, 21, ...)
```

### Rule 3: Tên hộ kinh doanh
```
giay_hkd.tenHoKinhDoanh (dòng 16)
  PHẢI KHỚP với 
van_ban_uy_quyen_hgd.tenHoKinhDoanh (nếu có trong nội dung)
```

---

## Flow Auto-Fill

```
┌─────────────────────────────────────────────────────────┐
│ 1. User eKYC (CCCD + selfie)                           │
│    → Lưu vào User profile                              │
│      • cccdNumber, cccdFullName, cccdBirthDay          │
│      • cccdGender, cccdRecentLocation, ...             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Upload Giấy ĐKHKD                                    │
│    → OCR trích xuất:                                    │
│      • tenHoKinhDoanh, maSoHoKinhDoanh                 │
│      • hoTenChuHo, soCCCDChuHo ⭐ (CHỦ HỘ CŨ)        │
│      • ngaySinhChuHo, gioiTinhChuHo, ...               │
│    → Lưu vào Session.documents[giay_hkd]               │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Upload Giấy ủy quyền HGĐ                            │
│    → OCR trích xuất:                                    │
│      • tenNguoiDuocUyQuyen (CHỦ HỘ MỚI)               │
│      • tenNguoiUyQuyen (CHỦ HỘ CŨ)                     │
│      • tenHoKinhDoanh                                   │
│    → Lưu vào Session.documents[van_ban_uy_quyen_hgd]  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Cross-check tự động                                  │
│    ✓ cccd.hoTen = uyQuyen.nguoiDuocUyQuyen            │
│    ✓ hkd.chuHo = uyQuyen.nguoiUyQuyen                  │
│    ✓ hkd.tenHoKD = uyQuyen.tenHoKD                     │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Auto-fill formData (34 trường)                      │
│                                                          │
│    formData = {                                         │
│      // Từ Giấy ĐKHKD                                  │
│      "hoKinhDoanh.tenHoKinhDoanh": giay_hkd.ten,      │
│      "hoKinhDoanh.maSo": giay_hkd.maSo,               │
│      "chuHoCu.hoTen": giay_hkd.hoTenChuHo,            │
│      "chuHoCu.soCCCD": giay_hkd.soCCCDChuHo, ⭐       │
│      "chuHoCu.ngaySinh": giay_hkd.ngaySinhChuHo,      │
│      ...                                                │
│                                                          │
│      // Từ eKYC (CCCD chủ hộ mới)                      │
│      "chuHoMoi.hoTen": cccd.hoTen,                     │
│      "chuHoMoi.soCCCD": cccd.soCCCD, ⭐               │
│      "chuHoMoi.ngaySinh": cccd.ngaySinh,              │
│      "chuHoMoi.diaChiThuongTru": cccd.noiThuongTru,   │
│      ...                                                │
│                                                          │
│      // Từ User profile                                 │
│      "chuHoMoi.dienThoai": user.phoneNumber,           │
│      "chuHoMoi.email": user.email,                     │
│                                                          │
│      // Từ Giấy ủy quyền                               │
│      "thayDoi.lyDo.uyQuyen": true                      │
│    }                                                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 6. Render tờ khai DOCX                                  │
│    → Thay thế 34 placeholder bằng formData             │
│    → Xuất file PDF/DOCX đã điền                        │
│    → Người dùng xem trước & xác nhận                   │
└─────────────────────────────────────────────────────────┘
```

---

## Ví dụ cụ thể

### Input (3 giấy tờ):

**1. Giấy ĐKHKD:**
```
Tên hộ kinh doanh: CỬA HÀNG TẠP HÓA BÌNH MINH
Số: 01234567890
Chủ hộ: NGUYỄN VĂN A
Giới tính: Nam
Sinh ngày: 15/03/1975
Số CCCD: 001234567890
Ngày cấp: 01/01/2020
Nơi cấp: Cục Cảnh sát ĐKQL cư trú và DLQG về dân cư
Địa chỉ thường trú: 123 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM
```

**2. Giấy ủy quyền HGĐ:**
```
BÊN ỦY QUYỀN: NGUYỄN VĂN A (chủ hộ cũ)
BÊN ĐƯỢC ỦY QUYỀN: NGUYỄN THỊ B (con gái)
Số CCCD: 001987654321
Địa chỉ: 456 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM
```

**3. eKYC (CCCD chủ hộ mới):**
```
Họ tên: NGUYỄN THỊ B
Số CCCD: 001987654321
Sinh ngày: 20/05/1995
Giới tính: Nữ
Quốc tịch: Việt Nam
Địa chỉ thường trú: 456 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM
```

### Output (Tờ khai đã điền):

```
THÔNG BÁO
Thay đổi chủ hộ kinh doanh

Tên hộ kinh doanh: CỬA HÀNG TẠP HÓA BÌNH MINH
Mã số hộ kinh doanh: 01234567890

Đăng ký thay đổi chủ hộ kinh doanh với các nội dung sau:

Thay đổi chủ hộ kinh doanh do:
☑ Thành viên hộ gia đình ủy quyền
☐ Tặng cho hộ kinh doanh
☐ Bán hộ kinh doanh
☐ Thừa kế hộ kinh doanh

1. Chủ hộ TRƯỚC khi thay đổi:
Họ và tên: NGUYỄN VĂN A        Giới tính: Nam
Sinh ngày: 15/03/1975          Dân tộc: Kinh    Quốc tịch: Việt Nam
Số CCCD: 001234567890
Ngày cấp: 01/01/2020           Nơi cấp: Cục Cảnh sát ĐKQL...
Địa chỉ thường trú: 123 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM

2. Chủ hộ SAU khi thay đổi:
Họ và tên: NGUYỄN THỊ B        Giới tính: Nữ
Sinh ngày: 20/05/1995          Dân tộc: Kinh    Quốc tịch: Việt Nam
Số CCCD: 001987654321
Ngày cấp: 01/01/2021           Nơi cấp: Cục Cảnh sát ĐKQL...
Địa chỉ thường trú: 456 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM
Điện thoại: 0901234567         Email: nguyenthib@example.com

[Chữ ký chủ hộ mới]            [Chữ ký chủ hộ cũ]
```

---

## Code implementation (SmartForm service)

```typescript
// Auto-fill logic trong SmartForm service
async function autoFillHKDThayDoi(session: Session): Promise<FormData> {
  const giayHKD = session.documents.find(d => d.checklistId === 'giay_hkd');
  const uyQuyenHGD = session.documents.find(d => d.checklistId === 'van_ban_uy_quyen_hgd');
  const cccdMoi = session.documents.find(d => d.checklistId === 'cccd_nguoi_yeu_cau');
  const user = await userModel.findById(session.userId);

  return {
    // Từ Giấy ĐKHKD → Chủ hộ cũ
    'hoKinhDoanh.tenHoKinhDoanh': giayHKD.ocrData.tenHoKinhDoanh,
    'hoKinhDoanh.maSo': giayHKD.ocrData.maSoHoKinhDoanh,
    'chuHoCu.hoTen': giayHKD.ocrData.hoTenChuHo,
    'chuHoCu.soCCCD': giayHKD.ocrData.soCCCDChuHo, // ⭐
    'chuHoCu.ngaySinh': giayHKD.ocrData.ngaySinhChuHo,
    'chuHoCu.gioiTinh': giayHKD.ocrData.gioiTinhChuHo,
    'chuHoCu.diaChiThuongTru': giayHKD.ocrData.diaChiThuongTruChuHo,
    
    // Từ eKYC → Chủ hộ mới
    'chuHoMoi.hoTen': user.cccdFullName,
    'chuHoMoi.soCCCD': user.cccdNumber, // ⭐
    'chuHoMoi.ngaySinh': user.cccdBirthDay,
    'chuHoMoi.gioiTinh': user.cccdGender,
    'chuHoMoi.diaChiThuongTru': user.cccdRecentLocation,
    'chuHoMoi.dienThoai': user.phoneNumber,
    'chuHoMoi.email': user.email,
    
    // Lý do thay đổi
    'thayDoi.lyDo.uyQuyen': true,
  };
}
```

---

Bạn muốn tôi tạo script demo để test flow auto-fill này không?
