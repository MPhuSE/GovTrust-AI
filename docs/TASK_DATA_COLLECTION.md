# GIAO VIỆC: Thu thập dữ liệu giấy tờ để chuẩn hoá Schema

> **Người làm:** (bạn)
> **Phạm vi đợt này:** Hộ tịch — **Đăng ký khai sinh** + Đất đai — **Nhà đất**
> **Nguyên tắc:** mẫu dưới đây thiết kế để **mở rộng** — sau này thêm nhóm khác chỉ việc điền thêm cùng mẫu.
> **Đầu ra mong muốn:** mỗi loại giấy tờ = 1 phiếu điền đầy đủ → tôi convert thẳng thành document trong collection `document_types`.

---

## A. BẠN CẦN HIỂU TRƯỚC: thu thập để làm gì?

Mỗi loại giấy tờ trong hệ thống sẽ thành **1 "khuôn mẫu" (template)** gồm:
1. Nó là giấy gì, ai cấp, có hạn không.
2. **Trên giấy đó in những thông tin (field) nào** ← đây là phần quan trọng nhất, vì AI OCR sẽ đọc đúng các field này.
3. Field nào phải khớp với field trên giấy khác (đối chiếu chéo).
4. Luật nào điều chỉnh nó.

➡️ **Việc của bạn:** với mỗi giấy tờ, đi tìm 1 mẫu thật rồi "bóc tách" ra các thông tin trên. Không cần biết code — chỉ cần điền vào phiếu.

---

## B. THU THẬP Ở ĐÂU? (nguồn tra cứu)

| Nguồn | Dùng để lấy gì | Ghi chú |
|---|---|---|
| **Cổng Dịch vụ công Quốc gia** (dichvucong.gov.vn) | Danh sách thủ tục, giấy tờ cần nộp, biểu mẫu | Tra theo tên thủ tục |
| **Thư viện pháp luật** (thuvienphapluat.vn) | Luật/Nghị định, **mẫu giấy tờ ban hành kèm** | Tìm số hiệu văn bản |
| **Ảnh mẫu giấy tờ thật** (Google Images, mẫu trắng) | Bóc tách **field in trên giấy** | Dùng mẫu trống/mẫu mờ thông tin, KHÔNG dùng giấy tờ thật của người khác |
| **Người quen từng làm thủ tục** | Thực tế cần nộp gì, hay vướng gì | Bổ sung "lỗi thường gặp" |

> ⚠️ **Bảo mật:** chỉ thu thập **MẪU TRỐNG** hoặc giấy đã che thông tin cá nhân. Tuyệt đối không lưu CCCD/giấy tờ thật của người khác vào tài liệu.

---

## C. MẪU PHIẾU ĐIỀN (copy mẫu này cho MỖI giấy tờ)

```
========================================================
PHIẾU GIẤY TỜ #___
--------------------------------------------------------
1. Mã chuẩn (VIET_HOA_KHONG_DAU):  ______________
2. Tên đầy đủ:                     ______________
3. Nhóm: [ ] HO_TICH  [ ] DAT_DAI  [ ] NHAN_THAN  [ ] khác:____
4. Cơ quan cấp:                    ______________
5. Có ảnh chân dung? [ ]Có [ ]Không
6. Số mặt/trang cần chụp:          ______________
7. Có hạn sử dụng?
   [ ]Không hết hạn
   [ ]Có — ngày hết hạn in ở field tên: __________
   [ ]Có — nhưng tính theo quy tắc: ____________________
8. Tên gọi khác / giấy thay thế được: ______________

9. DANH SÁCH FIELD IN TRÊN GIẤY (quan trọng nhất):
   | Tên field (tiếng Việt) | Kiểu (chữ/số/ngày) | Bắt buộc đọc? | Là thông tin cá nhân? | Ví dụ giá trị |
   |------------------------|--------------------|---------------|----------------------|---------------|
   |                        |                    |               |                      |               |
   |                        |                    |               |                      |               |
   (liệt kê HẾT mọi dòng chữ in sẵn trên giấy)

10. Field phải KHỚP với giấy khác (đối chiếu chéo):
    - Field "______" phải trùng "______" trên giấy "______"

11. Căn cứ pháp lý:
    - Luật/Nghị định: ______________
    - Điều/khoản hay dùng: ______________
    - Năm hiệu lực: ______________

12. Lỗi thường gặp khi nộp giấy này:
    - ______________
========================================================
```

---

## D. DANH SÁCH GIẤY TỜ CẦN THU THẬP (làm theo thứ tự)

### NHÓM 1 — ĐĂNG KÝ KHAI SINH (ưu tiên làm trước, dễ hơn)

Thu thập đủ các giấy sau (mỗi giấy 1 phiếu mục C):

- [ ] **GIAY_CHUNG_SINH** — Giấy chứng sinh (bệnh viện cấp)
- [ ] **CCCD** — Căn cước công dân (của cha/mẹ)
- [ ] **GIAY_DKKH** — Giấy đăng ký kết hôn (của cha mẹ)
- [ ] **GIAY_KHAI_SINH** — Giấy khai sinh (đây là **kết quả** đầu ra, nhưng vẫn cần field của nó)
- [ ] **TO_KHAI_KHAI_SINH** — Tờ khai đăng ký khai sinh (biểu mẫu)

> Văn bản gốc để tra: **Luật Hộ tịch 2014**, Nghị định 123/2015, mẫu tờ khai theo Thông tư 04/2020/TT-BTP.

### NHÓM 2 — NHÀ ĐẤT (làm sau, nhiều field hơn)

- [ ] **GCN_QSDD** — Giấy chứng nhận quyền sử dụng đất (Sổ đỏ / Sổ hồng)
- [ ] **HOP_DONG_CHUYEN_NHUONG** — Hợp đồng chuyển nhượng (đã công chứng)
- [ ] **CCCD** — (dùng lại từ Nhóm 1, không cần làm lại)
- [ ] **TO_KHAI_THUE_DAT** — Tờ khai lệ phí trước bạ / thuế thu nhập
- [ ] **SO_DO_THUA_DAT** — Sơ đồ/trích lục thửa đất (nếu có)

> Văn bản gốc để tra: **Luật Đất đai 2024**, Nghị định 101/2024, mẫu GCN theo Thông tư của Bộ TN&MT.

---

## E. ĐỊNH NGHĨA "HOÀN THÀNH" (Definition of Done)

Một phiếu coi là xong khi:
- [ ] Đã điền **hết** mục 1–12, không để trống mục 9 (danh sách field).
- [ ] Mục 9 liệt kê **mọi dòng chữ in sẵn** trên giấy (kể cả mục nhỏ như "Nơi cấp", "Ngày cấp").
- [ ] Mục 10 (đối chiếu chéo) điền nếu giấy này có thông tin trùng với giấy khác.
- [ ] Có ghi nguồn (link văn bản luật / link mẫu giấy bạn tham khảo).

**Mốc giao nộp gợi ý:**
1. Xong **Nhóm 1 (Khai sinh)** trước → tôi review + dựng schema mẫu để bạn thấy kết quả.
2. Sau đó làm tiếp **Nhóm 2 (Nhà đất)**.

---

## F. VÍ DỤ MẪU ĐÃ ĐIỀN (để bạn hình dung — GIAY_CHUNG_SINH)

```
PHIẾU GIẤY TỜ #1
1. Mã chuẩn: GIAY_CHUNG_SINH
2. Tên đầy đủ: Giấy chứng sinh
3. Nhóm: [x] HO_TICH
4. Cơ quan cấp: Cơ sở y tế (bệnh viện/trạm xá) nơi sinh
5. Có ảnh chân dung? [x]Không
6. Số mặt cần chụp: 1
7. Có hạn sử dụng? [x]Không hết hạn
8. Tên gọi khác: (không)

9. DANH SÁCH FIELD:
   | Tên field            | Kiểu  | Bắt buộc | Cá nhân? | Ví dụ            |
   | Họ tên mẹ            | chữ   | có       | có       | NGUYỄN THỊ B     |
   | Năm sinh mẹ          | số    | có       | có       | 1992             |
   | Nơi thường trú mẹ    | chữ   | có       | có       | ...              |
   | Họ tên con (dự kiến) | chữ   | không    | có       | NGUYỄN VĂN C     |
   | Giới tính con        | chữ   | có       | có       | Nam              |
   | Ngày sinh            | ngày  | có       | có       | 01/06/2026       |
   | Giờ sinh             | số    | không    | không    | 09:30            |
   | Cân nặng             | số    | không    | không    | 3200g            |
   | Nơi sinh             | chữ   | có       | không    | BV Phụ sản TW    |
   | Người đỡ đẻ          | chữ   | không    | có       | ...              |

10. Đối chiếu chéo:
    - "Họ tên mẹ" phải trùng "Họ tên" trên CCCD của mẹ
    - "Ngày sinh" sẽ thành "Ngày sinh" trên Giấy khai sinh

11. Căn cứ pháp lý:
    - Luật Hộ tịch 2014; Thông tư 17/2012/TT-BYT (mẫu giấy chứng sinh)
    - Năm hiệu lực: 2012/2014

12. Lỗi thường gặp:
    - Tên mẹ trên chứng sinh sai dấu so với CCCD
    - Thiếu giấy chứng sinh khi sinh tại nhà
```

---

## G. SAU KHI BẠN XONG, TÔI SẼ LÀM GÌ

1. Convert mỗi phiếu → 1 document trong collection **`document_types`** (xem `DATA_COLLECTION_FOR_DOCTYPES.md` mục 7).
2. Dựng quy tắc đối chiếu chéo từ mục 10 các phiếu.
3. Cập nhật `DATABASE_DESIGN.md`: đổi `checklist` sang dạng **tham chiếu** `documentTypeCode`, bỏ field OCR hardcode.
4. Tạo seed mẫu cho 2 thủ tục: Đăng ký khai sinh + Chuyển nhượng nhà đất.

> Bạn chỉ cần lo **mục C–F** (điền phiếu). Phần biến thành schema/code là việc của tôi.
