# Chuyển nhượng QSDĐ — Hợp đồng PDF NHIỀU TRANG (test luồng PDF đa trang)

## Giấy tờ upload (đúng thứ tự slot)
- `01_so-do-ben-chuyen-nhuong.jpg → slot 'Sổ đỏ bên chuyển nhượng'` (Qwen, ảnh)
- `02_hop-dong-chuyen-nhuong.pdf → slot 'Hợp đồng chuyển nhượng'` (Qwen, **PDF 3 trang**)

## Mục đích
Kiểm luồng OCR khi người dùng nộp **PDF hợp đồng nhiều trang** (không phải 1 ảnh).
Field bị tách sang 3 trang: 2 bên (T1), thửa đất/diện tích (T2), giá + công chứng (T3).
ai-svc render từng trang → OCR từng trang → hợp nhất field (field điền trước thắng).

## Kết quả cross-check / điền form DỰ KIẾN
- Người yêu cầu (eKYC) = bên nhận/mua = NGUYỄN ĐĂNG KIÊN
- R1 MATCH: bên nhận trên hợp đồng = người yêu cầu
- R2 MATCH: chủ sổ đỏ = bên chuyển nhượng trên hợp đồng = TRẦN VĂN MINH
- R3 MATCH: địa chỉ thửa đất khớp
- R4 MATCH: diện tích 120 m² khớp
- Đã verify OCR thật: 7/7 field trải đủ 3 trang được merge đúng.

> Hợp đồng PDF sinh bởi `scripts/make-multipage-contract.py`.
> Sổ đỏ là ảnh tổng hợp (Qwen VL).
