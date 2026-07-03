# Thủ tục: Chuyển nhượng quyền sử dụng đất (CHUYEN_NHUONG_QSDD)

## Mô tả thủ tục

Chuyển nhượng quyền sử dụng đất có sổ đỏ (Điều 188 Luật Đất đai 2024).

**Cơ quan tiếp nhận:** Văn phòng đăng ký đất đai

**Output:** Đơn đề nghị cấp GCN QSDĐ (do chuyển nhượng)

## Checklist giấy tờ (5 loại)

### 1. CCCD của bên nhận chuyển nhượng (VNPT eKYC) ✅ REQUIRED
- **Mục đích:** Định danh bên nhận chuyển nhượng QSDĐ
- **Input mode:** EKYC
- **OCR:** VNPT eKYC API
- **Test file:** `cccd-ben-nhan.jpg`

### 2. Giấy chứng nhận QSDĐ (Sổ đỏ) của bên chuyển nhượng ✅ REQUIRED
- **Mục đích:** Chứng minh quyền sở hữu của bên chuyển nhượng (Đ.188 k.1 điểm a Luật Đất đai 2024)
- **Input mode:** UPLOAD
- **OCR:** Qwen Vision-Language OCR
- **Document type code:** `GIAY_CHUNG_NHAN_QSDD`
- **Test file:** `so-do-ben-chuyen-nhuong.jpg`
- **Expected fields:**
  - `tenChuSoHuu`: Họ tên người được cấp (bên chuyển nhượng)
  - `soCCCD`: Số CCCD/CMND
  - `diaChiThuongTru`: Địa chỉ thường trú
  - `diaChiNha`: Địa chỉ thửa đất
  - `dienTich`: Diện tích
  - `soGiayChungNhan`: Số giấy chứng nhận
  - `soThua`: Số thửa
  - `soTo`: Số tờ bản đồ

### 3. Hợp đồng chuyển nhượng QSDĐ (đã công chứng) ✅ REQUIRED
- **Mục đích:** Hợp đồng chuyển nhượng được công chứng hoặc chứng thực (Đ.188 k.1 điểm b Luật Đất đai 2024)
- **Input mode:** UPLOAD
- **OCR:** Qwen Vision-Language OCR
- **Document type code:** `HOP_DONG_CHUYEN_NHUONG`
- **Test file:** `hop-dong-chuyen-nhuong.jpg`
- **Expected fields:**
  - `benChuyenNhuong`: Họ tên bên chuyển nhượng
  - `benNhanChuyenNhuong`: Họ tên bên nhận chuyển nhượng
  - `diaChiThuaDat`: Địa chỉ thửa đất
  - `dienTich`: Diện tích chuyển nhượng
  - `giaChuyenNhuong`: Giá chuyển nhượng
  - `ngayKy`: Ngày ký hợp đồng (dd/mm/yyyy)
  - `noiCongChung`: Nơi công chứng

### 4. Văn bản ủy quyền của bên chuyển nhượng (nếu có) ⚠️ OPTIONAL
- **Mục đích:** Ủy quyền cho người khác thực hiện thủ tục thay bên chuyển nhượng
- **Input mode:** UPLOAD
- **OCR:** Qwen Vision-Language OCR
- **Document type code:** `VAN_BAN_UY_QUYEN_THU_TUC`
- **Test file:** `uy-quyen-ben-chuyen-nhuong.jpg`
- **Conditional:** Chỉ cần nếu bên chuyển nhượng ủy quyền cho người khác nộp hồ sơ
- **Expected fields:**
  - `tenNguoiUyQuyen`: Họ tên người ủy quyền (bên chuyển nhượng)
  - `tenNguoiDuocUyQuyen`: Họ tên người được ủy quyền
  - `noiDung`: Nội dung ủy quyền
  - `ngayUyQuyen`: Ngày ủy quyền (dd/mm/yyyy)

### 5. Văn bản ủy quyền của bên nhận chuyển nhượng (nếu có) ⚠️ OPTIONAL
- **Mục đích:** Ủy quyền cho người khác thực hiện thủ tục thay bên nhận chuyển nhượng
- **Input mode:** UPLOAD
- **OCR:** Qwen Vision-Language OCR
- **Document type code:** `VAN_BAN_UY_QUYEN_THU_TUC`
- **Test file:** `uy-quyen-ben-nhan.jpg`
- **Conditional:** Chỉ cần nếu bên nhận chuyển nhượng ủy quyền cho người khác nộp hồ sơ
- **Expected fields:** (giống văn bản ủy quyền trên)

## Cross-check rules

1. **Bên nhận chuyển nhượng trên CCCD khớp với hợp đồng** (HIGH severity)
   - `cccd_nguoi_yeu_cau.hoTen` ↔ `hop_dong_chuyen_nhuong.benNhanChuyenNhuong`
   
2. **Bên chuyển nhượng trên sổ đỏ khớp với hợp đồng** (HIGH severity)
   - `so_do_ben_chuyen_nhuong.tenChuSoHuu` ↔ `hop_dong_chuyen_nhuong.benChuyenNhuong`
   
3. **Địa chỉ thửa đất trên sổ đỏ khớp với hợp đồng** (MEDIUM severity, fuzzy)
   - `so_do_ben_chuyen_nhuong.diaChiNha` ↔ `hop_dong_chuyen_nhuong.diaChiThuaDat`
   
4. **Diện tích trên sổ đỏ khớp với hợp đồng** (MEDIUM severity)
   - `so_do_ben_chuyen_nhuong.dienTich` ↔ `hop_dong_chuyen_nhuong.dienTich`

## Hướng dẫn thu thập giấy tờ mẫu

### Nguồn thu thập

1. **Sổ đỏ (GCN QSDĐ):**
   - Mẫu thật từ internet (tìm kiếm "mẫu sổ đỏ việt nam")
   - Hoặc sử dụng file đã có: `/data/test-documents/DK_THUONG_TRU/so-do.jpg`
   - Đảm bảo rõ nét: tên chủ sở hữu, số CCCD, địa chỉ, diện tích, số thửa/tờ

2. **Hợp đồng chuyển nhượng:**
   - Tìm mẫu "hợp đồng chuyển nhượng quyền sử dụng đất" (có công chứng)
   - Hoặc tạo mẫu giả với nội dung đầy đủ: 2 bên, địa chỉ đất, diện tích, giá, ngày ký
   - Chụp ảnh rõ nét, không bị mờ hoặc nghiêng

3. **Văn bản ủy quyền:**
   - Mẫu "giấy ủy quyền làm thủ tục hành chính"
   - Có thể tái sử dụng mẫu từ `/data/test-documents/HKD_THAY_DOI/uy-quyen-*.jpg`

### Chất lượng tối thiểu

- **Độ phân giải:** Tối thiểu 1200x1600 pixels
- **Định dạng:** JPG, PNG
- **Ánh sáng:** Đều, không bị tối hoặc chói
- **Góc chụp:** Vuông góc, không bị méo
- **Nội dung:** Chữ rõ ràng, không bị mờ hoặc nhòe

### Lưu ý bảo mật

⚠️ **QUAN TRỌNG:**
- Sử dụng mẫu GIẤY TỜ GIẢ hoặc đã được che thông tin nhạy cảm
- KHÔNG sử dụng giấy tờ thật có thông tin cá nhân
- Nếu dùng mẫu từ internet, kiểm tra kỹ không có thông tin cá nhân thật

## Test OCR

Chạy test OCR cho từng giấy tờ:

```bash
# Test Sổ đỏ (Qwen OCR)
cd /home/dangkien/1st-Main/hackaithon/GovTrust-AI
python scripts/test-qwen-ocr.py data/test-documents/CHUYEN_NHUONG_QSDD/so-do-ben-chuyen-nhuong.jpg

# Test Hợp đồng (Qwen OCR)
python scripts/test-qwen-ocr.py data/test-documents/CHUYEN_NHUONG_QSDD/hop-dong-chuyen-nhuong.jpg

# Test CCCD (VNPT eKYC)
# Sử dụng CCCD có sẵn từ thủ tục khác hoặc test qua UI
```

## Status

- [ ] Thu thập CCCD bên nhận
- [ ] Thu thập Sổ đỏ (bên chuyển nhượng)
- [ ] Thu thập Hợp đồng chuyển nhượng
- [ ] Thu thập Văn bản ủy quyền (bên chuyển nhượng)
- [ ] Thu thập Văn bản ủy quyền (bên nhận)
- [ ] Test OCR từng giấy tờ
- [ ] Test end-to-end qua UI
