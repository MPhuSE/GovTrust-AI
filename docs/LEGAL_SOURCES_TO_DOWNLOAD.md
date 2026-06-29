# Danh sách văn bản luật cần tải PDF — Nhóm 1: Đăng ký khai sinh

> **Mục tiêu:** Tải PDF từ thuvienphapluat.vn về `data/legal-sources/pdf/`, sau đó chạy `pdf_to_chunks` để parse thành JSON chunk.
> **Phạm vi:** Nhóm 1 — Đăng ký khai sinh (category `HO_TICH`) — theo `docs/TASK_DATA_COLLECTION.md`

## Trạng thái

| #   | Văn bản                            | Trạng thái                                                        | Chunk |
| --- | ---------------------------------- | ----------------------------------------------------------------- | ----- |
| 1   | Luật Hộ tịch 2014                  | ✅ đã tải + parse                                                 | 78    |
| 2   | Nghị định 123/2015/NĐ-CP           | ✅ đã tải + parse                                                 | 50    |
| 3   | Thông tư 04/2020/TT-BTP            | ⏭️ bỏ (biểu mẫu, không có "Điều" → thuộc Mongo, không vào Qdrant) | 0     |
| 4   | Thông tư 17/2012/TT-BYT            | ✅ đã tải + parse                                                 | 7     |
| 5   | **Luật Hôn nhân và gia đình 2014** | ⬜ **cần tải**                                                    | —     |

> **Về "căn cứ" văn bản khác:** chỉ thu thập văn bản **trực tiếp điều chỉnh** thủ tục/giấy tờ.
> **BỎ:** Hiến pháp, Luật Tổ chức Chính phủ (căn cứ thẩm quyền); NĐ 158/2005, NĐ 06/2012 (đã **hết hiệu lực**, bị Luật Hộ tịch 2014 thay thế).

---

## 1. Luật Hộ tịch 2014

| Thông tin        | Giá trị                                                                                        |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| **Link tải PDF** | https://thuvienphapluat.vn/van-ban/Quyen-dan-su/Luat-Ho-tich-2014-238641.aspx                  |
| **Tên file lưu** | `luat-ho-tich-2014.pdf`                                                                        |
| **Điều cần có**  | Điều 13 (thẩm quyền), 14 (nội dung khai sinh), 15 (thời hạn), 16 (thủ tục), 17 (người yêu cầu) |
| **Hiệu lực**     | 01/01/2016                                                                                     |

**Lệnh parse:**

```bash
python -m app.scripts.pdf_to_chunks \
    ../../data/legal-sources/pdf/luat-ho-tich-2014.pdf \
    --category HO_TICH \
    --title "Luật Hộ tịch 2014" \
    --version 2014 \
    --effective 2016-01-01 \
    --url https://thuvienphapluat.vn/van-ban/Quyen-dan-su/Luat-Ho-tich-2014-238641.aspx \
    --out ../../data/legal-sources/chunks/luat-ho-tich-2014.json
```

---

## 2. Nghị định 123/2015/NĐ-CP (hướng dẫn Luật Hộ tịch)

| Thông tin        | Giá trị                                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------------------------- |
| **Link tải PDF** | https://thuvienphapluat.vn/van-ban/Quyen-dan-su/Nghi-dinh-123-2015-ND-CP-huong-dan-Luat-ho-tich-296380.aspx     |
| **Tên file lưu** | `nghi-dinh-123-2015.pdf`                                                                                        |
| **Điều cần có**  | Điều 9 (giấy tờ nộp/xuất trình), 10 (tờ khai), 15 (cha mẹ chưa ĐKKH), 16 (thủ tục khi không có giấy chứng sinh) |
| **Hiệu lực**     | 01/01/2016                                                                                                      |

**Lệnh parse:**

```bash
python -m app.scripts.pdf_to_chunks \
    ../../data/legal-sources/pdf/nghi-dinh-123-2015.pdf \
    --category HO_TICH \
    --title "Nghị định 123/2015/NĐ-CP" \
    --version 2015 \
    --effective 2016-01-01 \
    --url https://thuvienphapluat.vn/van-ban/Quyen-dan-su/Nghi-dinh-123-2015-ND-CP-huong-dan-Luat-ho-tich-296380.aspx \
    --out ../../data/legal-sources/chunks/nghi-dinh-123-2015.json
```

---

## 3. Thông tư 04/2020/TT-BTP (mẫu tờ khai)

| Thông tin        | Giá trị                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------ |
| **Link tải PDF** | https://thuvienphapluat.vn/van-ban/Quyen-dan-su/Thong-tu-04-2020-TT-BTP-bieu-mau-su-dung-ho-tich-436066.aspx |
| **Tên file lưu** | `thong-tu-04-2020-btp.pdf`                                                                                   |
| **Điều cần có**  | Mẫu tờ khai đăng ký khai sinh (Phụ lục)                                                                      |
| **Hiệu lực**     | 01/07/2020                                                                                                   |

**Lệnh parse:**

```bash
python -m app.scripts.pdf_to_chunks \
    ../../data/legal-sources/pdf/thong-tu-04-2020-btp.pdf \
    --category HO_TICH \
    --title "Thông tư 04/2020/TT-BTP" \
    --version 2020 \
    --effective 2020-07-01 \
    --url https://thuvienphapluat.vn/van-ban/Quyen-dan-su/Thong-tu-04-2020-TT-BTP-bieu-mau-su-dung-ho-tich-436066.aspx \
    --out ../../data/legal-sources/chunks/thong-tu-04-2020-btp.json
```

---

## 4. Thông tư 17/2012/TT-BYT (giấy chứng sinh)

| Thông tin        | Giá trị                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Link tải PDF** | https://thuvienphapluat.vn/van-ban/The-thao-Y-te/Thong-tu-17-2012-TT-BYT-huong-dan-cap-giay-chung-sinh-151831.aspx |
| **Tên file lưu** | `thong-tu-17-2012-byt.pdf`                                                                                         |
| **Điều cần có**  | Điều về đối tượng cấp, thời hạn cấp, nội dung giấy chứng sinh                                                      |
| **Hiệu lực**     | 01/09/2012                                                                                                         |

**Lệnh parse:**

```bash
python -m app.scripts.pdf_to_chunks \
    ../../data/legal-sources/pdf/thong-tu-17-2012-byt.pdf \
    --category HO_TICH \
    --title "Thông tư 17/2012/TT-BYT" \
    --version 2012 \
    --effective 2012-09-01 \
    --url https://thuvienphapluat.vn/van-ban/The-thao-Y-te/Thong-tu-17-2012-TT-BYT-huong-dan-cap-giay-chung-sinh-151831.aspx \
    --out ../../data/legal-sources/chunks/thong-tu-17-2012-byt.json
```

---

## 5. Luật Hôn nhân và gia đình 2014

> **Vì sao cần:** Hồ sơ khai sinh liên quan **giấy chứng nhận kết hôn** của cha mẹ và việc **xác định cha, mẹ, con**. Đây là căn cứ trực tiếp, nên đưa vào corpus.

| Thông tin | Giá trị |
| --- | --- |
| **Link tải PDF** | https://thuvienphapluat.vn/van-ban/Quyen-dan-su/Luat-Hon-nhan-va-gia-dinh-2014-238640.aspx |
| **Tên file lưu** | `luat-hon-nhan-gia-dinh-2014.pdf` |
| **Điều cần có** | Điều 8–9 (điều kiện & đăng ký kết hôn), Điều 88 (xác định cha, mẹ), Điều 90–91 (quyền nhận con) |
| **Hiệu lực** | 01/01/2015 |

**Lệnh parse:**

```bash
python -m app.scripts.pdf_to_chunks \
    ../../data/legal-sources/pdf/luat-hon-nhan-gia-dinh-2014.pdf \
    --category HO_TICH \
    --title "Luật Hôn nhân và gia đình 2014" \
    --version 2014 \
    --effective 2015-01-01 \
    --url https://thuvienphapluat.vn/van-ban/Quyen-dan-su/Luat-Hon-nhan-va-gia-dinh-2014-238640.aspx \
    --out ../../data/legal-sources/chunks/luat-hon-nhan-gia-dinh-2014.json
```

> ⚠️ Link/ItemID là phỏng đoán (Luật Hộ tịch 2014 = `...238641`, Luật HN&GĐ cùng kỳ họp ≈ `238640`). Nếu mở không đúng, search "Luật Hôn nhân và gia đình 2014 số 52/2014/QH13" trên thuvienphapluat rồi tải.

---

## Quy trình sau khi tải

1. **Tải 4 file PDF** trên vào `data/legal-sources/pdf/`
2. **Chạy 4 lệnh parse** ở trên (copy từng cái) trong `apps/ai-gateway/`
3. **Kiểm tra JSON** sinh ra trong `data/legal-sources/chunks/` (mỗi file ~10-30 chunk tuỳ số điều)
4. **Ingest vào Qdrant:**

   ```bash
   # Bật Qdrant (nếu chưa)
   docker compose -f infra/docker-compose.yml up -d

   # Ingest tất cả
   python -m app.vector_db.ingest
   ```

5. **Test search:**
   ```bash
   python -m app.vector_db.search "giấy chứng sinh khi đăng ký khai sinh" HO_TICH
   ```

---

## Lưu ý khi tải PDF

- **Đăng nhập** thuvienphapluat.vn trước (miễn phí) → nút "Tải về" mới hiện
- Nếu trang chỉ cho xem online (không có PDF), bấm **Ctrl+P** (in) → chọn "Save as PDF"
- File PDF nên **có text layer** (không phải ảnh scan) để `pypdf` đọc được. Nếu scan, cần OCR trước (không nằm trong scope script này)
