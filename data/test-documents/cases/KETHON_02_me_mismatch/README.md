# Khai sinh + Kết hôn — Tên mẹ trên giấy chứng sinh KHÔNG khớp

## Giấy tờ upload (đúng thứ tự slot)
- `01_giay-chung-sinh.jpg → slot 'Giấy chứng sinh' (Qwen)`
- `02_giay-dang-ky-ket-hon_sample.jpg → slot 'GCN kết hôn' (VNPT thật)`

## Kết quả cross-check / điền form DỰ KIẾN
- Người yêu cầu (eKYC) = user test ĐINH NGỌC ANH · Nữ → vai trò MẸ (seed: scripts/seed-kethon-user.js, login dinhngocanh_test/Test@1234)
- R1 MISMATCH HIGH: giấy chứng sinh mẹ 'LÊ THỊ SAI' ≠ người yêu cầu ĐINH NGỌC ANH → cảnh báo đỏ, trừ điểm nặng
- R3 MATCH: giấy kết hôn vợ = ĐINH NGỌC ANH = người yêu cầu (hôn nhân hợp lệ)
- Minh hoạ xung đột giữa giấy chứng sinh và định danh dù kết hôn vẫn khớp

> Ảnh `*_sample.*` = giấy THẬT (VNPT SmartReader đọc). Ảnh còn lại do Qwen VL đọc.
