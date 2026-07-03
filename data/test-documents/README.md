# Hướng dẫn thu thập giấy tờ mẫu cho 3 thủ tục MVP

## Tổng quan

3 thủ tục MVP:
1. **DK_THUONG_TRU** - Đăng ký thường trú (3 giấy tờ)
2. **HKD_THAY_DOI** - Thay đổi chủ hộ kinh doanh (3 giấy tờ)
3. **CHUYEN_NHUONG_QSDD** - Chuyển nhượng quyền sử dụng đất (5 giấy tờ)

**OCR Strategy:**
- ✅ **VNPT OCR**: CCCD, CMND, Giấy khai sinh, GCN ĐKHKD
- ✅ **Qwen VL OCR**: Sổ đỏ, Hợp đồng chuyển nhượng, Văn bản ủy quyền, Văn bản hành chính

---

## DK_THUONG_TRU - Đăng ký thường trú

### 1. CCCD (đã có)
- ✅ Đã có từ eKYC demo
- Vị trí: sử dụng trực tiếp eKYC flow

### 2. Giấy khai sinh (VNPT OCR hỗ trợ)
**Cách thu thập:**
- **Option A - Giấy tờ thật (khuyến nghị):**
  - Xin scan/chụp giấy khai sinh của bạn bè/đồng nghiệp (che CCCD nếu cần)
  - Hoặc dùng giấy khai sinh của chính bạn
- **Option B - Mẫu công khai:**
  - Tải mẫu từ cổng thông tin UBND: https://thongtindoanhnghiep.gov.vn
  - Hoặc tìm trên Google Images: "mẫu giấy khai sinh việt nam"
- **Option C - Tự tạo (không khuyến nghị vì OCR sẽ kém):**
  - Dùng template Word điền thông tin giả

**Lưu vào:** `data/test-documents/DK_THUONG_TRU/giay_khai_sinh.jpg`

**Fields cần có (để test OCR):**
- hoTenCon (tên người được khai sinh)
- ngaySinhCon
- gioiTinhCon
- hoTenMe
- hoTenCha
- noiDangKy

---

### 3. Giấy chứng nhận QSDD / Sổ đỏ
**Cách thu thập:**
- **Option A - Giấy tờ thật:**
  - Xin scan sổ đỏ từ gia đình/bạn bè (che thông tin nhạy cảm)
- **Option B - Mẫu công khai:**
  - Google: "mẫu giấy chứng nhận quyền sử dụng đất"
  - Trang web Bộ Tài nguyên và Môi trường có mẫu
- **Option C - Hợp đồng thuê nhà (thay thế):**
  - Dễ tạo hơn sổ đỏ
  - Scan hợp đồng thuê nhà thật hoặc tạo mẫu Word

**Lưu vào:** `data/test-documents/DK_THUONG_TRU/giay_cho_o.jpg`

**Fields cần có:**
- diaChiNha
- tenChuSoHuu
- soGiayChungNhan (nếu là sổ đỏ)

---

### 4. Văn bản ý kiến chủ hộ (optional)
**Cách tạo:**
- Tạo file Word đơn giản theo mẫu:

```
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                        Độc lập - Tự do - Hạnh phúc
                              ---------------------

                          Ý KIẾN ĐỒNG Ý NHẬP HỘ KHẨU

Tôi tên: [Họ tên chủ hộ]
Địa chỉ thường trú: [Địa chỉ]
CCCD số: [Số CCCD]

Đồng ý cho: [Tên người yêu cầu]
Đăng ký thường trú tại địa chỉ trên.

                                        [Địa điểm], ngày [dd] tháng [mm] năm [yyyy]
                                                    Chủ hộ
                                                  (Ký và ghi rõ họ tên)
```

**Lưu vào:** `data/test-documents/DK_THUONG_TRU/y_kien_chu_ho.jpg`

---

## HKD_THAY_DOI - Thay đổi chủ hộ kinh doanh

### 1. CCCD (đã có)
- ✅ Đã có từ eKYC demo

### 2. GCN ĐKHKD - Giấy chứng nhận đăng ký hộ kinh doanh (VNPT OCR hỗ trợ)
**Cách thu thập:**
- **Option A - Giấy tờ thật (khuyến nghị):**
  - Xin scan GCN ĐKHKD từ hộ kinh doanh nhỏ (cửa hàng tạp hóa, quán ăn, salon,...)
  - Che mã số thuế nếu cần
- **Option B - Mẫu công khai:**
  - Google: "mẫu giấy chứng nhận đăng ký hộ kinh doanh"
  - Trang Cục Thuế có mẫu: https://www.gdt.gov.vn
  - Tìm trên thongtindoanhnghiep.gov.vn

**Lưu vào:** `data/test-documents/HKD_THAY_DOI/giay_hkd.jpg`

**Fields cần có (để test OCR):**
- tenHoKinhDoanh
- maSoHoKinhDoanh
- hoTenChuHo
- diaChiKinhDoanh
- nganhNghe

---

### 3. Văn bản ủy quyền của các thành viên hộ gia đình
**Cách tạo:**
- Tạo file Word theo mẫu công chứng:

```
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                        Độc lập - Tự do - Hạnh phúc
                              ---------------------

              VĂN BẢN ỦY QUYỀN CỦA CÁC THÀNH VIÊN HỘ GIA ĐÌNH

Chúng tôi, các thành viên hộ gia đình của hộ kinh doanh:
Tên hộ kinh doanh: [Tên HKD]
Mã số hộ kinh doanh: [Mã số]

Gồm:
1. [Họ tên thành viên 1] - CCCD: [số]
2. [Họ tên thành viên 2] - CCCD: [số]
3. [Họ tên thành viên 3] - CCCD: [số]

Ủy quyền cho ông/bà: [Tên người được ủy quyền]
CCCD số: [Số CCCD]
Làm chủ hộ kinh doanh của hộ gia đình.

                                        [Địa điểm], ngày [dd] tháng [mm] năm [yyyy]
                                            Các thành viên hộ gia đình
                                              (Ký và ghi rõ họ tên)

---
CHỨNG THỰC
Phòng Tư pháp [....]
```

**Lưu vào:** `data/test-documents/HKD_THAY_DOI/van_ban_uy_quyen_hgd.jpg`

**Fields cần có:**
- tenNguoiDuocUyQuyen
- tenHoKinhDoanh
- ngayUyQuyen
- noiCongChung

---

### 4. Văn bản ủy quyền thủ tục (optional)
**Cách tạo:**
- Tạo file Word đơn giản hơn (không cần công chứng):

```
                          ỦY QUYỀN THỰC HIỆN THỦ TỤC

Tôi tên: [Họ tên chủ hộ mới]
CCCD số: [Số CCCD]
Là chủ hộ kinh doanh: [Tên HKD]

Ủy quyền cho ông/bà: [Tên người nhận ủy quyền]
CCCD số: [Số CCCD]
Đại diện nộp hồ sơ đăng ký thay đổi nội dung đăng ký hộ kinh doanh.

                                        [Địa điểm], ngày [dd] tháng [mm] năm [yyyy]
                                                    Người ủy quyền
                                                  (Ký và ghi rõ họ tên)
```

**Lưu vào:** `data/test-documents/HKD_THAY_DOI/van_ban_uy_quyen_thu_tuc.jpg`

---

## CHUYEN_NHUONG_QSDD - Chuyển nhượng quyền sử dụng đất

### 1. CCCD bên nhận chuyển nhượng
- ✅ Đã có từ eKYC demo
- Vị trí: sử dụng trực tiếp eKYC flow

### 2. Giấy chứng nhận QSDD (Sổ đỏ) - Qwen OCR
**Cách thu thập:**
- **Option A - Giấy tờ thật (khuyến nghị):**
  - Xin scan/chụp sổ đỏ từ gia đình/bạn bè (che thông tin nhạy cảm nếu cần)
  - ✅ Đã có: `data/test-documents/DK_THUONG_TRU/so-do.jpg` (có thể tái sử dụng)
- **Option B - Mẫu công khai:**
  - Google: "mẫu giấy chứng nhận quyền sử dụng đất việt nam"
  - Trang Bộ Tài nguyên và Môi trường có mẫu

**Lưu vào:** `data/test-documents/CHUYEN_NHUONG_QSDD/so-do-ben-chuyen-nhuong.jpg`

**Fields cần có:**
- tenChuSoHuu (bên chuyển nhượng)
- soCCCD
- diaChiNha (địa chỉ thửa đất)
- dienTich
- soGiayChungNhan
- soThua, soTo

### 3. Hợp đồng chuyển nhượng QSDĐ - Qwen OCR
**Cách tạo:**
- Tạo file Word theo mẫu:

```
                    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                        Độc lập - Tự do - Hạnh phúc
                              ---------------------

                  HỢP ĐỒNG CHUYỂN NHƯỢNG QUYỀN SỬ DỤNG ĐẤT

Hôm nay, ngày [dd] tháng [mm] năm [yyyy], tại [Địa điểm], chúng tôi gồm:

BÊN CHUYỂN NHƯỢNG (BÊN A):
Ông/Bà: [Họ tên bên chuyển nhượng]
CCCD số: [Số CCCD]
Địa chỉ thường trú: [Địa chỉ]

BÊN NHẬN CHUYỂN NHƯỢNG (BÊN B):
Ông/Bà: [Họ tên bên nhận chuyển nhượng]
CCCD số: [Số CCCD]
Địa chỉ thường trú: [Địa chỉ]

Hai bên thỏa thuận ký kết hợp đồng chuyển nhượng quyền sử dụng đất như sau:

ĐIỀU 1: THỬA ĐẤT CHUYỂN NHƯỢNG
- Địa chỉ: [Địa chỉ thửa đất - phải khớp với sổ đỏ]
- Diện tích: [xxx] m² (số thửa [xx], tờ bản đồ số [yy])
- Theo Giấy chứng nhận số: [Số GCN]

ĐIỀU 2: GIÁ CHUYỂN NHƯỢNG
Tổng giá trị chuyển nhượng: [xxx.xxx.xxx] VNĐ

ĐIỀU 3: CAM KẾT
Hai bên cam kết thực hiện đúng các điều khoản đã thỏa thuận.

                        BÊN A                           BÊN B
                  (Ký và ghi rõ họ tên)         (Ký và ghi rõ họ tên)

---
CHỨNG THỰC / CÔNG CHỨNG
Văn phòng công chứng [Tên]
Ngày [dd] tháng [mm] năm [yyyy]
```

**Lưu vào:** `data/test-documents/CHUYEN_NHUONG_QSDD/hop-dong-chuyen-nhuong.jpg`

**Fields cần có:**
- benChuyenNhuong (phải khớp với sổ đỏ)
- benNhanChuyenNhuong (phải khớp với CCCD)
- diaChiThuaDat (phải khớp với sổ đỏ)
- dienTich (phải khớp với sổ đỏ)
- giaChuyenNhuong
- ngayKy
- noiCongChung

### 4. Văn bản ủy quyền bên chuyển nhượng (optional) - Qwen OCR
**Cách tạo:**
- Tái sử dụng mẫu từ `data/test-documents/HKD_THAY_DOI/van_ban_uy_quyen_thu_tuc.jpg`
- Hoặc tạo mới với nội dung: "Ủy quyền thực hiện thủ tục chuyển nhượng quyền sử dụng đất"

**Lưu vào:** `data/test-documents/CHUYEN_NHUONG_QSDD/uy-quyen-ben-chuyen-nhuong.jpg`

### 5. Văn bản ủy quyền bên nhận (optional) - Qwen OCR
**Lưu vào:** `data/test-documents/CHUYEN_NHUONG_QSDD/uy-quyen-ben-nhan.jpg`

---

## Checklist thu thập

### DK_THUONG_TRU
- [ ] giay_khai_sinh.jpg (ưu tiên cao - có OCR thật)
- [ ] giay_cho_o.jpg (ưu tiên cao)
- [ ] y_kien_chu_ho.jpg (ưu tiên thấp - optional)

### HKD_THAY_DOI
- [ ] giay_hkd.jpg (ưu tiên cao - có OCR thật)
- [ ] van_ban_uy_quyen_hgd.jpg (ưu tiên cao)
- [ ] van_ban_uy_quyen_thu_tuc.jpg (ưu tiên thấp - optional)

### CHUYEN_NHUONG_QSDD
- [ ] so-do-ben-chuyen-nhuong.jpg (ưu tiên cao - Qwen OCR)
- [ ] hop-dong-chuyen-nhuong.jpg (ưu tiên cao - Qwen OCR)
- [ ] uy-quyen-ben-chuyen-nhuong.jpg (ưu tiên thấp - optional)
- [ ] uy-quyen-ben-nhan.jpg (ưu tiên thấp - optional)

## Lưu ý khi thu thập

1. **Định dạng file:**
   - JPG/PNG, độ phân giải tối thiểu 1000px (chiều rộng)
   - Không quá nặng (dưới 5MB/file)

2. **Chất lượng ảnh:**
   - Rõ nét, không bị mờ
   - Đủ sáng, không bị tối
   - Không bị nghiêng quá 15 độ
   - Toàn bộ giấy tờ trong khung hình

3. **Bảo mật:**
   - Nếu dùng giấy tờ thật, xin phép chủ sở hữu
   - Che thông tin nhạy cảm nếu cần (mã số thuế, CCCD,...)
   - KHÔNG commit giấy tờ thật lên Git public

4. **Tên file:**
   - Đặt tên theo `document_type_code` trong checklist
   - VD: `giay_khai_sinh.jpg`, `giay_hkd.jpg`

## Nguồn tham khảo mẫu công khai

- **Cổng thông tin quốc gia về đăng ký doanh nghiệp:** https://dangkykinhdoanh.gov.vn
- **Bộ Tư pháp - Mẫu văn bản:** https://moj.gov.vn
- **Google Images:** "mẫu [tên giấy tờ] việt nam" + "sample"
- **Diễn đàn pháp luật:** thuvienphapluat.vn có nhiều mẫu đính kèm

## Sau khi thu thập xong

1. Kiểm tra lại checklist
2. Test OCR với VNPT API (giấy khai sinh, GCN ĐKHKD)
3. Validate field mapping với schema `template/document-types/*.json`
4. Tạo test case với dữ liệu thật
5. Chuẩn bị demo flow end-to-end
