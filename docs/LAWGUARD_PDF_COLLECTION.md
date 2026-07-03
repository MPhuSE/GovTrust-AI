# LawGuard - Danh sách PDF cần thu thập

## 🎯 Mục tiêu

Bổ sung legal chunks vào Qdrant để hỗ trợ **SmartBot** tư vấn cho 3 thủ tục MVP:
1. ✅ **HKD_THAY_DOI** - Thay đổi chủ hộ kinh doanh (đã đủ ~900 chunks)
2. ⚠️ **DANG_KY_KHAI_SINH** - Đăng ký khai sinh (chỉ có 1 chunk)
3. ❌ **CHUYEN_NHUONG_QSDD** - Chuyển nhượng QSDĐ (không có)

---

## 📚 Category 1: HỘ TỊCH (Đăng ký khai sinh)

### ✅ **Priority 1: Luật Hộ tịch 2014**

**URL:** https://thuvienphapluat.vn/van-ban/Quyen-dan-su/Luat-ho-tich-2014-259034.aspx

**Trạng thái:**
- ✅ Điều 16: Thủ tục đăng ký khai sinh (đã có trong Qdrant)
- ❌ Điều 17-25: Cần chunk thêm

**Các điều cần thu thập:**

| Điều | Nội dung | Ưu tiên |
|------|----------|---------|
| Điều 17 | Đăng ký khai sinh cho trẻ em bị bỏ rơi | HIGH |
| Điều 18 | Đăng ký khai sinh cho người chết | MEDIUM |
| Điều 19 | Đăng ký khai sinh trễ hạn | HIGH |
| Điều 20 | Xác định cha, mẹ, con | HIGH |
| Điều 21 | Đăng ký nhận cha, mẹ, con | MEDIUM |
| Điều 22 | Sửa đổi, bổ sung hộ tịch khai sinh | MEDIUM |
| Điều 23 | Hủy đăng ký khai sinh | LOW |
| Điều 24 | Đăng ký lại khai sinh | LOW |
| Điều 25 | Thẩm quyền đăng ký khai sinh | MEDIUM |

**Lý do:**
- Điều 16 đã đủ cho happy path (có đầy đủ giấy tờ)
- Điều 17, 19, 20 cần cho edge cases (trẻ bị bỏ rơi, đăng ký muộn, xác định cha/mẹ)

---

### ✅ **Priority 2: Nghị định 123/2015/NĐ-CP**

**Tên đầy đủ:** Nghị định 123/2015/NĐ-CP hướng dẫn thi hành một số điều của Luật Hộ tịch

**URL:** https://thuvienphapluat.vn/van-ban/Quyen-dan-su/Nghi-dinh-123-2015-ND-CP-huong-dan-Luat-Ho-tich-297696.aspx

**Các điều cần thu thập:**

| Điều | Nội dung | Ưu tiên |
|------|----------|---------|
| Điều 8 | Hồ sơ đăng ký khai sinh | HIGH |
| Điều 9 | Hồ sơ đăng ký khai sinh cho trẻ em bị bỏ rơi | MEDIUM |
| Điều 10 | Hồ sơ đăng ký khai sinh trễ hạn | HIGH |
| Điều 11 | Giấy tờ chứng minh quan hệ cha mẹ - con | HIGH |
| Điều 12 | Thủ tục đăng ký khai sinh tại cơ quan đăng ký hộ tịch | HIGH |
| Điều 13-15 | Thời hạn giải quyết | MEDIUM |

**Lý do:**
- Hướng dẫn chi tiết về hồ sơ, giấy tờ cần thiết
- Bổ sung cho Luật Hộ tịch 2014

---

### ✅ **Priority 3: Thông tư 56/2017/TT-BYT**

**Tên đầy đủ:** Thông tư 56/2017/TT-BYT hướng dẫn quản lý công tác sản

**URL:** https://thuvienphapluat.vn/van-ban/The-thao-Y-te/Thong-tu-56-2017-TT-BYT-huong-dan-quan-ly-cong-tac-san-367894.aspx

**Nội dung cần thu thập:**
- **Phụ lục 5:** Mẫu Giấy chứng sinh
- Hướng dẫn cấp và sử dụng Giấy chứng sinh
- Trách nhiệm của cơ sở y tế

**Lý do:**
- Giấy chứng sinh là 1 trong 4 giấy tờ bắt buộc cho DANG_KY_KHAI_SINH
- Qwen OCR cần hiểu cấu trúc của Giấy chứng sinh

---

## 📚 Category 2: ĐẤT ĐAI (Chuyển nhượng QSDĐ)

### ✅ **Priority 1: Luật Đất đai 2024**

**Tên đầy đủ:** Luật Đất đai 31/2024/QH15

**URL:** https://thuvienphapluat.vn/van-ban/Bat-dong-san/Luat-Dat-dai-2024-606129.aspx

**Trạng thái:** ❌ Không có chunk nào trong Qdrant

**Các điều cần thu thập:**

| Điều | Nội dung | Ưu tiên |
|------|----------|---------|
| Điều 188 | Chuyển nhượng quyền sử dụng đất | **CRITICAL** |
| Điều 189 | Điều kiện chuyển nhượng QSDĐ | **CRITICAL** |
| Điều 190 | Hạn chế chuyển nhượng QSDĐ | HIGH |
| Điều 191 | Trường hợp không được chuyển nhượng | HIGH |
| Điều 192 | Giá chuyển nhượng QSDĐ | MEDIUM |
| Điều 193 | Thủ tục chuyển nhượng QSDĐ | HIGH |
| Điều 194 | Hồ sơ chuyển nhượng QSDĐ | HIGH |
| Điều 195 | Hợp đồng chuyển nhượng | HIGH |
| Điều 196 | Đăng ký biến động đất đai | MEDIUM |
| Điều 197 | Thẩm quyền đăng ký | MEDIUM |
| Điều 198-200 | Cấp Giấy chứng nhận QSDĐ mới | MEDIUM |

**Lý do:**
- Điều 188-195 là cơ sở pháp lý chính cho thủ tục CHUYEN_NHUONG_QSDD
- SmartBot cần để tư vấn điều kiện, hồ sơ, thủ tục

---

### ✅ **Priority 2: Nghị định 120/2025/NĐ-CP**

**Tên đầy đủ:** Nghị định 120/2025/NĐ-CP về đăng ký biến động đất đai, nhà ở và tài sản gắn liền với đất

**URL:** https://thuvienphapluat.vn/van-ban/Bat-dong-san/Nghi-dinh-120-2025-ND-CP-dang-ky-bien-dong-dat-dai-nha-o-tai-san-gan-lien-voi-dat-605943.aspx

**Các điều cần thu thập:**

| Điều | Nội dung | Ưu tiên |
|------|----------|---------|
| Điều 10 | Thủ tục chuyển nhượng QSDĐ | **CRITICAL** |
| Điều 11 | Hồ sơ chuyển nhượng QSDĐ | **CRITICAL** |
| Điều 12 | Giấy tờ chứng minh quyền sở hữu | HIGH |
| Điều 13 | Hợp đồng chuyển nhượng (yêu cầu công chứng) | HIGH |
| Điều 14 | Văn bản ủy quyền (nếu có) | MEDIUM |
| Điều 15 | Thời hạn giải quyết | MEDIUM |
| Điều 16-20 | Trình tự, thẩm quyền | MEDIUM |

**Lý do:**
- Hướng dẫn chi tiết về hồ sơ, giấy tờ cho thủ tục chuyển nhượng
- Bổ sung cho Luật Đất đai 2024

---

### ✅ **Priority 3: Thông tư 24/2014/TT-BTNMT**

**Tên đầy đủ:** Thông tư 24/2014/TT-BTNMT hướng dẫn về đăng ký biến động đất đai, tài sản gắn liền với đất

**URL:** https://thuvienphapluat.vn/van-ban/Bat-dong-san/Thong-tu-24-2014-TT-BTNMT-huong-dan-dang-ky-bien-dong-dat-dai-tai-san-gan-lien-voi-dat-246860.aspx

**Nội dung cần thu thập:**
- **Mẫu số 15:** Đơn đăng ký đất đai, tài sản gắn liền với đất
- Hướng dẫn điền mẫu đơn
- Giấy tờ kèm theo

**Lý do:**
- Mẫu đơn này là output của thủ tục CHUYEN_NHUONG_QSDD
- SmartForm cần để render template `DKDD_CHUYEN_NHUONG.docx`

---

## 📥 Hướng dẫn download PDF

### **Bước 1: Truy cập Thư viện Pháp luật**

1. Mở URL văn bản
2. Nhấn **"Tải về"** hoặc **"In văn bản"**
3. Chọn **"Toàn văn"** (không chọn "Chỉ điều X")
4. Chọn định dạng **PDF**
5. Download về máy

### **Bước 2: Đặt tên file**

**Format:** `<loai>-<ma>-<nam>-<ten-viet-tat>.pdf`

**Ví dụ:**
```
luat-31-2024-dat-dai.pdf
nghi-dinh-120-2025-dang-ky-dat-dai.pdf
nghi-dinh-123-2015-huong-dan-ho-tich.pdf
thong-tu-56-2017-giay-chung-sinh.pdf
thong-tu-24-2014-mau-don-dat-dai.pdf
```

### **Bước 3: Lưu vào folder**

```
data/legal-sources/pdf/
├── ho-tich/
│   ├── luat-ho-tich-2014.pdf
│   ├── nghi-dinh-123-2015-huong-dan-ho-tich.pdf
│   └── thong-tu-56-2017-giay-chung-sinh.pdf
└── dat-dai/
    ├── luat-31-2024-dat-dai.pdf
    ├── nghi-dinh-120-2025-dang-ky-dat-dai.pdf
    └── thong-tu-24-2014-mau-don-dat-dai.pdf
```

---

## 🔧 Chunk PDF thành JSON

### **Script:** `/scripts/chunk-legal-pdfs.py`

**Sử dụng:**

```bash
# Chunk toàn bộ PDF trong folder
python scripts/chunk-legal-pdfs.py

# Hoặc chunk từng file
python scripts/chunk-legal-pdfs.py \
  --input data/legal-sources/pdf/ho-tich/luat-ho-tich-2014.pdf \
  --category HO_TICH \
  --output data/legal-sources/chunks/ho-tich/

python scripts/chunk-legal-pdfs.py \
  --input data/legal-sources/pdf/dat-dai/luat-31-2024-dat-dai.pdf \
  --category DAT_DAI \
  --output data/legal-sources/chunks/dat-dai/
```

**Output:** JSON chunks trong `data/legal-sources/chunks/`

---

## 📤 Upload chunks vào Qdrant

### **Script:** `/scripts/upload-chunks-to-qdrant.py` (cần tạo)

**Sử dụng:**

```bash
# Upload toàn bộ chunks
python scripts/upload-chunks-to-qdrant.py \
  --input data/legal-sources/chunks/ \
  --collection legal_chunks
```

**Kết quả:**
- ✅ Qdrant collection `legal_chunks` có thêm ~100-200 chunks
- ✅ SmartBot có thể tư vấn cho 3 thủ tục MVP

---

## 📊 Checklist

### **HỘ TỊCH**
- [ ] Download Luật Hộ tịch 2014 (PDF)
- [ ] Download Nghị định 123/2015 (PDF)
- [ ] Download Thông tư 56/2017 (PDF)
- [ ] Chunk 3 PDF → JSON
- [ ] Upload vào Qdrant
- [ ] Test SmartBot với câu hỏi: "Tôi muốn đăng ký khai sinh cho con, cần giấy tờ gì?"

### **ĐẤT ĐAI**
- [ ] Download Luật Đất đai 2024 (PDF)
- [ ] Download Nghị định 120/2025 (PDF)
- [ ] Download Thông tư 24/2014 (PDF)
- [ ] Chunk 3 PDF → JSON
- [ ] Upload vào Qdrant
- [ ] Test SmartBot với câu hỏi: "Tôi muốn chuyển nhượng đất, cần điều kiện gì?"

---

## 🎯 Mục tiêu cuối cùng

**Qdrant collection `legal_chunks`:**
- ✅ HO_KINH_DOANH: ~900 chunks (đã có)
- ✅ HO_TICH: ~50-100 chunks (từ 3 PDF)
- ✅ DAT_DAI: ~100-150 chunks (từ 3 PDF)
- **Tổng:** ~1,100-1,200 chunks

**SmartBot có thể tư vấn:**
- ✅ Điều kiện, hồ sơ, thủ tục cho 3 thủ tục MVP
- ✅ Trích dẫn chính xác điều luật, nghị định
- ✅ Cảnh báo edge cases (đăng ký muộn, trẻ bị bỏ rơi, đất hạn chế chuyển nhượng)

---

**File:** `/docs/LAWGUARD_PDF_COLLECTION.md`  
**Last updated:** 2026-07-03
