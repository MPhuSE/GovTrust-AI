# GovTrust form templates

- Phạm vi MVP hiện tại gồm `GIAY_KHAI_SINH` và `HO_KINH_DOANH`; CCCD được xử lý qua eKYC.
- `document-types/` là manifest trường OCR lấy từ collection MongoDB `document_types`.
- Các file biểu mẫu công khai gốc được giữ nguyên để đối chiếu.
- `renderable/` chứa DOCX có placeholder cho SmartForm; không sửa trực tiếp các file sinh ra.
- Registry thủ tục, checklist, cross-check và mapping OCR nằm tại
  `apps/core-svc/src/modules/procedures/mvp-procedures.ts`.
- Bốn mẫu hộ kinh doanh dùng Phụ lục II Thông tư 68/2025/TT-BTC:
  `HKD_THANH_LAP` (Mẫu 1), `HKD_THAY_DOI` (Mẫu 2),
  `HKD_CHAM_DUT` (Mẫu 4), `HKD_CAP_LAI` (Mẫu 5).
- Tạo lại các bản renderable sau khi thay cấu hình:

```bash
python3 scripts/build-form-templates.py
```

## Mapping `HO_KINH_DOANH`

| MongoDB field | SmartForm target |
|---|---|
| `tenHoKinhDoanh` | `hoKinhDoanh.tenHoKinhDoanh` |
| `maSoHoKinhDoanh` | `hoKinhDoanh.maSo` |
| `hoTenChuHo` | `chuHo.hoTen` |
| `diaChiKinhDoanh` | `hoKinhDoanh.diaChiKinhDoanh`, `hoKinhDoanh.diaChiHienTai` |
| `nganhNghe` | `hoKinhDoanh.nganhNghe` |

File xuất từ hệ thống là bản nháp tiền kiểm. Người dùng phải xem lại và xác nhận trước khi
sử dụng; GovTrust AI không tự nộp hồ sơ thay người dân.
